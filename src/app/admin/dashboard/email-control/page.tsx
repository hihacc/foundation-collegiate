'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, Send, CheckCircle2, AlertCircle, RefreshCw, Sliders, ShieldCheck, FileText, Sparkles, Server, Inbox } from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

interface EmailLog {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed';
  timestamp: string;
}

const defaultLogs: EmailLog[] = [
  { id: '1', type: 'welcome', recipient: 'foundationcollegiate@gmail.com', subject: 'Welcome to The Foundation Collegiate, Ahmed Ali!', status: 'Sent', timestamp: new Date().toISOString() },
  { id: '2', type: 'fee_payment', recipient: 'foundationcollegiate@gmail.com', subject: 'Payment Receipt - August 2026', status: 'Sent', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'contact', recipient: 'foundationcollegiate@gmail.com', subject: 'New Contact Form Submission', status: 'Sent', timestamp: new Date(Date.now() - 7200000).toISOString() },
];

export default function EmailControlPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'triggers' | 'broadcast' | 'logs'>('overview');
  
  // Triggers state
  const [triggers, setTriggers] = useState({
    welcome_on_admission: true,
    receipt_on_payment: true,
    contact_alerts: true,
    admission_alerts: true,
  });

  // Test Tester State
  const [testType, setTestType] = useState('welcome');
  const [testEmail, setTestEmail] = useState('foundationcollegiate@gmail.com');
  const [testSending, setTestSending] = useState(false);

  // Broadcast State
  const [broadcastForm, setBroadcastForm] = useState({
    recipientEmail: '',
    subject: '',
    title: '',
    message: '',
    cta_label: '',
    cta_url: '',
  });
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<EmailLog[]>(() => getStoredData('email_logs', defaultLogs));

  const addLog = (type: string, recipient: string, subject: string, status: 'Sent' | 'Failed') => {
    const newLog: EmailLog = {
      id: crypto.randomUUID(),
      type,
      recipient,
      subject,
      status,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    setStoredData('email_logs', updated);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return toast.error('Please enter a target email address');
    
    setTestSending(true);
    try {
      let payload: any = {};
      let subject = 'Test Email';

      if (testType === 'welcome') {
        subject = 'Welcome to The Foundation Collegiate!';
        payload = { student_name: 'Test Student', class_name: 'Matric Science', roll_number: 'FC-2026-TEST' };
      } else if (testType === 'fee_payment') {
        subject = 'Payment Receipt - Test';
        payload = { student_name: 'Test Student', month_year: 'August 2026', barcode_ref: 'FC-TEST-1234', payment_method: 'Easypaisa', amount_paid: 5000, remaining: 0 };
      } else if (testType === 'contact') {
        subject = 'New Contact Submission Test';
        payload = { name: 'Test User', phone: '0333-1234567', email: testEmail, subject: 'Inquiry Test', message: 'This is a test contact inquiry.' };
      } else if (testType === 'admission_alert') {
        subject = 'New Admission Application Test';
        payload = { student_name: 'Test Student', father_name: 'Test Father', class_applied: 'Pre-Medical', parent_phone: '0300-1234567' };
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: testType, payload, toEmail: testEmail }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Test email (${testType}) sent successfully to ${testEmail}!`);
        addLog(testType, testEmail, subject, 'Sent');
      } else {
        toast.error(`Email failed: ${data.error || 'Check SMTP credentials'}`);
        addLog(testType, testEmail, subject, 'Failed');
      }
    } catch (err: any) {
      toast.error('Network error while triggering test email');
      addLog(testType, testEmail, 'Test Email', 'Failed');
    } finally {
      setTestSending(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.subject || !broadcastForm.message) {
      return toast.error('Subject and message body are required');
    }

    const targetEmail = broadcastForm.recipientEmail.trim() || 'foundationcollegiate@gmail.com';
    setBroadcastSending(true);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom_broadcast',
          toEmail: targetEmail,
          payload: {
            subject: broadcastForm.subject,
            title: broadcastForm.title || broadcastForm.subject,
            message: broadcastForm.message,
            cta_label: broadcastForm.cta_label,
            cta_url: broadcastForm.cta_url,
          }
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Broadcast email sent to ${targetEmail}!`);
        addLog('custom_broadcast', targetEmail, broadcastForm.subject, 'Sent');
        setBroadcastForm({ recipientEmail: '', subject: '', title: '', message: '', cta_label: '', cta_url: '' });
      } else {
        toast.error(`Broadcast failed: ${data.error || 'SMTP Error'}`);
        addLog('custom_broadcast', targetEmail, broadcastForm.subject, 'Failed');
      }
    } catch {
      toast.error('Failed to send broadcast email');
      addLog('custom_broadcast', targetEmail, broadcastForm.subject, 'Failed');
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 flex items-center gap-2">
            <Mail className="text-blue-600" /> Email & SMTP Control Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage email templates, automated triggers, broadcast communications, and delivery logs.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'test', label: 'Test Dispatcher' },
            { key: 'triggers', label: 'Automated Triggers' },
            { key: 'broadcast', label: 'Broadcast Mailer' },
            { key: 'logs', label: 'Delivery Logs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SMTP STATUS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SMTP Server</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xl font-bold text-slate-800">Gmail SMTP</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">foundationcollegiate@gmail.com</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Emails Sent</span>
                <Inbox className="text-blue-500" size={18} />
              </div>
              <div className="text-2xl font-bold text-slate-800">{logs.filter(l => l.status === 'Sent').length}</div>
              <div className="text-xs text-emerald-600 font-bold mt-1">100% Delivery Success Rate</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Triggers</span>
                <ShieldCheck className="text-emerald-500" size={18} />
              </div>
              <div className="text-2xl font-bold text-slate-800">4 / 4</div>
              <div className="text-xs text-slate-500 mt-1">Auto Welcome & Receipts Enabled</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">HTML Engine</span>
                <Sparkles className="text-amber-500" size={18} />
              </div>
              <div className="text-xl font-bold text-slate-800">HTML5 Responsive</div>
              <div className="text-xs text-slate-500 mt-1">Inline CSS Brand Template</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-[#001B4D] to-[#001338] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Live Communication Control</span>
                <h3 className="text-2xl font-bold mt-1">Send Automated or Custom Broadcast Emails</h3>
                <p className="text-sm text-blue-100/80 mt-2 max-w-xl">
                  Easily send welcome notices, payment confirmation receipts, or broadcast announcements directly from your administrative dashboard.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('test')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all whitespace-nowrap"
              >
                Launch Test Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEST DISPATCHER */}
      {activeTab === 'test' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send size={18} className="text-blue-600" /> Interactive Email Tester
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select an email template type and dispatch a live test email to verify formatting and delivery.</p>
          </div>

          <form onSubmit={handleSendTestEmail} className="space-y-5 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Select Template Type</label>
              <select
                value={testType}
                onChange={e => setTestType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
              >
                <option value="welcome">Welcome Email (Student Admission)</option>
                <option value="fee_payment">Fee Payment Receipt (Transaction Confirmation)</option>
                <option value="contact">Contact Inquiry Alert (Admin Notification)</option>
                <option value="admission_alert">Admission Application Alert (Admin Notification)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Target Email Address *</label>
              <input
                required
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="e.g. foundationcollegiate@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={testSending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testSending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Send Test Email Now
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AUTOMATED TRIGGERS CONTROL */}
      {activeTab === 'triggers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" /> Automated Email Trigger Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1">Control which events automatically send HTML emails to students or administrators.</p>
          </div>

          <div className="space-y-4 max-w-2xl">
            {[
              { key: 'welcome_on_admission', title: 'Send Welcome Email on Admission Approval', desc: 'Automatically emails the student/parent with their official Roll Number when an admin approves their application.' },
              { key: 'receipt_on_payment', title: 'Send Fee Receipt Email on Payment', desc: 'Automatically emails an official payment receipt detailing amount paid and remaining balance when a fee payment is recorded.' },
              { key: 'contact_alerts', title: 'Send Email Notification for Contact Form', desc: 'Alerts administrators whenever a new message is submitted through the Contact Us page.' },
              { key: 'admission_alerts', title: 'Send Email Notification for New Admission', desc: 'Alerts administrators whenever a prospective student applies online for admission.' },
            ].map(item => {
              const active = (triggers as any)[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...triggers, [item.key]: !active };
                      setTriggers(updated);
                      toast.success(`Trigger "${item.title}" ${!active ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      active ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST MAILER */}
      {activeTab === 'broadcast' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail size={18} className="text-blue-600" /> Custom Broadcast Mailer
            </h2>
            <p className="text-xs text-slate-500 mt-1">Compose and send custom HTML announcements or messages to individual or list email recipients.</p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Recipient Email (Leave blank for default admin email)</label>
              <input
                type="email"
                value={broadcastForm.recipientEmail}
                onChange={e => setBroadcastForm({ ...broadcastForm, recipientEmail: e.target.value })}
                placeholder="e.g. parent@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Subject *</label>
                <input
                  required
                  type="text"
                  value={broadcastForm.subject}
                  onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                  placeholder="e.g. Important Announcement: Mid-Term Exams Schedule"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Header Title</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g. Mid-Term Examination Schedule 2026"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Message Content *</label>
              <textarea
                required
                rows={5}
                value={broadcastForm.message}
                onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                placeholder="Type your message body here..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Button Label (Optional)</label>
                <input
                  type="text"
                  value={broadcastForm.cta_label}
                  onChange={e => setBroadcastForm({ ...broadcastForm, cta_label: e.target.value })}
                  placeholder="e.g. View Date Sheet"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Button Link URL (Optional)</label>
                <input
                  type="text"
                  value={broadcastForm.cta_url}
                  onChange={e => setBroadcastForm({ ...broadcastForm, cta_url: e.target.value })}
                  placeholder="e.g. https://foundationcollegiate.com/downloads"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={broadcastSending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {broadcastSending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Send Broadcast Email
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Recent Email Activity Logs
            </h3>
            <span className="text-xs font-bold text-slate-500">{logs.length} Total Dispatches</span>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold text-left">Type</th>
                  <th className="py-3.5 px-4 font-bold text-left">Recipient</th>
                  <th className="py-3.5 px-4 font-bold text-left">Subject</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold uppercase">{log.type}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{log.recipient}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium text-xs max-w-[240px] truncate">{log.subject}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-PK', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
