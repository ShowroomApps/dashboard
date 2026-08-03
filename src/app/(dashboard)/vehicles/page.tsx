'use client';

import React, { useState } from 'react';
import { useVehicles, useBranches } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPKR, formatDate } from '@/lib/format';
import { Car, Plus, Search, Filter, Pencil, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';

const initialForm = {
  id: '', make: '', model: '', year: new Date().getFullYear(), color: '', vin: '',
  engineNumber: '', registrationNumber: '', fuelType: 'petrol', transmissionType: 'automatic',
  mileageKm: 0, askingPrice: 0, costBasis: 0, status: 'available',
};

export default function VehiclesPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDeleted, setViewDeleted] = useState(false);
  const { vehicles, isLoading, mutate } = useVehicles({ status: statusFilter, q: searchQuery, includeDeleted: viewDeleted ? 'only' : 'false' });
  const { branches } = useBranches();

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
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (v: any) => {
    setError('');
    setIsEditing(true);
    setForm({
      id: v.id,
      make: v.make || '',
      model: v.model || '',
      year: Number(v.year || v.modelYear || new Date().getFullYear()),
      color: v.color || '',
      vin: v.vin || '',
      engineNumber: v.engineNumber || '',
      registrationNumber: v.registrationNumber || '',
      fuelType: v.fuelType || 'petrol',
      transmissionType: v.transmissionType || 'automatic',
      mileageKm: Number(v.mileageKm || 0),
      askingPrice: Number(v.askingPrice || 0),
      costBasis: Number(v.costBasis || 0),
      status: v.status || 'available',
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
        await apiClient.patch(`/vehicles/${form.id}`, {
          make: form.make,
          model: form.model,
          modelYear: Number(form.year),
          color: form.color,
          vin: form.vin || undefined,
          engineNumber: form.engineNumber || undefined,
          registrationNumber: form.registrationNumber || undefined,
          fuelType: form.fuelType,
          transmissionType: form.transmissionType,
          mileageKm: Number(form.mileageKm || 0),
          askingPrice: Number(form.askingPrice || 0),
          costBasis: Number(form.costBasis || 0),
          status: form.status,
        });
        toast.success('Vehicle Updated', `${form.make} ${form.model} updated successfully.`);
      } else {
        await apiClient.post('/vehicles', {
          branchId: defaultBranchId,
          make: form.make,
          model: form.model,
          modelYear: Number(form.year),
          color: form.color,
          vin: form.vin || undefined,
          engineNumber: form.engineNumber || undefined,
          registrationNumber: form.registrationNumber || undefined,
          fuelType: form.fuelType,
          transmissionType: form.transmissionType,
          mileageKm: Number(form.mileageKm || 0),
          askingPrice: Number(form.askingPrice || 0),
          costBasis: Number(form.costBasis || form.askingPrice || 0),
          status: form.status,
        });
        toast.success('Vehicle Added', `${form.make} ${form.model} added to inventory.`);
      }
      handleCloseModal();
      mutate();
    } catch (err: any) {
      setError(err?.message || 'Failed to save vehicle');
      toast.error('Operation Failed', err?.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/vehicles/${deleteTarget.id}`);
      toast.info('Vehicle Soft-Deleted', `${deleteTarget.make} ${deleteTarget.model} archived.`);
      setDeleteTarget(null);
      mutate();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/vehicles/${id}/restore`, {});
      toast.success('Vehicle Reactivated', 'Vehicle restored to active inventory list.');
      mutate();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate vehicle');
    }
  };

  const columns = [
    {
      key: 'stockId', label: 'Stock ID',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.stockId}</span>,
    },
    {
      key: 'make', label: 'Make & Model',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white">{row.make} {row.model}</div>
          <div className="text-xs text-slate-400">{row.year || row.modelYear} • {row.color || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'costBasis', label: 'Purchase Cost Basis',
      render: (row: any) => <span className="text-slate-300 tabular-nums">{formatPKR(row.costBasis)}</span>,
    },
    {
      key: 'askingPrice', label: 'Asking Price',
      render: (row: any) => <span className="font-semibold text-emerald-400 tabular-nums">{formatPKR(row.askingPrice || row.costBasis)}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt', label: 'Added Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Vehicle"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Vehicle"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Vehicle"
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
            <Car className="w-6 h-6 text-indigo-400" /> Vehicle Inventory & Cost Basis
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage showroom vehicles, cost basis, soft deletions, and record reactivation</p>
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
            {viewDeleted ? 'Viewing Archived Inventory' : 'Show Archived Inventory'}
          </button>
          <Button onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Add Vehicle</Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search make, model, stock ID, VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none" />
        </div>
        <div className="flex gap-2">
          {['', 'available', 'reserved', 'sold'].map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border capitalize transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
            >
              {st === '' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={vehicles} isLoading={isLoading} emptyMessage="No vehicles found." />

      {/* Edit / Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit Vehicle Details' : 'Add New Vehicle'}`} size="xl">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Make</label>
              <input type="text" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required placeholder="e.g. Toyota"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="e.g. Fortuner Legender"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
              <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="e.g. Super White"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">VIN / Chassis #</label>
              <input type="text" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="17-digit VIN"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registration #</label>
              <input type="text" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="e.g. BK-9999"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase / Acquisition Cost Basis (PKR)</label>
              <input type="number" value={form.costBasis} onChange={(e) => setForm({ ...form, costBasis: Number(e.target.value) })} placeholder="e.g. 17200000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asking Price (PKR)</label>
              <input type="number" value={form.askingPrice} onChange={(e) => setForm({ ...form, askingPrice: Number(e.target.value) })} placeholder="e.g. 18500000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>{isEditing ? 'Update Vehicle' : 'Save Vehicle'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Vehicle Confirmation">
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Audit Trail Safe Soft-Delete</p>
              <p>
                Soft-deleting vehicle <strong>{deleteTarget?.make} {deleteTarget?.model}</strong> will archive this vehicle record while keeping all associated purchase, sale, and journal entry records strictly intact.
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
