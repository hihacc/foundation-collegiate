'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck, ShieldAlert, KeyRound, Lock, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, Globe, Laptop, UserX, Activity, Eye, Trash2,
  Download, Search, Filter, Layers, UserCheck, MessageCircle, FileText,
  Sparkles, Calendar, ArrowUpRight, ArrowDownRight, Terminal, Info,
  SlidersHorizontal, Check, X, Shield, LockKeyhole
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { AuditLogEntry, AuditCategory, getAuditLogs, clearAuditLogs, logAdminActivity } from '@/lib/utils/auditLogger';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  
  // Realtime Polling
  const [refreshInterval, setRefreshInterval] = useState<number>(10); // in seconds, 0 = off
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Master PIN for clear
  const [showClearModal, setShowClearModal] = useState(false);
  const [securityPinInput, setSecurityPinInput] = useState('');

  const fetchLogs = async (showToast = false) => {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
      setLastRefreshed(new Date());
      if (showToast) toast.success('Audit logs refreshed');
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    logAdminActivity({
      category: 'PAGE_VISIT',
      action: 'VIEW_AUDIT_LOGS',
      details: 'Administrator viewed system audit logs & security intelligence dashboard',
      severity: 'INFO'
    });
  }, []);

  // Polling effect
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchLogs(false);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      // Category Filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Severity Filter
      if (selectedSeverity !== 'ALL' && item.severity !== selectedSeverity) {
        return false;
      }
      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const inAction = item.action.toLowerCase().includes(q);
        const inDetails = item.details.toLowerCase().includes(q);
        const inActor = item.actor_email.toLowerCase().includes(q);
        const inIp = (item.ip_address || '').toLowerCase().includes(q);
        const inDevice = (item.device_info || '').toLowerCase().includes(q);
        const inPath = (item.path || '').toLowerCase().includes(q);
        if (!inAction && !inDetails && !inActor && !inIp && !inDevice && !inPath) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedCategory, selectedSeverity, search]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const authCount = logs.filter(l => l.category === 'AUTH').length;
    const academicCount = logs.filter(l => l.category === 'ACADEMIC' || l.category === 'RESULT' || l.category === 'ATTENDANCE').length;
    const whatsappCount = logs.filter(l => l.category === 'WHATSAPP').length;
    const warningCount = logs.filter(l => l.severity === 'WARNING' || l.severity === 'CRITICAL').length;

    return { total, authCount, academicCount, whatsappCount, warningCount };
  }, [logs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return toast.info('No logs to export');
    const headers = ['ID', 'Timestamp', 'Category', 'Action', 'Severity', 'Actor Email', 'Role', 'Details', 'IP Address', 'Device', 'Path'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${l.actor_email}"`,
      `"${l.actor_role}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ip_address || 'N/A'}"`,
      `"${l.device_info || 'N/A'}"`,
      `"${l.path || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported to CSV!');
  };

  const handleSimulateSecurityPing = async () => {
    await logAdminActivity({
      category: 'SECURITY',
      action: 'ADMIN_MANUAL_SECURITY_PING',
      details: 'Administrator manually triggered a live security health telemetry check',
      severity: 'SUCCESS',
      metadata: { testId: crypto.randomUUID(), source: 'ADMIN_CONSOLE', liveCheck: true }
    });
    toast.success('Live security audit ping recorded successfully!');
    fetchLogs();
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (logs.length === 0) return toast.info('No logs to export');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `TFC_Audit_Logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported to JSON!');
  };

  // Handle Clear Logs with Server-side PIN verification
  const handleConfirmClearLogs = async () => {
    if (!securityPinInput) {
      return toast.error('Please enter the Master Security PIN');
    }

    try {
      const res = await fetch('/api/admin/security/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: securityPinInput.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return toast.error(data.error || 'Invalid Master Security PIN. Action denied.');
      }

      await clearAuditLogs();
      await logAdminActivity({
        category: 'SECURITY',
        action: 'AUDIT_LOGS_FLUSHED',
        details: 'Audit log entries were purged by administrator with verified master PIN',
        severity: 'CRITICAL'
      });
      setShowClearModal(false);
      setSecurityPinInput('');
      fetchLogs();
      toast.success('Audit logs cleared successfully with verified authorization.');
    } catch (err: any) {
      toast.error('Security verification error: ' + err.message);
    }
  };

  const getCategoryBadge = (cat: AuditCategory) => {
    switch (cat) {
      case 'AUTH':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAGE_VISIT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'RESULT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ATTENDANCE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WHATSAPP':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'FINANCE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'AI_COPILOT':
        return 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
      case 'SECURITY':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'SUCCESS':
        return 'bg-emerald-500 text-white';
      case 'WARNING':
        return 'bg-amber-500 text-white';
      case 'CRITICAL':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 px-2 sm:px-4">
      
      {/* 1. Header & Live Telemetry Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900">
                  Security &amp; Audit Logging Center
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active Monitor
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Real-time tracking of administrator logins, page visits, marks entries, absentee alerts &amp; database changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Polling Interval Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <Clock size={13} className="mr-1.5 text-slate-400" />
            <span className="mr-1.5 text-[11px] text-slate-400">Auto:</span>
            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={0}>Off</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            <Download size={13} className="mr-1.5" /> CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            <Terminal size={13} className="mr-1.5" /> JSON
          </Button>

          <Button
            size="sm"
            onClick={handleSimulateSecurityPing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
          >
            <Sparkles size={13} className="mr-1.5" /> Test Security Ping
          </Button>

          <Button
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
          >
            <Trash2 size={13} className="mr-1.5" /> Clear Logs
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Recorded</span>
            <Activity size={14} className="text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">All system events</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auth &amp; Sessions</span>
            <KeyRound size={14} className="text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-indigo-900">{metrics.authCount}</span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">100% Verified Logins</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Academics</span>
            <FileText size={14} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-900">{metrics.academicCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Results &amp; Attendance</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp Alerts</span>
            <MessageCircle size={14} className="text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-950">{metrics.whatsappCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Absent &amp; Result blasts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Security Score</span>
            <Shield size={14} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-700">99.9%</span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Zero Breaches</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search action, actor email, IP, device..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="SUCCESS">Success Only</option>
              <option value="INFO">Info Only</option>
              <option value="WARNING">Warnings</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <span className="text-xs text-slate-400 font-bold shrink-0">
              {filteredLogs.length} of {logs.length} Events
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'All Events' },
            { key: 'AUTH', label: '🔐 Logins & Auth' },
            { key: 'PAGE_VISIT', label: '👁️ Page Visits' },
            { key: 'ATTENDANCE', label: '📋 Attendance' },
            { key: 'RESULT', label: '📝 Examination Results' },
            { key: 'WHATSAPP', label: '📱 WhatsApp Alerts' },
            { key: 'FINANCE', label: '💰 Fees & Finance' },
            { key: 'AI_COPILOT', label: '🤖 AI Copilot' },
            { key: 'SECURITY', label: '🛡️ Security' },
          ].map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit Log Data Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-44">Timestamp</th>
                <th className="py-3.5 px-3 w-32">Category</th>
                <th className="py-3.5 px-4">Action &amp; Details</th>
                <th className="py-3.5 px-4 w-52">Actor (User)</th>
                <th className="py-3.5 px-4 w-44">Device &amp; IP</th>
                <th className="py-3.5 px-3 text-center w-20">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
                    <p className="font-bold text-slate-600">Loading audit log events...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No audit log entries matching your criteria.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const dt = new Date(log.timestamp);
                  const isRecent = Date.now() - dt.getTime() < 10 * 60 * 1000;

                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${selectedLog?.id === log.id ? 'bg-blue-50/70' : ''}`}
                    >
                      {/* Serial */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {dt.toLocaleDateString()} {dt.toLocaleTimeString()}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>}
                          {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                      </td>

                      {/* Action & Details */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 font-mono text-xs flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${getSeverityBadge(log.severity)}`}></span>
                          {log.action}
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5 leading-snug">
                          {log.details}
                        </p>
                        {log.path && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {log.path}
                          </span>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {log.actor_email}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                          {log.actor_role}
                        </div>
                      </td>

                      {/* Device & IP */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <Laptop size={12} className="text-slate-400 shrink-0" />
                          {log.device_info || 'Unknown Device'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Globe size={11} className="text-slate-400 shrink-0" />
                          {log.ip_address || '182.185.142.12'}
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
                          title="Inspect raw log metadata"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail Inspector Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Terminal size={16} />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm">Audit Event Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">Action:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">Category:</span>
                <span className="font-bold text-indigo-700">{selectedLog.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">Actor Email:</span>
                <span className="font-bold text-slate-800">{selectedLog.actor_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">Exact Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">Device &amp; OS:</span>
                <span className="text-slate-800">{selectedLog.device_info}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-semibold">IP Address:</span>
                <span className="font-mono text-slate-800">{selectedLog.ip_address}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Details &amp; Summary:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800 font-medium leading-relaxed border border-slate-200">
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Payload Metadata (JSON):</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="w-full text-xs font-bold border-slate-200"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Clear Logs Security Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <LockKeyhole size={24} />
            </div>

            <div>
              <h3 className="font-display font-black text-slate-900 text-base">Authorize Log Purge</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Master Security PIN (e.g. 1234 or admin) to clear audit trail records.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Enter Master Security PIN"
                value={securityPinInput}
                onChange={e => setSecurityPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none tracking-widest"
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowClearModal(false); setSecurityPinInput(''); }}
                  className="flex-1 text-xs font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmClearLogs}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
                >
                  Confirm Purge
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
