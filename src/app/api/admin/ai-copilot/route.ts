import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { sanitizeInput } from '@/lib/security/sanitize';
import { ALL_IMPORTED_STUDENT_CONTACTS, IMPORTED_BROADCAST_LISTS } from '@/lib/whatsapp/importedContacts';

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
    const { prompt: rawPrompt, history = [], clientStudents = [], filterTable } = await req.json();
    const prompt = sanitizeInput(rawPrompt);

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Fetch live snapshot of website data across tables
    const [
      { data: sbStudents },
      { data: results },
      { data: feeChallans },
      { data: admissions },
      { data: inquiries },
      { data: attendance },
      { data: notices },
      { data: achievers },
      { data: teachers },
      { data: courses }
    ] = await Promise.all([
      supabase.from('students').select('*').limit(500),
      supabase.from('results').select('id, student_name, roll_number, class_name, exam_name, month, total_marks, obtained_marks, percentage, grade, position').limit(200),
      supabase.from('fee_challans').select('id, student_id, challan_no, student_name, class_name, month_year, total_amount, status, due_date').limit(150),
      supabase.from('admissions').select('id, student_name, father_name, class_applied, parent_phone, status, created_at').limit(100),
      supabase.from('inquiries').select('*').limit(300),
      supabase.from('attendance').select('*').limit(200),
      supabase.from('notices').select('id, title, category, is_active, created_at').limit(50),
      supabase.from('achievers').select('id, name, position, board, percentage').limit(50),
      supabase.from('teachers').select('id, name, subject, qualification, is_active').limit(50),
      supabase.from('courses').select('id, name, duration, fee, is_active').limit(50)
    ]);

    // Merge Supabase students with any client-side cached / newly added students
    const studentMap = new Map<string, any>();
    
    // 1. Add Supabase students
    (sbStudents || []).forEach((s: any) => {
      const key = s.id || s.roll_number || s.name;
      studentMap.set(key, s);
    });

    // 2. Add/Override with Client students if provided
    if (Array.isArray(clientStudents)) {
      clientStudents.forEach((cs: any) => {
        if (!cs) return;
        const key = cs.id || cs.roll_number || cs.name;
        studentMap.set(key, { ...(studentMap.get(key) || {}), ...cs });
      });
    }

    const mergedStudents = Array.from(studentMap.values()).map(s => ({
      id: s.id,
      name: s.name,
      father_name: s.father_name || '',
      roll_number: s.roll_number || '',
      class_name: s.class_name || s.current_class || '',
      phone: s.phone || '',
      parent_phone: s.parent_phone || '',
      email: s.email || '',
      status: s.status || (s.is_active !== false ? 'Active' : 'Inactive'),
      is_active: s.is_active !== false
    }));

    // Perform targeted keyword search on students based on user's prompt
    const promptTokens = prompt.toLowerCase().split(/[\s,\-_.:/]+/).filter(t => t.length >= 2);
    const searchMatches = mergedStudents.filter(s => {
      const sName = (s.name || '').toLowerCase();
      const sFather = (s.father_name || '').toLowerCase();
      const sRoll = (s.roll_number || '').toLowerCase();
      const sPhone = (s.phone || '').replace(/\D/g, '');
      const sParentPhone = (s.parent_phone || '').replace(/\D/g, '');

      return promptTokens.some(token => 
        sName.includes(token) || 
        sFather.includes(token) || 
        sRoll.includes(token) ||
        (token.length >= 4 && sPhone.includes(token)) ||
        (token.length >= 4 && sParentPhone.includes(token))
      );
    });

    // Also search the 762 imported WhatsApp phonebook contacts
    const phonebookMatches = ALL_IMPORTED_STUDENT_CONTACTS.filter(c => {
      const cName = (c.name || '').toLowerCase();
      const cPhone = (c.phone || '').replace(/\D/g, '');
      return promptTokens.some(token => 
        cName.includes(token) || (token.length >= 4 && cPhone.includes(token))
      );
    });

    // Also search Admission Inquiries
    const inquiryMatches = (inquiries || []).filter((inq: any) => {
      const inqName = (inq.name || '').toLowerCase();
      const inqContact = (inq.contact || '').replace(/\D/g, '');
      return promptTokens.some(token => 
        inqName.includes(token) || (token.length >= 4 && inqContact.includes(token))
      );
    });

    const dataContext = {
      students_total_count: mergedStudents.length,
      matched_students_for_query: searchMatches,
      phonebook_contacts_total: ALL_IMPORTED_STUDENT_CONTACTS.length,
      matched_phonebook_contacts: phonebookMatches.slice(0, 20),
      inquiries_total: (inquiries || []).length,
      matched_inquiries: inquiryMatches.slice(0, 15),
      attendance_records_count: (attendance || []).length,
      whatsapp_broadcast_lists: IMPORTED_BROADCAST_LISTS.map(l => ({ name: l.name, count: l.contacts.length })),
      results_count: results?.length || 0,
      results_sample: results || [],
      fee_challans_count: feeChallans?.length || 0,
      fee_challans_sample: feeChallans || [],
      admissions_count: admissions?.length || 0,
      admissions_sample: admissions || [],
      notices_sample: notices || [],
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
1. QUERY & SEARCH: Provide exact answers and find records even with typos or slight spelling variations (e.g., "abddull asif" vs "Abdullah Asif", roll "FC-26-160").
2. PROPOSE ACTIONS WITH ADMIN APPROVAL: Whenever the admin asks to edit, update, delete, archive, or insert records, you MUST propose a structured actionable plan with the exact student record_id. You do NOT make modifications directly without generating the proposal.
3. PROPOSED ACTIONS FORMAT: When proposing changes, include a JSON block in this exact markdown codefence:
\`\`\`json:action_proposal
{
  "action": "UPDATE" | "DELETE" | "INSERT",
  "table": "students" | "results" | "fee_challans" | "admissions" | "notices" | "achievers" | "teachers",
  "record_id": "<target uuid or roll number>",
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

Current Live Database Snapshot & Matched Entities:
${JSON.stringify(dataContext, null, 2)}

Respond with professional, clear markdown formatting and actionable proposals.`;

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
