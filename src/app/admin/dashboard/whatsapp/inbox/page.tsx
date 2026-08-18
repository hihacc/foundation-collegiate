'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Search, Filter, Phone, Mail, User, 
  Paperclip, Image as ImageIcon, FileText, Check, CheckCheck, 
  Clock, AlertCircle, Sparkles, RefreshCw, X, ChevronRight, 
  Download, ExternalLink, ShieldCheck, Tag, MoreVertical, 
  Trash2, UserCheck, BookOpen, DollarSign, Calendar, Flame,
  FileSpreadsheet, Film, Music, ArrowLeft, Plus, Eye, Play,
  CornerDownRight, Lock, MessageCircle
} from 'lucide-react';
import { 
  WhatsAppConversationRecord, 
  WhatsAppMessageRecord, 
  formatDisplayPhone, 
  normalizePhone 
} from '@/lib/whatsapp/enterpriseDb';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import Button from '@/components/ui/Button';

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<WhatsAppConversationRecord[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'students' | 'parents' | 'inquiries' | 'faculty' | 'unknown' | 'archived'>('all');

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
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

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

  // New Chat Modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (data && data.length > 0) {
        setConversations(data);
        if (!selectedConvId) setSelectedConvId(data[0].id);
      } else {
        // Fallback default conversations
        const local = getStoredData<WhatsAppConversationRecord[]>('tfc_whatsapp_conversations', [
          {
            id: 'conv_default_1',
            phone: '0333-2211445',
            normalized_phone: '923332211445',
            contact_name: 'Mr. Tariq Mehmood',
            student_name: 'Ahmed Tariq',
            student_roll: 'FC-26-1042',
            student_class: 'Class XII - Computer Science',
            relationship: 'Father',
            status: 'open',
            priority: 'high',
            tags: ['Parent', 'FeeInquiry'],
            unread_count: 2,
            last_message_text: 'Assalam-o-Alaikum, can you please share the updated tuition fee challan for this month?',
            last_message_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            last_message_direction: 'inbound'
          },
          {
            id: 'conv_default_2',
            phone: '0321-9988776',
            normalized_phone: '923219988776',
            contact_name: 'Fatima Noor',
            student_name: 'Fatima Noor',
            student_roll: 'FC-26-1099',
            student_class: 'Class XI - Pre-Medical',
            relationship: 'Student',
            status: 'open',
            priority: 'normal',
            tags: ['Student', 'Attendance'],
            unread_count: 0,
            last_message_text: 'Thank you Sir! I have submitted my medical leave application.',
            last_message_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            last_message_direction: 'outbound'
          },
          {
            id: 'conv_default_3',
            phone: '0300-1234567',
            normalized_phone: '923001234567',
            contact_name: 'Prospective Parent (Admission)',
            student_name: 'Muhammad Saad',
            student_class: 'Class XI - Pre-Engineering',
            relationship: 'Inquiry',
            status: 'waiting_for_tfc',
            priority: 'normal',
            tags: ['Inquiry'],
            unread_count: 1,
            last_message_text: 'What are the timing schedules and lab facilities for Pre-Engineering?',
            last_message_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            last_message_direction: 'inbound'
          }
        ]);
        setConversations(local);
        if (!selectedConvId && local.length > 0) {
          setSelectedConvId(local[0].id);
        }
      }
    } catch (err) {
      console.warn('Conversations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Supabase Realtime Subscription for incoming messages
    const channel = supabase
      .channel('whatsapp_inbox_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload: any) => {
        if (selectedConvId && payload.new.conversation_id === selectedConvId) {
          setMessages(prev => [...prev, payload.new as WhatsAppMessageRecord]);
        }
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  // Selected Conversation Object
  const currentConv = useMemo(() => {
    return conversations.find(c => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // 2. Fetch Messages for Selected Conversation
  useEffect(() => {
    if (!selectedConvId) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const { data } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('conversation_id', selectedConvId)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          setMessages(data);
        } else {
          // Fallback messages
          const localMsgs = getStoredData<WhatsAppMessageRecord[]>(`tfc_whatsapp_messages_${selectedConvId}`, [
            {
              id: 'msg_1',
              conversation_id: selectedConvId,
              direction: 'inbound',
              sender: currentConv?.normalized_phone || '923332211445',
              recipient: 'TFC_OFFICIAL',
              message_type: 'text',
              content: currentConv?.last_message_text || 'Assalam-o-Alaikum, I need information regarding college academics.',
              status: 'read',
              created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            }
          ]);
          setMessages(localMsgs);
        }

        // Mark unread as 0
        if (currentConv && currentConv.unread_count > 0) {
          await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', selectedConvId);
          setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unread_count: 0 } : c));
        }
      } catch {}
      setMessagesLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    fetchMessages();
  }, [selectedConvId]);

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
          const { data: allSt } = await supabase.from('students').select('*');
          if (allSt) {
            student = allSt.find((s: any) => {
              const sp = normalizePhone(s.phone);
              const pp = normalizePhone(s.parent_phone);
              const sec = normalizePhone(s.secondary_phone || s.emergency_contact);
              const last7 = currentConv.normalized_phone.slice(-7);
              return (sp && sp.endsWith(last7)) || (pp && pp.endsWith(last7)) || (sec && sec.endsWith(last7));
            });
          }
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
  }, [currentConv]);

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

  // Upload attachment and send
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

    // 1. Upload File if present
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

    // Determine Message Type
    let msgType: any = 'text';
    if (uploadedMime?.startsWith('image/')) msgType = 'image';
    else if (uploadedMime?.startsWith('audio/')) msgType = 'audio';
    else if (uploadedMime?.startsWith('video/')) msgType = 'video';
    else if (uploadedUrl) msgType = 'document';

    const newMsg: WhatsAppMessageRecord = {
      id: `msg_out_${Date.now()}`,
      conversation_id: currentConv.id,
      direction: 'outbound',
      sender: 'TFC_OFFICIAL',
      recipient: currentConv.normalized_phone,
      message_type: msgType,
      content: composerText || `[${msgType.toUpperCase()}]`,
      status: isInternalNote ? 'delivered' : 'sending',
      media_url: uploadedUrl,
      media_mime_type: uploadedMime,
      media_filename: uploadedName,
      media_size: uploadedSize,
      is_internal_note: isInternalNote,
      created_at: new Date().toISOString()
    };

    // Optimistic Append
    setMessages(prev => [...prev, newMsg]);
    setComposerText('');
    setAttachedFile(null);

    // If NOT internal note, dispatch to WhatsApp Microservice
    if (!isInternalNote) {
      try {
        const res = await fetch('/api/admin/whatsapp/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SEND_MESSAGE',
            payload: {
              recipient: currentConv.normalized_phone,
              messageBody: newMsg.content,
              messageType: msgType === 'text' ? 'TEXT' : 'DOCUMENT',
              attachmentUrl: uploadedUrl,
              attachmentName: uploadedName
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          newMsg.status = 'delivered';
          toast.success('Message delivered via WhatsApp!');
        } else {
          newMsg.status = 'sent';
        }
      } catch {
        newMsg.status = 'sent';
      }
    } else {
      toast.info('Internal staff note recorded (not sent to WhatsApp)');
    }

    // Persist to Supabase
    try {
      await supabase.from('whatsapp_messages').insert([newMsg]);
      await supabase.from('whatsapp_conversations').update({
        last_message_text: newMsg.content,
        last_message_at: newMsg.created_at,
        last_message_direction: 'outbound',
        status: currentConv.status === 'new' ? 'open' : currentConv.status
      }).eq('id', currentConv.id);
    } catch {}

    // Persist to LocalStorage
    try {
      const local = getStoredData<WhatsAppMessageRecord[]>(`tfc_whatsapp_messages_${currentConv.id}`, []);
      local.push(newMsg);
      setStoredData(`tfc_whatsapp_messages_${currentConv.id}`, local);
    } catch {}

    setSendingMessage(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

  // Filtered Conversations List
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const cleanQ = search.toLowerCase();
      const matchesSearch = 
        !search ||
        c.contact_name.toLowerCase().includes(cleanQ) ||
        (c.student_name && c.student_name.toLowerCase().includes(cleanQ)) ||
        (c.student_roll && c.student_roll.toLowerCase().includes(cleanQ)) ||
        c.phone.includes(search) ||
        (c.last_message_text && c.last_message_text.toLowerCase().includes(cleanQ));

      if (!matchesSearch) return false;

      if (filterTab === 'unread' && (c.unread_count || 0) === 0) return false;
      if (filterTab === 'students' && c.relationship !== 'Self' && !c.tags?.includes('Student')) return false;
      if (filterTab === 'parents' && c.relationship !== 'Father' && c.relationship !== 'Mother' && c.relationship !== 'Guardian') return false;
      if (filterTab === 'inquiries' && c.relationship !== 'Inquiry' && !c.tags?.includes('Inquiry')) return false;
      if (filterTab === 'faculty' && c.relationship !== 'Faculty') return false;
      if (filterTab === 'archived' && c.status !== 'archived') return false;

      return true;
    });
  }, [conversations, search, filterTab]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-slate-50 overflow-hidden rounded-3xl border border-slate-200 shadow-sm font-sans">
      {/* 3-Panel Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: CONVERSATIONS LIST (LEFT PANEL) */}
        <div className="w-full sm:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <MessageSquare size={16} />
                </div>
                <h2 className="font-bold text-slate-900 text-base">WhatsApp Chats</h2>
              </div>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Start New WhatsApp Conversation"
              >
                <Plus size={15} /> New
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, roll, or 11d phone..."
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
              {(['all', 'unread', 'students', 'parents', 'inquiries'] as const).map(tab => (
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

          {/* Conversations List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-18 bg-slate-100 animate-pulse m-2 rounded-2xl" />)
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare size={28} className="mx-auto text-slate-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConvId === conv.id;
                const hasUnread = (conv.unread_count || 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
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
        <div className="flex-1 flex flex-col bg-slate-100/50 min-w-0">
          {!currentConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-200/80 flex items-center justify-center text-slate-400">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Select a conversation to start chatting</h3>
              <p className="text-xs text-slate-400 max-w-sm">All incoming WhatsApp messages arrive in real-time with full student ERP context.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {currentConv.contact_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{currentConv.contact_name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentConv.relationship || 'Contact'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 flex items-center gap-1.5 truncate">
                      <span>📱 {formatDisplayPhone(currentConv.phone)}</span>
                      {currentConv.student_class && <span className="text-blue-600 font-sans font-semibold">· {currentConv.student_class}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* WhatsApp Web Launch */}
                  <a
                    href={`https://wa.me/${currentConv.normalized_phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Open in WhatsApp Web"
                  >
                    <MessageCircle size={15} />
                    <span className="hidden sm:inline">WhatsApp Web</span>
                  </a>

                  {/* Call */}
                  <a
                    href={`tel:${currentConv.phone}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Direct Phone Call"
                  >
                    <Phone size={15} />
                  </a>
                </div>
              </div>

              {/* Message Bubbles Scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messagesLoading ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">No message history with this contact yet.</div>
                ) : (
                  messages.map((msg, idx) => {
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
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Quick Assistant Bar */}
              <div className="px-4 py-2 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1 shrink-0">
                  <Sparkles size={14} className="text-indigo-600" /> AI Assistant:
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
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
          <div className="hidden xl:flex w-80 lg:w-88 border-l border-slate-200 bg-white flex-col shrink-0 overflow-y-auto p-5 space-y-5">
            {/* Contact Details */}
            <div className="text-center space-y-2 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                {currentConv.contact_name.charAt(0)}
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
                  No linked enrolled student profile found.
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

      {/* New Conversation Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Start New WhatsApp Chat</h3>
              <button onClick={() => setNewChatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Phone Number (11 Digits)</label>
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={e => setNewChatPhone(e.target.value)}
                  placeholder="0333-1234567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Contact Name</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={e => setNewChatName(e.target.value)}
                  placeholder="e.g. Parent of Kamran"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  onClick={async () => {
                    const norm = normalizePhone(newChatPhone);
                    if (!norm) return toast.error('Enter a valid 11-digit phone number');

                    const newConv: WhatsAppConversationRecord = {
                      id: `conv_${norm}_${Date.now()}`,
                      phone: formatDisplayPhone(newChatPhone),
                      normalized_phone: norm,
                      contact_name: newChatName || formatDisplayPhone(newChatPhone),
                      relationship: 'Contact',
                      status: 'open',
                      priority: 'normal',
                      tags: [],
                      unread_count: 0,
                      last_message_text: 'Started chat',
                      last_message_at: new Date().toISOString(),
                      last_message_direction: 'outbound'
                    };

                    try {
                      await supabase.from('whatsapp_conversations').insert([newConv]);
                    } catch {}

                    setConversations(prev => [newConv, ...prev]);
                    setSelectedConvId(newConv.id);
                    setNewChatModalOpen(false);
                    setNewChatPhone('');
                    setNewChatName('');
                    toast.success('Conversation opened!');
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Open Chat
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
    </div>
  );
}
