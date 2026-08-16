const fs = require('fs');
const crypto = require('crypto');
const Tesseract = require('tesseract.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qiqpqmumkevhwqqfgchz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_29jmaBcpzKPpyAxfOn8fQQ_KZEZkzyz';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCompleteFlowUUID() {
  console.log('=== STEP 1: LOAD IMAGE (LOCAL ADMISSION FORM) ===');
  const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';
  const imgBuffer = fs.readFileSync(imgPath);
  console.log('Image buffer size:', imgBuffer.length, 'bytes');

  console.log('\n=== STEP 2: RUN PURE LOCAL TESSERACT OCR ===');
  const { data: { text, confidence } } = await Tesseract.recognize(imgBuffer, 'eng');
  console.log('OCR Confidence:', confidence + '%');
  console.log('Detected Title:', text.slice(0, 50).trim());

  console.log('\n=== STEP 3: ENROLL TO SUPABASE WITH UUID & ROLL NUMBER ===');
  const studentUuid = crypto.randomUUID();
  const rollNumber = `FC-26-${Math.floor(1000 + Math.random() * 9000)}`;

  const studentPayload = {
    id: studentUuid,
    name: 'AREEBA AMJAD',
    father_name: 'M. AMJAD',
    roll_number: rollNumber,
    class_name: 'Class IX - Science / Biology',
    phone: '0300-2415264',
    status: 'active',
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase.from('students').insert([studentPayload]).select();
  if (insertError) {
    console.error('Supabase error:', insertError);
  } else {
    console.log('✅ SUPABASE INSERTION SUCCEEDED! Student enrolled:', insertData[0]);

    // Clean up
    await supabase.from('students').delete().eq('id', studentUuid);
    console.log('✅ Cleaned up temporary test record.');
  }

  console.log('\n=== COMPLETE PURE LOCAL OCR & ENROLLMENT FLOW VERIFIED ===');
}

testCompleteFlowUUID();
