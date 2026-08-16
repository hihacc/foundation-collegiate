import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllAiConnections, 
  saveAiConnections, 
  addOrUpdateAiConnection 
} from '@/lib/ai/aiConnectionService';
import { AI_MODELS_REGISTRY } from '@/lib/ai/modelRegistry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const connections = await getAllAiConnections();
    
    // Return sanitized connections without encrypted keys
    const sanitized = connections.map(c => ({
      id: c.id,
      name: c.name,
      provider: c.provider,
      masked_key: c.masked_key,
      model_id: c.model_id,
      is_active: c.is_active,
      is_default: c.is_default,
      status: c.status,
      last_tested_at: c.last_tested_at,
      latency_ms: c.latency_ms,
      created_at: c.created_at,
      updated_at: c.updated_at
    }));

    return NextResponse.json({
      success: true,
      connections: sanitized,
      available_models: AI_MODELS_REGISTRY
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, provider, plain_api_key, model_id, is_default, id } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Connection name is required' }, { status: 400 });
    }

    const saved = await addOrUpdateAiConnection({
      id,
      name,
      provider: provider || 'huggingface',
      plain_api_key,
      model_id: model_id || 'Qwen/Qwen2.5-VL-7B-Instruct',
      is_default: !!is_default
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: saved.id,
        name: saved.name,
        provider: saved.provider,
        masked_key: saved.masked_key,
        model_id: saved.model_id,
        is_active: saved.is_active,
        is_default: saved.is_default,
        status: saved.status
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body; // action: 'set_default' | 'toggle_active'

    const connections = await getAllAiConnections();
    const target = connections.find(c => c.id === id);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
    }

    if (action === 'set_default') {
      connections.forEach(c => (c.is_default = c.id === id));
    } else if (action === 'toggle_active') {
      target.is_active = !target.is_active;
    }

    await saveAiConnections(connections);

    return NextResponse.json({ success: true, connections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const connections = await getAllAiConnections();
    const remaining = connections.filter(c => c.id !== id);

    // Ensure at least one is default
    if (remaining.length > 0 && !remaining.some(c => c.is_default)) {
      remaining[0].is_default = true;
    }

    await saveAiConnections(remaining);

    return NextResponse.json({ success: true, message: 'Connection deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
