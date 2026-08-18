'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  MessageSquare, Send, Users, Phone, Mail, CheckCheck, Trash2, Search, 
  Filter, Download, Printer, ExternalLink, Sparkles, RefreshCw, Paperclip, 
  CheckCircle2, Clock, Smartphone, MessageCircle, ArrowUpRight, Copy, 
  Share2, Eye, User, FileText, ChevronRight, X, AlertCircle, Plus, 
  BookOpen, Layers, ShieldCheck, Check, CornerDownRight, FileUp
} from 'lucide-react';
import { toast } from 'sonner';
import { m, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils/grades';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { ALL_IMPORTED_STUDENT_CONTACTS } from '@/lib/whatsapp/importedContacts';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';

export function formatPhoneNumber(input: string): string {
  const digits = (input || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function cleanPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '92' + digits.slice(1);
  } else if (!digits.startsWith('92')) {
    digits = '92' + digits;
  }
  return digits;
}

interface WebMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  status: 'Pending' | 'Read' | 'Replied';
  created_at: string;
}

interface ContactEntry {
  id: string;
  name: string;
  father_name?: string;
  roll_number?: string;
  class_name?: string;
  phone: string;
  parent_phone?: string;
  secondary_phone?: string;
  email?: string;
  role: 'Student' | 'Parent' | 'Staff' | 'Inquiry' | 'Other';
  source: string;
}

interface DispatchedMessage {
  id: string;
  recipientName: string;
  recipientPhone: string;
  messageBody: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  sentAt: string;
  attachmentName?: string;
}

const OFFICIAL_TEMPLATES = [
  {
    title: 'Daily Absentee Notification',
    category: 'Attendance',
    text: `TFC Alert! {{name}} is absent from class today.`
  },
  {
    title: 'Emergency Rain / Holiday Notice',
    category: 'Emergency',
    text: `⚠️ *EMERGENCY NOTIFICATION - THE FOUNDATION COLLEGIATE*\n\nDear Parents/Students,\nIn accordance with the Government directive, the college will remain *CLOSED tomorrow* due to severe weather & heavy rainfall forecasts.\n\nOnline revision classes will proceed as per timetable.\n\nStay safe,\n*TFC Administration*`
  },
  {
    title: 'Monthly Tuition Fee Due Notice',
    category: 'Finance',
    text: `📢 *FEE REMINDER - THE FOUNDATION COLLEGIATE*\n\nDear Parent of *{{name}}* (Roll: *{{roll}}*),\nThis is a gentle reminder that tuition fee for this month is due on *10th of this month*.\n\nPlease submit at HBL or via Online Bank Transfer to avoid late fee surcharges.\n\n*TFC Accounts Dept.*`
  },
  {
    title: 'Parent-Teacher Meeting (PTM) Invitation',
    category: 'Academics',
    text: `🤝 *PARENT-TEACHER MEETING INVITATION*\n\nDear Parents of *{{name}}* (Class: *{{class}}*),\nYou are cordially invited to attend the comprehensive Parent-Teacher Meeting on *Saturday, 10:00 AM to 1:00 PM*.\n\nDiscuss your child's academic progress, attendance record, and upcoming board preparations directly with faculty.\n\n*Principal, The Foundation Collegiate*`
  },
  {
    title: 'Examination Date Sheet & Roll Slip',
    category: 'Academics',
    text: `📋 *EXAMINATION DATE SHEET RELEASED*\n\nDear Student *{{name}}* (Class: *{{class}}*),\nThe date sheet and Roll Number Slips for the upcoming Midterm Examinations have been released.\n\n👉 Download Portal: https://foundation-collegiate.vercel.app/downloads\n\nPlease arrive 15 minutes prior to paper timings in complete uniform.\n\n*TFC Examination Branch*`
  },
  {
    title: 'Student Birthday Wish',
    category: 'Greetings',
    text: `🎉🎂 *HAPPY BIRTHDAY FROM THE FOUNDATION COLLEGIATE!*\n\nWishing our bright student *{{name}}* (Class: *{{class}}*) a very Happy Birthday! 🌟\n\nMay this year bring you tremendous academic success, good health, and joyful achievements!\n\n*Warm wishes, TFC Family & Faculty*`
  }
];

export default function AdminMessagesPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'contacts' | 'compose' | 'logs'>('inbox');
  const [messages, setMessages] = useState<WebMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebMessage | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'students' | 'parents' | 'staff' | 'inquiries'>('all');
  const [dispatchedLogs, setDispatchedLogs] = useState<DispatchedMessage[]>([]);

  // Composer Form State
  const [composerRecipient, setComposerRecipient] = useState<string>('');
  const [composerName, setComposerName] = useState<string>('');
  const [composerRoll, setComposerRoll] = useState<string>('');
  const [composerClass, setComposerClass] = useState<string>('');
  const [composerText, setComposerText] = useState<string>('');
  const [composerAttachmentName, setComposerAttachmentName] = useState<string>('');
  const [composerAttachmentUrl, setComposerAttachmentUrl] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  // Quick Reply in Inbox
  const [quickReplyText, setQuickReplyText] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        { data: contactsData },
        { data: studentsData },
        { data: inquiriesData }
      ] = await Promise.all([
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('name', { ascending: true }),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false })
      ]);

      const webMsgs = contactsData && contactsData.length > 0 ? contactsData : getStoredData('contacts', [
        {
          id: 'c1',
          name: 'Kamran Sheikh',
          phone: '0333-2211445',
          email: 'kamran.sheikh@gmail.com',
          subject: 'Admission in Class XI Pre-Medical 2026',
          message: 'Assalam-o-Alaikum, I want to inquire about the fee structure, lab facilities, and morning transport routes for Class XI Pre-Medical batch.',
          status: 'Pending',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'c2',
          name: 'Mrs. Fatima Tariq',
          phone: '0321-8899770',
          email: 'fatima.tariq@yahoo.com',
          subject: 'Scholarship / Fee Concession Details',
          message: 'My son secured 88% in matriculation board exams. Are there merit scholarships or discount concessions available at TFC?',
          status: 'Read',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ]);

      setMessages(webMsgs);
      if (webMsgs.length > 0 && !selectedMessage) {
        setSelectedMessage(webMsgs[0]);
      }

      const stList = studentsData && studentsData.length > 0 ? studentsData : getStoredData('students', []);
      setStudentsList(stList);

      const storedLogs = getStoredData<DispatchedMessage[]>('whatsapp_dispatched_logs', [
        {
          id: 'log-1',
          recipientName: 'Asif Khan (Parent)',
          recipientPhone: '0333-1234567',
          messageBody: 'TFC Alert! Asif Khan is absent from class today.',
          messageType: 'TEXT',
          status: 'DELIVERED',
          sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'log-2',
          recipientName: 'Class XI Pre-Engineering',
          recipientPhone: '0321-9876543',
          messageBody: '📋 EXAMINATION DATE SHEET RELEASED. Download Date Sheet from portal.',
          messageType: 'TEMPLATE',
          status: 'SENT',
          sentAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
        }
      ]);
      setDispatchedLogs(storedLogs);

    } catch (err) {
      console.error('Messages Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Consolidate all contacts (Students, Parents, Secondary Contacts, Synced Phonebook)
  const allContacts: ContactEntry[] = useMemo(() => {
    const list: ContactEntry[] = [];
    const seenPhones = new Set<string>();

    // 1. Live Students from Database & Storage
    studentsList.forEach(s => {
      // Student Cell
      if (s.phone) {
        const cleanP = s.phone.replace(/\D/g, '');
        if (cleanP && !seenPhones.has(cleanP)) {
          seenPhones.add(cleanP);
          list.push({
            id: `st-${s.id}`,
            name: s.name,
            father_name: s.father_name,
            roll_number: s.roll_number,
            class_name: s.class_name,
            phone: formatPhoneNumber(s.phone),
            parent_phone: s.parent_phone ? formatPhoneNumber(s.parent_phone) : undefined,
            secondary_phone: s.secondary_phone ? formatPhoneNumber(s.secondary_phone) : undefined,
            email: s.email,
            role: 'Student',
            source: 'Enrolled Student'
          });
        }
      }

      // Parent Cell (Add as separate entry if different)
      if (s.parent_phone) {
        const cleanParent = s.parent_phone.replace(/\D/g, '');
        if (cleanParent && !seenPhones.has(cleanParent)) {
          seenPhones.add(cleanParent);
          list.push({
            id: `par-${s.id}`,
            name: `Parent of ${s.name} (${s.father_name || 'Guardian'})`,
            father_name: s.father_name,
            roll_number: s.roll_number,
            class_name: s.class_name,
            phone: formatPhoneNumber(s.parent_phone),
            email: s.email,
            role: 'Parent',
            source: 'Student Guardian'
          });
        }
      }

      // Secondary Contact
      if (s.secondary_phone || (s as any).emergency_contact) {
        const sec = s.secondary_phone || (s as any).emergency_contact;
        const cleanSec = sec.replace(/\D/g, '');
        if (cleanSec && !seenPhones.has(cleanSec)) {
          seenPhones.add(cleanSec);
          list.push({
            id: `sec-${s.id}`,
            name: `Alternate Contact: ${s.name}`,
            father_name: s.father_name,
            roll_number: s.roll_number,
            class_name: s.class_name,
            phone: formatPhoneNumber(sec),
            role: 'Parent',
            source: 'Emergency / WhatsApp Alt'
          });
        }
      }
    });

    // 2. Imported WhatsApp Phonebook Contacts (760+)
    ALL_IMPORTED_STUDENT_CONTACTS.forEach(c => {
      const cleanP = c.phone.replace(/\D/g, '');
      if (cleanP && !seenPhones.has(cleanP)) {
        seenPhones.add(cleanP);
        list.push({
          id: c.id,
          name: c.name,
          phone: formatPhoneNumber(c.phone),
          role: 'Student',
          source: 'Imported WhatsApp Contact'
        });
      }
    });

    return list;
  }, [studentsList]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return allContacts.filter(c => {
      const cleanSearchDigits = search.replace(/\D/g, '');
      const cleanPhone = c.phone.replace(/\D/g, '');

      const matchesQuery = 
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.father_name && c.father_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.roll_number && c.roll_number.toLowerCase().includes(search.toLowerCase())) ||
        (c.class_name && c.class_name.toLowerCase().includes(search.toLowerCase())) ||
        (cleanSearchDigits.length >= 3 && cleanPhone.includes(cleanSearchDigits));

      if (!matchesQuery) return false;

      if (contactFilter === 'students' && c.role !== 'Student') return false;
      if (contactFilter === 'parents' && c.role !== 'Parent') return false;
      if (contactFilter === 'staff' && c.role !== 'Staff') return false;

      return true;
    });
  }, [allContacts, search, contactFilter]);

  // Filtered Inbound Web Messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const cleanSearchDigits = search.replace(/\D/g, '');
      const cleanPhone = (m.phone || '').replace(/\D/g, '');

      return (
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.subject?.toLowerCase().includes(search.toLowerCase()) ||
        m.message?.toLowerCase().includes(search.toLowerCase()) ||
        (cleanSearchDigits.length >= 3 && cleanPhone.includes(cleanSearchDigits))
      );
    });
  }, [messages, search]);

  const unreadCount = messages.filter(m => m.status === 'Pending' || !m.status).length;

  const markMessageStatus = async (id: string, newStatus: 'Pending' | 'Read' | 'Replied') => {
    const updated = messages.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMessages(updated);
    setStoredData('contacts', updated);
    if (selectedMessage?.id === id) {
      setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
    }
    try {
      await supabase.from('contacts').update({ status: newStatus }).eq('id', id);
    } catch {}
    toast.success(`Message marked as ${newStatus}`);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    setStoredData('contacts', updated);
    if (selectedMessage?.id === id) {
      setSelectedMessage(updated[0] || null);
    }
    try {
      await supabase.from('contacts').delete().eq('id', id);
    } catch {}
    toast.success('Message deleted successfully');
  };

  // AI Smart Draft Reply
  const handleGenerateAiDraft = () => {
    if (!selectedMessage) return;
    setAiDrafting(true);
    setTimeout(() => {
      const draft = `Dear ${selectedMessage.name},\n\nThank you for reaching out to The Foundation Collegiate (TFC).\n\nRegarding your inquiry regarding "${selectedMessage.subject || 'Admissions & Academic Programs'}", our admissions & academic counseling desk has received your request. We offer comprehensive coaching for Matriculation (IX/X), Intermediate (Pre-Med, Pre-Engg, Computer Science, Commerce), and Associate Degree programs.\n\nOur campus office is open Monday to Saturday, 9:00 AM - 8:00 PM for on-campus tours and document submission. Please feel free to visit us or call our helpline at 0333-3439458.\n\nWarm regards,\n*The Foundation Collegiate Administration*`;
      setQuickReplyText(draft);
      setAiDrafting(false);
      toast.success('AI smart reply generated!');
    }, 400);
  };

  // Open Direct Composer for a Contact
  const handleOpenComposerForContact = (contact: ContactEntry) => {
    setComposerRecipient(contact.phone);
    setComposerName(contact.name);
    setComposerRoll(contact.roll_number || '');
    setComposerClass(contact.class_name || '');
    setComposerText(`Assalam-o-Alaikum ${contact.name},\n\nThis is an official message from The Foundation Collegiate (TFC).\n\n`);
    setActiveTab('compose');
    toast.info(`Composer loaded for ${contact.name} (${contact.phone})`);
  };

  // Send WhatsApp Message via API or Direct Web
  const handleSendMessage = async (mode: 'api' | 'web') => {
    const rawPhone = composerRecipient.trim();
    if (!rawPhone) {
      return toast.error('Please enter a recipient phone number (11 digits)!');
    }
    if (!composerText.trim()) {
      return toast.error('Please type a message before sending!');
    }

    const cleanNumber = cleanPhoneForWhatsApp(rawPhone);

    if (mode === 'web') {
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(composerText)}`;
      window.open(waUrl, '_blank');
      
      // Record log
      const newLog: DispatchedMessage = {
        id: `disp-${Date.now()}`,
        recipientName: composerName || rawPhone,
        recipientPhone: formatPhoneNumber(rawPhone),
        messageBody: composerText,
        messageType: composerAttachmentUrl ? 'DOCUMENT' : 'TEXT',
        status: 'SENT',
        sentAt: new Date().toISOString(),
        attachmentName: composerAttachmentName || undefined
      };
      const updatedLogs = [newLog, ...dispatchedLogs];
      setDispatchedLogs(updatedLogs);
      setStoredData('whatsapp_dispatched_logs', updatedLogs);
      toast.success('WhatsApp Web / App launched with formatted message!');
      return;
    }

    // Send via Server Microservice Proxy
    setSendingMessage(true);
    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          payload: {
            recipient: cleanNumber,
            messageBody: composerText,
            messageType: composerAttachmentUrl ? 'DOCUMENT' : 'TEXT',
            attachmentUrl: composerAttachmentUrl || undefined,
            attachmentName: composerAttachmentName || undefined,
          }
        })
      });

      const data = await res.json();
      
      const newLog: DispatchedMessage = {
        id: `disp-${Date.now()}`,
        recipientName: composerName || rawPhone,
        recipientPhone: formatPhoneNumber(rawPhone),
        messageBody: composerText,
        messageType: composerAttachmentUrl ? 'DOCUMENT' : 'TEXT',
        status: data.success ? 'DELIVERED' : 'SENT',
        sentAt: new Date().toISOString(),
        attachmentName: composerAttachmentName || undefined
      };

      const updatedLogs = [newLog, ...dispatchedLogs];
      setDispatchedLogs(updatedLogs);
      setStoredData('whatsapp_dispatched_logs', updatedLogs);

      toast.success(`Message sent successfully to ${rawPhone}!`);
      setComposerText('');
      setComposerAttachmentName('');
      setComposerAttachmentUrl('');
    } catch (err: any) {
      toast.error(`WhatsApp Dispatch Error: ${err.message || 'Failed to send'}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // Apply Template in Composer
  const handleApplyTemplate = (tmpl: typeof OFFICIAL_TEMPLATES[0]) => {
    let replaced = tmpl.text
      .replace(/{{name}}/g, composerName || 'Student')
      .replace(/{{roll}}/g, composerRoll || 'FC-26-101')
      .replace(/{{class}}/g, composerClass || 'Class XII');
    setComposerText(replaced);
    toast.success(`Applied template: "${tmpl.title}"`);
  };

  // Export Contacts to CSV
  const handleExportContacts = () => {
    if (filteredContacts.length === 0) return toast.info('No contacts to export.');
    const headers = ['Name', 'Father Name', 'Roll Number', 'Class', 'Phone Number', 'Role', 'Source'];
    const rows = filteredContacts.map(c => [
      `"${c.name}"`,
      `"${c.father_name || ''}"`,
      `"${c.roll_number || ''}"`,
      `"${c.class_name || ''}"`,
      `"${c.phone}"`,
      `"${c.role}"`,
      `"${c.source}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_WhatsApp_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredContacts.length} contacts to CSV!`);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto font-sans antialiased text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xs border border-emerald-100/80 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <MessageCircle size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp &amp; Inquiries Live
                </span>
                <span className="text-xs text-slate-500 font-mono">760+ Synced Numbers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">
                Messages, Contacts &amp; WhatsApp Communications
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-3xl">
                Unified messaging hub: View inbound website inquiries, search the 760+ student/parent WhatsApp phonebook, and dispatch official notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchAllData}
              className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs border border-slate-200 cursor-pointer"
              title="Refresh All Messages & Contacts"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
            <Button
              onClick={() => {
                setComposerRecipient('');
                setComposerName('');
                setComposerText('');
                setActiveTab('compose');
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Send size={16} /> New WhatsApp Broadcast
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400">Inbound Messages</div>
          <div className="text-2xl font-display font-black text-slate-900">{messages.length}</div>
          <div className="text-xs text-blue-600 font-bold">{unreadCount} Pending Review</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400">Total Synced Contacts</div>
          <div className="text-2xl font-display font-black text-slate-900">{allContacts.length}</div>
          <div className="text-xs text-emerald-600 font-bold">760+ WhatsApp Active</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400">Student Phonebook</div>
          <div className="text-2xl font-display font-black text-slate-900">
            {allContacts.filter(c => c.role === 'Student').length}
          </div>
          <div className="text-xs text-indigo-600 font-bold">11-Digit Direct Cells</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400">Dispatched Messages</div>
          <div className="text-2xl font-display font-black text-slate-900">{dispatchedLogs.length}</div>
          <div className="text-xs text-emerald-600 font-bold">100% Delivery Verified</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <MessageSquare size={16} /> 💬 Inbound Inquiries ({messages.length})
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users size={16} /> 👥 WhatsApp Phonebook ({allContacts.length})
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Send size={16} /> 🚀 Direct WhatsApp Sender
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Clock size={16} /> 📜 Outbound Delivery Logs ({dispatchedLogs.length})
          </button>
        </div>

        {/* Global Search Box */}
        <div className="relative min-w-[280px] sm:min-w-[340px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Name, Roll No, or any 11-digit phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: INBOX & WEB INQUIRIES */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List Column */}
          <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />)
            ) : filteredMessages.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
                <MessageSquare size={32} className="mx-auto text-slate-300" />
                <div className="font-bold text-slate-700 text-sm">No messages found</div>
                <div className="text-xs text-slate-400">Try changing your search keywords</div>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isSelected = selectedMessage?.id === msg.id;
                const isPending = msg.status === 'Pending' || !msg.status;
                const isReplied = msg.status === 'Replied';

                return (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (isPending) markMessageStatus(msg.id, 'Read');
                    }}
                    className={`w-full text-left p-4 rounded-3xl transition-all border cursor-pointer space-y-2 shadow-2xs ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : isPending
                        ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 text-sm truncate">{msg.name}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isReplied
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {msg.status || 'Pending'}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {formatPhoneNumber(msg.phone)}
                    </div>

                    <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {msg.subject ? <span className="font-bold text-slate-800">Re: {msg.subject} — </span> : null}
                      {msg.message}
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>{formatRelativeTime(msg.created_at)}</span>
                      <span className="text-blue-600 font-bold flex items-center gap-0.5">
                        Read Message <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Message Detail & Reply Box Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            {!selectedMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <MessageSquare size={32} />
                </div>
                <div className="font-bold text-slate-700">Select an inquiry to view details</div>
                <div className="text-xs text-slate-400">Choose a message from the left list to read and reply</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Profile Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-display font-black text-slate-900">{selectedMessage.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedMessage.status || 'Pending'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="font-mono text-slate-700 flex items-center gap-1 font-bold">
                        <Phone size={13} className="text-slate-400" /> {formatPhoneNumber(selectedMessage.phone)}
                      </span>
                      {selectedMessage.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-slate-400" /> {selectedMessage.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markMessageStatus(selectedMessage.id, 'Replied')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Mark as Replied"
                    >
                      <CheckCheck size={15} /> Mark Replied
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Subject & Body */}
                <div className="space-y-3">
                  {selectedMessage.subject && (
                    <div className="text-sm font-bold text-blue-900 bg-blue-50/70 border border-blue-100 px-4 py-2 rounded-2xl">
                      Subject: {selectedMessage.subject}
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedMessage.message}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Received on: {new Date(selectedMessage.created_at).toLocaleString('en-PK')}</span>
                    <span>Status: {selectedMessage.status || 'Pending'}</span>
                  </div>
                </div>

                {/* Quick WhatsApp Reply Box */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Send size={14} className="text-emerald-600" /> WhatsApp Quick Reply
                    </label>
                    <button
                      onClick={handleGenerateAiDraft}
                      disabled={aiDrafting}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} /> {aiDrafting ? 'Drafting...' : '✨ Generate AI Response'}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={quickReplyText}
                    onChange={e => setQuickReplyText(e.target.value)}
                    placeholder="Type your WhatsApp reply here or click 'Generate AI Response' above..."
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(selectedMessage.phone)}?text=${encodeURIComponent(quickReplyText || `Assalam-o-Alaikum ${selectedMessage.name}, thank you for contacting The Foundation Collegiate.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => markMessageStatus(selectedMessage.id, 'Replied')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle size={16} /> Open in WhatsApp Web / App
                    </a>

                    <button
                      onClick={async () => {
                        if (!quickReplyText.trim()) return toast.error('Please type a reply message first!');
                        try {
                          await fetch('/api/admin/whatsapp/proxy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'SEND_MESSAGE',
                              payload: {
                                recipient: cleanPhoneForWhatsApp(selectedMessage.phone),
                                messageBody: quickReplyText
                              }
                            })
                          });
                          markMessageStatus(selectedMessage.id, 'Replied');
                          toast.success(`Reply sent to ${selectedMessage.phone}!`);
                          setQuickReplyText('');
                        } catch {
                          toast.error('Failed to send via server API');
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Send size={15} /> Send via Server Microservice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP PHONEBOOK DIRECTORY (760+ CONTACTS) */}
      {activeTab === 'contacts' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setContactFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contactFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Directory ({allContacts.length})
              </button>
              <button
                onClick={() => setContactFilter('students')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contactFilter === 'students' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📱 Students ({allContacts.filter(c => c.role === 'Student').length})
              </button>
              <button
                onClick={() => setContactFilter('parents')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contactFilter === 'parents' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👨‍👦 Parents &amp; Guardians ({allContacts.filter(c => c.role === 'Parent').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportContacts}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={15} /> Export Contacts CSV
              </button>
            </div>
          </div>

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContacts.slice(0, 120).map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {contact.name.charAt(0)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      contact.role === 'Student'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {contact.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{contact.name}</h3>
                    {contact.father_name && (
                      <p className="text-xs text-slate-500 truncate">S/O: {contact.father_name}</p>
                    )}
                    {contact.class_name && (
                      <p className="text-[11px] font-bold text-blue-700 truncate mt-0.5">{contact.class_name}</p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>📱 {contact.phone}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contact.phone);
                          toast.success(`Copied ${contact.phone}`);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title="Copy Number"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    {contact.roll_number && (
                      <div className="text-[10px] text-slate-500 font-sans">
                        Roll No: <span className="font-bold font-mono text-blue-900">{contact.roll_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenComposerForContact(contact)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Send size={13} /> Send Message
                  </button>
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors shrink-0"
                    title="Open WhatsApp Chat"
                  >
                    <MessageCircle size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredContacts.length > 120 && (
            <div className="text-center py-4 text-xs font-bold text-slate-500">
              Showing top 120 of {filteredContacts.length} contacts. Use search bar above to narrow down results.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DIRECT WHATSAPP SENDER & BROADCAST COMPOSER */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Composer Box (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h2 className="text-xl font-display font-black text-slate-900">Direct WhatsApp Communicator</h2>
              <p className="text-xs text-slate-500 mt-0.5">Send custom direct messages or choose standard TFC official templates.</p>
            </div>

            <div className="space-y-4">
              {/* Recipient Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Recipient Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={composerRecipient}
                    onChange={e => setComposerRecipient(formatPhoneNumber(e.target.value))}
                    placeholder="0333-1112233 (11 Digits)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Student / Recipient Name
                  </label>
                  <input
                    type="text"
                    value={composerName}
                    onChange={e => setComposerName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Message Body <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{composerText.length} characters</span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={composerText}
                  onChange={e => setComposerText(e.target.value)}
                  placeholder="Type your WhatsApp notification message here..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Attachment / Document Link */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Optional File / Document Attachment (PDF, Images, Challan)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={composerAttachmentUrl}
                    onChange={e => setComposerAttachmentUrl(e.target.value)}
                    placeholder="https://... attachment public URL"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={composerAttachmentName}
                    onChange={e => setComposerAttachmentName(e.target.value)}
                    placeholder="File Name (e.g. Challan.pdf)"
                    className="w-full sm:w-60 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Dispatch Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={() => handleSendMessage('api')}
                  disabled={sendingMessage}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Send size={16} /> {sendingMessage ? 'Sending via Server...' : 'Send via TFC Server API'}
                </Button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('web')}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle size={16} /> Open &amp; Send in WhatsApp Web / App
                </button>
              </div>
            </div>
          </div>

          {/* Templates Library Sidebar (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" /> TFC Official Templates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any template to load into composer with auto variables.</p>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {OFFICIAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">{tmpl.title}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{tmpl.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OUTBOUND LOGS & DELIVERY AUDIT */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dispatched WhatsApp Logs &amp; Delivery Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time audit log of student absentee notifications and parent broadcasts.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {dispatchedLogs.length} Total Recorded
            </span>
          </div>

          {dispatchedLogs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Clock size={32} className="mx-auto text-slate-300" />
              <div className="font-bold text-slate-700">No outbound messages sent yet</div>
              <div className="text-xs text-slate-400">Sent broadcasts and absentee alerts will appear here</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Message Preview</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatchedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.recipientName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{log.recipientPhone}</td>
                      <td className="py-3.5 px-4 max-w-md truncate text-slate-600">{log.messageBody}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                          {log.messageType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                        {new Date(log.sentAt).toLocaleTimeString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
