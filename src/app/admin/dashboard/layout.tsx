'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, FileText, Users, Image as ImageIcon, MessageSquare, Bell,
  Download, BookOpen, LogOut, Menu, X, Home, ExternalLink, Trophy,
  Settings, BarChart3, UserCog, ClipboardList, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Banknote, Receipt, Wallet, Mail, SlidersHorizontal, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard',         href: '/admin/dashboard',             icon: LayoutDashboard },
  
  // Fee Management Module
  { name: 'Fee Dashboard',     href: '/admin/dashboard/fees',        icon: Banknote,      isFee: true },
  { name: 'Fee Structures',    href: '/admin/dashboard/fees/structures', icon: BookOpen,   isFee: true },
  { name: 'Student Fees',      href: '/admin/dashboard/fees/students',   icon: Users,      isFee: true },
  { name: 'Fee Challans',      href: '/admin/dashboard/fees/challans',   icon: Receipt,    isFee: true },
  { name: 'Payments',          href: '/admin/dashboard/fees/payments',   icon: Wallet,     isFee: true },
  
  { name: 'Top Achievers',     href: '/admin/dashboard/achievers',   icon: Trophy },
  { name: 'Results',           href: '/admin/dashboard/results',     icon: FileText },
  { name: 'Attendance',        href: '/admin/dashboard/attendance',  icon: UserCheck },
  { name: 'Admissions',        href: '/admin/dashboard/admissions',  icon: ClipboardList },
  { name: 'Academic Classes',  href: '/admin/dashboard/academics/classes', icon: BookOpen },
  { name: 'Academic Groups',   href: '/admin/dashboard/academics/groups',  icon: Users },
  { name: 'Academic Subjects', href: '/admin/dashboard/academics/subjects',icon: FileText },
  { name: 'Students',          href: '/admin/dashboard/students',    icon: Users },
  { name: 'Teachers',          href: '/admin/dashboard/teachers',    icon: UserCog },
  { name: 'Gallery',           href: '/admin/dashboard/gallery',     icon: ImageIcon },
  { name: 'Messages',          href: '/admin/dashboard/messages',    icon: MessageSquare },
  { name: 'Notices',           href: '/admin/dashboard/notices',     icon: Bell },
  { name: 'Downloads',         href: '/admin/dashboard/downloads',   icon: Download },
  { name: 'Courses & Diplomas',href: '/admin/dashboard/courses',     icon: BookOpen },
  { name: 'Analytics',         href: '/admin/dashboard/analytics',   icon: BarChart3 },
  { name: 'Email Control',     href: '/admin/dashboard/email-control', icon: Mail, isControl: true },
  { name: 'Settings',          href: '/admin/dashboard/settings',    icon: Settings },
];

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
    };
    fetchCounts();
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

  const renderSidebarContent = (collapsed: boolean) => (
    <>
      {/* Logo & Toggle Header */}
      <div className={cn(
        'flex items-center justify-between h-16 px-4 border-b border-slate-100 shrink-0',
        collapsed ? 'justify-center px-2' : ''
      )}>
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl shadow-md bg-blue-600 text-white flex items-center justify-center font-bold">
            TFC
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="font-bold text-slate-800 text-sm leading-tight">TFC Admin</div>
              <div className="text-[11px] text-slate-400 font-medium">Control Panel</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setSidebarOpen(false)}
            title="Collapse Sidebar"
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5 px-2">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "Go to Main Website" : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-all mb-3',
            collapsed ? 'justify-center px-2' : ''
          )}
        >
          <Home size={18} className="shrink-0 text-emerald-600" />
          {!collapsed && (
            <>
              <span className="whitespace-nowrap flex-1">Go to Main Website</span>
              <ExternalLink size={14} className="opacity-70" />
            </>
          )}
        </Link>

        {navItems.map((item, index) => {
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
          
          let badge = null;
          if (item.name === 'Messages' && unreadMessages > 0) {
            badge = unreadMessages;
          }
          if (item.name === 'Admissions' && pendingAdmissions > 0) {
            badge = pendingAdmissions;
          }

          return (
            <div key={item.name}>
              {index === 1 && !collapsed && (
                <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Management</div>
              )}
              {index === 6 && !collapsed && (
                <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academics & Operations</div>
              )}
              <Link
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  item.isFee && !active && 'hover:text-emerald-700 hover:bg-emerald-50'
                )}
              >
                <div className="relative">
                  <item.icon size={18} className="shrink-0" />
                  {collapsed && badge !== null && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-white" />
                  )}
                </div>
                
                {!collapsed && (
                  <>
                    <span className="whitespace-nowrap flex-1">{item.name}</span>
                    {badge !== null && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        active ? "bg-white text-blue-600" : "bg-red-500 text-white"
                      )}>
                        {badge}
                      </span>
                    )}
                    {active && badge === null && <ChevronRight size={14} className="opacity-70" />}
                  </>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex light" style={{ colorScheme: 'light' }}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen transition-all duration-300 z-30 shadow-sm',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        {renderSidebarContent(!sidebarOpen)}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative bg-white w-64 max-w-full h-full flex flex-col z-10 shadow-2xl">
            <div className="absolute right-3 top-3 z-20 md:hidden">
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
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
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className="hidden md:flex p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <Menu size={20} />
            </button>
            
            <span className="font-bold text-slate-800 text-sm hidden sm:inline-block">The Foundation Collegiate Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            >
              <span>Search modules or pages...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono font-bold border border-slate-300 text-slate-600 shadow-2xs">Ctrl K</kbd>
            </button>

            {liveTime && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{liveTime}</span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-xs"
            >
              <Home size={14} className="text-emerald-600" />
              <span>Go to Website</span>
              <ExternalLink size={12} className="opacity-70 hidden sm:inline-block" />
            </Link>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800">Admin User</div>
              <div className="text-[11px] text-slate-400">{user?.email || 'admin@foundationcollegiate.com'}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Command Launcher Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span>Quick Admin Command Launcher</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500">ESC to close</kbd>
              </div>
              <button onClick={() => setSearchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Type to filter modules (e.g., fees, students, attendance, notices)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {navItems
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
