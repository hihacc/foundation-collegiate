const testKey = 'AQ.Ab8RN6LGRQjt1c4rIVcu3La-AaVM_Eau4g8ctBDm2_D6BkFHiw';

async function listAllModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
  const data = await res.json();
  if (data.models) {
    console.log('Available models:');
    data.models.forEach(m => {
      if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
        console.log('-', m.name, '|', m.displayName);
      }
    });
  } else {
    console.log('No models list:', data);
  }
}

listAllModels();
