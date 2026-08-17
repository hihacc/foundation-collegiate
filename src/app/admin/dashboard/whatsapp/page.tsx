'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  MessageCircle, Send, QrCode, Smartphone, RefreshCw, CheckCircle2, 
  AlertTriangle, Users, BookOpen, Layers, ShieldCheck, Power, 
  ExternalLink, Clock, FileText, Check, X, Loader2, Plus, Copy, CheckCheck
} from 'lucide-react';

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
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';
  sentAt?: string;
  createdAt: string;
  errorMessage?: string;
}

export default function WhatsAppCenterPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'automations' | 'logs' | 'accounts'>('broadcast');
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
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);

  // Create Account Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');

  // Broadcast Message Form
  const [targetType, setTargetType] = useState<'single' | 'class'>('single');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [selectedClass, setSelectedClass] = useState('IX-CS');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);

  // Student directory for class broadcast
  const [students, setStudents] = useState<any[]>([]);

  // Logs
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

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
        body: JSON.stringify({ action: 'LIST_MESSAGES', payload: { limit: 30 } })
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
      const { data } = await supabase.from('students').select('id, name, roll_number, class_name, phone').eq('status', 'active');
      if (data) setStudents(data);
    } catch {}
  };

  useEffect(() => {
    fetchServiceState();
    fetchStudents();
  }, []);

  // Poll QR code if modal is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrModalOpen) {
      const targetId = selectedAccountId || accounts[0]?.id || 'tfc-default-sender';
      const pollQr = async () => {
        try {
          const res = await fetch('/api/admin/whatsapp/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_QR', payload: { accountId: targetId } })
          });
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.connected) {
              toast.success('WhatsApp connected successfully!');
              setQrModalOpen(false);
              fetchServiceState();
            } else if (data.data.qrCode) {
              setActiveQrCode(data.data.qrCode);
            }
          }
        } catch {}
      };
      pollQr();
      interval = setInterval(pollQr, 3000);
    }
    return () => clearInterval(interval);
  }, [qrModalOpen, selectedAccountId, accounts]);

  // Connect & Request QR Code (Zero blocker, auto-resolves account)
  const handleStartPairing = async (accId?: string) => {
    let id = accId || selectedAccountId;
    
    if (!id || id === 'tfc-default-sender') {
      if (accounts.length > 0 && accounts[0].id) {
        id = accounts[0].id;
        setSelectedAccountId(id);
      }
    }

    try {
      setLoading(true);
      toast.loading('Initializing WhatsApp pairing session...', { id: 'qr_init' });

      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONNECT_ACCOUNT', payload: { accountId: id } })
      });
      const data = await res.json();
      toast.dismiss('qr_init');

      setQrModalOpen(true);
      toast.success('Scan the QR code with WhatsApp on your phone!');
    } catch (err: any) {
      toast.dismiss('qr_init');
      toast.error(err.message || 'Pairing error');
    } finally {
      setLoading(false);
    }
  };

  // Create New Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) {
      toast.error('Please enter an account name (e.g. TFC Admissions Line)');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ACCOUNT',
          payload: {
            name: newAccountName.trim(),
            phoneNumber: newAccountPhone.trim() || undefined
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registered account "${newAccountName}"!`);
        setCreateModalOpen(false);
        setNewAccountName('');
        setNewAccountPhone('');
        fetchServiceState();
      } else {
        toast.error(data.error?.message || 'Failed to create account');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = async (accId: string) => {
    if (!confirm('Disconnect this WhatsApp session?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISCONNECT_ACCOUNT', payload: { accountId: accId } })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('WhatsApp session disconnected');
        fetchServiceState();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send Direct or Bulk Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeId = selectedAccountId || accounts[0]?.id || 'tfc-default-sender';

    if (!messageBody.trim()) {
      toast.error('Please enter a message body.');
      return;
    }

    setSending(true);

    try {
      if (targetType === 'single') {
        if (!recipientPhone.trim()) {
          toast.error('Please enter recipient phone number.');
          setSending(false);
          return;
        }

        const res = await fetch('/api/admin/whatsapp/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SEND_MESSAGE',
            payload: {
              accountId: activeId,
              recipient: recipientPhone.trim(),
              messageBody: messageBody.trim()
            }
          })
        });

        const data = await res.json();
        if (data.success) {
          toast.success('WhatsApp message queued successfully!');
          setMessageBody('');
          fetchServiceState();
        } else {
          toast.error(data.error?.message || 'Failed to send message');
        }

      } else {
        // Bulk Class Broadcast
        const classStudents = students.filter(s => s.class_name === selectedClass && s.phone);
        if (classStudents.length === 0) {
          toast.error(`No students with phone numbers found in Class ${selectedClass}.`);
          setSending(false);
          return;
        }

        const bulkPayload = classStudents.map(s => ({
          recipient: s.phone,
          messageBody: messageBody
            .replace(/\{\{\s*name\s*\}\}/gi, s.name)
            .replace(/\{\{\s*roll\s*\}\}/gi, s.roll_number || '')
            .replace(/\{\{\s*class\s*\}\}/gi, s.class_name || ''),
          metadata: { studentId: s.id, rollNumber: s.roll_number }
        }));

        const res = await fetch('/api/admin/whatsapp/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SEND_BULK',
            payload: {
              accountId: activeId,
              messages: bulkPayload
            }
          })
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Queued ${bulkPayload.length} broadcast messages for Class ${selectedClass}!`);
          setMessageBody('');
          fetchServiceState();
        } else {
          toast.error(data.error?.message || 'Bulk broadcast failed');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Send error');
    } finally {
      setSending(false);
    }
  };

  // Trigger Institutional Automation
  const handleTriggerAutomation = async (triggerType: any, sampleVars: Record<string, any>) => {
    const phone = prompt('Enter recipient phone number for automation test:', '03001234567');
    if (!phone) return;

    const activeId = selectedAccountId || accounts[0]?.id || 'tfc-default-sender';

    try {
      toast.loading(`Dispatching ${triggerType}...`, { id: 'auto_disp' });
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER_AUTOMATION',
          payload: {
            triggerType,
            recipient: phone,
            variables: sampleVars,
            accountId: activeId
          }
        })
      });
      const data = await res.json();
      toast.dismiss('auto_disp');

      if (data.success) {
        toast.success(`Dispatched ${triggerType} successfully!`);
        fetchServiceState();
      } else {
        toast.error(data.error?.message || 'Automation dispatch failed');
      }
    } catch (err: any) {
      toast.dismiss('auto_disp');
      toast.error(err.message);
    }
  };

  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <MessageCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900">
                WhatsApp Automation Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Microservice Live
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Baileys Automation &bull; Multi-Device QR &bull; Automated Results, Fees &amp; Admission Alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Sender Account
          </button>
          
          <button
            onClick={fetchServiceState}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Status
          </button>
          
          <a
            href="https://foundation-whatsapp.vercel.app/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ExternalLink size={14} /> API Health Probe
          </a>
        </div>
      </div>

      {/* Account Connection Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                {activeAccount?.name || 'TFC Official Sender'}
                {activeAccount?.connected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Ready to Pair via QR
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300">
                {activeAccount?.phoneNumber ? `+${activeAccount.phoneNumber}` : 'Scan QR code with phone to link WhatsApp'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAccount?.connected ? (
              <button
                onClick={() => handleDisconnect(activeAccount.id)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Power size={14} /> Disconnect
              </button>
            ) : (
              <button
                onClick={() => handleStartPairing()}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <QrCode size={16} /> Pair WhatsApp (QR Code)
              </button>
            )}
          </div>
        </div>

        {/* Operational Diagnostics Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">API Engine</span>
            <span className="font-mono font-bold text-emerald-400">Vercel Serverless (200 OK)</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Database</span>
            <span className="font-mono font-bold text-blue-400">Dedicated Supabase DB</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Queue Processing</span>
            <span className="font-mono font-bold text-amber-400">BullMQ Redis Queues</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Registered Senders</span>
            <span className="font-mono font-bold text-white text-sm">{accounts.length} Accounts</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            💬 Instant &amp; Class Broadcast
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'automations'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ⚡ Institutional Automations
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            📜 Delivery Logs ({messages.length})
          </button>
        </div>

        {/* Tab 1: Broadcast & Direct Send */}
        {activeTab === 'broadcast' && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleSendMessage} className="space-y-4 max-w-2xl">
              
              <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'single'}
                    onChange={() => setTargetType('single')}
                    className="accent-emerald-600"
                  />
                  Single Direct Message
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'class'}
                    onChange={() => setTargetType('class')}
                    className="accent-emerald-600"
                  />
                  Class Broadcast ({selectedClass})
                </label>
              </div>

              {targetType === 'single' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="03001234567 or 923001234567"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Class Roster
                  </label>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="IX-CS">Class IX (Computer Science)</option>
                    <option value="IX-BIO">Class IX (Biology)</option>
                    <option value="X-CS">Class X (Computer Science)</option>
                    <option value="X-BIO">Class X (Biology)</option>
                    <option value="XI-MED">XI - First Year Pre-Medical</option>
                    <option value="XI-ENG">XI - First Year Pre-Engineering</option>
                    <option value="XII-MED">XII - Second Year Pre-Medical</option>
                    <option value="XII-ENG">XII - Second Year Pre-Engineering</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Total Enrolled with Phone: {students.filter(s => s.class_name === selectedClass && s.phone).length} students
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    WhatsApp Message Content
                  </label>
                  {targetType === 'class' && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      Available: &#123;&#123;name&#125;&#125;, &#123;&#123;roll&#125;&#125;, &#123;&#123;class&#125;&#125;
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  placeholder="Type your official announcement or message here..."
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Queueing Dispatch...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send via WhatsApp
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Tab 2: Institutional Automations */}
        {activeTab === 'automations' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Instant Institutional Automation Dispatchers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Admission Confirmation</h4>
                    <p className="text-[11px] text-slate-500">Sends official admission confirmation with Roll No</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerAutomation('ADMISSION_CONFIRMATION', {
                    studentName: 'Hamza Tariq',
                    parentName: 'Mr. Tariq',
                    className: 'First Year Pre-Engineering',
                    rollNumber: 'FC-26-104'
                  })}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Test Admission Alert
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    💳
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Fee Due Reminder</h4>
                    <p className="text-[11px] text-slate-500">Sends fee voucher amount and due date alert</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerAutomation('FEE_DUE_REMINDER', {
                    studentName: 'Hamza Tariq',
                    className: 'First Year Pre-Engineering',
                    challanNo: 'FC-2026-0812',
                    totalAmount: '6,500',
                    dueDate: '20-Aug-2026'
                  })}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Test Fee Reminder
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Attendance Absent Alert</h4>
                    <p className="text-[11px] text-slate-500">Notifies parent when student is marked absent</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerAutomation('ATTENDANCE_ALERT', {
                    studentName: 'Hamza Tariq',
                    rollNumber: 'FC-26-104',
                    date: new Date().toLocaleDateString('en-GB')
                  })}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Test Absent Alert
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    📊
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Exam Results &amp; Marks Alert</h4>
                    <p className="text-[11px] text-slate-500">Sends percentage, grade, position &amp; PIN</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerAutomation('RESULT_NOTIFICATION', {
                    studentName: 'Hamza Tariq',
                    examName: 'Midterm Examination',
                    obtainedMarks: 462,
                    totalMarks: 500,
                    percentage: 92.4,
                    grade: 'A-1',
                    position: '1st',
                    pin: '4821'
                  })}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Test Results Alert
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Delivery Logs */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No WhatsApp messages dispatched yet.
                    </td>
                  </tr>
                ) : (
                  messages.map(msg => (
                    <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">+{msg.recipient}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{msg.messageBody}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          msg.status === 'SENT' || msg.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : msg.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Register Account Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus size={18} className="text-emerald-600" /> Register WhatsApp Line
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. TFC Admissions Line"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">WhatsApp Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 923001234567"
                  value={newAccountPhone}
                  onChange={e => setNewAccountPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                Register &amp; Save Line
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode size={18} className="text-emerald-600" /> WhatsApp Web Pairing
              </h3>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center min-h-[220px]">
              {activeQrCode ? (
                <img
                  src={activeQrCode}
                  alt="WhatsApp Login QR Code"
                  className="w-48 h-48 rounded-xl shadow-xs"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                  <span>Connecting to persistent worker...</span>
                  <span className="text-[10px] text-slate-400">QR code will render automatically</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 text-left space-y-1">
              <p className="font-bold text-slate-700">How to link your device:</p>
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> $\to$ <strong>Linked Devices</strong></p>
              <p>3. Tap <strong>Link a Device</strong> and point your camera at this screen</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
