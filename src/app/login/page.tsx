'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { Building2, Eye, EyeOff, Loader2, ArrowRight, Shield, AlertCircle, Lock } from 'lucide-react';

function LoginForm() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [deactivatedMsg, setDeactivatedMsg] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get('reason');
    const expired = searchParams.get('expired');
    const storedMsg = typeof window !== 'undefined' ? sessionStorage.getItem('deactivation_message') : null;

    if (reason || storedMsg) {
      const msg = storedMsg || 'Your account is deactivated because your trial or subscription has expired. Please contact the administrator.';
      setDeactivatedMsg(msg);
      toast.error('Account Deactivated', msg);
      if (typeof window !== 'undefined') sessionStorage.removeItem('deactivation_message');
    } else if (expired === 'true') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSessionExpired(false);
    setDeactivatedMsg('');
    setLoading(true);

    try {
      const response: any = await apiClient.post('/auth/login', { email, password });
      const { access_token, refresh_token, user, organizations } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('current_user', JSON.stringify(user));
      localStorage.setItem('current_orgs', JSON.stringify(organizations || []));

      if (organizations && organizations.length > 0) {
        localStorage.setItem('current_org_id', organizations[0].id);
      }

      toast.success('Sign In Successful', `Welcome back, ${user.full_name || user.email}`);
      router.push('/dashboard');
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email or password. Please try again.';
      setError(errMsg);
      toast.error('Authentication Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-sm text-slate-400">
          Sign in to your dealership management console
        </p>
      </div>

      {deactivatedMsg && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold space-y-1">
          <div className="flex items-center gap-2 text-rose-300 font-bold uppercase tracking-wider text-[11px]">
            <Lock className="w-4 h-4 text-rose-400" /> Account Deactivated
          </div>
          <p>{deactivatedMsg}</p>
        </div>
      )}

      {sessionExpired && !deactivatedMsg && (
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Your session expired. Please sign in again to continue.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-sm"
            placeholder="admin@showroomos.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-sm"
              placeholder="••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5" />
        Secured with JWT + Row-Level Security
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Brand Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-2xl shadow-indigo-500/40 mb-5">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">ShowroomOS</h1>
          <p className="text-slate-400 text-sm">Multi-Tenant Automobile Dealership SaaS</p>
        </div>

        <Suspense fallback={<div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  );
}
