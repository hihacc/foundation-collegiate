const testKey = 'AQ.Ab8RN6LGRQjt1c4rIVcu3La-AaVM_Eau4g8ctBDm2_D6BkFHiw';

async function testGemini() {
  console.log('Testing key with Google Generative Language API...');
  
  // 1. Test standard query parameter key
  try {
    const res1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${testKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with OK' }] }]
      })
    });
    console.log('Query param key test status:', res1.status);
    const data1 = await res1.json();
    console.log('Query param key response:', JSON.stringify(data1).slice(0, 300));
  } catch (e) {
    console.log('Query param error:', e.message);
  }

  // 2. Test Authorization Bearer header
  try {
    const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testKey}`,
        'x-goog-api-key': testKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with OK' }] }]
      })
    });
    console.log('Header test status:', res2.status);
    const data2 = await res2.json();
    console.log('Header response:', JSON.stringify(data2).slice(0, 300));
  } catch (e) {
    console.log('Header error:', e.message);
  }

  // 3. Test gemini-2.0-flash / v1alpha
  try {
    const res3 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
    console.log('List models status:', res3.status);
    const data3 = await res3.json();
    console.log('List models response:', JSON.stringify(data3).slice(0, 300));
  } catch (e) {
    console.log('List models error:', e.message);
  }
}

testGemini();
