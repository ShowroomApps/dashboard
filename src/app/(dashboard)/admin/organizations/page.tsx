'use client';

import React, { useState } from 'react';
import { useOrganizations } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { Building2, Plus, Globe, Facebook, ExternalLink, Pencil, Trash2, RotateCcw, ShieldAlert, Key, UserCheck, Users, Shield } from 'lucide-react';

const initialForm = {
  id: '', name: '', displayName: '', slug: '', logoUrl: '', website: '', facebookPageUrl: '',
  city: 'Karachi', country: 'Pakistan', currencyCode: 'PKR', timezone: 'Asia/Karachi',
  adminEmail: '', adminPassword: '', adminFullName: '',
};

export default function AdminOrganizationsPage() {
  const toast = useToast();
  const [viewDeleted, setViewDeleted] = useState(false);
  const { organizations, isLoading, mutate } = useOrganizations({ includeDeleted: viewDeleted ? 'only' : 'false' });

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // User inspection modal state
  const [viewUsersTarget, setViewUsersTarget] = useState<any>(null);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleOpenUsersModal = async (org: any) => {
    setViewUsersTarget(org);
    setLoadingUsers(true);
    setOrgUsers([]);
    try {
      const res: any = await apiClient.get(`/organizations/${org.id}/users`);
      setOrgUsers(res.data || []);
    } catch (err) {
      toast.error('Fetch Failed', 'Failed to load user accounts for organization');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenCreate = () => {
    setError('');
    setIsEditing(false);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (org: any) => {
    setError('');
    setIsEditing(true);
    setForm({
      id: org.id,
      name: org.name || '',
      displayName: org.displayName || org.display_name || org.name || '',
      slug: org.slug || '',
      logoUrl: org.logoUrl || org.logo_url || '',
      website: org.website || '',
      facebookPageUrl: org.facebookPageUrl || org.facebook_page_url || '',
      city: org.city || 'Karachi',
      country: org.country || 'Pakistan',
      currencyCode: org.currencyCode || org.currency_code || 'PKR',
      timezone: org.timezone || 'Asia/Karachi',
      adminEmail: '', adminPassword: '', adminFullName: '',
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
      if (isEditing && form.id) {
        await apiClient.patch(`/organizations/${form.id}`, {
          displayName: form.displayName || form.name,
          logoUrl: form.logoUrl || undefined,
          website: form.website || undefined,
          facebookPageUrl: form.facebookPageUrl || undefined,
        });
        toast.success('Organization Settings Updated', `${form.displayName || form.name} profile updated successfully.`);
      } else {
        await apiClient.post('/organizations', {
          name: form.name,
          displayName: form.displayName || form.name,
          slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          logoUrl: form.logoUrl || undefined,
          website: form.website || undefined,
          facebookPageUrl: form.facebookPageUrl || undefined,
          city: form.city,
          country: form.country,
          currencyCode: form.currencyCode,
          timezone: form.timezone,
          adminEmail: form.adminEmail || undefined,
          adminPassword: form.adminPassword || undefined,
          adminFullName: form.adminFullName || undefined,
        });
        toast.success('SaaS Organization Onboarded', `${form.displayName || form.name} onboarded with initial admin user.`);
      }
      handleCloseModal();
      mutate();
    } catch (err: any) {
      setError(err?.message || 'Failed to save organization');
      toast.error('Operation Failed', err?.message || 'Failed to save organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/organizations/${deleteTarget.id}`);
      toast.info('Organization Soft-Deleted', `${deleteTarget.displayName || deleteTarget.name} deactivated.`);
      setDeleteTarget(null);
      mutate();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Failed to soft delete organization');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/organizations/${id}/restore`, {});
      toast.success('Organization Reactivated', 'SaaS organization reactivated.');
      mutate();
    } catch (err: any) {
      toast.error('Restoration Failed', err?.message || 'Failed to reactivate organization');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Organization',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          {row.logoUrl || row.logo_url ? (
            <img src={row.logoUrl || row.logo_url} alt={row.name} className="w-9 h-9 rounded-xl object-contain bg-slate-800 border border-slate-700 p-1" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {(row.displayName || row.name || 'O').charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-white">{row.displayName || row.name}</div>
            <div className="text-xs font-mono text-indigo-400">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'digitalPresence', label: 'Website & Socials',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.website ? (
            <a href={row.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:underline">
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          ) : <span className="text-xs text-slate-500">—</span>}
          {row.facebookPageUrl || row.facebook_page_url ? (
            <a href={row.facebookPageUrl || row.facebook_page_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          ) : null}
        </div>
      ),
    },
    {
      key: 'currencyCode', label: 'Currency',
      render: (row: any) => <span className="text-xs font-semibold text-slate-300">{row.currencyCode || row.currency_code || 'PKR'}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenUsersModal(row)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all"
            title="View Showroom Users & Admins"
          >
            <Users className="w-3.5 h-3.5" /> Users
          </button>

          {row.deletedAt ? (
            <button
              onClick={() => handleRestore(row.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
              title="Reactivate Organization"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                title="Edit Organization"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                title="Soft Delete Organization"
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
            <Building2 className="w-6 h-6 text-indigo-400" /> SaaS Client Organizations Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">Platform Super Admin portal: Onboard dealership tenants, provision showroom admins, manage settings, and soft delete</p>
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
            {viewDeleted ? 'Viewing Archived SaaS Clients' : 'Show Archived SaaS Clients'}
          </button>
          <Button onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Onboard Organization</Button>
        </div>
      </div>

      <DataTable columns={columns} data={organizations} isLoading={isLoading} emptyMessage="No SaaS client organizations found." />

      {/* View Users Modal */}
      <Modal isOpen={!!viewUsersTarget} onClose={() => setViewUsersTarget(null)} title={`Showroom Users & Accounts — ${viewUsersTarget?.displayName || viewUsersTarget?.name}`} size="lg">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Registered user accounts and administrators tied to organization <span className="text-indigo-400 font-semibold font-mono">{viewUsersTarget?.slug}</span>
          </p>

          {loadingUsers ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading user accounts...</div>
          ) : orgUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No user accounts found for this showroom.</div>
          ) : (
            <div className="space-y-2">
              {orgUsers.map((u) => (
                <div key={u.id} className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {u.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{u.fullName}</div>
                      <div className="text-xs text-indigo-400 font-mono">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <UserCheck className="w-3 h-3" /> Active Account
                    </span>
                    <span className="text-xs text-slate-500">Joined {formatDate(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setViewUsersTarget(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Edit / Onboard Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={`${isEditing ? 'Edit Organization Settings' : 'Onboard New Dealership Tenant'}`} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Diwan Motors (Pvt) Ltd"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="e.g. Diwan Motors"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Slug (Subdomain)</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. diwan-motors"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Logo URL</label>
              <input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://diwanmotors.pk"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Facebook Page URL</label>
              <input type="url" value={form.facebookPageUrl} onChange={(e) => setForm({ ...form, facebookPageUrl: e.target.value })} placeholder="https://facebook.com/diwanmotors"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>

          {!isEditing && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3 mt-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Key className="w-4 h-4" /> Provision Dedicated Showroom Admin Account (Optional)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Admin Email</label>
                  <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@dealership.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                  <input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="••••••••••"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={submitting}>{isEditing ? 'Update Organization' : 'Onboard Organization'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Soft Delete Organization Confirmation">
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">Platform Admin Soft-Delete Guarantee</p>
              <p>
                Soft-deleting SaaS organization <strong>{deleteTarget?.displayName || deleteTarget?.name}</strong> will deactivate tenant access while keeping all customer, vehicle, sales, and accounting records preserved in the system database.
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
