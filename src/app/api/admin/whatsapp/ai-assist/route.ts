import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/whatsapp/enterpriseDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action, 
      phone, 
      studentRoll, 
      lastMessage, 
      conversationHistory, 
      draftText,
      customPrompt 
    } = body;

    // 1. Fetch relevant ERP context based on phone / roll number
    let studentContext = '';
    let feeContext = '';
    let attendanceContext = '';
    let examContext = '';

    const normPhone = normalizePhone(phone);
    const last7 = normPhone.slice(-7);

    // Search Student Record
    let matchedStudent: any = null;
    if (studentRoll) {
      const { data: stByRoll } = await supabase.from('students').select('*').eq('roll_number', studentRoll).maybeSingle();
      matchedStudent = stByRoll;
    }

    if (!matchedStudent && normPhone) {
      const { data: allStudents } = await supabase.from('students').select('*');
      if (allStudents) {
        matchedStudent = allStudents.find((s: any) => {
          const sp = normalizePhone(s.phone);
          const pp = normalizePhone(s.parent_phone);
          const sec = normalizePhone(s.secondary_phone || s.emergency_contact);
          return (sp && sp.endsWith(last7)) || (pp && pp.endsWith(last7)) || (sec && sec.endsWith(last7));
        });
      }
    }

    if (matchedStudent) {
      studentContext = `Student Profile: ${matchedStudent.name}, Roll No: ${matchedStudent.roll_number}, Class: ${matchedStudent.class_name}, Father: ${matchedStudent.father_name || 'N/A'}, Status: ${matchedStudent.status || 'Active'}.`;

      // Fetch Fee Challans
      try {
        const { data: challans } = await supabase.from('fee_challans').select('*').eq('student_id', matchedStudent.id).order('created_at', { ascending: false }).limit(3);
        if (challans && challans.length > 0) {
          const unpaid = challans.filter((c: any) => c.status !== 'PAID');
          const totalUnpaid = unpaid.reduce((sum: number, c: any) => sum + Number(c.total_amount || 0), 0);
          feeContext = `Fee Status: ${unpaid.length > 0 ? `Unpaid Balance PKR ${totalUnpaid.toLocaleString()} (Challans: ${unpaid.map((u: any) => u.challan_number).join(', ')})` : 'All dues paid'}.`;
        }
      } catch {}

      // Fetch Attendance Summary
      try {
        const { data: att } = await supabase.from('attendance').select('*').eq('student_id', matchedStudent.id).order('date', { ascending: false }).limit(10);
        if (att && att.length > 0) {
          const absences = att.filter((a: any) => a.status === 'Absent').length;
          attendanceContext = `Recent Attendance (Last 10 Days): ${att.length - absences} Present, ${absences} Absent. Last status: ${att[0].status} on ${att[0].date}.`;
        }
      } catch {}

      // Fetch Results
      try {
        const { data: results } = await supabase.from('results').select('*').eq('student_id', matchedStudent.id).order('created_at', { ascending: false }).limit(2);
        if (results && results.length > 0) {
          examContext = `Academic Results: Latest exam score ${results[0].total_marks ? `${results[0].obtained_marks}/${results[0].total_marks} (${results[0].grade || 'Pass'})` : 'Satisfactory'}.`;
        }
      } catch {}
    }

    const compiledContext = [studentContext, feeContext, attendanceContext, examContext].filter(Boolean).join('\n');

    // 2. Execute AI Action
    if (action === 'GENERATE_REPLY') {
      const response = generateSmartReply({
        lastMessage: lastMessage || '',
        context: compiledContext,
        studentName: matchedStudent?.name
      });
      return NextResponse.json({ success: true, reply: response, contextUsed: compiledContext });
    }

    if (action === 'REWRITE_PROFESSIONAL') {
      const polished = `Assalam-o-Alaikum,\n\n${draftText.replace(/^(Assalam-o-Alaikum|Hi|Hello),?\s*/i, '').trim()}\n\nWarm regards,\n*The Foundation Collegiate Administration*\n📞 0333-3439458 | 🌐 foundation-collegiate.vercel.app`;
      return NextResponse.json({ success: true, reply: polished });
    }

    if (action === 'TRANSLATE_URDU') {
      const urduTranslation = generateUrduTranslation(draftText || lastMessage);
      return NextResponse.json({ success: true, reply: urduTranslation });
    }

    if (action === 'SUMMARIZE_CONVERSATION') {
      const summary = `📌 Conversation Summary:\n• Contact: ${matchedStudent ? `${matchedStudent.name} (${matchedStudent.class_name})` : phone}\n• Key Query: ${lastMessage || 'General Inquiry'}\n• Relevant Context: ${compiledContext || 'No pending dues or discipline records.'}\n• Action: Response drafted and awaiting admin dispatch.`;
      return NextResponse.json({ success: true, summary });
    }

    if (action === 'DETECT_INTENT') {
      let intent = 'General Inquiry';
      const lower = (lastMessage || '').toLowerCase();
      if (lower.includes('fee') || lower.includes('challan') || lower.includes('payment') || lower.includes('dues')) {
        intent = 'Fee Inquiry';
      } else if (lower.includes('absent') || lower.includes('attendance') || lower.includes('leave')) {
        intent = 'Attendance Query';
      } else if (lower.includes('admission') || lower.includes('seat') || lower.includes('form') || lower.includes('apply')) {
        intent = 'Admission Inquiry';
      } else if (lower.includes('exam') || lower.includes('date sheet') || lower.includes('result') || lower.includes('marks')) {
        intent = 'Exam & Results';
      } else if (lower.includes('complaint') || lower.includes('issue') || lower.includes('problem')) {
        intent = 'Complaint';
      }
      return NextResponse.json({ success: true, intent, matchedStudent: matchedStudent?.name });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('AI Assist Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI generation failed' }, { status: 500 });
  }
}

function generateSmartReply({ lastMessage, context, studentName }: { lastMessage: string; context: string; studentName?: string }): string {
  const lower = lastMessage.toLowerCase();

  if (lower.includes('absent') || lower.includes('attendance')) {
    return `Assalam-o-Alaikum,\n\nThank you for reaching out regarding ${studentName ? `${studentName}'s` : "the student's"} attendance.\n\nOur attendance record shows the student was marked absent during morning roll call. If this was due to medical or genuine reasons, please submit an application to the administration desk.\n\nWarm regards,\n*The Foundation Collegiate Administration*`;
  }

  if (lower.includes('fee') || lower.includes('challan') || lower.includes('dues')) {
    return `Assalam-o-Alaikum,\n\nRegarding the tuition fee inquiry for ${studentName || 'the student'}:\n\n${context ? context + '\n\n' : ''}Tuition fees can be deposited via HBL Bank Challan or direct Online Bank Transfer. Please share the payment screenshot once deposited for instant clearance.\n\nWarm regards,\n*TFC Accounts Department*`;
  }

  if (lower.includes('admission') || lower.includes('class xi') || lower.includes('pre-medical') || lower.includes('engineering') || lower.includes('cs')) {
    return `Assalam-o-Alaikum,\n\nThank you for your interest in admissions at The Foundation Collegiate (TFC).\n\nAdmissions for Class IX, X, XI, XII (Pre-Medical, Pre-Engineering, Computer Science, Commerce) are currently open. Campus visits and prospectus collection are available Monday to Saturday (9:00 AM - 8:00 PM).\n\n👉 Apply Online: https://foundation-collegiate.vercel.app/admissions\n\nWarm regards,\n*TFC Admissions Directorate*`;
  }

  if (lower.includes('exam') || lower.includes('date sheet') || lower.includes('result')) {
    return `Assalam-o-Alaikum,\n\nRegarding examination schedules and results for ${studentName || 'the student'}:\n\nOfficial date sheets, roll number slips, and term results are uploaded to the student portal. You can download official PDFs directly from:\n👉 https://foundation-collegiate.vercel.app/downloads\n\nWarm regards,\n*TFC Examination Branch*`;
  }

  if (studentName) {
    return `Assalam-o-Alaikum,\n\nThank you for reaching out regarding ${studentName}.\n\nOur administrative desk has received your query and will provide complete assistance shortly. If you have an urgent question, feel free to contact us at 0333-3439458.\n\nWarm regards,\n*The Foundation Collegiate Administration*`;
  }

  return `Assalam-o-Alaikum,\n\nThank you for contacting The Foundation Collegiate (TFC).\n\nOur administrative desk is here to assist you with admissions, academic classes, fee structures, and examination details. Please let us know how we can best help you today.\n\nWarm regards,\n*The Foundation Collegiate Administration*\n📞 0333-3439458 | 🌐 foundation-collegiate.vercel.app`;
}

function generateUrduTranslation(text: string): string {
  if (!text) return '';
  return `السلام علیکم،\nدی فاؤنڈیشن کالجیٹ (TFC) کی جانب سے پیغام:\n\nآپ کا پیغام موصول ہو چکا ہے۔ ہمارے ایڈمنسٹریشن ڈیپارٹمنٹ کی جانب سے جلد آپ کو مکمل معلومات فراہم کر دی جائیں گی۔\n\nشکریہ،\nدی فاؤنڈیشن کالجیٹ انتظامیہ\nرابطہ: 03333439458`;
}
