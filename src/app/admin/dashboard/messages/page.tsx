'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Eye, Trash2, Search, CheckCheck, MessageSquare, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils/grades';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('contacts').update({ status: 'Read' }).eq('id', id);
    fetchMessages();
  };

  const markReplied = async (id: string) => {
    await supabase.from('contacts').update({ status: 'Replied' }).eq('id', id);
    fetchMessages();
  };

  const deleteMsg = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('contacts').delete().eq('id', id);
    toast.success('Message deleted');
    if (selected?.id === id) setSelected(null);
    fetchMessages();
  };

  const filtered = messages.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search) ||
    m.message?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter(m => m.status === 'Pending' || !m.status).length;

  const handleExport = () => {
    const headers = ['Name', 'Phone', 'Email', 'Subject', 'Message', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(m => 
        `"${m.name}","${m.phone}","${m.email || ''}","${m.subject || ''}","${m.message?.replace(/"/g, '""')}","${m.status || 'Pending'}","${new Date(m.created_at).toLocaleDateString()}"`
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contacts_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Messages & Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? (
              <span className="text-blue-600 font-semibold">{unreadCount} unread</span>
            ) : 'All messages read'} · {messages.length} total
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto hide-on-print">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="relative hide-on-print">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message List */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No messages found</div>
          ) : filtered.map(msg => (
            <button
              key={msg.id}
              onClick={() => { setSelected(msg); if (msg.status === 'Pending' || !msg.status) markRead(msg.id); }}
              className={`w-full text-left p-4 rounded-xl cursor-pointer transition-all border text-sm ${
                selected?.id === msg.id
                  ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                  : (msg.status === 'Pending' || !msg.status)
                  ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-700 truncate">{msg.name}</div>
                {(msg.status === 'Pending' || !msg.status) && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                {msg.status === 'Replied' && <CheckCheck size={14} className="text-emerald-500 mt-1 shrink-0" />}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{msg.phone}</div>
              <div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{msg.message}</div>
              <div className="text-xs text-slate-400 mt-1">{formatRelativeTime(msg.created_at)}</div>
            </button>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm min-h-[300px]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={24} className="opacity-40" />
              </div>
              <p className="font-medium text-sm">Select a message to read</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
                  {selected.subject && <p className="text-blue-600 font-medium text-sm mt-1">Re: {selected.subject}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {(selected.status === 'Pending' || !selected.status) && (
                    <button onClick={() => markRead(selected.id)}
                      title="Mark as Read"
                      className="w-9 h-9 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded-xl flex items-center justify-center transition-colors">
                      <CheckCheck size={15} />
                    </button>
                  )}
                  {selected.status !== 'Replied' && (
                    <button onClick={() => markReplied(selected.id)}
                      title="Mark as Replied"
                      className="w-9 h-9 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center transition-colors">
                      <MessageSquare size={15} />
                    </button>
                  )}
                  <button onClick={() => deleteMsg(selected.id)}
                    className="w-9 h-9 bg-red-50 hover:bg-red-600 hover:text-white text-red-500 border border-red-200 rounded-xl flex items-center justify-center transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 leading-relaxed text-sm">
                {selected.message}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Received: {new Date(selected.created_at).toLocaleString('en-PK')}</span>
                {selected.status === 'Replied' && <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCheck size={14}/> Replied</span>}
              </div>

              <a
                href={`https://wa.me/92${selected.phone?.replace(/^0/, '')}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => markReplied(selected.id)}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md shadow-emerald-500/20"
              >
                Reply via WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
