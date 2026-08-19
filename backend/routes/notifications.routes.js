import express from 'express';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Route to save a push subscription
router.post('/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription' });
  }

  try {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      return res.status(200).json({ message: 'Subscription already exists' });
    }

    // Insert new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth
      });

    if (error) throw error;

    res.status(201).json({ message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

// Route to trigger a push notification for a shared collection
router.post('/notify-share', async (req, res) => {
  const { recipientId, collectionName, senderName } = req.body;

  if (!recipientId || !collectionName || !senderName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get all subscriptions for the recipient
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', recipientId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found for user.' });
    }

    const payload = JSON.stringify({
      title: 'New Collection Shared!',
      body: `${senderName} has shared "${collectionName}" with you.`,
      url: '/collections',
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        console.error('Error sending push to endpoint:', sub.endpoint, err);
        // If subscription is invalid (status 410 or 404), we should delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    res.status(200).json({ message: 'Notifications sent.' });
  } catch (error) {
    console.error('Error notifying share:', error);
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

export default router;
