'use client';

import React, { useState } from 'react';
import { useCustomers, useSellers } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Users, Plus, UserCheck, Truck, Pencil, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';

const initialForm = {
  id: '', name: '', phone: '', email: '', cnic: '', city: 'Karachi', address: '', notes: '',
};

export default function ContactsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'customers' | 'sellers'>('customers');
  const [viewDeleted, setViewDeleted] = useState(false);
  const { customers, isLoading: customersLoading, mutate: mutateCustomers } = useCustomers({ includeDeleted: viewDeleted ? 'only' : 'false' });
  const { sellers, isLoading: sellersLoading, mutate: mutateSellers } = useSellers({ includeDeleted: viewDeleted ? 'only' : 'false' });

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

  const handleOpenEdit = (item: any) => {
    setError('');
    setIsEditing(true);
    setForm({
      id: item.id,
      name: item.name || item.fullName || '',
      phone: item.phone || '',
      email: item.email || '',
      cnic: item.cnic || '',
      city: item.city || 'Karachi',
      address: item.address || '',
      notes: item.notes || '',
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
    try {
      const endpoint = activeTab === 'customers' ? '/customers' : '/sellers';
      const entityLabel = activeTab === 'customers' ? 'Customer' : 'Seller';
      if (isEditing && form.id) {
        await apiClient.patch(`${endpoint}/${form.id}`, {
          name: form.name,
          phone: form.phone,
          email: form.email,
          cnic: form.cnic,
          city: form.city,
          address: form.address,
          notes: form.notes,
        });
        toast.success(`${entityLabel} Updated`, `${form.name} profile has been updated successfully.`);
      } else {
        await apiClient.post(endpoint, {
          name: form.name,
          phone: form.phone,
          email: form.email,
          cnic: form.cnic,
          city: form.city,
          address: form.address,
          notes: form.notes,
        });
        toast.success(`New ${entityLabel} Added`, `${form.name} has been added successfully.`);
      }
      handleCloseModal();
      activeTab === 'customers' ? mutateCustomers() : mutateSellers();
    } catch (err: any) {
      setError(err?.message || 'Failed to save contact');
      toast.error('Operation Failed', err?.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const entityLabel = activeTab === 'customers' ? 'Customer' : 'Seller';
    try {
      const endpoint = activeTab === 'customers' ? '/customers' : '/sellers';
      await apiClient.delete(`${endpoint}/${deleteTarget.id}`);
      toast.info(`${entityLabel} Soft-Deleted`, `${deleteTarget.name || deleteTarget.fullName} has been archived. Associated records remain intact.`);
      setDeleteTarget(null);
      activeTab === 'customers' ? mutateCustomers() : mutateSellers();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete contact');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    const entityLabel = activeTab === 'customers' ? 'Customer' : 'Seller';
    try {
      const endpoint = activeTab === 'customers' ? '/customers' : '/sellers';
      await apiClient.post(`${endpoint}/${id}/restore`, {});
      toast.success(`${entityLabel} Reactivated`, `Contact record has been restored to active list.`);
      activeTab === 'customers' ? mutateCustomers() : mutateSellers();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate contact');
    }
  };

  const customerColumns = [
    {
      key: 'customerNumber', label: 'Customer #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.customerNumber}</span>,
    },
    {
      key: 'name', label: 'Full Name',
      render: (row: any) => <span className="font-semibold text-white">{row.name || row.fullName}</span>,
    },
    {
      key: 'phone', label: 'Phone',
      render: (row: any) => <span className="text-slate-300">{row.phone || '—'}</span>,
    },
    {
      key: 'cnic', label: 'CNIC / National ID',
      render: (row: any) => <span className="font-mono text-xs text-slate-400">{row.cnic || '—'}</span>,
    },
    {
      key: 'city', label: 'City',
      render: (row: any) => <span className="text-slate-300">{row.city || '—'}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Customer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Customer"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Customer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const sellerColumns = [
    {
      key: 'sellerNumber', label: 'Seller #',
      render: (row: any) => <span className="font-mono text-xs text-amber-400 font-semibold">{row.sellerNumber}</span>,
    },
    {
      key: 'name', label: 'Full Name / Company',
      render: (row: any) => <span className="font-semibold text-white">{row.name || row.fullName}</span>,
    },
    {
      key: 'phone', label: 'Phone',
      render: (row: any) => <span className="text-slate-300">{row.phone || '—'}</span>,
    },
    {
      key: 'sellerType', label: 'Type',
      render: (row: any) => <span className="capitalize text-xs font-semibold text-slate-300">{row.sellerType || 'individual'}</span>,
    },
    {
      key: 'city', label: 'City',
      render: (row: any) => <span className="text-slate-300">{row.city || '—'}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Seller"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Seller"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Seller"
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
            <Users className="w-6 h-6 text-emerald-400" /> Customers & Vehicle Sellers
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage buyers, individual sellers, soft deletions, and record reactivation</p>
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
            {viewDeleted ? 'Viewing Archived Items' : 'Show Archived Items'}
          </button>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> Add {activeTab === 'customers' ? 'Customer' : 'Seller'}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'customers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Customers ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sellers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" /> Sellers ({sellers.length})
        </button>
      </div>

      {activeTab === 'customers' ? (
        <DataTable columns={customerColumns} data={customers} isLoading={customersLoading} emptyMessage="No customer records found." />
      ) : (
        <DataTable columns={sellerColumns} data={sellers} isLoading={sellersLoading} emptyMessage="No seller records found." />
      )}

      {/* Edit / Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit' : 'Add New'} ${activeTab === 'customers' ? 'Customer' : 'Seller'}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Tariq Mehmood"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+923001234567"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CNIC / ID</label>
              <input type="text" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="42101-1234567-1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>{isEditing ? 'Update' : 'Save'} {activeTab === 'customers' ? 'Customer' : 'Seller'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Confirmation">
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Safe Soft-Delete Guarantee</p>
              <p>
                Soft-deleting <strong>{deleteTarget?.name || deleteTarget?.fullName}</strong> will hide this record from active dropdowns while preserving all associated financial ledger entries and vehicle transaction histories.
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
