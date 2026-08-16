const testKey = 'AQ.Ab8RN6LGRQjt1c4rIVcu3La-AaVM_Eau4g8ctBDm2_D6BkFHiw';

async function testGemini25() {
  console.log('Testing gemini-2.5-flash with key...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${testKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello! Reply with {"status":"online","model":"Gemini 2.5 Flash"}' }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    console.log('gemini-2.5-flash status:', res.status);
    const data = await res.json();
    console.log('gemini-2.5-flash response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testGemini25();
