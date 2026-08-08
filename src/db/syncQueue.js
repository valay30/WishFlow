import Dexie from 'dexie';
import { supabase } from './index';

// Initialize a new Dexie DB specifically for our offline sync queue
export const syncDB = new Dexie('WishFlowSync');
syncDB.version(1).stores({
  operations: '++id, type, payload, createdAt'
});

export const addToSyncQueue = async (type, payload) => {
  await syncDB.operations.add({
    type,
    payload,
    createdAt: new Date().toISOString()
  });
  console.log(`Added ${type} operation to offline sync queue.`);
};

let isProcessing = false;

export const processSyncQueue = async () => {
  // Prevent parallel processing
  if (isProcessing) return;
  if (!navigator.onLine) return;
  
  isProcessing = true;
  
  try {
    const pendingOps = await syncDB.operations.orderBy('createdAt').toArray();
    if (pendingOps.length === 0) {
      isProcessing = false;
      return;
    }
    
    console.log(`Processing ${pendingOps.length} offline operations...`);

    for (const op of pendingOps) {
      if (op.type === 'ADD_ITEM') {
        const { item, targetCollectionId } = op.payload;
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (userId) {
          // Send to Supabase
          const { data, error } = await supabase.from('items').insert({
            ...item,
            user_id: userId
          }).select();
          
          if (!error) {
            // Success! If part of a collection, add to collection
            if (targetCollectionId && data?.[0]) {
               await supabase.from('collection_items').insert({
                 collection_id: targetCollectionId,
                 item_id: data[0].id
               });
            }
            // Remove from offline queue
            await syncDB.operations.delete(op.id);
          } else {
            console.error("Failed to sync offline item:", error);
            // We keep it in the queue to try again later
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing offline sync queue:", error);
  } finally {
    isProcessing = false;
  }
};
