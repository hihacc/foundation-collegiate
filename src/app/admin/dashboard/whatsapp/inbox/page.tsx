'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Search, Filter, Phone, Mail, User, 
  Paperclip, Image as ImageIcon, FileText, Check, CheckCheck, 
  Clock, AlertCircle, Sparkles, RefreshCw, X, ChevronRight, 
  Download, ExternalLink, ShieldCheck, Tag, MoreVertical, 
  Trash2, UserCheck, BookOpen, DollarSign, Calendar, Flame,
  FileSpreadsheet, Film, Music, ArrowLeft, Plus, Eye, Play, Pause,
  CornerDownRight, Lock, MessageCircle, Activity, Info, Users,
  CheckCircle2, AlertTriangle, UserPlus, Mic, MicOff, Volume2,
  Share2, ZoomIn, FileCheck, Copy, Sparkle, Globe, ArrowDown
} from 'lucide-react';
import { 
  WhatsAppConversationRecord, 
  WhatsAppMessageRecord, 
  formatDisplayPhone, 
  normalizePhone 
} from '@/lib/whatsapp/enterpriseDb';
import { whatsappSupabase } from '@/lib/whatsapp/supabaseClient';
import Button from '@/components/ui/Button';

// ==========================================
// 1. RICH WHATSAPP TEXT FORMATTER COMPONENT
// ==========================================
function WhatsAppRichText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  // Function to parse WhatsApp Markdown syntax
  const parseMarkdown = (rawText: string) => {
    // 1. URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = rawText.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
            onClick={e => e.stopPropagation()}
          >
            {part} <ExternalLink size={10} className="inline ml-0.5" />
          </a>
        );
      }

      // Format WhatsApp Markdown: *bold*, _italic_, ~strike~, ```code```
      let formatted: React.ReactNode = part;

      // Handle bold *text*
      const boldParts = part.split(/(\*[^*]+\*)/g);
      if (boldParts.length > 1) {
        return boldParts.map((bp, bi) => {
          if (bp.startsWith('*') && bp.endsWith('*') && bp.length > 2) {
            return <strong key={`${i}-${bi}`} className="font-black">{bp.slice(1, -1)}</strong>;
          }
          // Handle italic _text_
          const italicParts = bp.split(/(_[^_]+_)/g);
          if (italicParts.length > 1) {
            return italicParts.map((ip, ii) => {
              if (ip.startsWith('_') && ip.endsWith('_') && ip.length > 2) {
                return <em key={`${i}-${bi}-${ii}`} className="italic">{ip.slice(1, -1)}</em>;
              }
              return ip;
            });
          }
          return bp;
        });
      }

      return formatted;
    });
  };

  return (
    <div className={`whitespace-pre-wrap leading-relaxed break-words font-medium ${className}`}>
      {parseMarkdown(text)}
    </div>
  );
}

// ==========================================
// 2. WHATSAPP VOICE NOTE & AUDIO PLAYER
// ==========================================
function WhatsAppAudioPlayer({ 
  src, 
  filename, 
  isOutbound 
}: { 
  src: string; 
  filename?: string | null; 
  isOutbound: boolean 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setHasError(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    const nextSpeed: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Safe proxy URL for external CORS audio
  const safeSrc = src.startsWith('http') && !src.includes(window?.location?.host || '')
    ? `/api/admin/whatsapp/proxy?url=${encodeURIComponent(src)}`
    : src;

  return (
    <div className={`p-2.5 rounded-2xl flex flex-col gap-2 ${
      isOutbound ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200/80'
    }`}>
      <audio ref={audioRef} src={safeSrc} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
            isOutbound 
              ? 'bg-white text-emerald-800 hover:scale-105' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
          }`}
        >
          {hasError ? (
            <AlertCircle size={18} className="text-amber-300" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Waveform / Progress Slider */}
        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed Toggle */}
        <button
          onClick={cycleSpeed}
          className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border transition-colors cursor-pointer shrink-0 ${
            isOutbound 
              ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' 
              : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
          }`}
        >
          {speed}x
        </button>
      </div>

      {/* Voice Note Label */}
      <div className="flex items-center justify-between text-[10px] opacity-75 font-semibold px-1">
        <span className="flex items-center gap-1">
          <Mic size={11} className={isPlaying ? 'text-emerald-300 animate-pulse' : ''} /> 
          {filename || 'Voice Note'}
        </span>
        {hasError && <span className="text-amber-300 font-bold">Audio format fallback active</span>}
      </div>
    </div>
  );
}

// ==========================================
// 3. WHATSAPP IMAGE VIEWER & LIGHTBOX CARD
// ==========================================
function WhatsAppImageCard({ 
  src, 
  filename, 
  onZoom 
}: { 
  src: string; 
  filename?: string | null; 
  onZoom: (url: string) => void 
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const safeSrc = src.startsWith('http') && !src.includes(window?.location?.host || '')
    ? `/api/admin/whatsapp/proxy?url=${encodeURIComponent(src)}`
    : src;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-black/10 bg-slate-950/20 group max-w-sm">
      {!imgLoaded && !imgError && (
        <div className="h-44 w-full bg-slate-200 animate-pulse flex items-center justify-center">
          <ImageIcon size={24} className="text-slate-400" />
        </div>
      )}

      {imgError ? (
        <div className="p-4 bg-slate-100 text-slate-600 text-xs text-center space-y-2 rounded-2xl">
          <AlertCircle size={20} className="mx-auto text-amber-500" />
          <p className="font-bold">Image preview unavailable</p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
          >
            Open raw image <ExternalLink size={11} />
          </a>
        </div>
      ) : (
        <img
          src={safeSrc}
          alt={filename || 'WhatsApp Image'}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          onClick={() => onZoom(safeSrc)}
          className={`max-h-72 w-full object-cover rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.01] ${
            imgLoaded ? 'block' : 'hidden'
          }`}
        />
      )}

      {imgLoaded && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => onZoom(safeSrc)}
            className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <ZoomIn size={12} /> Zoom
          </button>
          <a
            href={safeSrc}
            download={filename || 'whatsapp-image.jpg'}
            className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black text-xs font-bold shadow-xs"
          >
            <Download size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. WHATSAPP DOCUMENT & PDF PREVIEW CARD
// ==========================================
function WhatsAppDocumentCard({
  url,
  filename,
  size,
  mimeType,
  isOutbound,
  onPdfPreview
}: {
  url: string;
  filename?: string | null;
  size?: number | null;
  mimeType?: string | null;
  isOutbound: boolean;
  onPdfPreview: (url: string) => void;
}) {
  const isPdf = mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');
  const isExcel = mimeType?.includes('sheet') || mimeType?.includes('excel') || filename?.toLowerCase().endsWith('.xlsx') || filename?.toLowerCase().endsWith('.csv');
  const isWord = mimeType?.includes('word') || filename?.toLowerCase().endsWith('.docx') || filename?.toLowerCase().endsWith('.doc');

  const formattedSize = size ? (size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(size / 1024)} KB`) : 'Document';

  const safeUrl = url.startsWith('http') && !url.includes(window?.location?.host || '')
    ? `/api/admin/whatsapp/proxy?url=${encodeURIComponent(url)}`
    : url;

  return (
    <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 border shadow-2xs ${
      isOutbound 
        ? 'bg-emerald-700/60 border-emerald-500/40 text-white' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPdf ? 'bg-red-500 text-white' : isExcel ? 'bg-emerald-600 text-white' : isWord ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
        }`}>
          {isPdf ? <FileText size={20} /> : isExcel ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold truncate max-w-[180px] sm:max-w-xs">{filename || 'Document.pdf'}</p>
          <p className="text-[10px] opacity-75 font-mono">{formattedSize}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isPdf && (
          <button
            onClick={() => onPdfPreview(safeUrl)}
            className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isOutbound ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Preview PDF"
          >
            <Eye size={14} />
          </button>
        )}
        <a
          href={safeUrl}
          download={filename || 'download'}
          className={`p-2 rounded-xl text-xs font-bold transition-colors ${
            isOutbound ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Download File"
        >
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN WHATSAPP INBOX PAGE
// ==========================================
export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<WhatsAppConversationRecord[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'students' | 'parents' | 'inquiries' | 'birthdays'>('all');

  // Mobile View Toggle
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');

  // Composer State
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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Assistant State
  const [aiGenerating, setAiGenerating] = useState(false);

  // Student ERP Data for Context Drawer
  const [studentErpData, setStudentErpData] = useState<{
    student?: any;
    fees?: any[];
    attendance?: any[];
    results?: any[];
  } | null>(null);

  // Media Modals
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // New Chat Modal & Student Directory Matching
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatInitialMsg, setNewChatInitialMsg] = useState('');
  const [newChatStudentSearch, setNewChatStudentSearch] = useState('');
  const [newChatMatchedStudent, setNewChatMatchedStudent] = useState<any>(null);
  const [newChatStarting, setNewChatStarting] = useState(false);
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
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Load Messages for Selected Conversation
  const loadConversationMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    setHasOlderMessages(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/messages?conversationId=${convId}&limit=50`);
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

  // Initial Load + Directory Fetch + WhatsApp Sync
  useEffect(() => {
    fetchConversations(true);

    const loadStudents = async () => {
      try {
        const { data } = await supabase.from('students').select('*').order('name');
        if (data) setEnrolledStudents(data);
      } catch {}
    };
    loadStudents();

    // Trigger background sync with microservice
    fetch('/api/admin/whatsapp/sync', { method: 'POST' })
      .then(() => fetchConversations(true))
      .catch(() => {});
  }, [fetchConversations]);

  // Live Supabase Realtime Subscription + Background Polling
  useEffect(() => {
    const channel = whatsappSupabase
      .channel('whatsapp_live_inbox_v2')
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

    const interval = setInterval(() => {
      if (selectedConvId) {
        fetch(`/api/admin/whatsapp/messages?conversationId=${selectedConvId}&limit=50`)
          .then(r => r.json())
          .then(d => {
            if (d.success && Array.isArray(d.data) && d.data.length > 0) {
              setMessages(d.data);
            }
          })
          .catch(() => {});
      }
    }, 6000);

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

  // When selectedConvId changes, fetch messages
  useEffect(() => {
    if (selectedConvId) {
      loadConversationMessages(selectedConvId);
      setMobileView('chat');
    }
  }, [selectedConvId, loadConversationMessages]);

  // Context ERP Data Loader
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

  // --- SEND MESSAGE ACTION ---
  const handleSendMessage = async () => {
    if (!currentConv || (!composerText.trim() && !attachedFile)) return;

    try {
      setSendingMessage(true);
      let mediaUrl = attachedFile?.url;
      let mediaMime = attachedFile?.type;
      let mediaName = attachedFile?.name;
      let mediaSize = attachedFile?.size;

      // If attached file hasn't been uploaded to server yet, upload it
      if (attachedFile && !mediaUrl) {
        setUploadingAttachment(true);
        const formData = new FormData();
        formData.append('file', attachedFile.file);
        const uploadRes = await fetch('/api/admin/whatsapp/upload', {
          method: 'POST',
          body: formData
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.file) {
          mediaUrl = uploadJson.file.url;
          mediaMime = uploadJson.file.mimeType;
          mediaName = uploadJson.file.filename;
          mediaSize = uploadJson.file.size;
        }
        setUploadingAttachment(false);
      }

      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConv.id,
          content: composerText.trim(),
          isInternalNote,
          mediaUrl,
          mediaFilename: mediaName,
          mediaMimeType: mediaMime,
          mediaSize
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setComposerText('');
        setAttachedFile(null);
        setIsInternalNote(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        fetchConversations(false);
      } else {
        toast.error('Failed to send: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      toast.error('Send error: ' + e.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // --- LIVE IN-BROWSER VOICE NOTE RECORDER ---
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Auto-upload voice note
        toast.loading('Uploading voice note...', { id: 'vn-upload' });
        const formData = new FormData();
        formData.append('file', audioFile);
        const res = await fetch('/api/admin/whatsapp/upload', {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        toast.dismiss('vn-upload');

        if (json.success && json.file) {
          setAttachedFile({
            file: audioFile,
            name: 'Voice Note.webm',
            size: audioBlob.size,
            type: 'audio/webm',
            url: json.file.url
          });
          toast.success('🎙️ Voice note recorded and attached!');
        } else {
          toast.error('Failed to process voice note');
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      toast.error('Microphone access denied: ' + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      audioChunksRef.current = [];
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast.info('Voice recording cancelled');
    }
  };

  // --- AI ASSISTANT DISPATCH ---
  const handleAiAssist = async (actionType: string) => {
    if (!currentConv) return;
    try {
      setAiGenerating(true);
      const res = await fetch('/api/admin/whatsapp/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          conversationId: currentConv.id,
          contactName: currentConv.contact_name,
          studentName: currentConv.student_name,
          currentDraft: composerText
        })
      });
      const data = await res.json();
      if (data.success && data.suggestion) {
        setComposerText(data.suggestion);
        toast.success(`✨ AI ${actionType.replace('_', ' ')} generated!`);
      }
    } catch (e: any) {
      toast.error('AI error: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchSearch = 
        c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.normalized_phone?.includes(search) ||
        c.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.student_roll?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === 'unread') return (c.unread_count || 0) > 0;
      if (filterTab === 'students') return c.relationship === 'Student' || c.tags?.includes('Student');
      if (filterTab === 'parents') return c.relationship === 'Parent' || c.tags?.includes('Parent');
      if (filterTab === 'inquiries') return c.relationship === 'Inquiry' || c.tags?.includes('Inquiry');
      if (filterTab === 'birthdays') return c.tags?.includes('Birthday');

      return true;
    });
  }, [conversations, search, filterTab]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col font-sans bg-slate-100/70">
      
      {/* Top Banner with Real-time Status */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WhatsApp Official Live Hub
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
            Direct High-Speed Media &amp; Voice Note Pipeline
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setSyncing(true);
              try {
                const res = await fetch('/api/admin/whatsapp/sync', { method: 'POST' });
                const json = await res.json();
                toast.success(`✨ WhatsApp sync complete (${json.syncedCount || 0} updated)`);
                fetchConversations(false);
              } catch (e: any) {
                toast.error('Sync failed: ' + e.message);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Messages'}</span>
          </button>

          <button
            onClick={() => setNewChatModalOpen(true)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Plus size={13} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONVERSATION LIST & FILTERS (320px - 380px) */}
        {/* ======================================================== */}
        <div className={`w-full lg:w-80 xl:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 ${
          mobileView === 'list' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats, roll no, name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'students', label: 'Students' },
                { id: 'parents', label: 'Parents' },
                { id: 'inquiries', label: 'Inquiries' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Cards Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse m-2 rounded-2xl" />)
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare size={32} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No matching conversations</p>
                <p className="text-[11px]">Click &quot;New Chat&quot; to message any contact.</p>
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
                    <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {conv.contact_name ? conv.contact_name.charAt(0) : 'W'}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate font-bold ${hasUnread ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                          {conv.contact_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {conv.student_name && (
                        <div className="text-[10px] text-blue-700 font-bold truncate flex items-center gap-1">
                          <span>🎓 {conv.student_name}</span>
                          {conv.student_roll && <span className="font-mono text-slate-500">({conv.student_roll})</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.last_message_direction === 'outbound' && <span className="text-emerald-600 font-bold">You: </span>}
                          {conv.last_message_text || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shrink-0">
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

        {/* ======================================================== */}
        {/* CENTER COLUMN: ACTIVE CHAT THREAD & COMPOSER */}
        {/* ======================================================== */}
        <div className={`flex-1 flex flex-col bg-slate-50 relative ${
          mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}>
          {currentConv ? (
            <>
              {/* Chat Thread Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {currentConv.contact_name ? currentConv.contact_name.charAt(0) : 'W'}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                      <span>{currentConv.contact_name}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px]">
                        {currentConv.phone}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{currentConv.relationship} • {currentConv.student_class || 'General Account'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setMobileView(mobileView === 'info' ? 'chat' : 'info')}
                    className="xl:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Toggle Context Details"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Scroll Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#efeae2]/30">
                {messagesLoading ? (
                  <div className="text-center py-12 text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-emerald-600" /> Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                    <MessageSquare size={36} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">No message history yet</p>
                    <p className="text-[11px]">Type a message or use quick replies below to start chatting.</p>
                  </div>
                ) : (
                  <>
                    {/* Load Older Messages Button */}
                    <div className="text-center py-1">
                      {hasOlderMessages ? (
                        <button
                          onClick={async () => {
                            if (!selectedConvId || loadingOlder) return;
                            try {
                              setLoadingOlder(true);
                              const oldestTimestamp = messages[0]?.created_at || '';
                              const res = await fetch(`/api/admin/whatsapp/messages?conversationId=${selectedConvId}&before=${encodeURIComponent(oldestTimestamp)}&limit=25`);
                              const data = await res.json();
                              if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                                setMessages(prev => {
                                  const existingIds = new Set(prev.map(m => m.id));
                                  const newOlder = data.data.filter((m: any) => !existingIds.has(m.id));
                                  if (newOlder.length === 0) {
                                    setHasOlderMessages(false);
                                    return prev;
                                  }
                                  return [...newOlder, ...prev];
                                });
                                toast.success(`Loaded ${data.data.length} older messages`);
                              } else {
                                setHasOlderMessages(false);
                              }
                            } catch (err: any) {
                              toast.error('Failed to load older messages: ' + err.message);
                            } finally {
                              setLoadingOlder(false);
                            }
                          }}
                          disabled={loadingOlder}
                          className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Clock size={12} className={loadingOlder ? 'animate-spin text-emerald-600' : 'text-slate-400'} />
                          <span>{loadingOlder ? 'Loading older messages...' : 'Load older messages'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold italic">Beginning of message history</span>
                      )}
                    </div>

                    {/* Messages Render Loop */}
                    {messages.map((msg, idx) => {
                      const isOutbound = msg.direction === 'outbound';
                      const isNote = msg.is_internal_note;

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-md md:max-w-lg rounded-2xl p-3.5 space-y-2 shadow-2xs ${
                              isNote
                                ? 'bg-amber-50 border-2 border-amber-300 text-amber-950'
                                : isOutbound
                                ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-900/10'
                                : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none shadow-slate-200/40'
                            }`}
                          >
                            {/* Internal Note Tag */}
                            {isNote && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-1">
                                <Lock size={11} /> Internal Staff Note
                              </div>
                            )}

                            {/* Media: Audio / Voice Note */}
                            {msg.media_url && (msg.message_type === 'audio' || msg.media_mime_type?.startsWith('audio/') || msg.media_filename?.endsWith('.webm') || msg.media_filename?.endsWith('.mp3') || msg.media_filename?.endsWith('.ogg')) && (
                              <WhatsAppAudioPlayer
                                src={msg.media_url}
                                filename={msg.media_filename}
                                isOutbound={isOutbound && !isNote}
                              />
                            )}

                            {/* Media: Image */}
                            {msg.media_url && (msg.message_type === 'image' || msg.media_mime_type?.startsWith('image/') || msg.media_filename?.endsWith('.jpg') || msg.media_filename?.endsWith('.jpeg') || msg.media_filename?.endsWith('.png')) && (
                              <WhatsAppImageCard
                                src={msg.media_url}
                                filename={msg.media_filename}
                                onZoom={setLightboxUrl}
                              />
                            )}

                            {/* Media: Video */}
                            {msg.media_url && (msg.message_type === 'video' || msg.media_mime_type?.startsWith('video/') || msg.media_filename?.endsWith('.mp4')) && (
                              <video controls className="max-h-60 rounded-xl w-full" src={msg.media_url} />
                            )}

                            {/* Media: Document / PDF */}
                            {msg.media_url && msg.message_type !== 'image' && msg.message_type !== 'audio' && msg.message_type !== 'video' && !msg.media_mime_type?.startsWith('image/') && !msg.media_mime_type?.startsWith('audio/') && (
                              <WhatsAppDocumentCard
                                url={msg.media_url}
                                filename={msg.media_filename}
                                size={msg.media_size}
                                mimeType={msg.media_mime_type}
                                isOutbound={isOutbound && !isNote}
                                onPdfPreview={setPdfPreviewUrl}
                              />
                            )}

                            {/* Formatted Text Message */}
                            {msg.content && (
                              <WhatsAppRichText
                                text={msg.content}
                                className={`text-xs ${isOutbound && !isNote ? 'text-white' : 'text-slate-900'}`}
                              />
                            )}

                            {/* Timestamp & Read Status */}
                            <div className={`flex items-center justify-end gap-1.5 text-[10px] ${
                              isOutbound && !isNote ? 'text-emerald-100' : 'text-slate-400'
                            }`}>
                              <span>
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {isOutbound && !isNote && (
                                <span>
                                  {msg.status === 'read' ? (
                                    <CheckCheck size={13} className="text-sky-200" />
                                  ) : msg.status === 'delivered' ? (
                                    <CheckCheck size={13} className="text-emerald-200" />
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
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ✨ Auto-Reply
                  </button>
                  <button
                    onClick={() => handleAiAssist('REWRITE_PROFESSIONAL')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Polite Rewrite
                  </button>
                  <button
                    onClick={() => handleAiAssist('TRANSLATE_URDU')}
                    disabled={aiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Translate Urdu
                  </button>
                </div>
              </div>

              {/* Attachment Preview Strip */}
              {attachedFile && (
                <div className="px-4 py-2 bg-slate-200/80 border-t border-slate-300 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate font-bold text-slate-800">
                    <Paperclip size={14} className="text-emerald-600" />
                    <span className="truncate">{attachedFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="text-slate-500 hover:text-red-600 p-1 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Live Voice Recording Bar */}
              {isRecordingVoice && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-red-700 font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span>Recording Voice Note... {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelVoiceRecording}
                      className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopVoiceRecording}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} /> Done &amp; Attach
                    </button>
                  </div>
                </div>
              )}

              {/* Canned Quick Replies */}
              <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold scrollbar-none">
                <span className="text-slate-400 font-bold shrink-0">⚡ Quick:</span>
                {[
                  { label: '💰 Fee Info', text: 'Tuition fee can be submitted online or at Main Campus. Kindly share the screenshot/slip after payment.' },
                  { label: '🎓 Admissions', text: 'Admissions for Class XI & XII Pre-Medical, Pre-Engineering & Computer Science are OPEN! Apply at https://foundationcollegiate.edu.pk/admissions' },
                  { label: '⏰ Timings', text: 'College Timings: Mon–Thu: 8:00 AM – 1:30 PM | Fri: 8:00 AM – 12:30 PM.' },
                  { label: '🎂 Birthday Wish', text: '🎉 Happy Birthday from The Foundation Collegiate! Wishing you tremendous success and joyful celebrations today! ✨' }
                ].map(canned => (
                  <button
                    key={canned.label}
                    onClick={() => setComposerText(canned.text)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-slate-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {canned.label}
                  </button>
                ))}
              </div>

              {/* Message Composer Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-end gap-2 shrink-0">
                {/* File Attachment Trigger */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAttachedFile({ file: f, name: f.name, size: f.size, type: f.type });
                    }
                  }}
                  className="hidden"
                  accept="image/*,application/pdf,audio/*,video/*,.doc,.docx,.xls,.xlsx,.csv"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                  title="Attach Image, Document, or Audio"
                >
                  <Paperclip size={18} />
                </button>

                {/* Voice Note Record Trigger */}
                <button
                  onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    isRecordingVoice 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600'
                  }`}
                  title="Record Voice Note"
                >
                  <Mic size={18} />
                </button>

                {/* Internal Note Toggle */}
                <button
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    isInternalNote 
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-500' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Toggle Internal Staff Note (Not sent to WhatsApp)"
                >
                  <Lock size={16} />
                </button>

                {/* Textarea Input */}
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
                  placeholder={isInternalNote ? 'Write internal staff note...' : 'Type a message (Enter to send, Shift+Enter for newline)...'}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-medium border resize-none outline-none max-h-28 ${
                    isInternalNote 
                      ? 'bg-amber-50/60 border-amber-300 text-amber-950 placeholder-amber-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || uploadingAttachment || (!composerText.trim() && !attachedFile)}
                  className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs disabled:opacity-40 ${
                    isInternalNote 
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                  }`}
                >
                  {sendingMessage || uploadingAttachment ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <MessageSquare size={48} className="text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a student or parent chat from the left sidebar to view message history, stream images &amp; voice notes, or start a new conversation.
              </p>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STUDENT CONTEXT & ERP DRAWER (320px)       */}
        {/* ======================================================== */}
        {currentConv && (
          <div className={`w-full xl:w-80 bg-white border-l border-slate-200 flex-col overflow-y-auto p-4 space-y-4 shrink-0 ${
            mobileView === 'info' ? 'flex' : 'hidden xl:flex'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-indigo-600" /> Student Profile &amp; ERP
              </h3>
              <button
                onClick={() => setMobileView('chat')}
                className="xl:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Student Avatar & Basic Details */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-indigo-600 to-blue-600 text-white font-black text-xl mx-auto flex items-center justify-center shadow-md">
                {currentConv.student_name ? currentConv.student_name.charAt(0) : currentConv.contact_name.charAt(0)}
              </div>
              <h4 className="font-black text-slate-900 text-sm">{currentConv.student_name || currentConv.contact_name}</h4>
              <p className="text-xs text-slate-500 font-mono">{currentConv.phone}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                {currentConv.relationship} • {currentConv.student_class || 'Registered'}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <a
                href={`tel:${currentConv.normalized_phone}`}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-center text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <Phone size={13} /> Call
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentConv.normalized_phone);
                  toast.success('Phone number copied to clipboard!');
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-center text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy size={13} /> Copy No
              </button>
            </div>

            {/* ERP Academic & Financial Context */}
            {studentErpData?.student ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Roll Number:</span>
                    <span className="font-mono text-indigo-700">{studentErpData.student.roll_number || 'N/A'}</span>
                  </div>
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Class Stream:</span>
                    <span className="text-slate-600 truncate max-w-[140px]">{studentErpData.student.class_name || 'N/A'}</span>
                  </div>
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Father Name:</span>
                    <span className="text-slate-600">{studentErpData.student.father_name || 'N/A'}</span>
                  </div>
                </div>

                {/* Recent Fee Challans */}
                {studentErpData.fees && studentErpData.fees.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Fee Status:</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                      <span>{studentErpData.fees[0].month || 'Current Month'}</span>
                      <span className="font-mono">Rs. {studentErpData.fees[0].amount || studentErpData.fees[0].total_amount || 0} ({studentErpData.fees[0].status})</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-1">
                <UserPlus size={20} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">Unlinked WhatsApp Contact</p>
                <p className="text-[10px]">No linked student roster record found for this number.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* LIGHTBOX MODAL (Image Fullscreen Viewer)                 */}
      {/* ======================================================== */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={lightboxUrl}
              alt="Lightbox View"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            />
            <div className="flex items-center gap-2">
              <a
                href={lightboxUrl}
                download="whatsapp-image.jpg"
                className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                onClick={e => e.stopPropagation()}
              >
                <Download size={14} /> Download Original
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PDF PREVIEW MODAL                                        */}
      {/* ======================================================== */}
      {pdfPreviewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPdfPreviewUrl(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="text-xs font-bold flex items-center gap-2">
                <FileText size={16} className="text-red-400" /> PDF Document Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewUrl}
                  download="document.pdf"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={() => setPdfPreviewUrl(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="PDF Document"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* START NEW CHAT MODAL                                     */}
      {/* ======================================================== */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" /> Start New WhatsApp Chat
              </h3>
              <button onClick={() => setNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Search Existing Student */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Search Enrolled Student:</label>
              <input
                type="text"
                value={newChatStudentSearch}
                onChange={e => {
                  setNewChatStudentSearch(e.target.value);
                  const matched = enrolledStudents.find(s => 
                    s.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    s.roll_number?.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  if (matched && e.target.value.trim().length > 1) {
                    setNewChatMatchedStudent(matched);
                    setNewChatName(matched.name);
                    setNewChatPhone(matched.phone || matched.parent_phone || '');
                  }
                }}
                placeholder="Type student name or roll number..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {newChatMatchedStudent && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                ✓ Matched: {newChatMatchedStudent.name} ({newChatMatchedStudent.class_name})
              </div>
            )}

            {/* Direct Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number (WhatsApp):</label>
              <input
                type="text"
                value={newChatPhone}
                onChange={e => setNewChatPhone(e.target.value)}
                placeholder="0333 1234567 or +92 333..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Contact Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Contact / Recipient Name:</label>
              <input
                type="text"
                value={newChatName}
                onChange={e => setNewChatName(e.target.value)}
                placeholder="e.g. Asif Khan (Parent)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Initial Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Initial Message (Optional):</label>
              <textarea
                rows={3}
                value={newChatInitialMsg}
                onChange={e => setNewChatInitialMsg(e.target.value)}
                placeholder="Assalam-o-Alaikum, this is The Foundation Collegiate..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const norm = normalizePhone(newChatPhone);
                  if (!norm) {
                    toast.error('Please enter a valid phone number');
                    return;
                  }

                  try {
                    setNewChatStarting(true);
                    const res = await fetch('/api/admin/whatsapp/conversations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phone: newChatPhone,
                        contact_name: newChatName || 'WhatsApp Contact',
                        student_name: newChatMatchedStudent?.name,
                        student_roll: newChatMatchedStudent?.roll_number,
                        student_class: newChatMatchedStudent?.class_name,
                        initial_message: newChatInitialMsg
                      })
                    });
                    const json = await res.json();
                    if (json.success && json.data) {
                      toast.success('Chat initiated successfully!');
                      setNewChatModalOpen(false);
                      setNewChatPhone('');
                      setNewChatName('');
                      setNewChatInitialMsg('');
                      setNewChatMatchedStudent(null);
                      await fetchConversations(false);
                      setSelectedConvId(json.data.id);
                      setMobileView('chat');
                    } else {
                      toast.error(json.error || 'Failed to create conversation');
                    }
                  } catch (e: any) {
                    toast.error('Error: ' + e.message);
                  } finally {
                    setNewChatStarting(false);
                  }
                }}
                disabled={newChatStarting || !newChatPhone.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {newChatStarting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Open Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
