'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, Send, Bot, User, Database, CheckCircle2, AlertTriangle, 
  Trash2, Edit3, Plus, ArrowRight, RefreshCw, ShieldCheck, 
  Search, Filter, ChevronRight, Layers, Award, Users, Receipt, 
  BookOpen, Bell, ArrowUpRight, Check, X, Loader2, CornerDownLeft, Sparkle
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
      content: `### Welcome to TFC AI Copilot & Database Manager 🤖\n\nI have full real-time visibility into your live college records (Students, Results, Fee Challans, Admissions, Notices, and Classes).\n\n**How I can assist you:**\n- **Analyze & Sort**: *"Which class has the highest pass percentage?"*\n- **Find Records**: *"Show me all Pre-Medical students with unpaid fees."*\n- **Propose Database Edits**: *"Update Asif Khan's status to Graduated."*\n- **Content Generation**: *"Draft a notice for Summer Vacation."*\n\nAny proposed modifications are presented for your **explicit one-click approval** before applying to the live database!`,
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

  const fetchDatabaseStats = async () => {
    try {
      const [
        { count: studentsCount },
        { count: resultsCount },
        { count: challansCount },
        { count: admissionsCount },
        { count: noticesCount }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('results').select('*', { count: 'exact', head: true }),
        supabase.from('fee_challans').select('*', { count: 'exact', head: true }),
        supabase.from('admissions').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('*', { count: 'exact', head: true })
      ]);

      setDbStats({
        students: studentsCount || 0,
        results: resultsCount || 0,
        challans: challansCount || 0,
        admissions: admissionsCount || 0,
        notices: noticesCount || 0
      });
    } catch (error) {
      console.error('Error loading DB stats:', error);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!promptToSend) setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text.trim(),
          history: messages.slice(-8)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI Copilot');
      }

      const assistantMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        action_proposal: data.action_proposal || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Connection Notice**: ${error.message}\n\nPlease verify your OpenRouter API key in **Settings > AI Scanner** or check your internet connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (msgId: string, proposal: NonNullable<Message['action_proposal']>) => {
    setExecutingId(msgId);
    try {
      const response = await fetch('/api/admin/ai-copilot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute modification');
      }

      toast.success(data.message || 'Database successfully updated!');
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, executed: true } : m))
      );
      fetchDatabaseStats();
    } catch (error: any) {
      toast.error(error.message || 'Execution error');
    } finally {
      setExecutingId(null);
    }
  };

  const handleRejectAction = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, rejected: true } : m))
    );
    toast.info('Action proposal cancelled');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      
      {/* 1. Header Banner - Clean Light Theme */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                AI Copilot &amp; Data Manager
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                OpenRouter Powered
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
              Live Database Queries &bull; Intelligent Analytics &bull; Supervised Safe Modifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDatabaseStats}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          
          <Link
            href="/admin/dashboard/settings/ai-scanner"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ShieldCheck size={14} /> AI Settings &amp; Keys
          </Link>
        </div>
      </div>

      {/* 2. Live Database Telemetry Cards - Pure Light Theme */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Database size={15} className="text-emerald-600" />
            <span>Live Database Visibility</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Synced &amp; Connected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/admin/dashboard/students"
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Students Directory</span>
              <Users size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-display font-black text-slate-900">{dbStats.students}</span>
              <span className="text-[10px] font-semibold text-emerald-600">Active Roster</span>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/results"
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Exam Marksheets</span>
              <Award size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-display font-black text-slate-900">{dbStats.results}</span>
              <span className="text-[10px] font-semibold text-blue-600">Gradebooks</span>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/fees/challans"
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Fee Challans</span>
              <Receipt size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-display font-black text-slate-900">{dbStats.challans}</span>
              <span className="text-[10px] font-semibold text-amber-600">Vouchers</span>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/admissions"
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Admissions Queue</span>
              <BookOpen size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-display font-black text-slate-900">{dbStats.admissions}</span>
              <span className="text-[10px] font-semibold text-indigo-600">Applicants</span>
            </div>
          </Link>

          <Link
            href="/admin/dashboard/notices"
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Official Notices</span>
              <Bell size={15} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-display font-black text-slate-900">{dbStats.notices}</span>
              <span className="text-[10px] font-semibold text-purple-600">Published</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Quick AI Prompt Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
          Instant Suggestions
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs text-left cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Feed Container - Clean White & Soft Emerald */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col h-[560px] overflow-hidden">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-[90%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs font-medium shadow-xs'
                      : 'bg-slate-50/80 border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Structured Action Proposal Card */}
                {msg.action_proposal && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Admin Approval Required
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900">
                        {msg.action_proposal.action} &bull; {msg.action_proposal.table}
                      </span>
                    </div>

                    <p className="text-xs text-amber-950 font-medium">
                      {msg.action_proposal.description}
                    </p>

                    {/* Before & After Visual Preview */}
                    {msg.action_proposal.preview && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 text-rose-800">
                          <span className="block text-[10px] font-bold uppercase text-rose-500">Current</span>
                          <span>{msg.action_proposal.preview.before}</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 text-emerald-800">
                          <span className="block text-[10px] font-bold uppercase text-emerald-600">Proposed</span>
                          <span>{msg.action_proposal.preview.after}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {msg.executed ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                          <CheckCircle2 size={14} /> Applied to Database
                        </span>
                      ) : msg.rejected ? (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">
                          <X size={14} /> Rejected by Admin
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRejectAction(msg.id)}
                            disabled={executingId === msg.id}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveAction(msg.id, msg.action_proposal!)}
                            disabled={executingId === msg.id}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            {executingId === msg.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Applying...
                              </>
                            ) : (
                              <>
                                <Check size={14} /> Approve &amp; Apply
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-medium px-1">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-2xs">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                <span>Reading live database &amp; generating insights...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Floating Input Control Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-t border-slate-200/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI to query records, sort students, calculate fee totals, or propose data updates..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
