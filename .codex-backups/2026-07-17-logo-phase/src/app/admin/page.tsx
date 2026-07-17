'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Lock, Mail, GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login successful! Redirecting...');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error('Login failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 hero-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4 shadow-2xl shadow-primary/30">
            <GraduationCap className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-white/50 text-sm">The Foundation Collegiate</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Sign in to continue</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-white/70">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@foundationcollegiate.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-white/70">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-3 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Unauthorized access is strictly prohibited
        </p>
      </div>
    </div>
  );
}
