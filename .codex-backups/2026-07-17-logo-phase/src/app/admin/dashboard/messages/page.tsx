'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Eye, Trash2, Search, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils/grades';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
    fetch();
  };

  const deleteMsg = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('messages').delete().eq('id', id);
    toast.success('Message deleted');
    if (selected?.id === id) setSelected(null);
    fetch();
  };

  const filtered = messages.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search) ||
    m.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Messages</h1>
        <p className="text-slate-400 text-sm mt-1">{messages.filter(m => !m.is_read).length} unread messages</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No messages</div>
          ) : filtered.map(msg => (
            <div
              key={msg.id}
              onClick={() => { setSelected(msg); if (!msg.is_read) markRead(msg.id); }}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selected?.id === msg.id ? 'border-primary bg-primary/10' :
                !msg.is_read ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-white text-sm truncate">{msg.name}</div>
                {!msg.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{msg.phone}</div>
              <div className="text-xs text-slate-500 mt-2 truncate">{msg.message}</div>
              <div className="text-xs text-slate-600 mt-1">{formatRelativeTime(msg.created_at)}</div>
            </div>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-20">
              <Eye size={48} className="mb-3 opacity-20" />
              <p>Select a message to read</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-slate-400 text-sm">{selected.phone} {selected.email ? `· ${selected.email}` : ''}</p>
                  {selected.subject && <p className="text-primary font-medium mt-1">Re: {selected.subject}</p>}
                </div>
                <div className="flex gap-2">
                  {!selected.is_read && (
                    <button onClick={() => markRead(selected.id)} className="w-9 h-9 bg-slate-800 hover:bg-green-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button onClick={() => deleteMsg(selected.id)} className="w-9 h-9 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 text-slate-200 leading-relaxed">
                {selected.message}
              </div>

              <div className="text-xs text-slate-600">Received: {new Date(selected.created_at).toLocaleString('en-PK')}</div>

              {/* Quick Reply via WhatsApp */}
              <a
                href={`https://wa.me/92${selected.phone.replace(/^0/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
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
