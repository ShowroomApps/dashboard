'use client';

import React, { useState } from 'react';
import { useSubscriptions } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { Key, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Lock, Calendar, CreditCard, RotateCcw } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const toast = useToast();
  const [viewDeleted, setViewDeleted] = useState(false);
  const { subscriptions, isLoading, mutate } = useSubscriptions({ includeDeleted: viewDeleted ? 'only' : 'false' });

  // Modal states
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [extendTarget, setExtendTarget] = useState<any>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [assignForm, setAssignForm] = useState({
    planName: 'Enterprise Tier',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [extendForm, setExtendForm] = useState({
    newEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [deactivateReason, setDeactivateReason] = useState('');

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    setSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/organizations/${assignTarget.organization.id}/subscription`, {
        planName: assignForm.planName,
        startDate: new Date(assignForm.startDate).toISOString(),
        endDate: new Date(assignForm.endDate).toISOString(),
      });
      toast.success('Subscription Activated', `${assignTarget.organization.displayName || assignTarget.organization.name} upgraded to ${assignForm.planName}.`);
      setAssignTarget(null);
      mutate();
    } catch (err: any) {
      const msg = err?.message || 'Failed to assign subscription';
      setError(msg);
      toast.error('Assignment Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/organizations/${extendTarget.organization.id}/subscription/extend`, {
        newEndDate: new Date(extendForm.newEndDate).toISOString(),
      });
      toast.success('Subscription Extended', `Expiration date extended to ${formatDate(extendForm.newEndDate)}.`);
      setExtendTarget(null);
      mutate();
    } catch (err: any) {
      const msg = err?.message || 'Failed to extend subscription';
      setError(msg);
      toast.error('Extension Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivateTarget) return;
    setSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/organizations/${deactivateTarget.organization.id}/deactivate`, {
        reason: deactivateReason || undefined,
      });
      toast.info('Organization Deactivated', `${deactivateTarget.organization.displayName || deactivateTarget.organization.name} access revoked.`);
      setDeactivateTarget(null);
      setDeactivateReason('');
      mutate();
    } catch (err: any) {
      const msg = err?.message || 'Failed to deactivate organization';
      setError(msg);
      toast.error('Deactivation Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async (orgId: string, orgName: string) => {
    try {
      await apiClient.post(`/organizations/${orgId}/reactivate`, {});
      toast.success('Organization Reactivated', `${orgName} access restored.`);
      mutate();
    } catch (err: any) {
      const msg = err?.message || 'Failed to reactivate. Valid subscription/trial required.';
      toast.error('Reactivation Blocked', msg);
    }
  };

  const handleStartTrial = async (orgId: string, orgName: string) => {
    try {
      await apiClient.post(`/organizations/${orgId}/subscription/trial`, { durationMonths: 1 });
      toast.success('Free Trial Provisioned', `1-Month free trial assigned to ${orgName}.`);
      mutate();
    } catch (err: any) {
      toast.error('Trial Provision Failed', err?.message || 'Failed to provision trial');
    }
  };

  const columns = [
    {
      key: 'organization', label: 'Showroom Organization',
      render: (row: any) => {
        const org = row.organization;
        return (
          <div className="flex items-center gap-3">
            {org.logoUrl || org.logo_url ? (
              <img src={org.logoUrl || org.logo_url} alt={org.name} className="w-9 h-9 rounded-xl object-contain bg-slate-800 border border-slate-700 p-1" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                {(org.displayName || org.name || 'O').charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-white">{org.displayName || org.name}</div>
              <div className="text-xs font-mono text-indigo-400">{org.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Subscription Status',
      render: (row: any) => {
        const status = row.status;
        if (status === 'ACTIVE') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
            </span>
          );
        } else if (status === 'TRIAL') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" /> TRIAL
            </span>
          );
        } else if (status === 'EXPIRED') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <Lock className="w-3.5 h-3.5" /> DEACTIVATED
            </span>
          );
        }
      },
    },
    {
      key: 'planName', label: 'Tier / Plan Name',
      render: (row: any) => <span className="text-xs font-medium text-slate-300">{row.planName || 'Standard Dealership Plan'}</span>,
    },
    {
      key: 'dates', label: 'Start & Expiration Date',
      render: (row: any) => {
        const sub = row.subscription;
        if (!sub) return <span className="text-xs text-slate-500">—</span>;
        const startDate = sub.startDate || sub.trialStartDate;
        const endDate = row.expiresAt || sub.endDate || sub.trialEndDate;
        return (
          <div className="text-xs space-y-0.5">
            <div className="text-slate-400">Start: {formatDate(startDate)}</div>
            <div className="text-indigo-400 font-medium">Expires: {formatDate(endDate)}</div>
          </div>
        );
      },
    },
    {
      key: 'daysRemaining', label: 'Days Remaining',
      render: (row: any) => {
        const days = row.daysRemaining;
        if (row.status === 'EXPIRED') {
          return <span className="text-xs font-bold text-rose-400">Expired</span>;
        } else if (row.status === 'DEACTIVATED') {
          return <span className="text-xs font-bold text-slate-500">Access Blocked</span>;
        }
        return (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
            days <= 7
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          }`}>
            {days} day{days === 1 ? '' : 's'} left
          </span>
        );
      },
    },
    {
      key: 'actions', label: 'Licensing Actions',
      render: (row: any) => {
        const org = row.organization;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAssignTarget(row);
                setError('');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all"
              title="Assign Paid Subscription"
            >
              <CreditCard className="w-3.5 h-3.5" /> Assign Paid
            </button>
            <button
              onClick={() => {
                setExtendTarget(row);
                setError('');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all"
              title="Extend Expiration Date"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Extend
            </button>
            {row.status === 'DEACTIVATED' ? (
              <button
                onClick={() => handleReactivate(org.id, org.displayName || org.name)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all"
                title="Reactivate Organization Access"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  setDeactivateTarget(row);
                  setError('');
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-all"
                title="Deactivate Organization"
              >
                <Lock className="w-3.5 h-3.5" /> Deactivate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Key className="w-6 h-6 text-indigo-400" /> Subscriptions & Licensing Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Platform Super Admin portal: Assign paid subscriptions, extend trials, view days remaining, and manage organization access</p>
        </div>
        <button
          onClick={() => setViewDeleted(!viewDeleted)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            viewDeleted
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
          }`}
        >
          {viewDeleted ? 'Viewing Archived Clients' : 'Show Archived Clients'}
        </button>
      </div>

      <DataTable columns={columns} data={subscriptions} isLoading={isLoading} emptyMessage="No organization subscriptions found." />

      {/* Assign Paid Subscription Modal */}
      <Modal isOpen={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign Paid Subscription — ${assignTarget?.organization?.displayName || assignTarget?.organization?.name}`}>
        <form onSubmit={handleAssign} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Subscription Plan</label>
            <select
              value={assignForm.planName}
              onChange={(e) => setAssignForm({ ...assignForm, planName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            >
              <option value="Standard Dealership Plan">Standard Dealership Plan</option>
              <option value="Professional Tier">Professional Tier</option>
              <option value="Enterprise Tier">Enterprise Tier</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expiration Date</label>
              <input
                type="date"
                value={assignForm.endDate}
                onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Activate Subscription</Button>
          </div>
        </form>
      </Modal>

      {/* Extend Expiration Modal */}
      <Modal isOpen={!!extendTarget} onClose={() => setExtendTarget(null)} title={`Extend Subscription Expiration — ${extendTarget?.organization?.displayName || extendTarget?.organization?.name}`}>
        <form onSubmit={handleExtend} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs space-y-1">
            <div className="text-slate-400">Current Plan: <span className="text-white font-semibold">{extendTarget?.planName}</span></div>
            <div className="text-slate-400">Current Expiration: <span className="text-indigo-400 font-semibold">{formatDate(extendTarget?.expiresAt)}</span></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Expiration Date</label>
            <input
              type="date"
              value={extendForm.newEndDate}
              onChange={(e) => setExtendForm({ ...extendForm, newEndDate: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setExtendTarget(null)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Extend Subscription</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Modal */}
      <Modal isOpen={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} title={`Deactivate Organization — ${deactivateTarget?.organization?.displayName || deactivateTarget?.organization?.name}`}>
        <form onSubmit={handleDeactivate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300 mb-1">Immediate Access Revocation</p>
              <p>Users belonging to this organization will immediately lose access to the system and will be automatically logged out on their next action.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Deactivation Reason (Optional)</label>
            <input
              type="text"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="e.g. Payment review or administrative request"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button variant="danger" type="submit" loading={submitting}>Deactivate Organization</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
