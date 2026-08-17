import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { sanitizeInput } from '@/lib/security/sanitize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection (Max 30 AI queries per minute per client)
  const rl = checkRateLimit(req, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({
      error: 'Too many requests. Please wait a moment before sending another AI query.'
    }, { status: 429 });
  }

  try {
    const { prompt: rawPrompt, history = [], filterTable } = await req.json();
    const prompt = sanitizeInput(rawPrompt);

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Fetch live snapshot of website data across tables
    const [
      { data: students },
      { data: results },
      { data: feeChallans },
      { data: admissions },
      { data: notices },
      { data: achievers },
      { data: teachers },
      { data: courses }
    ] = await Promise.all([
      supabase.from('students').select('id, name, father_name, roll_number, class_name, email, phone, status, is_active').limit(150),
      supabase.from('results').select('id, student_name, roll_number, class_name, exam_name, month, total_marks, obtained_marks, percentage, grade, position').limit(150),
      supabase.from('fee_challans').select('id, student_id, challan_no, student_name, class_name, month_year, total_amount, status, due_date').limit(100),
      supabase.from('admissions').select('id, student_name, father_name, class_applied, parent_phone, status, created_at').limit(50),
      supabase.from('notices').select('id, title, category, is_active, created_at').limit(30),
      supabase.from('achievers').select('id, name, position, board, percentage').limit(30),
      supabase.from('teachers').select('id, name, subject, qualification, is_active').limit(30),
      supabase.from('courses').select('id, name, duration, fee, is_active').limit(30)
    ]);

    const dataContext = {
      students_count: students?.length || 0,
      students_sample: students?.slice(0, 40) || [],
      results_count: results?.length || 0,
      results_sample: results?.slice(0, 40) || [],
      fee_challans_count: feeChallans?.length || 0,
      fee_challans_sample: feeChallans?.slice(0, 30) || [],
      admissions_count: admissions?.length || 0,
      admissions_sample: admissions?.slice(0, 20) || [],
      notices_sample: notices?.slice(0, 15) || [],
      achievers_sample: achievers || [],
      teachers_sample: teachers || [],
      courses_sample: courses || []
    };

    // 2. Resolve OpenRouter API Key
    const connections = await getAllAiConnections();
    const orConn = connections.find(c => c.provider === 'openrouter') ||
                   connections.find(c => c.is_default);

    let apiKey = '';
    let modelToUse = 'openrouter/free';

    if (orConn && orConn.encrypted_key) {
      apiKey = decryptApiKey(orConn.encrypted_key);
      if (orConn.model_id && !orConn.model_id.includes(':free')) {
        modelToUse = orConn.model_id;
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'No OpenRouter or AI API key configured. Please configure an API key in AI Scanner Settings (/admin/dashboard/settings/ai-scanner).'
      }, { status: 400 });
    }

    // 3. System Prompt for Institutional AI Copilot
    const systemPrompt = `You are "TFC AI Copilot & Data Manager" for The Foundation Collegiate administrative dashboard (Karachi, Pakistan).
You have real-time visibility into the college database: Students, Exam Results, Fee Challans, Admissions, Notices, Achievers, Teachers, and Courses.

Your Capabilities:
1. QUERY & SORT: Provide precise analytical answers, rankings, statistics, and filtered summaries of website data.
2. PROPOSE ACTIONS WITH ADMIN APPROVAL: Whenever the admin asks to edit, update, delete, archive, or insert records, you MUST propose a structured actionable plan. You do NOT make modifications directly without generating the proposal.
3. PROPOSED ACTIONS FORMAT: When proposing changes, include a JSON block in this exact markdown codefence:
\`\`\`json:action_proposal
{
  "action": "UPDATE" | "DELETE" | "INSERT",
  "table": "students" | "results" | "fee_challans" | "admissions" | "notices" | "achievers" | "teachers",
  "record_id": "<target uuid or identifier>",
  "description": "Short human-readable summary of the modification",
  "changes": {
    "field_name": "new_value"
  },
  "preview": {
    "target_name": "Student / Entity Name",
    "before": "Old value summary",
    "after": "New value summary"
  }
}
\`\`\`

Current Database Snapshot:
${JSON.stringify(dataContext, null, 2)}

Respond with professional, clear markdown formatting, helpful analysis, and polite tone.`;

    // 4. Construct messages history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })),
      { role: 'user', content: prompt }
    ];

    // 5. Call OpenRouter API
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://foundationcollegiate.edu.pk',
        'X-Title': 'The Foundation Collegiate AI Copilot',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    const orData = await orRes.json();

    if (!orRes.ok || !orData.choices?.[0]?.message?.content) {
      const errMsg = orData.error?.message || 'OpenRouter inference error';
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const replyContent = orData.choices[0].message.content;

    // 6. Extract action proposal if present
    let actionProposal: any = null;
    const actionMatch = replyContent.match(/```json:action_proposal\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        actionProposal = JSON.parse(actionMatch[1]);
      } catch (e) {
        console.warn('Action proposal parse failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      model_used: modelToUse,
      reply: replyContent,
      action_proposal: actionProposal
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
