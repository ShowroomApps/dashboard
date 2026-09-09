'use client';

import React, { useState } from 'react';
import { useExpenses, useBranches, useChartOfAccounts } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPKR, formatDate } from '@/lib/format';
import { Wallet, Plus, Pencil, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';

const initialForm = {
  id: '', category: 'Showroom Utilities', description: '', amount: 0,
  accountId: '6400', expenseDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
};

export default function ExpensesPage() {
  const toast = useToast();
  const [viewDeleted, setViewDeleted] = useState(false);
  const { expenses, isLoading, mutate } = useExpenses({ includeDeleted: viewDeleted ? 'only' : 'false' });
  const { branches } = useBranches();
  const { accounts } = useChartOfAccounts();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setError('');
    setIsEditing(false);
    const defaultAcc = accounts.find((a: any) => a.code === '6400' || a.accountType === 'expense') || accounts[0];
    setForm({
      ...initialForm,
      accountId: defaultAcc ? defaultAcc.id : '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (row: any) => {
    setError('');
    setIsEditing(true);
    let accId = row.accountId || row.account?.id || '';
    if (!accId && row.account?.code) {
      const matched = accounts.find((a: any) => a.code === row.account.code);
      if (matched) accId = matched.id;
    }
    setForm({
      id: row.id,
      category: row.category || 'Showroom Utilities',
      description: row.description || '',
      amount: Number(row.amount || 0),
      accountId: accId,
      expenseDate: row.expenseDate ? row.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: row.paymentMethod || 'bank_transfer',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setError('');
    setForm(initialForm);
    setShowModal(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const defaultBranchId = branches.length > 0 ? branches[0].id : undefined;

    try {
      if (isEditing && form.id) {
        await apiClient.patch(`/expenses/${form.id}`, {
          category: form.category,
          description: form.description || form.category,
          amount: Number(form.amount),
          accountId: form.accountId,
          expenseDate: form.expenseDate,
          paymentMethod: form.paymentMethod,
        });
        toast.success('Expense Updated', 'Expense record updated successfully.');
      } else {
        await apiClient.post('/expenses', {
          branchId: defaultBranchId,
          category: form.category,
          description: form.description || form.category,
          amount: Number(form.amount),
          accountId: form.accountId,
          expenseDate: form.expenseDate,
          paymentMethod: form.paymentMethod,
          isCapitalizable: false,
        });
        toast.success('Expense Recorded', 'Operating expense recorded.');
      }
      handleCloseModal();
      mutate();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense');
      toast.error('Operation Failed', err?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/expenses/${deleteTarget.id}`);
      toast.info('Expense Soft-Deleted', `${deleteTarget.expenseNumber} archived.`);
      setDeleteTarget(null);
      mutate();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/expenses/${id}/restore`, {});
      toast.success('Expense Reactivated', 'Expense record restored.');
      mutate();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate expense');
    }
  };

  const columns = [
    {
      key: 'expenseNumber', label: 'Expense #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.expenseNumber}</span>,
    },
    {
      key: 'category', label: 'Category / Account',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white">
            {row.account ? `${row.account.code} — ${row.account.name}` : row.category || 'General Expense'}
          </div>
          <div className="text-xs text-slate-400">
            {row.account && row.category && row.category !== row.account.name ? `${row.category} • ` : ''}
            {row.description || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: (row: any) => <span className="font-semibold text-white tabular-nums">{formatPKR(row.amount)}</span>,
    },
    {
      key: 'isCapitalizable', label: 'Type',
      render: (row: any) => (
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${row.isCapitalizable ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
          {row.isCapitalizable ? 'Pre-sale (Capitalized)' : 'Post-listing Operating'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'expenseDate', label: 'Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.expenseDate)}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Expense"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Expense"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Expense"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-rose-400" /> Operating & Showroom Expenses
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track operating expenses, soft deletions, and record reactivation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewDeleted(!viewDeleted)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              viewDeleted
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            {viewDeleted ? 'Viewing Archived Expenses' : 'Show Archived Expenses'}
          </button>
          <Button onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Add Expense</Button>
        </div>
      </div>

      <DataTable columns={columns} data={expenses} isLoading={isLoading} emptyMessage="No expense records found." />

      {/* Edit / Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit Expense Record' : 'Record Showroom Expense'}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category / Title</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="e.g. Electricity Bill & Internet"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (PKR)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required placeholder="e.g. 150000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Chart of Account</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
              >
                <option value="">Select Account...</option>
                {accounts.length > 0 ? (
                  accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.accountType.toUpperCase()})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="6400">6400 — Rent Expense</option>
                    <option value="6500">6500 — Utilities Expense</option>
                    <option value="6300">6300 — Salaries & Wages</option>
                    <option value="6900">6900 — Miscellaneous Expense</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Date</label>
              <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}><Wallet className="w-4 h-4" /> {isEditing ? 'Update Expense' : 'Save Expense'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Expense Confirmation">
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Audit Trail Safe Soft-Delete</p>
              <p>
                Soft-deleting expense <strong>{deleteTarget?.expenseNumber}</strong> will archive this expense record while keeping all posted GL accounting entries intact.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Soft Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
