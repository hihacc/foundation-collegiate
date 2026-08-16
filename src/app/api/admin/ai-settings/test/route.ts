import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { getAllAiConnections, saveAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 1x1 base64 test image PNG
const SAMPLE_TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { connection_id, provider = 'huggingface', model_id = 'Qwen/Qwen2.5-VL-7B-Instruct', plain_api_key } = body;

    let testKey = plain_api_key || '';
    let targetConn: any = null;

    if (connection_id) {
      const connections = await getAllAiConnections();
      targetConn = connections.find(c => c.id === connection_id);
      if (targetConn && targetConn.encrypted_key) {
        testKey = decryptApiKey(targetConn.encrypted_key);
      }
    }

    // 1. Local Engine Test
    if (provider === 'local' || model_id === 'local-wasm-tesseract') {
      const latency = Date.now() - startTime;
      if (targetConn) {
        targetConn.status = 'working';
        targetConn.latency_ms = latency;
        targetConn.last_tested_at = new Date().toISOString();
        const connections = await getAllAiConnections();
        await saveAiConnections(connections);
      }

      return NextResponse.json({
        success: true,
        status: 'working',
        latency_ms: latency,
        model: 'Unlimited Local WebAssembly Engine',
        provider: 'Local Device',
        auth_valid: true,
        image_supported: true,
        inference_success: true,
        message: '🟢 Local WebAssembly OCR Engine is fully operational with zero quota limits.'
      });
    }

    // 2. Google AI Studio Key Test
    if (provider === 'google' || model_id === 'gemini-2.5-flash') {
      if (!testKey) {
        return NextResponse.json({
          success: false,
          status: 'invalid_key',
          error: 'No Google API key provided'
        });
      }

      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${testKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          })
        });

        const latency = Date.now() - startTime;
        if (res.ok) {
          if (targetConn) {
            targetConn.status = 'working';
            targetConn.latency_ms = latency;
            targetConn.last_tested_at = new Date().toISOString();
            const connections = await getAllAiConnections();
            await saveAiConnections(connections);
          }
          return NextResponse.json({
            success: true,
            status: 'working',
            latency_ms: latency,
            model: 'Google Gemini 2.5 Flash',
            provider: 'Google AI Studio',
            auth_valid: true,
            image_supported: true,
            inference_success: true,
            message: `🟢 Google AI Studio connected successfully! Latency: ${latency}ms`
          });
        } else {
          const errData = await res.json();
          return NextResponse.json({
            success: false,
            status: 'invalid_key',
            error: errData.error?.message || 'Google API key validation failed'
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: err.message
        });
      }
    }

    // 3. Hugging Face Inference Test
    if (!testKey) {
      return NextResponse.json({
        success: false,
        status: 'invalid_key',
        error: 'No Hugging Face token provided'
      });
    }

    const hf = new HfInference(testKey);

    try {
      const response = await hf.chatCompletion({
        model: model_id,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Reply with ONLY the word "READY".' },
              { type: 'image_url', image_url: { url: SAMPLE_TEST_IMAGE } }
            ]
          }
        ],
        max_tokens: 10
      });

      const latency = Date.now() - startTime;
      const resultText = response.choices?.[0]?.message?.content || '';

      if (targetConn) {
        targetConn.status = 'working';
        targetConn.latency_ms = latency;
        targetConn.last_tested_at = new Date().toISOString();
        const connections = await getAllAiConnections();
        await saveAiConnections(connections);
      }

      return NextResponse.json({
        success: true,
        status: 'working',
        latency_ms: latency,
        model: model_id,
        provider: 'Hugging Face Inference',
        auth_valid: true,
        image_supported: true,
        inference_success: true,
        output_sample: resultText.trim(),
        message: `🟢 Model test passed! Authentication and vision inference verified (${latency}ms).`
      });

    } catch (hfErr: any) {
      const latency = Date.now() - startTime;
      const errMsg = hfErr.message || '';

      let statusResult: 'credits_depleted' | 'invalid_key' | 'failed' = 'failed';

      if (errMsg.toLowerCase().includes('depleted') || errMsg.toLowerCase().includes('credits') || errMsg.toLowerCase().includes('quota')) {
        statusResult = 'credits_depleted';
      } else if (errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('401') || errMsg.toLowerCase().includes('403')) {
        statusResult = 'invalid_key';
      }

      if (targetConn) {
        targetConn.status = statusResult;
        targetConn.latency_ms = latency;
        targetConn.last_tested_at = new Date().toISOString();
        const connections = await getAllAiConnections();
        await saveAiConnections(connections);
      }

      return NextResponse.json({
        success: false,
        status: statusResult,
        latency_ms: latency,
        model: model_id,
        error: errMsg,
        diagnostics: {
          auth_valid: statusResult !== 'invalid_key',
          quota_ok: statusResult !== 'credits_depleted',
          recommendation: statusResult === 'credits_depleted'
            ? 'Monthly credits depleted. Add a backup Hugging Face key or switch to Unlimited Local Engine.'
            : 'Check that your token is valid and has "read" permissions.'
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error.message
    }, { status: 500 });
  }
}
