'use client';

import React, { useState } from 'react';
import { useMe, useUsers } from '@/lib/use-swr-hooks';
import { useAuthContext } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { Shield, UserPlus, UserCheck, Key, Building2 } from 'lucide-react';

export default function ShowroomUsersPage() {
  const toast = useToast();
  const { user: me } = useMe();
  const { currentOrgId, organizations } = useAuthContext();
  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];
  const effectiveOrgId = currentOrgId || currentOrg?.id;

  const { users: staffMembers, isLoading, mutate } = useUsers(effectiveOrgId);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'salesperson',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrgId = effectiveOrgId;
    if (!targetOrgId) {
      setError('Please select an active showroom organization');
      return;
    }
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post(`/organizations/${targetOrgId}/users`, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      });

      const successMsg = `User "${form.fullName}" (${form.email}) created successfully for ${currentOrg?.display_name || currentOrg?.name || 'Showroom'}!`;
      setSuccess(successMsg);
      toast.success('Staff User Created', successMsg);
      setShowCreate(false);
      setForm({ fullName: '', email: '', password: '', phone: '', role: 'salesperson' });
      mutate();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to create showroom staff user';
      setError(errMsg);
      toast.error('Creation Failed', errMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeUserId) return;
    
    const targetOrgId = effectiveOrgId;
    if (!targetOrgId) {
      setError('Please select an active showroom organization');
      return;
    }

    setPasswordChanging(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.patch(`/organizations/${targetOrgId}/users/${passwordChangeUserId}/password`, {
        password: newPassword,
      });

      const successMsg = 'Password changed successfully.';
      setSuccess(successMsg);
      toast.success('Success', successMsg);
      setShowChangePassword(false);
      setNewPassword('');
      mutate();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to change password';
      setError(errMsg);
      toast.error('Error', errMsg);
    } finally {
      setPasswordChanging(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      label: 'Staff Member Name',
      render: (row: any) => (
        <div>
          <div className="font-bold text-white text-sm">{row.fullName || row.full_name}</div>
          <div className="text-xs text-indigo-400 font-mono">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Assigned Showroom Role',
      render: (row: any) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {row.role || (row.isPlatformUser ? 'Platform Super Admin' : 'org_admin')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <UserCheck className="w-3 h-3" /> {row.status || 'Active User'}
        </span>
      ),
    },
    {
      key: 'password',
      label: 'Password',
      render: (row: any) => (
        <span className="text-xs font-mono text-slate-300">
          {row.password ? row.password : '••••••••'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.createdAt || row.created_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => {
            setPasswordChangeUserId(row.id);
            setShowChangePassword(true);
            setNewPassword('');
          }}
        >
          <Key className="w-3 h-3 mr-1" /> Change Password
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-400" /> Showroom Admins & Staff Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Showroom Console — Manage user accounts, administrators, accountants, and sales representatives for <span className="text-indigo-300 font-semibold">{currentOrg?.display_name || currentOrg?.name || 'All Showrooms'}</span>
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4" /> Add Showroom Staff
        </Button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <UserCheck className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staffMembers}
        isLoading={isLoading}
        emptyMessage={`No user accounts found for ${currentOrg?.display_name || currentOrg?.name || 'this showroom'}. Click "Add Showroom Staff" to create one.`}
      />

      {/* Add Staff User Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={`Add Staff User for ${currentOrg?.display_name || currentOrg?.name || 'Showroom'}`} size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              placeholder="e.g. Kamran Akmal"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="accountant@showroom.pk"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••••"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Role & Permissions</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            >
              <option value="org_owner">Showroom Owner / Admin (Full Access)</option>
              <option value="accountant">Accountant (GL, Payments, Expenses)</option>
              <option value="salesperson">Sales Representative (Vehicles, Sales)</option>
              <option value="inventory_manager">Inventory Manager (Stock & Inspection)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}><UserPlus className="w-4 h-4" /> Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change User Password" size="md">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
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
            <Button type="submit" loading={passwordChanging}><Key className="w-4 h-4" /> Save Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
