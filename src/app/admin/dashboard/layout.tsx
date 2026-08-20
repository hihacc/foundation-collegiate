'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, FileText, Users, Image as ImageIcon, MessageSquare, Bell,
  Download, BookOpen, LogOut, Menu, X, Home, ExternalLink, Trophy,
  Settings, BarChart3, UserCog, ClipboardList, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Banknote, Receipt, Wallet, Mail, SlidersHorizontal, UserCheck, HardDrive, Cake, Camera, Sparkles, ShieldCheck, MessageCircle, Lock,
  ClipboardCheck, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logAdminActivity } from '@/lib/utils/auditLogger';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badgeKey?: 'messages' | 'admissions';
  isAi?: boolean;
  isFee?: boolean;
  isHot?: boolean;
}

export interface NavGroup {
  category: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    category: 'Core & AI Intelligence',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: '🤖 AI Copilot & Data', href: '/admin/dashboard/ai-copilot', icon: Sparkles, isAi: true },
      { name: 'Analytics & Trends', href: '/admin/dashboard/analytics', icon: BarChart3 },
      { name: '🛡️ Audit & Activity Logs', href: '/admin/dashboard/logs', icon: ShieldCheck }
    ]
  },
  {
    category: 'Admissions & Inquiries',
    items: [
      { name: 'Inquiry Register', href: '/admin/dashboard/inquiries', icon: ClipboardCheck, isHot: true },
      { name: 'Admissions Desk', href: '/admin/dashboard/admissions', icon: ClipboardList, badgeKey: 'admissions' },
      { name: 'Scan Paper Forms', href: '/admin/dashboard/students/scanner', icon: Camera }
    ]
  },
  {
    category: 'WhatsApp & Messaging',
    items: [
      { name: '💬 WhatsApp Live Inbox', href: '/admin/dashboard/whatsapp/inbox', icon: MessageSquare, isHot: true },
      { name: 'WhatsApp Hub & Broadcast', href: '/admin/dashboard/whatsapp', icon: MessageCircle },
      { name: 'Messages & Contacts', href: '/admin/dashboard/messages', icon: Users, badgeKey: 'messages' },
      { name: 'Notice Board', href: '/admin/dashboard/notices', icon: Bell },
      { name: 'Email Control', href: '/admin/dashboard/email-control', icon: Mail }
    ]
  },
  {
    category: 'Fee & Finance',
    items: [
      { name: 'Fee Dashboard', href: '/admin/dashboard/fees', icon: Banknote, isFee: true },
      { name: 'Fee Challans', href: '/admin/dashboard/fees/challans', icon: Receipt, isFee: true },
      { name: 'Fee Structures', href: '/admin/dashboard/fees/structures', icon: BookOpen, isFee: true },
      { name: 'Student Fees', href: '/admin/dashboard/fees/students', icon: Users, isFee: true },
      { name: 'Payments Register', href: '/admin/dashboard/fees/payments', icon: Wallet, isFee: true }
    ]
  },
  {
    category: 'Academics & Exams',
    items: [
      { name: 'Attendance Register', href: '/admin/dashboard/attendance', icon: UserCheck },
      { name: 'Exam Results', href: '/admin/dashboard/results', icon: FileText },
      { name: 'Top Achievers', href: '/admin/dashboard/achievers', icon: Trophy },
      { name: 'Academic Classes', href: '/admin/dashboard/academics/classes', icon: BookOpen },
      { name: 'Academic Groups', href: '/admin/dashboard/academics/groups', icon: Users },
      { name: 'Academic Subjects', href: '/admin/dashboard/academics/subjects', icon: FileText },
      { name: 'Courses & Diplomas', href: '/admin/dashboard/courses', icon: BookOpen },
      { name: 'Downloads & Docs', href: '/admin/dashboard/downloads', icon: Download }
    ]
  },
  {
    category: 'People & Directory',
    items: [
      { name: 'Students Roster', href: '/admin/dashboard/students', icon: Users },
      { name: '📋 G.R. Register Ledger', href: '/admin/dashboard/students/gr-register', icon: BookOpen, isHot: true },
      { name: 'Student Birthdays', href: '/admin/dashboard/students/birthdays', icon: Cake },
      { name: 'Faculty & Teachers', href: '/admin/dashboard/teachers', icon: UserCog }
    ]
  },
  {
    category: 'System & Security',
    items: [
      { name: 'Drive & Backups', href: '/admin/dashboard/backups', icon: HardDrive },
      { name: 'Security & Access', href: '/admin/dashboard/security', icon: Lock },
      { name: 'Photo Gallery', href: '/admin/dashboard/gallery', icon: ImageIcon },
      { name: 'System Settings', href: '/admin/dashboard/settings', icon: Settings }
    ]
  }
];

const allNavItems = navGroups.flatMap(g => g.items);

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>({ email: 'admin@foundationcollegiate.com' });
  
  // Quick Command Launcher & Live Clock State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveTime, setLiveTime] = useState<string>('');

  // Notification counts
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingAdmissions, setPendingAdmissions] = useState(0);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Fetch notifications safely with offline fallback
    const fetchCounts = async () => {
      try {
        const { count: msgCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
        if (msgCount !== null && msgCount !== undefined) setUnreadMessages(msgCount);
      } catch {}
      
      try {
        const { count: admCount } = await supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        if (admCount !== null && admCount !== undefined) setPendingAdmissions(admCount);
      } catch {}

      // Background WhatsApp sync on dashboard load
      try {
        fetch('/api/admin/whatsapp/sync', { method: 'POST' }).catch(() => {});
      } catch {}
    };
    fetchCounts();

    // Log page visits in audit trail
    if (pathname && pathname.startsWith('/admin')) {
      const pageTitle = allNavItems.find(n => n.href === pathname)?.name || pathname;
      logAdminActivity({
        category: 'PAGE_VISIT',
        action: 'ADMIN_ROUTE_TRANSITION',
        details: `Administrator accessed ${pageTitle}`,
        path: pathname,
        severity: 'INFO'
      });
    }
  }, [pathname]);

  useEffect(() => {
    // Verified session token check via localStorage or Supabase Auth
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('tfc_admin_session');
      const localExpiry = localStorage.getItem('tfc_session_expires');
      const localEmail = localStorage.getItem('tfc_admin_email');

      if (localToken === 'true' && localExpiry && Date.now() < Number(localExpiry)) {
        setUser({ email: localEmail || 'admin@foundationcollegiate.com' });
        return;
      }
    }

    supabase.auth.getUser().then((res: any) => {
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        router.replace('/admin');
      }
    }).catch(() => {
      router.replace('/admin');
    });
  }, [router]);

  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tfc_admin_session');
    }
    await supabase.auth.signOut().catch(() => {});
    toast.success('Logged out successfully');
    router.push('/admin');
  };

  // Find active group & active item for breadcrumb
  const currentItem = allNavItems.find(item => item.href === pathname || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href)));
  const currentGroup = navGroups.find(g => g.items.some(i => i.href === pathname || (i.href !== '/admin/dashboard' && pathname?.startsWith(i.href))));

  const renderSidebarContent = (collapsed: boolean) => (
    <>
      {/* Logo & Toggle Header */}
      <div className={cn(
        'flex items-center justify-between h-16 px-4 border-b border-slate-100 shrink-0',
        collapsed ? 'justify-center px-2' : ''
      )}>
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 rounded-2xl p-1 bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
            <Image 
              src="/foundation-logo.png" 
              alt="The Foundation Collegiate Logo" 
              width={36} 
              height={36} 
              priority
              className="w-full h-full object-contain" 
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="font-display font-black text-slate-900 text-sm leading-tight tracking-tight">The Foundation</div>
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Collegiate Admin</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setSidebarOpen(false)}
            title="Collapse Sidebar"
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-4 px-2 custom-scrollbar">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "Go to Main Website" : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/80 transition-all shadow-2xs',
            collapsed ? 'justify-center px-2' : ''
          )}
        >
          <Home size={16} className="shrink-0 text-emerald-600" />
          {!collapsed && (
            <>
              <span className="whitespace-nowrap flex-1">Public Website</span>
              <ExternalLink size={13} className="opacity-70" />
            </>
          )}
        </Link>

        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {group.category}
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
              
              let badge = null;
              if (item.badgeKey === 'messages' && unreadMessages > 0) badge = unreadMessages;
              if (item.badgeKey === 'admissions' && pendingAdmissions > 0) badge = pendingAdmissions;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                    collapsed ? 'justify-center px-2' : '',
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                    item.isAi && !active && 'text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-100',
                    item.isHot && !active && 'hover:text-emerald-700 hover:bg-emerald-50/60'
                  )}
                >
                  <div className="relative">
                    <item.icon size={16} className="shrink-0" />
                    {collapsed && badge !== null && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-white" />
                    )}
                  </div>
                  
                  {!collapsed && (
                    <>
                      <span className="whitespace-nowrap flex-1 truncate">{item.name}</span>
                      {badge !== null && (
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          active ? "bg-white text-blue-600" : "bg-red-500 text-white"
                        )}>
                          {badge}
                        </span>
                      )}
                      {active && badge === null && <ChevronRight size={13} className="opacity-70" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0 space-y-2 bg-slate-50/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              A
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Administrator</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Session
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout Session</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex light antialiased" style={{ colorScheme: 'light' }}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen transition-all duration-200 z-30 shadow-xs shrink-0',
        sidebarOpen ? 'w-64' : 'w-18'
      )}>
        {renderSidebarContent(!sidebarOpen)}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative bg-white w-72 max-w-[85vw] h-full flex flex-col z-10 shadow-2xl">
            <div className="absolute right-3 top-3 z-20 md:hidden">
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className="hidden md:flex p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            </button>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-slate-900 tracking-tight hidden sm:inline">TFC Portal</span>
              {currentGroup && (
                <>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <span className="text-slate-400 font-bold hidden md:inline">{currentGroup.category}</span>
                </>
              )}
              {currentItem && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {currentItem.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Search modules...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono font-bold border border-slate-300 text-slate-600 shadow-2xs">Ctrl K</kbd>
            </button>

            {/* WhatsApp Socket Live Pill */}
            <Link
              href="/admin/dashboard/whatsapp/inbox"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all shadow-2xs"
              title="View WhatsApp Live Inbox"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp Live: +92 333 3439458</span>
            </Link>

            {liveTime && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold shadow-2xs">
                <Clock size={13} className="text-slate-500" />
                <span>{liveTime}</span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-2xs"
            >
              <Home size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Website</span>
              <ExternalLink size={11} className="opacity-70" />
            </Link>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>

      {/* Global Command Launcher Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span>Quick Admin Command Launcher</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500">ESC</kbd>
              </div>
              <button onClick={() => setSearchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search all 33+ portal modules (e.g. fees, whatsapp, inquiries, marks)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {allNavItems
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.href.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSearchModalOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={16} className="text-blue-600" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
