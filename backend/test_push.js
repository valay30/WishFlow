import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function testPush() {
  const { data, error } = await supabase.from('push_subscriptions').select('*');
  if (error || !data) return console.error('Error fetching subs', error);

  const payload = JSON.stringify({
    title: 'New Collection Shared! 🎁',
    body: `Valay shared "Birthday Wishlist" with you. Tap to view!`,
    url: '/',
  });

  for (const sub of data) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth
      }
    };
    try {
      await webpush.sendNotification(pushSubscription, payload);
      console.log('Sent push to', sub.endpoint);
    } catch (err) {
      console.error('Failed to send push to', sub.endpoint, err);
    }
  }
}

testPush();
