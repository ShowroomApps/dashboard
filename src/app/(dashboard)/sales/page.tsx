'use client';

import React, { useState } from 'react';
import { useSales, useVehicles, useCustomers, useBranches } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPKR, formatDate } from '@/lib/format';
import { TrendingUp, Plus, DollarSign, Pencil, Trash2, RotateCcw, ShieldAlert, Scale, Calculator, UserPlus, X } from 'lucide-react';

const initialForm = {
  id: '', vehicleId: '', customerId: '', sellingPrice: 0, discountAmount: 0, amountReceived: 0,
  saleDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash', notes: '',
};

export default function SalesPage() {
  const toast = useToast();
  const [viewDeleted, setViewDeleted] = useState(false);
  const { sales, isLoading, mutate } = useSales({ includeDeleted: viewDeleted ? 'only' : 'false' });
  const { vehicles, mutate: mutateVehicles } = useVehicles({ status: 'available' });
  const { customers, mutate: mutateCustomers } = useCustomers();
  const { branches } = useBranches();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-Add Customer State
  const [showQuickCust, setShowQuickCust] = useState(false);
  const [showInlineCustForm, setShowInlineCustForm] = useState(false);
  const [quickCustSubmitting, setQuickCustSubmitting] = useState(false);
  const [quickCustError, setQuickCustError] = useState('');
  const [quickCustForm, setQuickCustForm] = useState({ name: '', phone: '', cnic: '' });

  const handleOpenCreate = () => {
    setError('');
    setIsEditing(false);
    setShowInlineCustForm(false);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (row: any) => {
    setError('');
    setIsEditing(true);
    setShowInlineCustForm(false);
    setForm({
      id: row.id,
      vehicleId: row.vehicleId || row.vehicle?.id || '',
      customerId: row.customerId || row.customer?.id || '',
      sellingPrice: Number(row.sellingPrice || 0),
      discountAmount: Number(row.discountAmount || 0),
      amountReceived: Number(row.amountReceived || row.sellingPrice || 0),
      saleDate: row.saleDate ? row.saleDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: row.paymentMethod || 'cash',
      notes: row.notes || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setError('');
    setShowInlineCustForm(false);
    setForm(initialForm);
    setShowModal(false);
  };

  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickCustSubmitting(true);
    setQuickCustError('');
    try {
      const res: any = await apiClient.post('/customers', {
        name: quickCustForm.name,
        phone: quickCustForm.phone || undefined,
        cnic: quickCustForm.cnic || undefined,
      });

      const newCustomer = res.data;
      toast.success('Customer Created', `Customer "${quickCustForm.name}" created and selected.`);
      await mutateCustomers();
      setForm((prev) => ({ ...prev, customerId: newCustomer?.id || '' }));
      setShowQuickCust(false);
      setShowInlineCustForm(false);
      setQuickCustForm({ name: '', phone: '', cnic: '' });
    } catch (err: any) {
      setQuickCustError(err?.message || 'Failed to create customer');
    } finally {
      setQuickCustSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const defaultBranchId = branches.length > 0 ? branches[0].id : undefined;

    try {
      if (isEditing && form.id) {
        await apiClient.patch(`/sales/${form.id}`, {
          sellingPrice: Number(form.sellingPrice),
          discountAmount: Number(form.discountAmount || 0),
          amountReceived: Number(form.amountReceived || form.sellingPrice),
          saleDate: form.saleDate,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
        });
        toast.success('Sale Updated', `Sale details updated successfully.`);
      } else {
        await apiClient.post('/sales', {
          branchId: defaultBranchId,
          vehicleId: form.vehicleId,
          customerId: form.customerId,
          sellingPrice: Number(form.sellingPrice),
          discountAmount: Number(form.discountAmount || 0),
          amountReceived: Number(form.amountReceived || form.sellingPrice),
          saleDate: form.saleDate,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
        });
        toast.success('Vehicle Sale Recorded', `Sale transaction recorded & gross profit calculated.`);
      }
      handleCloseModal();
      mutate();
      mutateVehicles();
    } catch (err: any) {
      setError(err?.message || 'Failed to save sale transaction');
      toast.error('Operation Failed', err?.message || 'Failed to save sale transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/sales/${deleteTarget.id}`);
      toast.info('Sale Soft-Deleted', `${deleteTarget.saleNumber} archived. Financial ledger records remain preserved.`);
      setDeleteTarget(null);
      mutate();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete sale');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/sales/${id}/restore`, {});
      toast.success('Sale Reactivated', 'Sale transaction restored to active records.');
      mutate();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate sale');
    }
  };

  const selectedVehicle = vehicles.find((v: any) => v.id === form.vehicleId);
  const selectedCostBasis = selectedVehicle ? parseFloat(selectedVehicle.costBasis) || 0 : 0;
  const liveProfit = form.sellingPrice - selectedCostBasis;
  const liveMargin = form.sellingPrice > 0 ? (liveProfit / form.sellingPrice) * 100 : 0;

  const totalRevenue = sales.reduce((s: number, r: any) => s + (parseFloat(r.sellingPrice) || 0), 0);
  const totalCostBasis = sales.reduce((s: number, r: any) => s + (parseFloat(r.costBasisAtSale) || 0), 0);
  const totalProfit = sales.reduce((s: number, r: any) => s + (parseFloat(r.grossProfit) || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const columns = [
    {
      key: 'saleNumber', label: 'Sale #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.saleNumber}</span>,
    },
    {
      key: 'vehicle', label: 'Vehicle Details',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white">{row.vehicle?.make} {row.vehicle?.model}</div>
          <div className="text-xs text-slate-400">{row.vehicle?.modelYear || row.vehicle?.year} • STK: {row.vehicle?.stockId}</div>
        </div>
      ),
    },
    {
      key: 'customer', label: 'Customer',
      render: (row: any) => <span className="text-slate-300">{row.customer?.name || row.customer?.fullName || '—'}</span>,
    },
    {
      key: 'costBasisAtSale', label: 'Purchase Cost Basis',
      render: (row: any) => <span className="text-slate-400 tabular-nums">{formatPKR(row.costBasisAtSale)}</span>,
    },
    {
      key: 'sellingPrice', label: 'Selling Price',
      render: (row: any) => <span className="font-semibold text-white tabular-nums">{formatPKR(row.sellingPrice)}</span>,
    },
    {
      key: 'grossProfit', label: 'Profit / Loss Difference',
      render: (row: any) => {
        const profit = parseFloat(row.grossProfit) || 0;
        const price = parseFloat(row.sellingPrice) || 1;
        const margin = (profit / price) * 100;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tabular-nums ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profit >= 0 ? '+' : ''}{formatPKR(profit)}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${profit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'saleDate', label: 'Sale Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.saleDate)}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Sale"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Sale Details"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Sale"
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
            <TrendingUp className="w-6 h-6 text-emerald-400" /> Sales Transactions & Profit Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">Record vehicle sales, view gross profit differences, soft deletions, and record reactivation</p>
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
            {viewDeleted ? 'Viewing Archived Sales' : 'Show Archived Sales'}
          </button>
          <Button onClick={handleOpenCreate}><Plus className="w-4 h-4" /> New Sale</Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 glass-card rounded-2xl border border-slate-800">
        <div>
          <span className="text-xs text-slate-400 font-medium">Total Vehicle Sales Revenue</span>
          <div className="text-xl font-black text-white tabular-nums mt-1">{formatPKR(totalRevenue)}</div>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <span className="text-xs text-slate-400 font-medium">Total Purchase Cost Basis (COGS)</span>
          <div className="text-xl font-black text-slate-300 tabular-nums mt-1">{formatPKR(totalCostBasis)}</div>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <span className="text-xs text-slate-400 font-medium">Net Vehicle Gross Profit</span>
          <div className={`text-xl font-black tabular-nums mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatPKR(totalProfit)}
          </div>
        </div>
        <div className="border-l border-slate-800 pl-4 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Average Profit Margin</span>
          <div className="text-xl font-black text-emerald-400 tabular-nums mt-0.5">{profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      <DataTable columns={columns} data={sales} isLoading={isLoading} emptyMessage="No sales transactions found." />

      {/* Quick-Add Customer Modal (High z-index 80 overlay) */}
      <Modal isOpen={showQuickCust} onClose={() => setShowQuickCust(false)} title="Quick-Add New Customer" size="sm" zIndex={80}>
        <form onSubmit={handleSaveQuickCustomer} className="space-y-3">
          {quickCustError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {quickCustError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Full Name</label>
            <input type="text" value={quickCustForm.name} onChange={(e) => setQuickCustForm({ ...quickCustForm, name: e.target.value })} required placeholder="e.g. Tariq Aziz"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input type="text" value={quickCustForm.phone} onChange={(e) => setQuickCustForm({ ...quickCustForm, phone: e.target.value })} placeholder="+923001234567"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">CNIC / ID (Optional)</label>
            <input type="text" value={quickCustForm.cnic} onChange={(e) => setQuickCustForm({ ...quickCustForm, cnic: e.target.value })} placeholder="42101-1234567-1"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setShowQuickCust(false)}>Cancel</Button>
            <Button type="submit" loading={quickCustSubmitting}>Create & Select Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Edit / Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit Sale Details' : 'Record New Sale'}`} size="lg" zIndex={50}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {!isEditing && selectedVehicle && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Vehicle Purchase Cost:</span>
                <div className="font-bold text-white text-sm tabular-nums">{formatPKR(selectedCostBasis)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Selling Price:</span>
                <div className="font-bold text-white text-sm tabular-nums">{formatPKR(form.sellingPrice)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Calculated Profit:</span>
                <div className={`font-bold text-sm tabular-nums ${liveProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveProfit >= 0 ? '+' : ''}{formatPKR(liveProfit)} ({liveMargin.toFixed(1)}%)
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Inventory</label>
                  <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
                    <option value="">Select a vehicle...</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.stockId} — {v.make} {v.model} ({formatPKR(v.costBasis)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Customer</label>
                    <button type="button" onClick={() => setShowInlineCustForm(!showInlineCustForm)} className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                      <UserPlus className="w-3 h-3" /> {showInlineCustForm ? 'Cancel Inline Add' : 'Quick Add Customer'}
                    </button>
                  </div>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required={!showInlineCustForm}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
                    <option value="">Select a customer...</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.customerNumber || 'CUST'} — {c.name || c.fullName}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Inline Customer Expander Card */}
            {!isEditing && showInlineCustForm && (
              <div className="col-span-2 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Create & Select New Customer
                  </span>
                  <button type="button" onClick={() => setShowInlineCustForm(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                    <input type="text" value={quickCustForm.name} onChange={(e) => setQuickCustForm({ ...quickCustForm, name: e.target.value })} required placeholder="e.g. Tariq Aziz"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone</label>
                    <input type="text" value={quickCustForm.phone} onChange={(e) => setQuickCustForm({ ...quickCustForm, phone: e.target.value })} placeholder="+923001234567"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">CNIC / ID</label>
                    <input type="text" value={quickCustForm.cnic} onChange={(e) => setQuickCustForm({ ...quickCustForm, cnic: e.target.value })} placeholder="42101-1234567-1"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={handleSaveQuickCustomer} disabled={quickCustSubmitting || !quickCustForm.name}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md">
                    {quickCustSubmitting ? 'Saving...' : 'Save & Attach Customer'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price (PKR)</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value), amountReceived: Number(e.target.value) })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Received (PKR)</label>
              <input type="number" value={form.amountReceived} onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Date</label>
              <input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} required
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}><DollarSign className="w-4 h-4" /> {isEditing ? 'Update Sale' : 'Record Sale'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Sale Confirmation" zIndex={70}>
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Audit Trail Safe Soft-Delete</p>
              <p>
                Soft-deleting sale transaction <strong>{deleteTarget?.saleNumber}</strong> will soft-delete the transaction header while keeping all posted double-entry General Ledger audit entries strictly intact.
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
