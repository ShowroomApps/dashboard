'use client';

import React, { useState } from 'react';
import { usePurchases, useSellers, useVehicles, useBranches } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPKR, formatDate } from '@/lib/format';
import { ShoppingBag, Plus, Pencil, Trash2, RotateCcw, ShieldAlert, UserPlus, X } from 'lucide-react';

const initialForm = {
  id: '', vehicleId: '', sellerId: '', acquisitionPrice: 0, registrationCost: 0,
  repairCost: 0, transportationCost: 0, amountPaid: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer', notes: '',
};

export default function PurchasesPage() {
  const toast = useToast();
  const [viewDeleted, setViewDeleted] = useState(false);
  const { purchases, isLoading, mutate } = usePurchases({ includeDeleted: viewDeleted ? 'only' : 'false' });
  const { sellers, mutate: mutateSellers } = useSellers();
  const { vehicles, mutate: mutateVehicles } = useVehicles();
  const { branches } = useBranches();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-Add Seller State
  const [showQuickSeller, setShowQuickSeller] = useState(false);
  const [showInlineSellerForm, setShowInlineSellerForm] = useState(false);
  const [quickSellerSubmitting, setQuickSellerSubmitting] = useState(false);
  const [quickSellerError, setQuickSellerError] = useState('');
  const [quickSellerForm, setQuickSellerForm] = useState({ name: '', phone: '', sellerType: 'individual' });

  const handleOpenCreate = () => {
    setError('');
    setIsEditing(false);
    setShowInlineSellerForm(false);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (row: any) => {
    setError('');
    setIsEditing(true);
    setShowInlineSellerForm(false);
    setForm({
      id: row.id,
      vehicleId: row.vehicleId || row.vehicle?.id || '',
      sellerId: row.sellerId || row.seller?.id || '',
      acquisitionPrice: Number(row.acquisitionPrice || row.purchasePrice || 0),
      registrationCost: Number(row.registrationCost || 0),
      repairCost: Number(row.repairCost || 0),
      transportationCost: Number(row.transportationCost || 0),
      amountPaid: Number(row.amountPaid || row.totalCost || 0),
      purchaseDate: row.purchaseDate ? row.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: row.paymentMethod || 'bank_transfer',
      notes: row.notes || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setError('');
    setShowInlineSellerForm(false);
    setForm(initialForm);
    setShowModal(false);
  };

  const handleSaveQuickSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSellerSubmitting(true);
    setQuickSellerError('');
    try {
      const res: any = await apiClient.post('/sellers', {
        name: quickSellerForm.name,
        phone: quickSellerForm.phone || undefined,
        sellerType: quickSellerForm.sellerType,
      });

      const newSeller = res.data;
      toast.success('Seller Created', `Seller "${quickSellerForm.name}" created and selected.`);
      await mutateSellers();
      setForm((prev) => ({ ...prev, sellerId: newSeller?.id || '' }));
      setShowQuickSeller(false);
      setShowInlineSellerForm(false);
      setQuickSellerForm({ name: '', phone: '', sellerType: 'individual' });
    } catch (err: any) {
      setQuickSellerError(err?.message || 'Failed to create seller');
    } finally {
      setQuickSellerSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const defaultBranchId = branches.length > 0 ? branches[0].id : undefined;

    try {
      if (isEditing && form.id) {
        await apiClient.patch(`/purchases/${form.id}`, {
          acquisitionPrice: Number(form.acquisitionPrice),
          registrationCost: Number(form.registrationCost || 0),
          repairCost: Number(form.repairCost || 0),
          transportationCost: Number(form.transportationCost || 0),
          amountPaid: Number(form.amountPaid),
          purchaseDate: form.purchaseDate,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
        });
        toast.success('Acquisition Updated', 'Acquisition details updated successfully.');
      } else {
        const totalCost = Number(form.acquisitionPrice || 0) + Number(form.registrationCost || 0) + Number(form.repairCost || 0) + Number(form.transportationCost || 0);

        await apiClient.post('/purchases', {
          branchId: defaultBranchId,
          vehicleId: form.vehicleId,
          sellerId: form.sellerId,
          acquisitionPrice: Number(form.acquisitionPrice),
          registrationCost: Number(form.registrationCost || 0),
          repairCost: Number(form.repairCost || 0),
          transportationCost: Number(form.transportationCost || 0),
          amountPaid: Number(form.amountPaid || totalCost),
          purchaseDate: form.purchaseDate,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
        });
        toast.success('Vehicle Acquisition Recorded', 'Acquisition & cost basis capitalization recorded.');
      }
      handleCloseModal();
      mutate();
      mutateVehicles();
    } catch (err: any) {
      setError(err?.message || 'Failed to save acquisition');
      toast.error('Operation Failed', err?.message || 'Failed to save acquisition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/purchases/${deleteTarget.id}`);
      toast.info('Acquisition Soft-Deleted', `${deleteTarget.purchaseNumber} archived.`);
      setDeleteTarget(null);
      mutate();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete purchase');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/purchases/${id}/restore`, {});
      toast.success('Acquisition Reactivated', 'Acquisition record restored to active list.');
      mutate();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate purchase');
    }
  };

  const columns = [
    {
      key: 'purchaseNumber', label: 'Purchase #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.purchaseNumber}</span>,
    },
    {
      key: 'vehicle', label: 'Vehicle',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white">{row.vehicle?.make} {row.vehicle?.model}</div>
          <div className="text-xs text-slate-400">{row.vehicle?.modelYear || row.vehicle?.year} • {row.vehicle?.stockId}</div>
        </div>
      ),
    },
    {
      key: 'seller', label: 'Seller / Supplier',
      render: (row: any) => <span className="text-slate-300">{row.seller?.name || row.seller?.fullName || '—'}</span>,
    },
    {
      key: 'acquisitionPrice', label: 'Base Price',
      render: (row: any) => <span className="text-slate-300 tabular-nums">{formatPKR(row.acquisitionPrice || row.purchasePrice)}</span>,
    },
    {
      key: 'totalCost', label: 'Total Cost Basis (Option A)',
      render: (row: any) => <span className="font-semibold text-emerald-400 tabular-nums">{formatPKR(row.totalCost || row.totalCostBasis)}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'purchaseDate', label: 'Acquisition Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.purchaseDate)}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Acquisition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Acquisition"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Acquisition"
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
            <ShoppingBag className="w-6 h-6 text-amber-400" /> Vehicle Acquisitions & Cost Basis
          </h1>
          <p className="text-sm text-slate-400 mt-1">Record vehicle purchases with cost capitalization, soft deletions, and record reactivation</p>
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
            {viewDeleted ? 'Viewing Archived Acquisitions' : 'Show Archived Acquisitions'}
          </button>
          <Button onClick={handleOpenCreate}><Plus className="w-4 h-4" /> New Acquisition</Button>
        </div>
      </div>

      <DataTable columns={columns} data={purchases} isLoading={isLoading} emptyMessage="No vehicle acquisitions found." />

      {/* Quick-Add Seller Modal (High z-index 80 overlay) */}
      <Modal isOpen={showQuickSeller} onClose={() => setShowQuickSeller(false)} title="Quick-Add New Vehicle Seller" size="sm" zIndex={80}>
        <form onSubmit={handleSaveQuickSeller} className="space-y-3">
          {quickSellerError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {quickSellerError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Seller / Supplier Name</label>
            <input type="text" value={quickSellerForm.name} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, name: e.target.value })} required placeholder="e.g. PakWheels Auctions"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input type="text" value={quickSellerForm.phone} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, phone: e.target.value })} placeholder="+923009876543"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Seller Type</label>
            <select value={quickSellerForm.sellerType} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, sellerType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
              <option value="individual">Individual Private Seller</option>
              <option value="dealership">Dealership / Trader</option>
              <option value="auction">Auction House</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={() => setShowQuickSeller(false)}>Cancel</Button>
            <Button type="submit" loading={quickSellerSubmitting}>Create & Select Seller</Button>
          </div>
        </form>
      </Modal>

      {/* Edit / Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit Vehicle Acquisition' : 'Record New Vehicle Acquisition'}`} size="xl" zIndex={50}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vehicle</label>
                  <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.stockId} — {v.make} {v.model} ({v.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Seller / Supplier</label>
                    <button type="button" onClick={() => setShowInlineSellerForm(!showInlineSellerForm)} className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5">
                      <UserPlus className="w-3 h-3" /> {showInlineSellerForm ? 'Cancel Inline Add' : 'Quick Add Seller'}
                    </button>
                  </div>
                  <select value={form.sellerId} onChange={(e) => setForm({ ...form, sellerId: e.target.value })} required={!showInlineSellerForm}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none">
                    <option value="">Select seller...</option>
                    {sellers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.sellerNumber || 'SEL'} — {s.name || s.fullName}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Inline Seller Expander Card */}
            {!isEditing && showInlineSellerForm && (
              <div className="col-span-2 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Create & Select New Seller / Supplier
                  </span>
                  <button type="button" onClick={() => setShowInlineSellerForm(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Seller / Supplier Name</label>
                    <input type="text" value={quickSellerForm.name} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, name: e.target.value })} required placeholder="e.g. PakWheels Auctions"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone</label>
                    <input type="text" value={quickSellerForm.phone} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, phone: e.target.value })} placeholder="+923009876543"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Seller Type</label>
                    <select value={quickSellerForm.sellerType} onChange={(e) => setQuickSellerForm({ ...quickSellerForm, sellerType: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 outline-none">
                      <option value="individual">Individual</option>
                      <option value="dealership">Dealership</option>
                      <option value="auction">Auction House</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={handleSaveQuickSeller} disabled={quickSellerSubmitting || !quickSellerForm.name}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md">
                    {quickSellerSubmitting ? 'Saving...' : 'Save & Attach Seller'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Acquisition Base Price (PKR)</label>
              <input type="number" value={form.acquisitionPrice} onChange={(e) => {
                const price = Number(e.target.value);
                const total = price + form.registrationCost + form.repairCost + form.transportationCost;
                setForm({ ...form, acquisitionPrice: price, amountPaid: total });
              }} required className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registration / Transfer Fee</label>
              <input type="number" value={form.registrationCost} onChange={(e) => {
                const reg = Number(e.target.value);
                const total = form.acquisitionPrice + reg + form.repairCost + form.transportationCost;
                setForm({ ...form, registrationCost: reg, amountPaid: total });
              }} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pre-sale Repair / Detailing Cost</label>
              <input type="number" value={form.repairCost} onChange={(e) => {
                const rep = Number(e.target.value);
                const total = form.acquisitionPrice + form.registrationCost + rep + form.transportationCost;
                setForm({ ...form, repairCost: rep, amountPaid: total });
              }} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transportation Cost</label>
              <input type="number" value={form.transportationCost} onChange={(e) => {
                const trans = Number(e.target.value);
                const total = form.acquisitionPrice + form.registrationCost + form.repairCost + trans;
                setForm({ ...form, transportationCost: trans, amountPaid: total });
              }} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Paid (PKR)</label>
              <input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Acquisition Date</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}><ShoppingBag className="w-4 h-4" /> {isEditing ? 'Update Acquisition' : 'Save Acquisition'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Acquisition Confirmation" zIndex={70}>
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Audit Trail Safe Soft-Delete</p>
              <p>
                Soft-deleting acquisition <strong>{deleteTarget?.purchaseNumber}</strong> will archive this acquisition record while preserving vehicle cost basis records and financial GL journal entries.
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
