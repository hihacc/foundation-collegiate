'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  HardDrive, 
  FileText,
  Mail,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

interface BackupLog {
  id: string;
  filename: string;
  file_size: string;
  total_records: number;
  trigger_type: string;
  status: string;
  created_at: string;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>('');
  
  // 1-minute timer settings for local testing
  const [timerIntervalSec, setTimerIntervalSec] = useState<number>(60); // 1 minute default
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [isAutoTimerRunning, setIsAutoTimerRunning] = useState<boolean>(true);

  // Load existing backup logs
  useEffect(() => {
    const fetchBackupLogs = () => {
      setLoading(true);
      try {
        const localLogs = getStoredData<BackupLog[]>('backup_vault_logs', [
          {
            id: 'b-init-1',
            filename: 'TFC-Backup-Snapshot-2026.json',
            file_size: '248.50 KB',
            total_records: 48,
            trigger_type: 'Hourly Auto Cron',
            status: 'Completed',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
        setBackups(localLogs);
        if (localLogs.length > 0) setLastBackupTime(localLogs[0].created_at);
      } catch {
        setBackups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBackupLogs();
  }, []);

  // 1-minute countdown and auto-execution ticker
  useEffect(() => {
    if (!isAutoTimerRunning) return;

    const ticker = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          console.log('[1-Min Auto Backup] Triggering automated snapshot...');
          handleGenerateBackup(true);
          return timerIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [isAutoTimerRunning, timerIntervalSec]);

  const handleGenerateBackup = async (isBackground = false) => {
    if (!isBackground) setGenerating(true);
    const toastId = !isBackground ? toast.loading('Generating snapshot and emailing to recipients...') : undefined;

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        const newLog: BackupLog = {
          id: crypto.randomUUID(),
          filename: data.filename,
          file_size: data.file_size,
          total_records: data.total_records,
          trigger_type: isBackground ? `Auto Timer (${timerIntervalSec === 60 ? '1 Min' : '1 Hour'})` : 'Manual Admin Trigger',
          status: 'Completed',
          created_at: data.timestamp
        };

        const updated = [newLog, ...backups];
        setBackups(updated);
        setStoredData('backup_vault_logs', updated);
        setLastBackupTime(data.timestamp);

        // Reset countdown timer
        setSecondsLeft(timerIntervalSec);

        // Notification
        if (isBackground) {
          toast.success(`⚡ 1-Minute Automated Backup Snapshot emailed to foundationcollegiate@gmail.com & hihacc36@gmail.com! (${data.file_size})`);
        } else {
          const blob = new Blob([JSON.stringify(data.backup_data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);

          toast.success(`Backup created & emailed to foundationcollegiate@gmail.com & hihacc36@gmail.com!`, { id: toastId });
        }
      } else {
        if (!isBackground) toast.error('Failed to generate backup: ' + (data.error || 'Server error'), { id: toastId });
      }
    } catch (err: any) {
      if (!isBackground) toast.error('Backup error: ' + err.message, { id: toastId });
    } finally {
      if (!isBackground) setGenerating(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.tables || !parsed.meta) {
          throw new Error('Invalid TFC backup format. Missing metadata or tables block.');
        }

        if (!confirm(`Are you sure you want to restore database from "${file.name}"? This will overwrite existing records with backup data.`)) {
          return;
        }

        setRestoring(true);
        const toastId = toast.loading('Restoring database tables...');

        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup_data: parsed })
        });

        const resData = await res.json();
        if (resData.success) {
          toast.success('Database successfully restored from backup file!', { id: toastId });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error('Restore failed: ' + (resData.error || 'Unknown error'), { id: toastId });
        }
      } catch (err: any) {
        toast.error('Failed to process backup file: ' + err.message);
      } finally {
        setRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-blue-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-400" />
              Automated Cloud Backups Active
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Database Backup &amp; Email Vault
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automated full JSON snapshots of all 19 database tables are emailed directly to your admin email addresses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleGenerateBackup(false)}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
            >
              <Send size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Generating & Emailing...' : 'Generate & Email Backup Now'}
            </button>

            <label className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl transition-all backdrop-blur-sm cursor-pointer text-xs sm:text-sm">
              <Upload size={16} className={restoring ? 'animate-spin' : ''} />
              {restoring ? 'Restoring...' : 'Restore from JSON File'}
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                disabled={restoring}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 1-Minute Local Auto-Timer Live Controller Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAutoTimerRunning ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isAutoTimerRunning ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              {timerIntervalSec === 60 ? '⚡ 1-Minute Local Test Timer Active' : 'Automated Hourly Timer Active'}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Next automated email snapshot in:{' '}
            <span className="font-mono text-xl text-blue-700 font-extrabold">{secondsLeft}s</span>
          </p>
          <p className="text-xs text-slate-500">
            Dispatches full snapshot to <strong className="text-slate-700">foundationcollegiate@gmail.com</strong> &amp; <strong className="text-slate-700">hihacc36@gmail.com</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={timerIntervalSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTimerIntervalSec(val);
              setSecondsLeft(val);
            }}
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs outline-none cursor-pointer"
          >
            <option value={60}>⚡ 1 Minute (Local Test Mode)</option>
            <option value={120}>2 Minutes</option>
            <option value={300}>5 Minutes</option>
            <option value={3600}>60 Minutes (Standard Production)</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAutoTimerRunning(!isAutoTimerRunning)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isAutoTimerRunning
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isAutoTimerRunning ? '⏸ Pause Timer' : '▶ Resume 1-Min Timer'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Delivery Interval</span>
            <Mail size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={18} /> {timerIntervalSec === 60 ? 'Every 1 Minute' : 'Every 60 Minutes'}
          </div>
          <p className="text-xs text-slate-500 mt-1">24/7 Automated email dispatch</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Snapshot</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lastBackupTime ? new Date(lastBackupTime).toLocaleDateString('en-PK') : 'Session 2026'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vault Snapshots</span>
            <HardDrive size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{backups.length} Snapshots</div>
          <p className="text-xs text-slate-500 mt-1">Ready for 1-click download &amp; restore</p>
        </div>
      </div>

      {/* Connected Recipients Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
            <Mail size={22} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Automated Hourly Backup Recipients</h2>
            <p className="text-xs text-slate-500">Every hourly backup snapshot is automatically attached and emailed to these addresses:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Primary Admin Email</span>
                <span className="text-sm font-bold font-mono text-slate-800">foundationcollegiate@gmail.com</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Connected</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">2</div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Secondary Admin Email</span>
                <span className="text-sm font-bold font-mono text-slate-800">hihacc36@gmail.com</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Connected</span>
          </div>
        </div>
      </div>

      {/* Backup History Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" /> Hourly Backup Vault History
            </h2>
            <p className="text-xs text-slate-400">Chronological logs of all generated database snapshots</p>
          </div>
          <button
            onClick={() => handleGenerateBackup(false)}
            disabled={generating}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={generating ? 'animate-spin' : ''} /> Refresh Vault
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4">Snapshot Filename</th>
                <th className="py-3.5 px-4">Trigger Mode</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Records</th>
                <th className="py-3.5 px-4">Created Timestamp</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">Loading backup vault...</td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No backups generated yet. Click &quot;Generate &amp; Email Backup Now&quot; above to create your first snapshot.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 flex items-center gap-2">
                      <FileText size={15} className="text-slate-400 shrink-0" /> {b.filename}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{b.trigger_type || 'Hourly Cron'}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{b.file_size}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">{b.total_records} rows</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(b.created_at).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px] uppercase">
                        ✓ EMAILED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href="/api/backup?download=true"
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download size={12} /> Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
