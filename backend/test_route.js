import fetch from 'node-fetch';

async function testBackendRoute() {
  try {
    const res = await fetch('http://localhost:5000/api/notifications/notify-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: '22707e91-0374-46fb-8a5d-0fca1b528e01',
        collectionName: 'Test Backend',
        senderName: 'Test Script'
      })
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testBackendRoute();
