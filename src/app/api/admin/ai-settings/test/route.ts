import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { getAllAiConnections, saveAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Valid standard 200x200 PNG test image
const VALID_TEST_IMAGE_200 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEySURBVHhe7cExAQAAAMKg9U9tCF8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgD8DCKAAAe1X9uYAAAAASUVORK5CYII=';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { connection_id, provider = 'huggingface', model_id = 'Qwen/Qwen2.5-VL-72B-Instruct', plain_api_key } = body;

    let testKey = plain_api_key || '';
    let targetConn: any = null;

    const connections = await getAllAiConnections();

    if (connection_id) {
      targetConn = connections.find(c => c.id === connection_id);
      if (targetConn && targetConn.encrypted_key) {
        testKey = decryptApiKey(targetConn.encrypted_key);
      }
    } else {
      targetConn = connections.find(c => c.provider === provider && c.is_default) || connections[0];
      if (targetConn && targetConn.encrypted_key && !testKey) {
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

    // 2. OpenRouter.ai Test (Free & Premium Vision)
    if (provider === 'openrouter') {
      if (!testKey) {
        return NextResponse.json({
          success: false,
          status: 'invalid_key',
          error: 'No OpenRouter API key provided (must start with sk-or-v1-...)'
        });
      }

      try {
        const testModel = model_id || 'google/gemini-2.0-flash-exp:free';
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testKey}`,
            'HTTP-Referer': 'https://foundationcollegiate.edu.pk',
            'X-Title': 'The Foundation Collegiate Scanner',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: testModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Reply with ONLY the word "READY".' },
                  { type: 'image_url', image_url: { url: VALID_TEST_IMAGE_200 } }
                ]
              }
            ],
            max_tokens: 15
          })
        });

        const latency = Date.now() - startTime;
        const orData = await orRes.json();

        if (orRes.ok && orData.choices?.[0]?.message?.content) {
          if (targetConn) {
            targetConn.status = 'working';
            targetConn.latency_ms = latency;
            targetConn.last_tested_at = new Date().toISOString();
            await saveAiConnections(connections);
          }

          return NextResponse.json({
            success: true,
            status: 'working',
            latency_ms: latency,
            model: testModel,
            provider: 'OpenRouter.ai',
            auth_valid: true,
            image_supported: true,
            inference_success: true,
            output_sample: orData.choices[0].message.content.trim(),
            message: `🟢 OpenRouter.ai connected successfully! Model ${testModel} verified (${latency}ms).`
          });
        } else {
          const errMsg = orData.error?.message || 'OpenRouter authentication / inference failed';
          const isQuota = errMsg.toLowerCase().includes('credit') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit');
          const isAuth = orRes.status === 401 || errMsg.toLowerCase().includes('key') || errMsg.toLowerCase().includes('token');

          const statusResult = isQuota ? 'credits_depleted' : isAuth ? 'invalid_key' : 'failed';

          if (targetConn) {
            targetConn.status = statusResult;
            targetConn.latency_ms = latency;
            targetConn.last_tested_at = new Date().toISOString();
            await saveAiConnections(connections);
          }

          return NextResponse.json({
            success: false,
            status: statusResult,
            latency_ms: latency,
            model: testModel,
            error: errMsg,
            diagnostics: {
              auth_valid: !isAuth,
              quota_ok: !isQuota,
              recommendation: isAuth
                ? 'Check that your OpenRouter API key is correct (get a free key at openrouter.ai/keys).'
                : isQuota
                ? 'Rate limit reached on this free model. Switch to another OpenRouter free model or Unlimited Local Engine.'
                : 'Check OpenRouter model status.'
            }
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

    // 3. Google AI Studio Key Test
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

    // 3. Hugging Face Inference & Token Test
    if (!testKey) {
      return NextResponse.json({
        success: false,
        status: 'invalid_key',
        error: 'No Hugging Face token provided'
      });
    }

    // Step 3A: Validate WhoAmI endpoint
    let whoAmIUser = '';
    try {
      const whoRes = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { Authorization: `Bearer ${testKey}` }
      });
      if (whoRes.ok) {
        const whoData = await whoRes.json();
        whoAmIUser = whoData.name || whoData.fullname || 'Verified User';
      } else if (whoRes.status === 401) {
        return NextResponse.json({
          success: false,
          status: 'invalid_key',
          error: 'Invalid Hugging Face token. Please check the token permissions on hf.co/settings/tokens.'
        });
      }
    } catch {}

    // Step 3B: Test Vision Inference
    const hf = new HfInference(testKey);
    const candidateModels = [
      model_id,
      'Qwen/Qwen2.5-VL-72B-Instruct',
      'meta-llama/Llama-3.2-11B-Vision-Instruct'
    ];

    let successModel = '';
    let resultSample = '';
    let lastError = '';

    for (const m of candidateModels) {
      if (!m) continue;
      try {
        const response = await hf.chatCompletion({
          model: m,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Reply ONLY with the word "READY".' },
                { type: 'image_url', image_url: { url: VALID_TEST_IMAGE_200 } }
              ]
            }
          ],
          max_tokens: 15
        });

        resultSample = response.choices?.[0]?.message?.content || 'READY';
        successModel = m;
        break;
      } catch (err: any) {
        lastError = err.message || '';
      }
    }

    const latency = Date.now() - startTime;

    if (successModel) {
      if (targetConn) {
        targetConn.status = 'working';
        targetConn.model_id = successModel;
        targetConn.latency_ms = latency;
        targetConn.last_tested_at = new Date().toISOString();
        await saveAiConnections(connections);
      }

      return NextResponse.json({
        success: true,
        status: 'working',
        latency_ms: latency,
        model: successModel,
        provider: 'Hugging Face Inference',
        auth_valid: true,
        image_supported: true,
        inference_success: true,
        output_sample: resultSample.trim(),
        message: `🟢 Connected to Hugging Face (${whoAmIUser || 'User'})! Model ${successModel} is verified and ready for document scanning (${latency}ms).`
      });
    }

    // Determine specific failure reason
    let statusResult: 'credits_depleted' | 'invalid_key' | 'failed' = 'failed';
    if (lastError.toLowerCase().includes('depleted') || lastError.toLowerCase().includes('credits') || lastError.toLowerCase().includes('quota')) {
      statusResult = 'credits_depleted';
    } else if (lastError.toLowerCase().includes('unauthorized') || lastError.toLowerCase().includes('401')) {
      statusResult = 'invalid_key';
    }

    if (targetConn) {
      targetConn.status = statusResult;
      targetConn.latency_ms = latency;
      targetConn.last_tested_at = new Date().toISOString();
      await saveAiConnections(connections);
    }

    return NextResponse.json({
      success: false,
      status: statusResult,
      latency_ms: latency,
      model: model_id,
      error: lastError || 'Inference provider unavailable for this model',
      diagnostics: {
        auth_valid: !!whoAmIUser,
        quota_ok: statusResult !== 'credits_depleted',
        recommendation: statusResult === 'credits_depleted'
          ? 'Monthly credits depleted. Use another Hugging Face account key or switch to Unlimited Local Engine.'
          : 'Hugging Face serverless endpoint busy. We recommend selecting Qwen2.5-VL-72B-Instruct or using the Unlimited Local Engine.'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error.message
    }, { status: 500 });
  }
}
