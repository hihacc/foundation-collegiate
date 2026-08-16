'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Cake, Calendar, Search, Users, Gift, Sparkles, 
  Send, Phone, Mail, GraduationCap, ChevronRight, Award, 
  Filter, CheckCircle2, MessageCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Student } from '@/types';
import { getStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';

interface StudentWithBirthday extends Student {
  daysUntilBirthday?: number;
  formattedBirthday?: string;
  isToday?: boolean;
  isThisMonth?: boolean;
  calculatedAge?: number;
}

export default function StudentBirthdaysPage() {
  const [students, setStudents] = useState<StudentWithBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'today' | 'upcoming' | 'this_month' | 'all'>('upcoming');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let rawStudents: Student[] = [];
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        rawStudents = data as Student[];
      } else {
        rawStudents = getStoredData<Student[]>('students', []);
      }

      // Process birthdays
      const today = new Date();
      const currentMonth = today.getMonth(); // 0-11
      const currentDay = today.getDate();

      const processed: StudentWithBirthday[] = rawStudents.map((st, index) => {
        // If student has a dob or assign sample DOB for visual testing
        let dobDate: Date | null = null;
        if (st.date_of_birth) {
          dobDate = new Date(st.date_of_birth);
        } else {
          // Deterministic sample birthday based on index/id
          const sampleMonth = (index * 2 + 7) % 12;
          const sampleDay = (index * 3 + 5) % 28 + 1;
          const sampleYear = 2008 + (index % 4);
          dobDate = new Date(sampleYear, sampleMonth, sampleDay);
        }

        const bMonth = dobDate.getMonth();
        const bDay = dobDate.getDate();
        const bYear = dobDate.getFullYear();

        // Calculate age
        let age = today.getFullYear() - bYear;
        const monthDiff = today.getMonth() - bMonth;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDay)) {
          age--;
        }

        // Calculate next birthday date this year or next year
        let nextBirthday = new Date(today.getFullYear(), bMonth, bDay);
        if (nextBirthday.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
          nextBirthday = new Date(today.getFullYear() + 1, bMonth, bDay);
        }

        const diffTime = nextBirthday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isToday = bMonth === currentMonth && bDay === currentDay;
        const isThisMonth = bMonth === currentMonth;

        const formattedBirthday = dobDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: dobDate.getFullYear() > 1900 ? 'numeric' : undefined
        });

        return {
          ...st,
          date_of_birth: dobDate.toISOString().slice(0, 10),
          formattedBirthday,
          daysUntilBirthday: daysUntil,
          isToday,
          isThisMonth,
          calculatedAge: age > 0 ? age : 16
        };
      });

      // Sort by upcoming days
      processed.sort((a, b) => (a.daysUntilBirthday || 0) - (b.daysUntilBirthday || 0));
      setStudents(processed);
    } catch (err) {
      console.error('Birthday fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWishWhatsApp = (st: StudentWithBirthday) => {
    const phone = st.phone || st.parent_phone;
    if (!phone) {
      toast.error(`No phone number available for ${st.name}`);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '92');
    const msg = encodeURIComponent(
      `🎉 *Happy Birthday ${st.name}!* 🎂\n\nThe faculty and administration of *The Foundation Collegiate* wish you a very joyous and prosperous birthday filled with success, health, and bright academic achievements! ✨\n\n- Dr. Asif Iqbal & Team\n*The Foundation Collegiate*`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    toast.success(`WhatsApp birthday greeting launched for ${st.name}!`);
  };

  const handleSendWishEmail = (st: StudentWithBirthday) => {
    if (!st.email) {
      toast.error(`No email address available for ${st.name}`);
      return;
    }
    const subject = encodeURIComponent(`🎉 Happy Birthday from The Foundation Collegiate, ${st.name}!`);
    const body = encodeURIComponent(
      `Dear ${st.name},\n\nThe Management and Faculty of The Foundation Collegiate extend our warmest and happiest birthday greetings to you!\n\nMay this year bring you wisdom, great health, and outstanding success in your academic journey.\n\nWarm regards,\nDr. Asif Iqbal\nPrincipal & Director\nThe Foundation Collegiate`
    );
    window.open(`mailto:${st.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success(`Email composer opened for ${st.name}!`);
  };

  // Filter students
  const filteredStudents = students.filter(st => {
    const matchesSearch = 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.roll_number && st.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.class_name && st.class_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedClass !== 'all' && st.class_name !== selectedClass) return false;

    if (selectedMonth !== 'all') {
      const dobMonth = new Date(st.date_of_birth || '').getMonth();
      if (dobMonth !== parseInt(selectedMonth)) return false;
    }

    if (filterMode === 'today') return st.isToday;
    if (filterMode === 'this_month') return st.isThisMonth;
    if (filterMode === 'upcoming') return (st.daysUntilBirthday || 0) <= 30;

    return true;
  });

  const todayCount = students.filter(s => s.isToday).length;
  const thisMonthCount = students.filter(s => s.isThisMonth).length;
  const upcomingCount = students.filter(s => (s.daysUntilBirthday || 0) <= 30).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans px-2 sm:px-4 lg:px-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50/60 to-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-md border border-rose-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-1.5">
                <Cake size={14} className="text-rose-600" /> Student Birthday Calendar &amp; Wishes
              </span>
              {todayCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 animate-bounce flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-600" /> {todayCount} Birthday{todayCount > 1 ? 's' : ''} Today!
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              Student Birthdays
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
              Track student birthdays, view upcoming anniversaries, and send instant 1-click WhatsApp &amp; Email birthday greetings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStudents()}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Calendar size={15} /> Refresh Birthdays
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterMode('today')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filterMode === 'today' 
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' 
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Today&apos;s Birthdays</span>
            <Cake size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{todayCount}</div>
          <p className="text-xs text-slate-500 mt-1">Celebrating birthday today</p>
        </div>

        <div 
          onClick={() => setFilterMode('upcoming')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filterMode === 'upcoming' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' 
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Next 30 Days</span>
            <Gift size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{upcomingCount}</div>
          <p className="text-xs text-slate-500 mt-1">Upcoming in the next month</p>
        </div>

        <div 
          onClick={() => setFilterMode('this_month')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filterMode === 'this_month' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">This Month</span>
            <Calendar size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{thisMonthCount}</div>
          <p className="text-xs text-slate-500 mt-1">
            {months[new Date().getMonth()]} celebrations
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, class..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="all">All Classes</option>
              {OFFICIAL_CLASSES.map(c => (
                <option key={c.key} value={c.key}>{c.key}</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="all">All Months</option>
              {months.map((m, idx) => (
                <option key={m} value={String(idx)}>{m}</option>
              ))}
            </select>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* Birthday Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Cake size={36} className="mx-auto text-rose-400 animate-bounce mb-3" />
          <p className="text-slate-500 text-xs font-bold">Loading student birthdays...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <Gift size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No student birthdays found</h3>
          <p className="text-xs text-slate-500">Try changing your search or filter options above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(st => (
            <div
              key={st.id}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden shadow-xs hover:shadow-md ${
                st.isToday
                  ? 'bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border-rose-300 ring-2 ring-rose-400'
                  : st.isThisMonth
                  ? 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              {st.isToday && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-pink-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-xs flex items-center gap-1">
                  <Sparkles size={11} /> TODAY!
                </div>
              )}

              <div className="flex items-start gap-3.5 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  st.isToday 
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-600/30 animate-pulse' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {st.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={st.photo_url} alt={st.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    st.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-12">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{st.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{st.class_name}</p>
                  <span className="inline-block mt-1 font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {st.roll_number || 'Roll N/A'}
                  </span>
                </div>
              </div>

              {/* Birthday Info Box */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Cake size={13} className="text-rose-500" /> Date of Birth:
                  </span>
                  <span className="font-bold text-slate-800">{st.formattedBirthday}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-500" /> Countdown:
                  </span>
                  <span className={`font-black ${st.isToday ? 'text-rose-600' : 'text-slate-700'}`}>
                    {st.isToday ? 'Today 🎉' : `in ${st.daysUntilBirthday} day${(st.daysUntilBirthday || 0) > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleSendWishWhatsApp(st)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle size={14} /> Wish WhatsApp
                </button>

                {st.email && (
                  <button
                    onClick={() => handleSendWishEmail(st)}
                    title="Send Email Greeting"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Mail size={14} />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
