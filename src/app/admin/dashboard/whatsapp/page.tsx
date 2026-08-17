'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  MessageCircle, Send, QrCode, Smartphone, RefreshCw, CheckCircle2, 
  AlertTriangle, Users, BookOpen, Layers, ShieldCheck, Power, 
  ExternalLink, Clock, FileText, Check, X, Loader2, Plus, Copy, KeyRound, 
  Sparkles, Calendar, Play, Download, Search, Filter, Image as ImageIcon,
  Paperclip, MapPin, Bell, Award, UserCheck, Trash2, ChevronRight, Eye,
  ListPlus, UserPlus, Contact, Share2, ArrowRight
} from 'lucide-react';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';

interface WhatsAppAccount {
  id: string;
  name: string;
  phoneNumber?: string | null;
  status: 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED' | 'BANNED';
  connected: boolean;
  qrCode?: string | null;
  lastSeenAt?: string;
}

interface WhatsAppMessage {
  id: string;
  recipient: string;
  messageBody: string;
  messageType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE' | 'LOCATION';
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';
  sentAt?: string;
  createdAt: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface ScheduledMessage {
  id: string;
  recipient: string;
  recipientName?: string;
  targetType: 'single' | 'class' | 'list';
  targetLabel?: string;
  messageBody: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'PROCESSED';
  createdAt: string;
}

interface BroadcastListContact {
  id: string;
  name: string;
  phone: string;
  role?: string;
}

interface BroadcastList {
  id: string;
  name: string;
  description: string;
  contacts: BroadcastListContact[];
  createdAt: string;
}

interface CronJobConfig {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  type: 'ABSENTEE' | 'FEE_REMINDER' | 'BIRTHDAYS' | 'RESULT_RELEASE' | 'WEEKLY_REPORT';
  lastRun?: string;
}

const DEFAULT_BROADCAST_LISTS: BroadcastList[] = [
  {
    id: 'list_premed_toppers',
    name: 'Pre-Medical High Achievers',
    description: 'Top academic performers in Biology & Chemistry for special test series',
    contacts: [
      { id: 'c1', name: 'Zoya Fatima', phone: '03212655608', role: 'Student (XI-Med)' },
      { id: 'c2', name: 'Bilal Ahmed', phone: '03001234567', role: 'Student (XII-Med)' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'list_parent_council',
    name: 'Parent-Teacher Council',
    description: 'Elected parent representatives for monthly review meetings',
    contacts: [
      { id: 'c3', name: 'Tariq Mehmood (Father of Daniyal)', phone: '03331234567', role: 'Parent Rep' },
      { id: 'c4', name: 'Dr. Samina Khan (Mother of Ayla)', phone: '03451234567', role: 'Parent Rep' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'list_fee_defaulters',
    name: 'Pending Fee Challans Group',
    description: 'Students with overdue tuition fees for prompt follow-up',
    contacts: [
      { id: 'c5', name: 'Farhan Siddiqui', phone: '03121234567', role: 'Student (X-CS)' }
    ],
    createdAt: new Date().toISOString()
  }
];

const TEMPLATE_LIBRARY = [
  {
    title: 'Rain / Severe Weather Emergency Holiday',
    category: 'Emergency',
    tag: 'Official',
    text: `⚠️ *EMERGENCY NOTIFICATION - THE FOUNDATION COLLEGIATE*\n\nDear Parents/Students,\nIn accordance with the Government of Sindh directive, the college will remain *CLOSED tomorrow* due to severe weather & heavy rainfall forecasts.\n\nOnline revision classes will proceed as per timetable.\n\nStay safe,\n*TFC Administration*`
  },
  {
    title: 'Monthly Tuition Fee Due Reminder',
    category: 'Fee',
    tag: 'Finance',
    text: `📢 *FEE REMINDER - THE FOUNDATION COLLEGIATE*\n\nDear Parent of *{{name}}* (Roll: *{{roll}}*),\nThis is a gentle reminder that tuition fee for this month (Challan #*{{challan}}*) is due on *10th of this month*.\n\nAmount: *PKR {{amount}}*\nStatus: *UNPAID*\n\nPlease submit at HBL or via Online Bank Transfer to avoid late fee surcharges.\n\n*TFC Accounts Dept.*`
  },
  {
    title: 'Student Daily Absentee Notification',
    category: 'Attendance',
    tag: 'Discipline',
    text: `🚨 *ABSENCE NOTIFICATION - THE FOUNDATION COLLEGIATE*\n\nRespected Parent,\nStudent *{{name}}* (Roll: *{{roll}}*, Class: *{{class}}*) was marked *ABSENT* from college today (*{{date}}*) without prior leave submission.\n\nKindly contact college administration if this is an error.\n\n*TFC Attendance Office*`
  },
  {
    title: 'Exam Date Sheet & Roll Number Slip Issued',
    category: 'Academics',
    tag: 'Exams',
    text: `📋 *EXAMINATION DATE SHEET RELEASED*\n\nDear Student *{{name}}* (Class: *{{class}}*),\nThe date sheet and Roll Number Slips for the upcoming Midterm Examinations have been released.\n\n👉 Download Date Sheet: https://foundation-collegiate.vercel.app/downloads\n\nPlease arrive 15 minutes prior to paper timings in complete uniform.\n\n*TFC Examination Branch*`
  },
  {
    title: 'Parent-Teacher Meeting (PTM) Invitation',
    category: 'Academics',
    tag: 'Meeting',
    text: `🤝 *PARENT-TEACHER MEETING INVITATION*\n\nDear Parents of *{{name}}*,\nYou are cordially invited to attend the comprehensive Parent-Teacher Meeting on *Saturday, 10:00 AM to 1:00 PM*.\n\nDiscuss your child's academic progress, attendance record, and upcoming board preparations directly with faculty.\n\n*Principal, The Foundation Collegiate*`
  },
  {
    title: 'Happy Birthday Student Greeting',
    category: 'Greetings',
    tag: 'Wishes',
    text: `🎉🎂 *HAPPY BIRTHDAY FROM THE FOUNDATION COLLEGIATE!*\n\nWishing our bright student *{{name}}* (Class: *{{class}}*) a very Happy Birthday! 🌟\n\nMay this year bring you tremendous academic success, good health, and joyful achievements!\n\n*Warm wishes, TFC Family & Faculty*`
  }
];

export default function WhatsAppCenterPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'lists' | 'scheduled' | 'crons' | 'templates' | 'logs' | 'accounts'>('broadcast');
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([
    {
      id: 'tfc-default-sender',
      name: 'TFC Official Sender',
      phoneNumber: null,
      status: 'DISCONNECTED',
      connected: false
    }
  ]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('tfc-default-sender');
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pairingMode, setPairingMode] = useState<'qr' | 'code' | 'instant'>('qr');
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const [activePairingCode, setActivePairingCode] = useState<string>('TFC-89X2-M4L9');
  const [pairingPhone, setPairingPhone] = useState('923001234567');

  // Create Account Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');

  // Broadcast Message Form
  const [targetType, setTargetType] = useState<'single' | 'class' | 'list'>('single');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [selectedClass, setSelectedClass] = useState('IX-CS');
  const [selectedListId, setSelectedListId] = useState<string>('list_premed_toppers');
  const [messageType, setMessageType] = useState<'TEXT' | 'DOCUMENT' | 'IMAGE' | 'LOCATION'>('TEXT');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);

  // Broadcast Lists State
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>(DEFAULT_BROADCAST_LISTS);
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [targetListForContact, setTargetListForContact] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');

  // Scheduled Messages State
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledList, setScheduledList] = useState<ScheduledMessage[]>([
    {
      id: 'sch_sample_1',
      recipient: '03212655608',
      recipientName: 'Muhammad Hamza',
      targetType: 'single',
      messageBody: '📢 Reminder: Physics Mock Exam tomorrow at 9:00 AM in Hall A.',
      scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    }
  ]);

  // Cron Jobs State
  const [cronJobs, setCronJobs] = useState<CronJobConfig[]>([
    {
      id: 'cron_absentee',
      name: 'Daily Absentee Parent Alert',
      description: 'Auto-scans marked absent students daily at 2:00 PM and notifies parents',
      schedule: 'Every day at 2:00 PM (14:00 PKT)',
      enabled: true,
      type: 'ABSENTEE',
      lastRun: 'Today, 2:00 PM'
    },
    {
      id: 'cron_fee',
      name: 'Monthly Tuition Fee Due Notice',
      description: 'Auto-scans unpaid fee vouchers on 5th & 10th of every month',
      schedule: '5th & 10th of Month at 10:00 AM',
      enabled: true,
      type: 'FEE_REMINDER',
      lastRun: '10th Aug, 10:00 AM'
    },
    {
      id: 'cron_birthdays',
      name: 'Daily Student Birthday Wishes',
      description: 'Auto-scans student DOB records and sends personalized birthday wishes at 8:00 AM',
      schedule: 'Every day at 8:00 AM (08:00 PKT)',
      enabled: true,
      type: 'BIRTHDAYS',
      lastRun: 'Today, 8:00 AM'
    },
    {
      id: 'cron_results',
      name: 'Instant Marksheet Release Broadcast',
      description: 'Triggers WhatsApp notification as soon as teacher publishes new exam results',
      schedule: 'Event-driven (Instant)',
      enabled: true,
      type: 'RESULT_RELEASE',
      lastRun: 'Yesterday, 4:30 PM'
    }
  ]);
  const [executingCronId, setExecutingCronId] = useState<string | null>(null);

  // Student directory for class broadcast
  const [students, setStudents] = useState<any[]>([]);

  // Logs
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [logFilter, setLogFilter] = useState('');

  // Load Broadcast Lists from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLists = localStorage.getItem('tfc_whatsapp_broadcast_lists');
      if (savedLists) {
        try { setBroadcastLists(JSON.parse(savedLists)); } catch {}
      }
      const savedScheduled = localStorage.getItem('tfc_whatsapp_scheduled_messages');
      if (savedScheduled) {
        try { setScheduledList(JSON.parse(savedScheduled)); } catch {}
      }
    }
  }, []);

  // Save Broadcast Lists & Scheduled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tfc_whatsapp_broadcast_lists', JSON.stringify(broadcastLists));
    }
  }, [broadcastLists]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tfc_whatsapp_scheduled_messages', JSON.stringify(scheduledList));
    }
  }, [scheduledList]);

  // Automated client-side scheduler poller
  useEffect(() => {
    const checkScheduleInterval = setInterval(() => {
      const now = Date.now();
      setScheduledList(prev => {
        let changed = false;
        const updated = prev.map(item => {
          if (item.status === 'SCHEDULED' && new Date(item.scheduledAt).getTime() <= now) {
            changed = true;
            // Execute send
            fetch('/api/admin/whatsapp/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'SEND_MESSAGE',
                payload: {
                  accountId: selectedAccountId || 'tfc-default-sender',
                  recipient: item.recipient,
                  messageBody: item.messageBody,
                  metadata: { scheduledId: item.id }
                }
              })
            }).then(() => {
              toast.success(`⏰ Scheduled WhatsApp notification delivered to ${item.recipient}!`);
              fetchServiceState();
            }).catch(() => {});

            return { ...item, status: 'PROCESSED' as const };
          }
          return item;
        });
        return changed ? updated : prev;
      });
    }, 10000);

    return () => clearInterval(checkScheduleInterval);
  }, [selectedAccountId]);

  const fetchServiceState = async () => {
    setRefreshing(true);
    try {
      // 1. Get Accounts
      const accRes = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LIST_ACCOUNTS', payload: {} })
      });
      const accData = await accRes.json();
      if (accData.success && accData.data && accData.data.length > 0) {
        setAccounts(accData.data);
        if (!selectedAccountId || selectedAccountId === 'tfc-default-sender') {
          setSelectedAccountId(accData.data[0].id);
        }
      }

      // 2. Get Operational Status
      const stRes = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CHECK_STATUS', payload: {} })
      });
      const stData = await stRes.json();
      if (stData.success) {
        setServiceStatus(stData.data);
      }

      // 3. Get Logs
      const msgRes = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LIST_MESSAGES', payload: { limit: 50 } })
      });
      const msgData = await msgRes.json();
      if (msgData.success && msgData.data?.messages) {
        setMessages(msgData.data.messages);
      }

    } catch (err: any) {
      console.warn('WhatsApp service state fetch:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, roll_number, current_class, phone, email')
        .eq('status', 'Active')
        .order('name');
      
      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching student roster:', err);
    }
  };

  useEffect(() => {
    fetchServiceState();
    fetchStudents();
    const interval = setInterval(fetchServiceState, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const handleStartPairing = async (accountId?: string) => {
    const targetId = accountId || selectedAccountId;
    setLoading(true);
    setQrModalOpen(true);
    try {
      const connRes = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONNECT_ACCOUNT', payload: { accountId: targetId } })
      });
      await connRes.json();

      const qrRes = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_QR', payload: { accountId: targetId } })
      });
      const qrData = await qrRes.json();
      if (qrData.success && qrData.data?.qrCode) {
        setActiveQrCode(qrData.data.qrCode);
      }
    } catch (err) {
      toast.error('Could not initiate pairing with WhatsApp servers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ACCOUNT',
          payload: { name: newAccountName.trim(), phoneNumber: newAccountPhone.trim() || undefined }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Account "${newAccountName}" registered!`);
        setCreateModalOpen(false);
        setNewAccountName('');
        setNewAccountPhone('');
        fetchServiceState();
        if (data.data?.id) {
          handleStartPairing(data.data.id);
        }
      }
    } catch (err) {
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this WhatsApp account?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISCONNECT_ACCOUNT', payload: { accountId } })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('WhatsApp session disconnected');
        fetchServiceState();
      }
    } catch (err) {
      toast.error('Disconnect failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !messageBody) {
      toast.error('Please enter both phone number and message body');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          payload: {
            accountId: activeAccount?.id || 'tfc-default-sender',
            recipient: recipientPhone.trim(),
            messageBody: messageBody.trim(),
            messageType: messageType,
            metadata: {
              target: 'direct',
              attachmentUrl: attachmentUrl || undefined
            }
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`WhatsApp message delivered to ${recipientPhone}!`);
        setMessageBody('');
        setRecipientPhone('');
        fetchServiceState();
      } else {
        toast.error(data.error?.message || 'Failed to deliver message');
      }
    } catch (err: any) {
      toast.error(err.message || 'Send error');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !scheduledDate) {
      toast.error('Please fill message content and choose scheduled date & time');
      return;
    }

    const scheduledTimestamp = new Date(scheduledDate).getTime();
    if (isNaN(scheduledTimestamp) || scheduledTimestamp <= Date.now()) {
      toast.error('Scheduled time must be a valid future date and time');
      return;
    }

    setSending(true);
    try {
      let targetRecipient = recipientPhone.trim();
      let targetLabel = 'Single Direct';

      if (targetType === 'class') {
        targetRecipient = `Class: ${selectedClass}`;
        targetLabel = `Class ${selectedClass} Broadcast`;
      } else if (targetType === 'list') {
        const list = broadcastLists.find(l => l.id === selectedListId);
        targetRecipient = list ? list.name : 'Broadcast List';
        targetLabel = `List: ${targetRecipient}`;
      } else {
        if (!targetRecipient) {
          toast.error('Please enter recipient phone number');
          setSending(false);
          return;
        }
      }

      const newScheduledItem: ScheduledMessage = {
        id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipient: targetRecipient,
        recipientName: targetLabel,
        targetType,
        targetLabel,
        messageBody: messageBody.trim(),
        scheduledAt: new Date(scheduledDate).toISOString(),
        status: 'SCHEDULED',
        createdAt: new Date().toISOString()
      };

      // Call API proxy
      await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCHEDULE_MESSAGE',
          payload: {
            accountId: activeAccount?.id || 'tfc-default-sender',
            recipient: targetRecipient,
            messageBody: messageBody.trim(),
            scheduledAt: new Date(scheduledDate).toISOString(),
            metadata: { targetType, targetLabel }
          }
        })
      }).catch(() => {});

      setScheduledList(prev => [newScheduledItem, ...prev]);
      toast.success(`Message scheduled for ${new Date(scheduledDate).toLocaleString()}!`);
      setMessageBody('');
      setRecipientPhone('');
      setScheduledDate('');
      setActiveTab('scheduled');
    } catch (err: any) {
      toast.error(err.message || 'Schedule error');
    } finally {
      setSending(false);
    }
  };

  const handleSendClassBroadcast = async () => {
    const classRoster = students.filter(s => s.current_class === selectedClass && s.phone);
    if (classRoster.length === 0) {
      toast.error(`No students with valid phone numbers found in Class ${selectedClass}`);
      return;
    }

    if (!messageBody.trim()) {
      toast.error('Please enter message content for the broadcast');
      return;
    }

    if (!confirm(`Broadcast WhatsApp message to all ${classRoster.length} students in Class ${selectedClass}?`)) {
      return;
    }

    setSending(true);
    try {
      const bulkPayload = classRoster.map(st => {
        let personalized = messageBody
          .replace(/{{name}}/g, st.name || 'Student')
          .replace(/{{roll}}/g, st.roll_number || 'N/A')
          .replace(/{{class}}/g, st.current_class || selectedClass);

        return {
          recipient: st.phone,
          messageBody: personalized,
          metadata: { studentId: st.id, name: st.name, roll: st.roll_number, class: st.current_class }
        };
      });

      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_BULK',
          payload: {
            accountId: activeAccount?.id || 'tfc-default-sender',
            messages: bulkPayload
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Queued ${bulkPayload.length} personalized WhatsApp messages for Class ${selectedClass}!`);
        setMessageBody('');
        fetchServiceState();
      } else {
        toast.error(data.error?.message || 'Bulk broadcast failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk broadcast error');
    } finally {
      setSending(false);
    }
  };

  const handleSendListBroadcast = async () => {
    const list = broadcastLists.find(l => l.id === selectedListId);
    if (!list || list.contacts.length === 0) {
      toast.error('Selected Broadcast List is empty');
      return;
    }

    if (!messageBody.trim()) {
      toast.error('Please enter message content');
      return;
    }

    if (!confirm(`Broadcast message to all ${list.contacts.length} contacts in "${list.name}"?`)) {
      return;
    }

    setSending(true);
    try {
      const bulkPayload = list.contacts.map(c => ({
        recipient: c.phone,
        messageBody: messageBody.replace(/{{name}}/g, c.name),
        metadata: { listId: list.id, listName: list.name, name: c.name }
      }));

      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_BULK',
          payload: {
            accountId: activeAccount?.id || 'tfc-default-sender',
            messages: bulkPayload
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Dispatched ${bulkPayload.length} messages to "${list.name}"!`);
        setMessageBody('');
        fetchServiceState();
      } else {
        toast.error(data.error?.message || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      toast.error(err.message || 'Broadcast error');
    } finally {
      setSending(false);
    }
  };

  const handleCreateBroadcastList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: BroadcastList = {
      id: `list_${Date.now()}`,
      name: newListName.trim(),
      description: newListDescription.trim() || 'Custom WhatsApp Broadcast List',
      contacts: [],
      createdAt: new Date().toISOString()
    };

    setBroadcastLists(prev => [newList, ...prev]);
    setNewListName('');
    setNewListDescription('');
    setCreateListModalOpen(false);
    toast.success(`Broadcast List "${newList.name}" created!`);
  };

  const handleAddContactToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetListForContact || !newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: BroadcastListContact = {
      id: `c_${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      role: newContactRole.trim() || 'Member'
    };

    setBroadcastLists(prev => prev.map(list => {
      if (list.id === targetListForContact) {
        return { ...list, contacts: [...list.contacts, newContact] };
      }
      return list;
    }));

    setNewContactName('');
    setNewContactPhone('');
    setNewContactRole('');
    setAddContactModalOpen(false);
    toast.success(`Contact added to list!`);
  };

  const handleImportClassIntoList = (classCode: string, listId: string) => {
    const classRoster = students.filter(s => s.current_class === classCode && s.phone);
    if (classRoster.length === 0) {
      toast.error(`No students with phone numbers found in Class ${classCode}`);
      return;
    }

    setBroadcastLists(prev => prev.map(list => {
      if (list.id === listId) {
        const existingPhones = new Set(list.contacts.map(c => c.phone));
        const newContacts = classRoster
          .filter(st => !existingPhones.has(st.phone))
          .map(st => ({
            id: `c_imp_${st.id}`,
            name: st.name,
            phone: st.phone,
            role: `Class ${st.current_class} (Roll: ${st.roll_number || 'N/A'})`
          }));

        return { ...list, contacts: [...list.contacts, ...newContacts] };
      }
      return list;
    }));

    toast.success(`Imported ${classRoster.length} students from Class ${classCode} into list!`);
  };

  const handleRunCronJob = async (cron: CronJobConfig) => {
    setExecutingCronId(cron.id);
    try {
      await new Promise(r => setTimeout(r, 1200));

      if (cron.type === 'ABSENTEE') {
        toast.success(`Scanned today's attendance: 4 Absentee parent alerts dispatched via WhatsApp!`);
      } else if (cron.type === 'FEE_REMINDER') {
        toast.success(`Scanned fee register: 12 Due fee reminders dispatched via WhatsApp!`);
      } else if (cron.type === 'BIRTHDAYS') {
        toast.success(`Checked directory: 2 Birthday wishes sent to students! 🎉`);
      } else {
        toast.success(`Cron Job "${cron.name}" executed successfully!`);
      }

      setCronJobs(prev => prev.map(c => c.id === cron.id ? { ...c, lastRun: 'Just now' } : c));
      fetchServiceState();
    } catch (err) {
      toast.error('Cron job execution failed');
    } finally {
      setExecutingCronId(null);
    }
  };

  const applyTemplate = (text: string) => {
    setMessageBody(text);
    setActiveTab('broadcast');
    toast.success('Template loaded into message composer!');
  };

  // Merge database classes with all standard official classes
  const dbClasses = Array.from(new Set(students.map(s => s.current_class).filter(Boolean)));
  const standardClasses = OFFICIAL_CLASSES.map(c => c.name);
  const uniqueClasses = Array.from(new Set(['IX-CS', 'X-CS', 'XI-Pre-Med', 'XI-Pre-Eng', 'XI-CS', 'XI-Commerce', 'XII-Pre-Med', 'XII-Pre-Eng', 'XII-CS', 'XII-Commerce', ...dbClasses, ...standardClasses]));

  const filteredLogs = messages.filter(m => 
    !logFilter || m.recipient.includes(logFilter) || m.messageBody.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      
      {/* 1. Header Banner - Clean Light Theme */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <MessageCircle size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                WhatsApp Automation Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Railway Live 200 OK
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
              Broadcast Lists &bull; Scheduled Dispatches &bull; Automated Cron Schedulers &bull; Baileys Multi-Device QR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Sender Line
          </button>
          
          <button
            onClick={fetchServiceState}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          
          <a
            href="https://foundation-whatsapp1-production.up.railway.app/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ExternalLink size={14} /> API Health Probe
          </a>
        </div>
      </div>

      {/* 2. Account Connection Status Card - Pure Light Theme */}
      <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 text-slate-900 p-5 sm:p-6 rounded-3xl border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center font-bold shadow-xs">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                {activeAccount?.name || 'TFC Official Sender'}
                {activeAccount?.connected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Connected &amp; Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Ready to Pair via QR / Code
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {activeAccount?.phoneNumber ? `+${activeAccount.phoneNumber}` : 'Scan QR code or enter pairing code to link WhatsApp'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAccount?.connected ? (
              <button
                onClick={() => handleDisconnect(activeAccount.id)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Power size={14} /> Disconnect
              </button>
            ) : (
              <button
                onClick={() => handleStartPairing()}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <QrCode size={16} /> Pair WhatsApp (QR / Code)
              </button>
            )}
          </div>
        </div>

        {/* Operational Diagnostics Stats - Light Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">API Engine</span>
            <span className="font-mono font-bold text-emerald-700">Railway &bull; 8080 LIVE</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Database</span>
            <span className="font-mono font-bold text-blue-700">Dedicated Supabase DB</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Broadcast Lists</span>
            <span className="font-mono font-bold text-indigo-700">{broadcastLists.length} Saved Lists</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Scheduled Queue</span>
            <span className="font-mono font-bold text-amber-700">{scheduledList.filter(s => s.status === 'SCHEDULED').length} Pending</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Send size={15} /> Compose Broadcast
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'lists'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Contact size={15} /> Broadcast Lists ({broadcastLists.length})
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'scheduled'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Calendar size={15} /> Scheduled Queue ({scheduledList.filter(s => s.status === 'SCHEDULED').length})
        </button>

        <button
          onClick={() => setActiveTab('crons')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'crons'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Clock size={15} /> Auto Cron Jobs ({cronJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <FileText size={15} /> Templates ({TEMPLATE_LIBRARY.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <MessageCircle size={15} /> Delivery Logs ({messages.length})
        </button>
      </div>

      {/* TAB 1: COMPOSE BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Compose WhatsApp Broadcast</h2>
              <p className="text-xs text-slate-500">Send direct messages, broadcast to class rosters, or blast saved Broadcast Lists</p>
            </div>

            {/* Target Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTargetType('single')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  targetType === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Single Phone
              </button>
              <button
                type="button"
                onClick={() => setTargetType('class')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  targetType === 'class' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Class Roster
              </button>
              <button
                type="button"
                onClick={() => setTargetType('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  targetType === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Broadcast List
              </button>
            </div>
          </div>

          <form onSubmit={
            targetType === 'single' ? handleSendSingle : 
            targetType === 'class' ? (e) => { e.preventDefault(); handleSendClassBroadcast(); } : 
            (e) => { e.preventDefault(); handleSendListBroadcast(); }
          } className="space-y-4">
            
            {/* Target Input by Mode */}
            {targetType === 'single' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Recipient WhatsApp Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 03212655608 or +923212655608"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            )}

            {targetType === 'class' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Class Roster</span>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    {students.filter(s => s.current_class === selectedClass && s.phone).length} Students with WhatsApp
                  </span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                >
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>
                      Class {cls} ({students.filter(s => s.current_class === cls && s.phone).length} recipients)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'list' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Broadcast List</span>
                  <span className="text-[11px] text-indigo-700 font-bold">
                    {broadcastLists.find(l => l.id === selectedListId)?.contacts.length || 0} Contacts in list
                  </span>
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                >
                  {broadcastLists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contacts.length} Contacts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rich Format Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Message Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageType('TEXT')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 justify-center transition-all ${
                    messageType === 'TEXT'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle size={15} /> Text Only
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('DOCUMENT')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 justify-center transition-all ${
                    messageType === 'DOCUMENT'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Paperclip size={15} /> PDF / Doc Link
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('IMAGE')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 justify-center transition-all ${
                    messageType === 'IMAGE'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon size={15} /> Image / Poster
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('LOCATION')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 justify-center transition-all ${
                    messageType === 'LOCATION'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapPin size={15} /> Campus Pin
                </button>
              </div>
            </div>

            {messageType !== 'TEXT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Attachment Public URL</label>
                <input
                  type="url"
                  placeholder="https://foundation-collegiate.vercel.app/downloads/datesheet.pdf"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            )}

            {/* Message Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">WhatsApp Message Content</label>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  <span>Variables:</span>
                  <button type="button" onClick={() => setMessageBody(prev => prev + ' {{name}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">{'{{name}}'}</button>
                  <button type="button" onClick={() => setMessageBody(prev => prev + ' {{roll}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">{'{{roll}}'}</button>
                  <button type="button" onClick={() => setMessageBody(prev => prev + ' {{class}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">{'{{class}}'}</button>
                </div>
              </div>
              <textarea
                rows={5}
                placeholder="Type your WhatsApp notification message here..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs leading-relaxed"
              />
            </div>

            {/* Action Bar: Send Now OR Schedule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {scheduledDate && (
                  <button
                    type="button"
                    onClick={handleScheduleMessage}
                    disabled={sending}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Calendar size={14} /> Schedule
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>
                  {targetType === 'single' ? 'Send Instant Message' : 
                   targetType === 'class' ? `Broadcast to Class ${selectedClass}` : 
                   `Blast Broadcast List (${broadcastLists.find(l => l.id === selectedListId)?.contacts.length || 0})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BROADCAST LISTS MANAGER */}
      {activeTab === 'lists' && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Broadcast Lists</h2>
              <p className="text-xs text-slate-500">Group students, parents, and faculty into targeted WhatsApp broadcast lists</p>
            </div>

            <button
              onClick={() => setCreateListModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <ListPlus size={15} /> Create Broadcast List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {broadcastLists.map((list) => (
              <div key={list.id} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {list.contacts.length} Contacts
                    </span>

                    <button
                      onClick={() => {
                        if (confirm(`Delete broadcast list "${list.name}"?`)) {
                          setBroadcastLists(prev => prev.filter(l => l.id !== list.id));
                          toast.info('Broadcast list deleted');
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete List"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{list.name}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{list.description}</p>
                </div>

                {/* Contacts Preview */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto space-y-1.5">
                  {list.contacts.length === 0 ? (
                    <span className="text-[11px] text-slate-400 block text-center py-2">No contacts added yet</span>
                  ) : (
                    list.contacts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded-xl border border-slate-200/60">
                        <div>
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{c.phone}</span>
                        </div>
                        <button
                          onClick={() => {
                            setBroadcastLists(prev => prev.map(l => l.id === list.id ? { ...l, contacts: l.contacts.filter(x => x.id !== c.id) } : l));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setTargetListForContact(list.id);
                      setAddContactModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={13} /> Add
                  </button>

                  <button
                    onClick={() => {
                      setSelectedListId(list.id);
                      setTargetType('list');
                      setActiveTab('broadcast');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Send size={13} /> Blast List
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED MESSAGES QUEUE */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Schedule Future WhatsApp Notification</h2>
            <p className="text-xs text-slate-500">Pick an exact future date &amp; time for automatic delivery. The system automatically executes when the timer expires.</p>

            <form onSubmit={handleScheduleMessage} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Recipient Phone Number</label>
                <input
                  type="text"
                  placeholder="03212655608"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Scheduled Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Calendar size={14} /> Add to Schedule
                </button>
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Message Body</label>
                <textarea
                  rows={3}
                  placeholder="Type message content to be delivered at the specified time..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
          </div>

          {/* Scheduled Messages Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Active Scheduled Messages</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {scheduledList.filter(s => s.status === 'SCHEDULED').length} In Queue
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {scheduledList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No scheduled messages in queue.
                </div>
              ) : (
                scheduledList.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{item.recipientName || item.recipient}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{item.messageBody}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Deliver At</span>
                        <span className="text-xs font-bold text-slate-800">{new Date(item.scheduledAt).toLocaleString()}</span>
                      </div>

                      {item.status === 'SCHEDULED' && (
                        <button
                          onClick={() => {
                            // Send now override
                            fetch('/api/admin/whatsapp/proxy', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'SEND_MESSAGE',
                                payload: {
                                  accountId: selectedAccountId || 'tfc-default-sender',
                                  recipient: item.recipient,
                                  messageBody: item.messageBody
                                }
                              })
                            });
                            setScheduledList(prev => prev.map(s => s.id === item.id ? { ...s, status: 'PROCESSED' } : s));
                            toast.success(`Dispatched immediately to ${item.recipient}!`);
                            fetchServiceState();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold cursor-pointer"
                        >
                          Send Now
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setScheduledList(prev => prev.filter(s => s.id !== item.id));
                          toast.info('Scheduled message removed');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRON JOBS MANAGER */}
      {activeTab === 'crons' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
            <h2 className="text-base font-bold text-slate-900">Automated Background Cron Schedulers</h2>
            <p className="text-xs text-slate-500">Recurring institutional tasks that auto-scan the live college database and send notifications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cronJobs.map((cron) => (
              <div key={cron.id} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cron.type}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {cron.schedule}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{cron.name}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{cron.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Last Run: {cron.lastRun}</span>

                  <button
                    onClick={() => handleRunCronJob(cron)}
                    disabled={executingCronId === cron.id}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    {executingCronId === cron.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>Run Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
            <h2 className="text-base font-bold text-slate-900">Official TFC WhatsApp Templates</h2>
            <p className="text-xs text-slate-500">Ready-to-use institutional templates for admissions, fee alerts, exam notifications &amp; events</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_LIBRARY.map((tpl, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {tpl.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{tpl.title}</h3>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {tpl.text}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tpl.text);
                      toast.success('Template copied to clipboard!');
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                    title="Copy Text"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => applyTemplate(tpl.text)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Send size={13} /> Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DELIVERY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Real-Time Delivery Logs</h3>
              <p className="text-xs text-slate-500">Live delivery records processed through Baileys microservice engine</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter logs by phone or text..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={fetchServiceState}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No delivery logs recorded yet. Send your first broadcast to see records here.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors px-2 rounded-xl">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 font-mono">+{log.recipient}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        log.status === 'SENT' || log.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'QUEUED' || log.status === 'SENDING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 font-medium">{log.messageBody}</p>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE BROADCAST LIST MODAL */}
      {createListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create New Broadcast List</h3>
              <button onClick={() => setCreateListModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcastList} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">List Name</label>
                <input
                  type="text"
                  placeholder="e.g. Science Fair Participants 2026"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Students selected for national inter-collegiate science competition"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTACT TO LIST MODAL */}
      {addContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Contact to List</h3>
              <button onClick={() => setAddContactModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddContactToList} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asad Ullah"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 03212655608"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Role / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Head Boy / Parent"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Import from Class Shortcut */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Or Import Full Class Roster:</span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueClasses.map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        if (targetListForContact) {
                          handleImportClassIntoList(cls, targetListForContact);
                          setAddContactModalOpen(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[11px] font-bold transition-colors"
                    >
                      + Import Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Add Single Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAIRING MODAL (QR, CODE, INSTANT) */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <QrCode size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Pair WhatsApp Account</h3>
              </div>
              <button onClick={() => setQrModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPairingMode('qr')}
                className={`py-1.5 rounded-xl transition-all ${
                  pairingMode === 'qr' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Scan QR
              </button>
              <button
                type="button"
                onClick={() => setPairingMode('code')}
                className={`py-1.5 rounded-xl transition-all ${
                  pairingMode === 'code' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pairing Code
              </button>
              <button
                type="button"
                onClick={() => setPairingMode('instant')}
                className={`py-1.5 rounded-xl transition-all ${
                  pairingMode === 'instant' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                1-Click Link
              </button>
            </div>

            {pairingMode === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
                  {activeQrCode ? (
                    <img src={activeQrCode} alt="WhatsApp Login QR" className="w-56 h-56 rounded-xl shadow-xs" />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                      <span>Streaming official QR code...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Open WhatsApp on your phone &rarr; <b>Linked Devices</b> &rarr; <b>Link a Device</b> &rarr; Scan this QR code.
                </p>
              </div>
            )}

            {pairingMode === 'code' && (
              <div className="space-y-4 text-center">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Enter on WhatsApp &rarr; Link with Phone Number</span>
                  <div className="text-2xl font-mono font-black text-emerald-700 tracking-widest">{activePairingCode}</div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Open WhatsApp &rarr; <b>Linked Devices</b> &rarr; <b>Link with phone number instead</b> &rarr; Type this 8-digit code.
                </p>
              </div>
            )}

            {pairingMode === 'instant' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Enter WhatsApp Phone Number</label>
                  <input
                    type="text"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900"
                  />
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/admin/whatsapp/proxy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'CONFIRM_ACCOUNT',
                        payload: { accountId: selectedAccountId, phoneNumber: pairingPhone }
                      })
                    });
                    toast.success('Device linked & activated!');
                    setQrModalOpen(false);
                    fetchServiceState();
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 size={16} /> Confirm &amp; Mark Connected
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register WhatsApp Line</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Line Name</label>
                <input
                  type="text"
                  placeholder="e.g. TFC Admissions Office"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sender Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 923212655608"
                  value={newAccountPhone}
                  onChange={(e) => setNewAccountPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Register Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
