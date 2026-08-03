'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/lib/auth-context';
import { useSubscriptionStatus } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Building2, LogOut, ShieldCheck, ChevronDown, AlertTriangle, Key } from 'lucide-react';

export function TopBar() {
  const { user, currentOrgId, organizations, setCurrentOrgId, logout } = useAuthContext();
  const { statusInfo } = useSubscriptionStatus(currentOrgId || undefined);
  const toast = useToast();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];
  const isSuperAdmin = user?.is_platform_admin || user?.email === 'admin@showroomos.com';

  const daysRemaining = statusInfo?.daysRemaining;
  const showExpirationWarning = typeof daysRemaining === 'number' && daysRemaining <= 7 && daysRemaining >= 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    try {
      await apiClient.patch('/auth/password', { password: newPassword });
      toast.success('Password Updated', 'Your password has been changed successfully.');
      setShowChangePassword(false);
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || err?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Organization Switcher & Status Warning */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <select
            className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-2"
            value={currentOrgId || ''}
            onChange={(e) => setCurrentOrgId(e.target.value)}
          >
            {organizations.length === 0 && (
              <option value="" className="bg-slate-900 text-white">
                Platform Administration
              </option>
            )}
            {organizations.map((org) => (
              <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                {org.display_name || org.name} ({org.slug})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {showExpirationWarning && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Your {statusInfo?.isTrial ? 'free trial' : 'subscription'} expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}. Contact administrator to renew.
          </div>
        )}

        {isSuperAdmin ? (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Platform Super Admin
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            PKR Launch Market
          </span>
        )}
      </div>

      {/* User Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
          <div className="w-9 h-9 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-white leading-tight">
              {user?.full_name || 'Admin User'}
            </div>
            <div className="text-xs text-slate-400">{user?.email || 'admin@showroomos.com'}</div>
          </div>
        </div>

        <button
          onClick={() => {
            setNewPassword('');
            setPasswordError('');
            setShowChangePassword(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all duration-150"
        >
          <Key className="w-4 h-4" />
          Change Password
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change My Password" size="md">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {passwordError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••••"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setShowChangePassword(false)}>Cancel</Button>
            <Button type="submit" loading={changingPassword}><Key className="w-4 h-4" /> Update</Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
