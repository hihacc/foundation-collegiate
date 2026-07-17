'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, FileText, Users, Image as ImageIcon, MessageSquare, Bell,
  Download, BookOpen, LogOut, Menu, X,
  Settings, BarChart3, UserCog, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Results', href: '/admin/dashboard/results', icon: FileText },
  { name: 'Admissions', href: '/admin/dashboard/admissions', icon: ClipboardList },
  { name: 'Students', href: '/admin/dashboard/students', icon: Users },
  { name: 'Teachers', href: '/admin/dashboard/teachers', icon: UserCog },
  { name: 'Gallery', href: '/admin/dashboard/gallery', icon: ImageIcon },
  { name: 'Messages', href: '/admin/dashboard/messages', icon: MessageSquare },
  { name: 'Notices', href: '/admin/dashboard/notices', icon: Bell },
  { name: 'Downloads', href: '/admin/dashboard/downloads', icon: Download },
  { name: 'Courses', href: '/admin/dashboard/courses', icon: BookOpen },
  { name: 'Analytics', href: '/admin/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/admin'); return; }
      setUser(data.user);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/admin');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-800 shrink-0">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white">
            <Image src="/foundation-logo.png" alt="The Foundation Collegiate" fill sizes="32px" className="object-cover" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="font-bold text-white text-sm">TFC Admin</div>
              <div className="text-xs text-slate-400">Control Panel</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!sidebarOpen ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all',
                  active ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <item.icon size={20} className="shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.email ?? 'Admin'}</div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <button onClick={handleLogout} title="Logout" className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Logout" className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors mx-auto">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        <header className="h-16 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 flex items-center gap-4 px-6 shrink-0 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
