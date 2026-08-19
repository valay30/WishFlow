import { API_URL } from '../config';

// Helper to convert VAPID key to format required by PushManager
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return false;
    }

    // 2. Get SW Registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not set in environment variables.');
      return false;
    }

    const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
    
    // Force a fresh subscription to avoid stuck/invalid old subscriptions
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    // 4. Send to Backend
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription to backend');
    }

    console.log('Successfully subscribed to push notifications!');
    return true;

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}
