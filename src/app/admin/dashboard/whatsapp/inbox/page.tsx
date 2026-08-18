'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Search, Filter, Phone, Mail, User, 
  Paperclip, Image as ImageIcon, FileText, Check, CheckCheck, 
  Clock, AlertCircle, Sparkles, RefreshCw, X, ChevronRight, 
  Download, ExternalLink, ShieldCheck, Tag, MoreVertical, 
  Trash2, UserCheck, BookOpen, DollarSign, Calendar, Flame,
  FileSpreadsheet, Film, Music, ArrowLeft, Plus, Eye, Play,
  CornerDownRight, Lock, MessageCircle, Activity, Info, Users,
  CheckCircle2, AlertTriangle, UserPlus
} from 'lucide-react';
import { 
  WhatsAppConversationRecord, 
  WhatsAppMessageRecord, 
  formatDisplayPhone, 
  normalizePhone 
} from '@/lib/whatsapp/enterpriseDb';
import { whatsappSupabase } from '@/lib/whatsapp/supabaseClient';
import Button from '@/components/ui/Button';

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<WhatsAppConversationRecord[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'students' | 'parents' | 'inquiries' | 'unknown'>('all');

  // Mobile View Toggle: 'list' | 'chat' | 'info'
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');

  // Composer
  const [composerText, setComposerText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    name: string;
    size: number;
    type: string;
    url?: string;
  } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Assistant State
  const [aiGenerating, setAiGenerating] = useState(false);

  // Student ERP Data for Context Drawer
  const [studentErpData, setStudentErpData] = useState<{
    student?: any;
    fees?: any[];
    attendance?: any[];
    results?: any[];
  } | null>(null);

  // Media Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Diagnostics Modal State
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // New Chat Modal & Student Search State
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatInitialMsg, setNewChatInitialMsg] = useState('');
  const [newChatStudentSearch, setNewChatStudentSearch] = useState('');
  const [newChatMatchedStudent, setNewChatMatchedStudent] = useState<any>(null);
  const [newChatStarting, setNewChatStarting] = useState(false);

  // All Students list for directory matching
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

  // 1. Fetch Conversations from Server API
  const fetchConversations = useCallback(async (autoSelectIfNone = false) => {
    try {
      const res = await fetch('/api/admin/whatsapp/conversations');
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        if (autoSelectIfNone && data.data.length > 0) {
          setSelectedConvId(prev => prev || data.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Conversations fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Messages for Selected Conversation
  const loadConversationMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  // Initial Load + Enrolled Students List + Initial Sync
  useEffect(() => {
    fetchConversations(true);

    const loadStudents = async () => {
      try {
        const { data } = await supabase.from('students').select('*').order('name');
        if (data) setEnrolledStudents(data);
      } catch {}
    };
    loadStudents();

    // Trigger initial sync with WhatsApp microservice
    fetch('/api/admin/whatsapp/sync', { method: 'POST' })
      .then(() => fetchConversations(true))
      .catch(() => {});
  }, [fetchConversations]);

  // Live Supabase Realtime Subscription + Background Polling Fallback
  useEffect(() => {
    // 1. Supabase Realtime Channel
    const channel = whatsappSupabase
      .channel('whatsapp_live_inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        (payload: any) => {
          if (payload.new && payload.new.conversation_id === selectedConvId) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as WhatsAppMessageRecord];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
          fetchConversations(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversations' },
        () => {
          fetchConversations(false);
        }
      )
      .subscribe();

    // 2. Fallback Polling every 5 seconds
    const interval = setInterval(() => {
      fetch('/api/admin/whatsapp/conversations')
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data)) {
            setConversations(d.data);
            if (!selectedConvId && d.data.length > 0) {
              setSelectedConvId(d.data[0].id);
            }
          }
        })
        .catch(() => {});

      if (selectedConvId) {
        fetch(`/api/admin/whatsapp/messages?conversationId=${selectedConvId}`)
          .then(r => r.json())
          .then(d => {
            if (d.success && Array.isArray(d.data)) {
              setMessages(d.data);
            }
          })
          .catch(() => {});
      }
    }, 5000);

    return () => {
      whatsappSupabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [selectedConvId, fetchConversations]);

  // Selected Conversation Object
  const currentConv = useMemo(() => {
    if (!selectedConvId) return conversations[0] || null;
    return conversations.find(c => c.id === selectedConvId) || conversations[0] || null;
  }, [conversations, selectedConvId]);

  // When selectedConvId changes, fetch its messages
  useEffect(() => {
    if (selectedConvId) {
      loadConversationMessages(selectedConvId);
      setMobileView('chat');
    }
  }, [selectedConvId, loadConversationMessages]);

  // 3. Fetch Context ERP Data for Right Drawer
  useEffect(() => {
    if (!currentConv) {
      setStudentErpData(null);
      return;
    }

    const fetchStudentErp = async () => {
      try {
        let student: any = null;
        if (currentConv.student_roll) {
          const { data: stData } = await supabase.from('students').select('*').eq('roll_number', currentConv.student_roll).maybeSingle();
          student = stData;
        }

        if (!student) {
          const last7 = currentConv.normalized_phone.slice(-7);
          student = enrolledStudents.find(s => {
            const sp = normalizePhone(s.phone);
            const pp = normalizePhone(s.parent_phone);
            const sec = normalizePhone(s.secondary_phone || s.emergency_contact);
            return (sp && sp.endsWith(last7)) || (pp && pp.endsWith(last7)) || (sec && sec.endsWith(last7));
          });
        }

        if (student) {
          const [{ data: fees }, { data: attendance }, { data: results }] = await Promise.all([
            supabase.from('fee_challans').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
            supabase.from('attendance').select('*').eq('student_id', student.id).order('date', { ascending: false }).limit(10),
            supabase.from('results').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(2)
          ]);
          setStudentErpData({ student, fees: fees || [], attendance: attendance || [], results: results || [] });
        } else {
          setStudentErpData(null);
        }
      } catch {
        setStudentErpData(null);
      }
    };

    fetchStudentErp();
  }, [currentConv, enrolledStudents]);

  // Direct 1-Click Open Chat for any student from Search
  const handleOpenChatWithStudent = async (st: any) => {
    const rawPhone = st.phone || st.parent_phone || st.secondary_phone;
    const norm = normalizePhone(rawPhone);
    if (!norm) return toast.error(`No valid phone number registered for ${st.name}`);

    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: norm,
          name: `${st.name} (${st.class_name || 'Student'})`
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Chat opened with ${st.name}`);
        setSearch('');
        await fetchConversations();
        setSelectedConvId(data.data.id);
        setMobileView('chat');
      }
    } catch (e: any) {
      toast.error('Could not open chat: ' + e.message);
    }
  };

  // Live Auto-matching student in New Chat modal when typing phone number
  useEffect(() => {
    if (!newChatPhone || newChatPhone.length < 5) {
      setNewChatMatchedStudent(null);
      return;
    }
    const cleanDigits = newChatPhone.replace(/\D/g, '');
    const last7 = cleanDigits.slice(-7);

    const match = enrolledStudents.find(s => {
      const sp = normalizePhone(s.phone);
      const pp = normalizePhone(s.parent_phone);
      const sec = normalizePhone(s.secondary_phone || s.emergency_contact);
      return (sp && sp.endsWith(last7)) || (pp && pp.endsWith(last7)) || (sec && sec.endsWith(last7));
    });

    if (match) {
      setNewChatMatchedStudent(match);
      if (!newChatName) {
        setNewChatName(`${match.name} (${match.class_name})`);
      }
    } else {
      setNewChatMatchedStudent(null);
    }
  }, [newChatPhone, enrolledStudents, newChatName]);

  // Handle Sync from microservice
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/whatsapp/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced with WhatsApp service!`);
        await fetchConversations(true);
        if (selectedConvId) loadConversationMessages(selectedConvId);
      } else {
        toast.error('Sync notice: ' + (data.error || 'Sync service responded'));
      }
    } catch (e: any) {
      toast.error('Sync error: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Run System Diagnostics
  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    setDiagModalOpen(true);
    try {
      const res = await fetch('/api/admin/whatsapp/diagnostics');
      const data = await res.json();
      setDiagResults(data.results);
    } catch (e: any) {
      toast.error('Diagnostics failed: ' + e.message);
    } finally {
      setDiagLoading(false);
    }
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    });
    toast.success(`Attached file: ${file.name}`);
  };

  // Upload attachment and send message
  const handleSendMessage = async () => {
    if (!currentConv) return;
    if (!composerText.trim() && !attachedFile) {
      return toast.error('Please type a message or select an attachment!');
    }

    setSendingMessage(true);
    let uploadedUrl: string | undefined = undefined;
    let uploadedMime: string | undefined = undefined;
    let uploadedName: string | undefined = undefined;
    let uploadedSize: number | undefined = undefined;

    // Upload file if selected
    if (attachedFile) {
      setUploadingAttachment(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile.file);

        const upRes = await fetch('/api/admin/whatsapp/upload', {
          method: 'POST',
          body: formData
        });
        const upData = await upRes.json();

        if (upData.success && upData.file) {
          uploadedUrl = upData.file.url;
          uploadedMime = upData.file.mimeType;
          uploadedName = upData.file.filename;
          uploadedSize = upData.file.size;
        }
      } catch (err: any) {
        toast.error(`Attachment upload failed: ${err.message}`);
        setSendingMessage(false);
        setUploadingAttachment(false);
        return;
      }
      setUploadingAttachment(false);
    }

    try {
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConv.id,
          content: composerText,
          isInternalNote,
          mediaUrl: uploadedUrl,
          mediaFilename: uploadedName,
          mediaMimeType: uploadedMime,
          mediaSize: uploadedSize
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setComposerText('');
        setAttachedFile(null);
        if (isInternalNote) {
          toast.info('Internal staff note saved');
        } else {
          toast.success('Message dispatched to WhatsApp!');
        }
        fetchConversations();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (e: any) {
      toast.error('Send failed: ' + e.message);
    } finally {
      setSendingMessage(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // AI Smart Reply Trigger
  const handleAiAssist = async (action: 'GENERATE_REPLY' | 'REWRITE_PROFESSIONAL' | 'TRANSLATE_URDU' | 'SUMMARIZE_CONVERSATION') => {
    if (!currentConv) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/admin/whatsapp/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          phone: currentConv.normalized_phone,
          studentRoll: currentConv.student_roll,
          lastMessage: currentConv.last_message_text,
          draftText: composerText
        })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'SUMMARIZE_CONVERSATION') {
          toast.info(data.summary, { duration: 7000 });
        } else {
          setComposerText(data.reply);
          toast.success('AI drafted response inserted into composer!');
        }
      }
    } catch (err: any) {
      toast.error(`AI Assist error: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Start New Chat Submit
  const handleStartNewChat = async () => {
    if (!newChatPhone.trim()) {
      return toast.error('Please enter an 11-digit phone number or select a student');
    }

    const norm = normalizePhone(newChatPhone);
    if (!norm) {
      return toast.error('Please enter a valid Pakistan phone number (e.g. 03331234567)');
    }

    setNewChatStarting(true);
    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: norm,
          name: newChatName.trim() || undefined,
          initialMessage: newChatInitialMsg.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        toast.success('Conversation started successfully!');
        setNewChatModalOpen(false);
        setNewChatPhone('');
        setNewChatName('');
        setNewChatInitialMsg('');
        setNewChatMatchedStudent(null);
        await fetchConversations();
        setSelectedConvId(data.data.id);
        setMobileView('chat');
      } else {
        toast.error(data.error || 'Failed to start conversation');
      }
    } catch (e: any) {
      toast.error('Error starting conversation: ' + e.message);
    } finally {
      setNewChatStarting(false);
    }
  };

  // Delete single conversation
  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation and its entire chat history?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?id=${convId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Conversation deleted');
        setMessages([]);
        setSelectedConvId(null);
        await fetchConversations(true);
      } else {
        toast.error(data.error || 'Failed to delete conversation');
      }
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  // Clear all conversations
  const handleClearAllConversations = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL conversations and messages on this page. Continue?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/whatsapp/conversations?all=true', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('All conversations cleared');
        setConversations([]);
        setMessages([]);
        setSelectedConvId(null);
      } else {
        toast.error(data.error || 'Failed to clear conversations');
      }
    } catch (e: any) {
      toast.error('Clear failed: ' + e.message);
    }
  };

  // Export Chat History to Text Transcript
  const handleExportChat = () => {
    if (!messages || messages.length === 0) {
      return toast.info('No messages to export for this conversation');
    }
    const lines = [
      `============================================================`,
      `THE FOUNDATION COLLEGIATE (TFC) — WHATSAPP TRANSCRIPT`,
      `============================================================`,
      `Contact Name:     ${currentConv?.contact_name || 'Unknown'}`,
      `Phone Number:     ${currentConv?.phone || ''}`,
      `Linked Student:   ${currentConv?.student_name || 'None'} (Roll: ${currentConv?.student_roll || 'N/A'})`,
      `Export Timestamp: ${new Date().toLocaleString()}`,
      `Total Messages:   ${messages.length}`,
      `============================================================\n`,
      ...messages.map(m => {
        const time = new Date(m.created_at).toLocaleString();
        const author = m.direction === 'outbound' ? 'TFC Administration' : currentConv?.contact_name || m.sender;
        const noteTag = m.is_internal_note ? ' [INTERNAL NOTE]' : '';
        const mediaTag = m.media_url ? ` [ATTACHMENT: ${m.media_filename || m.media_url}]` : '';
        return `[${time}] ${author}${noteTag}:\n${m.content}${mediaTag}\n`;
      })
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tfc_chat_${currentConv?.normalized_phone || 'export'}_${Date.now()}.txt`;
    a.click();
    toast.success('Chat transcript exported successfully!');
  };

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const cleanQ = search.toLowerCase().trim();
      const matchesSearch = 
        !search ||
        c.contact_name.toLowerCase().includes(cleanQ) ||
        (c.student_name && c.student_name.toLowerCase().includes(cleanQ)) ||
        (c.student_roll && c.student_roll.toLowerCase().includes(cleanQ)) ||
        c.phone.includes(search) ||
        c.normalized_phone.includes(search) ||
        (c.last_message_text && c.last_message_text.toLowerCase().includes(cleanQ));

      if (!matchesSearch) return false;

      if (filterTab === 'unread' && (c.unread_count || 0) === 0) return false;
      if (filterTab === 'students' && c.relationship !== 'Student' && !c.tags?.includes('Student')) return false;
      if (filterTab === 'parents' && c.relationship !== 'Father' && c.relationship !== 'Mother' && c.relationship !== 'Guardian') return false;
      if (filterTab === 'inquiries' && c.relationship !== 'Inquiry' && !c.tags?.includes('Inquiry')) return false;
      if (filterTab === 'unknown' && (c.student_name || c.relationship !== 'Inquiry')) return false;

      return true;
    });
  }, [conversations, search, filterTab]);

  // Matching Students from Directory when searching
  const matchingStudentsFromDirectory = useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    const q = search.toLowerCase().trim();
    return enrolledStudents.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
      (s.class_name && s.class_name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.parent_phone && s.parent_phone.includes(q))
    ).slice(0, 5);
  }, [enrolledStudents, search]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-slate-50 overflow-hidden rounded-3xl border border-slate-200 shadow-sm font-sans">
      
      {/* 3-Panel Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: CONVERSATIONS LIST (LEFT PANEL) */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${
          mobileView !== 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header & Actions */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base leading-tight">Live WhatsApp Inbox</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time ERP Synchronization</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Sync with WhatsApp Provider"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleRunDiagnostics}
                  className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                  title="System Diagnostics"
                >
                  <Activity size={14} />
                </button>
                <button
                  onClick={handleClearAllConversations}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear All Conversations"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="Start New WhatsApp Conversation"
                >
                  <Plus size={14} /> New
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, roll, or phone (e.g. Asif)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
              {(['all', 'unread', 'students', 'parents', 'inquiries', 'unknown'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === tab
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List & Directory Search Matches */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            
            {/* If search active and matched students from directory, show them on top */}
            {matchingStudentsFromDirectory.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 space-y-2">
                <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                  <Users size={12} /> Students in Directory Matching "{search}":
                </div>
                <div className="space-y-1.5">
                  {matchingStudentsFromDirectory.map(st => (
                    <button
                      key={st.id}
                      onClick={() => handleOpenChatWithStudent(st)}
                      className="w-full p-2 bg-white hover:bg-emerald-100/60 rounded-xl border border-emerald-200 text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">🎓 {st.name}</div>
                        <div className="text-[10px] text-slate-500">{st.class_name} · Roll: {st.roll_number}</div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <MessageSquare size={10} /> Chat
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse m-2 rounded-2xl" />)
            ) : filteredConversations.length === 0 && matchingStudentsFromDirectory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                <MessageSquare size={32} className="mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No active conversations found</p>
                <p className="text-[11px] max-w-xs mx-auto">Click "+ New" above to start messaging a student or parent, or search any student name in the search box.</p>
                <Button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl mx-auto"
                >
                  <Plus size={14} /> Start New Chat
                </Button>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = currentConv?.id === conv.id;
                const hasUnread = (conv.unread_count || 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-l-4 border-emerald-600 shadow-2xs'
                        : hasUnread
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {conv.contact_name ? conv.contact_name.charAt(0) : 'W'}
                      </div>
                      {conv.priority === 'urgent' || conv.priority === 'high' ? (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                          🔥
                        </div>
                      ) : null}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate font-bold ${hasUnread ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                          {conv.contact_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {/* Student & Class Pill */}
                      {conv.student_name && (
                        <div className="text-[10px] text-blue-700 font-bold truncate flex items-center gap-1">
                          <span>🎓 {conv.student_name}</span>
                          {conv.student_roll && <span className="font-mono text-slate-500">({conv.student_roll})</span>}
                        </div>
                      )}

                      {/* Last Message Snippet */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.last_message_direction === 'outbound' && <span className="text-emerald-600 font-bold">You: </span>}
                          {conv.last_message_text || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: LIVE CHAT STREAM & COMPOSER (CENTER PANEL) */}
        <div className={`flex-1 flex flex-col bg-slate-100/50 min-w-0 ${
          mobileView === 'list' ? 'hidden md:flex' : mobileView === 'info' ? 'hidden xl:flex' : 'flex'
        }`}>
          {!currentConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-200/80 flex items-center justify-center text-slate-400">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Select a conversation or click "+ New"</h3>
              <p className="text-xs text-slate-400 max-w-sm">All incoming WhatsApp messages arrive in real-time with full student ERP context.</p>
              <Button
                onClick={() => setNewChatModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                <Plus size={14} /> Start New Conversation
              </Button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                    title="Back to Conversations"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {currentConv.contact_name ? currentConv.contact_name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{currentConv.contact_name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        {currentConv.relationship || 'Inquiry'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 flex items-center gap-1.5 truncate">
                      <span>📱 {formatDisplayPhone(currentConv.phone)}</span>
                      {currentConv.student_class && <span className="text-blue-600 font-sans font-semibold truncate">· {currentConv.student_class}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* WhatsApp Web Launch */}
                  <a
                    href={`https://wa.me/${currentConv.normalized_phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Open in WhatsApp Web"
                  >
                    <MessageCircle size={14} />
                    <span className="hidden lg:inline">WhatsApp Web</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${currentConv.phone}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Direct Phone Call"
                  >
                    <Phone size={14} />
                  </a>

                  {/* Export Chat Transcript */}
                  <button
                    onClick={handleExportChat}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export Chat History to Text File"
                  >
                    <Download size={14} />
                    <span className="hidden lg:inline">Export</span>
                  </button>

                  {/* Delete / Clear Conversation */}
                  <button
                    onClick={() => handleDeleteConversation(currentConv.id)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Delete Conversation and History"
                  >
                    <Trash2 size={14} />
                    <span className="hidden lg:inline">Delete</span>
                  </button>

                  {/* Info Toggle for Mobile / Tablet */}
                  <button
                    onClick={() => setMobileView(mobileView === 'info' ? 'chat' : 'info')}
                    className="xl:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Toggle Student Details"
                  >
                    <Info size={14} />
                  </button>
                </div>
              </div>

              {/* Message Bubbles Scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messagesLoading ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">No message history with this contact yet. Type a message below to start chatting!</div>
                ) : (
                  <>
                    <div className="text-center py-1">
                      <button
                        onClick={() => toast.info('All WhatsApp messages for this thread are synchronized in real-time.')}
                        className="px-3 py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-600 text-[11px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Clock size={12} className="text-slate-400" />
                        <span>Load older messages</span>
                      </button>
                    </div>
                    {messages.map((msg, idx) => {
                    const isOutbound = msg.direction === 'outbound';
                    const isNote = msg.is_internal_note;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md md:max-w-lg rounded-2xl p-3.5 space-y-2 shadow-2xs ${
                            isNote
                              ? 'bg-amber-50 border-2 border-amber-300 text-amber-950'
                              : isOutbound
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none'
                          }`}
                        >
                          {/* Internal Note Banner */}
                          {isNote && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-1">
                              <Lock size={11} /> Internal Staff Note (Not Sent to WhatsApp)
                            </div>
                          )}

                          {/* Media Attachment Previews */}
                          {msg.media_url && (
                            <div className="rounded-xl overflow-hidden bg-black/5 p-1">
                              {msg.message_type === 'image' || msg.media_mime_type?.startsWith('image/') ? (
                                <img
                                  src={msg.media_url}
                                  alt={msg.media_filename || 'Image Attachment'}
                                  onClick={() => setLightboxUrl(msg.media_url!)}
                                  className="max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              ) : msg.message_type === 'audio' || msg.media_mime_type?.startsWith('audio/') ? (
                                <div className="p-2 space-y-1">
                                  <div className="text-xs font-bold flex items-center gap-1.5">
                                    <Music size={14} /> {msg.media_filename || 'Audio Message'}
                                  </div>
                                  <audio controls className="w-full h-8" src={msg.media_url} />
                                </div>
                              ) : msg.message_type === 'video' || msg.media_mime_type?.startsWith('video/') ? (
                                <video controls className="max-h-60 rounded-lg w-full" src={msg.media_url} />
                              ) : (
                                <div className="flex items-center justify-between gap-3 p-2 bg-white/80 rounded-lg text-slate-800">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText size={18} className="text-red-500 shrink-0" />
                                    <span className="text-xs font-bold truncate">{msg.media_filename || 'Document.pdf'}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => setPdfPreviewUrl(msg.media_url!)}
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                      title="Preview PDF"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <a
                                      href={msg.media_url}
                                      download={msg.media_filename || 'document'}
                                      className="p-1 text-slate-600 hover:text-slate-800"
                                      title="Download"
                                    >
                                      <Download size={14} />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Content Text */}
                          <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content}
                          </div>

                          {/* Time & Delivery Status */}
                          <div className={`flex items-center justify-end gap-1.5 text-[10px] ${isOutbound && !isNote ? 'text-emerald-100' : 'text-slate-400'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOutbound && !isNote && (
                              <span>
                                {msg.status === 'read' ? (
                                  <CheckCheck size={13} className="text-blue-200" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck size={13} />
                                ) : (
                                  <Check size={13} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

              {/* AI Quick Assistant Bar */}
              <div className="px-4 py-2 bg-indigo-50/70 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1 shrink-0">
                  <Sparkles size={14} className="text-indigo-600" /> AI Assistant:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAiAssist('GENERATE_REPLY')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ✨ Auto-Reply
                  </button>
                  <button
                    onClick={() => handleAiAssist('REWRITE_PROFESSIONAL')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Polite Rewrite
                  </button>
                  <button
                    onClick={() => handleAiAssist('TRANSLATE_URDU')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Translate Urdu
                  </button>
                  <button
                    onClick={() => handleAiAssist('SUMMARIZE_CONVERSATION')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Summarize
                  </button>
                </div>
              </div>

              {/* Attachment Preview Strip */}
              {attachedFile && (
                <div className="px-4 py-2 bg-slate-200/70 border-t border-slate-300 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate font-bold text-slate-800">
                    <Paperclip size={14} className="text-emerald-600" />
                    <span className="truncate">{attachedFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="text-slate-500 hover:text-red-600 p-1">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Quick Canned Replies Bar */}
              <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold scrollbar-none">
                <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                  ⚡ Quick:
                </span>
                {[
                  { label: '💰 Fee Details', text: 'Tuition Fee can be submitted at HBL Account #0123456789 (The Foundation Collegiate) or via Online Transfer. Kindly share the screenshot/slip after payment.' },
                  { label: '🎓 Admissions', text: 'Admissions for Class XI & XII Pre-Medical, Pre-Engineering & Computer Science are OPEN! Apply online at https://foundation-collegiate.vercel.app/admissions' },
                  { label: '⏰ Timings', text: 'College Timings: Mon–Thu: 8:00 AM – 1:30 PM | Fri: 8:00 AM – 12:30 PM. Administrative office is open till 2:30 PM.' },
                  { label: '📍 Location', text: 'The Foundation Collegiate, Main Campus, Gulshan-e-Iqbal, Karachi. Contact: +92 333 3439458.' },
                  { label: '📊 Results', text: 'Exam transcripts and attendance scores are accessible via the Student Portal. Please contact the Examination Desk for verified copies.' }
                ].map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => setComposerText(prev => (prev ? prev + ' ' + qr.text : qr.text))}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
                    title={qr.text}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Chat Composer */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,audio/*,video/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Attach File / Document / Image / Audio / Video"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Internal Note Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isInternalNote
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Toggle Internal Staff Note"
                  >
                    <Lock size={13} /> {isInternalNote ? 'Staff Note ON' : 'WhatsApp'}
                  </button>

                  <textarea
                    rows={1}
                    value={composerText}
                    onChange={e => setComposerText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isInternalNote ? "Write internal staff note (won't be sent to WhatsApp)..." : "Type a WhatsApp reply (Press Enter to send)..."}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none max-h-32"
                  />

                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || uploadingAttachment}
                    className={`px-5 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                  >
                    <Send size={15} /> {sendingMessage ? 'Sending...' : isInternalNote ? 'Save Note' : 'Send'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PANEL 3: TFC STUDENT CONTEXT & CRM DRAWER (RIGHT PANEL) */}
        {currentConv && (
          <div className={`w-full sm:w-80 lg:w-88 border-l border-slate-200 bg-white flex-col shrink-0 overflow-y-auto p-5 space-y-5 ${
            mobileView === 'info' ? 'flex' : 'hidden xl:flex'
          }`}>
            {/* Mobile Close Button */}
            <div className="xl:hidden flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-500">Contact CRM Details</span>
              <button onClick={() => setMobileView('chat')} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Contact Details */}
            <div className="text-center space-y-2 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                {currentConv.contact_name ? currentConv.contact_name.charAt(0) : 'W'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{currentConv.contact_name}</h3>
                <p className="text-xs font-mono text-slate-500">{formatDisplayPhone(currentConv.phone)}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {currentConv.relationship} · {currentConv.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Matched Student Profile */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User size={13} /> Matched Student Profile
              </h4>

              {studentErpData?.student ? (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
                  <div className="font-bold text-blue-950 text-sm">{studentErpData.student.name}</div>
                  <div className="text-slate-600">Father: <span className="font-semibold text-slate-800">{studentErpData.student.father_name || 'N/A'}</span></div>
                  <div className="text-slate-600">Roll Number: <span className="font-mono font-bold text-blue-900">{studentErpData.student.roll_number}</span></div>
                  <div className="text-slate-600">Class: <span className="font-semibold text-slate-800">{studentErpData.student.class_name}</span></div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Unknown or prospective admission inquiry.
                </div>
              )}
            </div>

            {/* Fee Context */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign size={13} /> Tuition Fee Status
              </h4>
              {studentErpData?.fees && studentErpData.fees.length > 0 ? (
                <div className="space-y-1.5">
                  {studentErpData.fees.slice(0, 2).map((f: any) => (
                    <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">Challan #{f.challan_number || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500">PKR {Number(f.total_amount || 0).toLocaleString()}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        f.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {f.status || 'UNPAID'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">No fee records found.</div>
              )}
            </div>

            {/* Attendance Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} /> Attendance Record
              </h4>
              {studentErpData?.attendance && studentErpData.attendance.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recent Attendance:</span>
                    <span className="font-bold text-slate-800">{studentErpData.attendance.filter(a => a.status === 'Present').length} / {studentErpData.attendance.length} Present</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Status:</span>
                    <span className="font-bold text-emerald-700">{studentErpData.attendance[0]?.status} ({studentErpData.attendance[0]?.date})</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">No attendance logs available.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL WITH FULL STUDENT & DIRECTORY SEARCH */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Start New WhatsApp Chat</h3>
              </div>
              <button onClick={() => setNewChatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pick from Enrolled Students or Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Search Student Directory or Enter Phone
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={newChatStudentSearch}
                    onChange={e => setNewChatStudentSearch(e.target.value)}
                    placeholder="Search enrolled student by name, roll number, or class..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Autocomplete Results */}
                {newChatStudentSearch.trim().length >= 2 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-xs">
                    {enrolledStudents
                      .filter(s => 
                        s.name.toLowerCase().includes(newChatStudentSearch.toLowerCase()) ||
                        (s.roll_number && s.roll_number.toLowerCase().includes(newChatStudentSearch.toLowerCase())) ||
                        (s.class_name && s.class_name.toLowerCase().includes(newChatStudentSearch.toLowerCase()))
                      )
                      .slice(0, 5)
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            const p = s.phone || s.parent_phone || '';
                            setNewChatPhone(formatDisplayPhone(p));
                            setNewChatName(`${s.name} (${s.class_name})`);
                            setNewChatMatchedStudent(s);
                            setNewChatStudentSearch('');
                          }}
                          className="w-full p-2 text-left hover:bg-emerald-50 text-xs flex justify-between items-center transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{s.name}</span>
                            <span className="text-[10px] text-blue-700 font-mono ml-2">({s.roll_number})</span>
                            <div className="text-[10px] text-slate-500">{s.class_name} · Father: {s.father_name || 'N/A'}</div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700">{formatDisplayPhone(s.phone || s.parent_phone || '')}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Recipient Phone Number (11 Digits)
                </label>
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={e => setNewChatPhone(e.target.value)}
                  placeholder="0333-1234567 or +923331234567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Contact Name / Label
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={e => setNewChatName(e.target.value)}
                  placeholder="e.g. Asif Khan (Parent) or Inquiry"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Matched Student Preview */}
              {newChatMatchedStudent && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Linked to Student Profile:
                  </div>
                  <div className="text-emerald-800">
                    {newChatMatchedStudent.name} (Roll: {newChatMatchedStudent.roll_number}, Class: {newChatMatchedStudent.class_name})
                  </div>
                </div>
              )}

              {/* Optional First Message */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newChatInitialMsg}
                  onChange={e => setNewChatInitialMsg(e.target.value)}
                  placeholder="Type initial message to send immediately..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={handleStartNewChat}
                  disabled={newChatStarting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Send size={14} /> {newChatStarting ? 'Starting...' : 'Open Chat'}
                </Button>
                <button
                  onClick={() => setNewChatModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM DIAGNOSTICS MODAL */}
      {diagModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Activity size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">WhatsApp System Diagnostics</h3>
              </div>
              <button onClick={() => setDiagModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {diagLoading ? (
              <div className="text-center py-10 text-xs text-slate-500">Probing all subsystem layers...</div>
            ) : diagResults ? (
              <div className="space-y-3">
                {Object.entries(diagResults).map(([layer, info]: [string, any]) => (
                  <div key={layer} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{layer}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{info.message}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                      info.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : info.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {info.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setDiagModalOpen(false)} className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white font-bold p-2 hover:opacity-80"
            >
              <X size={24} />
            </button>
            <img src={lightboxUrl} alt="Preview" className="max-h-[85vh] mx-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">PDF Document Viewer</h3>
              <button onClick={() => setPdfPreviewUrl(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe src={pdfPreviewUrl} className="w-full h-full border-none" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
