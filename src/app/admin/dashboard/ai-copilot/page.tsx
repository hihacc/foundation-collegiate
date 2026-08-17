'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, Send, Bot, User, Database, CheckCircle2, AlertTriangle, 
  Trash2, Edit3, Plus, ArrowRight, RefreshCw, ShieldCheck, 
  Search, Filter, ChevronRight, Layers, Award, Users, Receipt, 
  BookOpen, Bell, ArrowUpRight, Check, X, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action_proposal?: {
    action: 'UPDATE' | 'DELETE' | 'INSERT';
    table: string;
    record_id?: string;
    description: string;
    changes?: Record<string, any>;
    preview?: {
      target_name: string;
      before: string;
      after: string;
    };
  } | null;
  executed?: boolean;
  rejected?: boolean;
  timestamp: string;
}

const PRESET_PROMPTS = [
  '🔍 Audit student directory for missing photos, emails, or phone numbers',
  '📊 List the top 3 highest mark scorers across all classes',
  '💰 Find all students with Unpaid or Overdue fee challans',
  '🎓 Suggest inactive students who can be marked as Graduated / Alumni',
  '📝 Draft an official announcement notice for the upcoming Midterm Examination'
];

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to TFC AI Copilot & Database Manager 🤖\n\nI have full visibility into your live college records (Students, Results, Fee Challans, Admissions, Notices, and Classes).\n\n**How I can assist you today:**\n- **Analyze & Sort**: *"Which class has the highest pass percentage?"*\n- **Find Records**: *"Show me all Pre-Medical students with unpaid fees."*\n- **Propose Database Edits**: *"Update Asif Khan's status to Graduated."*\n- **Content Generation**: *"Draft a notice for Summer Vacation."*\n\nAny data modifications will be presented for your **explicit approval** before applying to the live database!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Live database stats
  const [dbStats, setDbStats] = useState({
    students: 0,
    results: 0,
    challans: 0,
    admissions: 0,
    notices: 0
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchLiveCounts = async () => {
    try {
      const [
        { count: stCount },
        { count: resCount },
        { count: chCount },
        { count: admCount },
        { count: notCount }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('results').select('*', { count: 'exact', head: true }),
        supabase.from('fee_challans').select('*', { count: 'exact', head: true }),
        supabase.from('admissions').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('*', { count: 'exact', head: true })
      ]);

      setDbStats({
        students: stCount || 0,
        results: resCount || 0,
        challans: chCount || 0,
        admissions: admCount || 0,
        notices: notCount || 0
      });
    } catch {}
  };

  useEffect(() => {
    fetchLiveCounts();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/admin/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with AI');
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        action_proposal: data.action_proposal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'AI Copilot encountered an error');
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ **Error communicating with AI:** ${err.message || 'Please check your OpenRouter API key settings.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Approval & Live Execution
  const handleApproveAction = async (msgId: string, proposal: NonNullable<Message['action_proposal']>) => {
    try {
      setExecutingId(msgId);
      const res = await fetch('/api/admin/ai-copilot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      toast.success(data.message || 'Action executed successfully in live database!');
      
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, executed: true } : m));
      fetchLiveCounts();
    } catch (err: any) {
      toast.error(`Execution error: ${err.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  const handleRejectAction = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, rejected: true } : m));
    toast.info('Action proposal rejected. No database changes were made.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900">
                AI Copilot &amp; Data Manager
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                OpenRouter Powered
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Live Database Queries &bull; Intelligent Sorting &bull; Supervised Safe Modifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveCounts}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Live Database Snapshot"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <Link
            href="/admin/dashboard/settings/ai-scanner"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Bot size={14} /> AI Settings &amp; Keys
          </Link>
        </div>
      </div>

      {/* Main Grid: Data Explorer Sidebar & Interactive Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Live Database Snapshot Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Database size={16} className="text-blue-600" /> Live Database Visibility
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Synced
              </span>
            </div>

            <div className="space-y-2.5">
              <Link href="/admin/dashboard/students" className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-blue-600">Students Directory</div>
                    <div className="text-[10px] text-slate-400">Enrolled &amp; Active Roster</div>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">{dbStats.students}</span>
              </Link>

              <Link href="/admin/dashboard/results" className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <Award size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Exam Marksheets</div>
                    <div className="text-[10px] text-slate-400">Gradebooks &amp; PINs</div>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">{dbStats.results}</span>
              </Link>

              <Link href="/admin/dashboard/fees/challans" className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-600">Fee Challans</div>
                    <div className="text-[10px] text-slate-400">Paid &amp; Pending Vouchers</div>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">{dbStats.challans}</span>
              </Link>

              <Link href="/admin/dashboard/admissions" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-600">Admissions Queue</div>
                    <div className="text-[10px] text-slate-400">Online &amp; Paper Forms</div>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">{dbStats.admissions}</span>
              </Link>

              <Link href="/admin/dashboard/notices" className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-purple-600">Official Notices</div>
                    <div className="text-[10px] text-slate-400">Announcements</div>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">{dbStats.notices}</span>
              </Link>
            </div>
          </div>

          {/* Preset Prompts Box */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Sparkles size={14} /> Quick AI Prompts
            </h4>
            <div className="space-y-2">
              {PRESET_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  disabled={loading}
                  className="w-full text-left text-xs bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl border border-white/15 transition-all text-slate-200 hover:text-white cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Chat Terminal & Action Inspector (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] max-h-[750px]">
          
          {/* Chat Messages Log */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white p-3.5 sm:p-4 rounded-3xl rounded-tr-xs shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-800 p-4 sm:p-5 rounded-3xl rounded-tl-xs border border-slate-200/80 shadow-2xs'
                }`}>
                  
                  {/* Message Body */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                    {m.content.replace(/```json:action_proposal[\s\S]*?```/g, '')}
                  </div>

                  {/* Proposed Action Card (With Admin Approval Requirement) */}
                  {m.action_proposal && (
                    <div className="mt-3 p-4 bg-white rounded-2xl border-2 border-indigo-300 shadow-md space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <span className="font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                          <ShieldCheck size={16} className="text-indigo-600" /> Proposed Action &bull; Admin Approval Required
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.action_proposal.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800'
                            : m.action_proposal.action === 'UPDATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.action_proposal.action} ({m.action_proposal.table})
                        </span>
                      </div>

                      <p className="font-semibold text-slate-800">
                        {m.action_proposal.description}
                      </p>

                      {m.action_proposal.preview && (
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-bold uppercase block text-[9px]">Before</span>
                            <span className="font-mono text-slate-700">{m.action_proposal.preview.before}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase block text-[9px]">Proposed After</span>
                            <span className="font-mono font-bold text-blue-700">{m.action_proposal.preview.after}</span>
                          </div>
                        </div>
                      )}

                      {/* Approval Buttons */}
                      {m.executed ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 size={16} /> Applied to Live Database Successfully
                        </div>
                      ) : m.rejected ? (
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs bg-slate-100 p-2 rounded-xl">
                          <X size={16} /> Action Proposal Cancelled
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleApproveAction(m.id, m.action_proposal!)}
                            disabled={executingId === m.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {executingId === m.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Applying...
                              </>
                            ) : (
                              <>
                                <Check size={14} /> Approve &amp; Execute Live
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectAction(m.id)}
                            disabled={executingId === m.id}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] ${m.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-50 text-slate-800 p-4 rounded-3xl rounded-tl-xs border border-slate-200/80 flex items-center gap-2 text-xs font-semibold">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span>AI Copilot is analyzing live database records...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt Input Box */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2 bg-white border border-slate-300 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-xs"
            >
              <input
                type="text"
                placeholder="Ask AI to query, sort, summarize, or propose edits to any website data..."
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent border-0 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
