'use client';

import React, { useState, useMemo } from 'react';
import { useChartOfAccounts, useJournalEntries, useSales, useExpenses } from '@/lib/use-swr-hooks';
import { apiClient } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPKR, formatDate } from '@/lib/format';
import {
  BookOpen,
  Layers,
  FileText,
  Scale,
  Calculator,
  Plus,
  Pencil,
  Trash2,
  Search,
  HandCoins,
  Landmark,
  Shield,
  CheckCircle2,
  AlertCircle,
  Users,
  Coins,
  Info,
} from 'lucide-react';

type PresetType = 'loan_given' | 'borrowing_received' | 'partner_equity' | 'custom';

interface AccountFormData {
  id?: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense';
  code: string;
  subType: string;
  normalBalance: 'debit' | 'credit';
  description: string;
  allowDirectPosting: boolean;
  isActive?: boolean;
}

const defaultAccountForm: AccountFormData = {
  name: '',
  accountType: 'asset',
  code: '',
  subType: 'Loans & Advances to Person',
  normalBalance: 'debit',
  description: '',
  allowDirectPosting: true,
};

interface JournalLineForm {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export default function AccountingPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'pnl' | 'coa' | 'journals'>('pnl');

  // Filters for COA
  const [coaSearch, setCoaSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);

  const { accounts, isLoading: accountsLoading, mutate: mutateAccounts } = useChartOfAccounts({
    includeInactive,
  });
  const { entries, isLoading: entriesLoading, mutate: mutateEntries } = useJournalEntries();
  const { sales } = useSales();
  const { expenses } = useExpenses();

  // COA Create / Edit Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('loan_given');
  const [createForm, setCreateForm] = useState<AccountFormData>(defaultAccountForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<AccountFormData>(defaultAccountForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Journal Entry Modal
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalMemo, setJournalMemo] = useState('');
  const [journalLines, setJournalLines] = useState<JournalLineForm[]>([
    { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
    { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
  ]);
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [journalError, setJournalError] = useState('');

  // P&L Metrics
  const totalSalesRevenue = sales.reduce((s: number, r: any) => s + (parseFloat(r.sellingPrice) || 0), 0);
  const totalCogs = sales.reduce((s: number, r: any) => s + (parseFloat(r.costBasisAtSale) || 0), 0);
  const totalGrossProfit = sales.reduce((s: number, r: any) => s + (parseFloat(r.grossProfit) || 0), 0);
  const totalOperatingExpenses = expenses.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);
  const netOperatingProfit = totalGrossProfit - totalOperatingExpenses;
  const grossProfitMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;
  const netProfitMargin = totalSalesRevenue > 0 ? (netOperatingProfit / totalSalesRevenue) * 100 : 0;

  // Preset switch handler
  const handlePresetSelect = (preset: PresetType) => {
    setSelectedPreset(preset);
    setCreateError('');
    if (preset === 'loan_given') {
      setCreateForm({
        name: '',
        accountType: 'asset',
        code: '',
        subType: 'Loans & Advances to Person',
        normalBalance: 'debit',
        description: '',
        allowDirectPosting: true,
      });
    } else if (preset === 'borrowing_received') {
      setCreateForm({
        name: '',
        accountType: 'liability',
        code: '',
        subType: 'Borrowings & Loans from Person',
        normalBalance: 'credit',
        description: '',
        allowDirectPosting: true,
      });
    } else if (preset === 'partner_equity') {
      setCreateForm({
        name: '',
        accountType: 'equity',
        code: '',
        subType: 'Partner / Investor Capital',
        normalBalance: 'credit',
        description: '',
        allowDirectPosting: true,
      });
    } else {
      setCreateForm({
        name: '',
        accountType: 'asset',
        code: '',
        subType: 'General Custom Account',
        normalBalance: 'debit',
        description: '',
        allowDirectPosting: true,
      });
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    handlePresetSelect('loan_given');
    setCreateError('');
    setShowCreateModal(true);
  };

  // Submit Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      if (!createForm.name.trim()) {
        throw new Error('Please enter an account name.');
      }

      await apiClient.post('/accounting/chart-of-accounts', {
        name: createForm.name.trim(),
        accountType: createForm.accountType,
        code: createForm.code.trim() || undefined,
        subType: createForm.subType.trim() || undefined,
        normalBalance: createForm.normalBalance,
        description: createForm.description.trim() || undefined,
        allowDirectPosting: createForm.allowDirectPosting,
      });

      toast.success('Account Created', `Chart of account '${createForm.name}' has been created.`);
      setShowCreateModal(false);
      mutateAccounts();
    } catch (err: any) {
      const msg = err?.message || 'Failed to create chart of account';
      setCreateError(msg);
      toast.error('Creation Failed', msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: any) => {
    setEditForm({
      id: acc.id,
      name: acc.name,
      accountType: acc.accountType,
      code: acc.code,
      subType: acc.subType || '',
      normalBalance: acc.normalBalance,
      description: acc.description || '',
      allowDirectPosting: acc.allowDirectPosting ?? true,
      isActive: acc.isActive ?? true,
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Submit Edit Account
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      await apiClient.patch(`/accounting/chart-of-accounts/${editForm.id}`, {
        name: editForm.name.trim(),
        code: editForm.code.trim() || undefined,
        subType: editForm.subType.trim() || undefined,
        description: editForm.description.trim() || undefined,
        allowDirectPosting: editForm.allowDirectPosting,
        isActive: editForm.isActive,
      });

      toast.success('Account Updated', `Account '${editForm.name}' has been updated.`);
      setShowEditModal(false);
      mutateAccounts();
    } catch (err: any) {
      const msg = err?.message || 'Failed to update account';
      setEditError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete / Deactivate Account
  const handleDeleteAccount = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res: any = await apiClient.delete(`/accounting/chart-of-accounts/${deleteTarget.id}`);
      if (res?.deactivated) {
        toast.info('Account Deactivated', res.message || 'Account deactivated.');
      } else {
        toast.success('Account Deleted', 'Chart of account deleted successfully.');
      }
      setDeleteTarget(null);
      mutateAccounts();
    } catch (err: any) {
      toast.error('Action Failed', err?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Journal Posting Calculations
  const totalDebitSum = journalLines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0);
  const totalCreditSum = journalLines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0);
  const isJournalBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.001 && totalDebitSum > 0;

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setJournalSubmitting(true);
    setJournalError('');

    try {
      if (!isJournalBalanced) {
        throw new Error(`Debits (${formatPKR(totalDebitSum)}) must equal Credits (${formatPKR(totalCreditSum)}).`);
      }
      if (!journalMemo.trim()) {
        throw new Error('Please enter a description / memo for this journal transaction.');
      }
      for (const line of journalLines) {
        if (!line.accountId) {
          throw new Error('Please select an account for all journal lines.');
        }
      }

      await apiClient.post('/accounting/journal-entries', {
        entryDate: journalDate,
        description: journalMemo.trim(),
        lines: journalLines.map((line) => ({
          accountId: line.accountId,
          debitAmount: Number(line.debitAmount) || 0,
          creditAmount: Number(line.creditAmount) || 0,
          description: line.description.trim() || journalMemo.trim(),
        })),
      });

      toast.success('Journal Posted', 'Balanced double-entry journal entry has been posted.');
      setShowJournalModal(false);
      setJournalMemo('');
      setJournalLines([
        { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
        { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
      ]);
      mutateEntries();
      mutateAccounts();
    } catch (err: any) {
      const msg = err?.message || 'Failed to post journal entry';
      setJournalError(msg);
      toast.error('Posting Failed', msg);
    } finally {
      setJournalSubmitting(false);
    }
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc: any) => {
      if (selectedType !== 'all' && acc.accountType !== selectedType) {
        return false;
      }
      if (!includeInactive && acc.isActive === false) {
        return false;
      }
      if (coaSearch.trim()) {
        const q = coaSearch.toLowerCase();
        const matchesName = acc.name?.toLowerCase().includes(q);
        const matchesCode = acc.code?.toLowerCase().includes(q);
        const matchesDesc = acc.description?.toLowerCase().includes(q);
        const matchesSub = acc.subType?.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDesc || matchesSub;
      }
      return true;
    });
  }, [accounts, selectedType, includeInactive, coaSearch]);

  // COA KPI Counts
  const coaStats = useMemo(() => {
    const assetsCount = accounts.filter((a: any) => a.accountType === 'asset').length;
    const liabilitiesCount = accounts.filter((a: any) => a.accountType === 'liability').length;
    const equityCount = accounts.filter((a: any) => a.accountType === 'equity').length;
    const customCount = accounts.filter((a: any) => !a.isSystem).length;
    return { assetsCount, liabilitiesCount, equityCount, customCount };
  }, [accounts]);

  const coaColumns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: any) => (
        <span className="font-mono text-xs text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Account Name & Category',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white flex items-center gap-2">
            {row.name}
            {!row.isActive && (
              <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                Inactive
              </span>
            )}
          </div>
          {row.subType && (
            <div className="text-xs text-indigo-300/80 mt-0.5 flex items-center gap-1">
              <span>{row.subType}</span>
            </div>
          )}
          {row.description && (
            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'accountType',
      label: 'Classification',
      render: (row: any) => {
        const typeColors: Record<string, string> = {
          asset: 'text-sky-300 bg-sky-950/40 border-sky-800/60',
          liability: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
          equity: 'text-purple-300 bg-purple-950/40 border-purple-800/60',
          revenue: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60',
          cogs: 'text-orange-300 bg-orange-950/40 border-orange-800/60',
          expense: 'text-rose-300 bg-rose-950/40 border-rose-800/60',
        };
        const colorClass = typeColors[row.accountType] || 'text-slate-300 bg-slate-800 border-slate-700';
        return (
          <span className={`uppercase text-[11px] font-bold px-2.5 py-1 rounded-lg border ${colorClass}`}>
            {row.accountType}
          </span>
        );
      },
    },
    {
      key: 'normalBalance',
      label: 'Normal Balance',
      render: (row: any) => (
        <span
          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
            row.normalBalance === 'debit'
              ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
              : 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
          }`}
        >
          {row.normalBalance}
        </span>
      ),
    },
    {
      key: 'currentBalance',
      label: 'Running Balance',
      render: (row: any) => {
        const bal = parseFloat(row.currentBalance) || 0;
        return (
          <div className="text-right font-mono font-bold tabular-nums">
            <span className={bal !== 0 ? 'text-emerald-400' : 'text-slate-400'}>
              {formatPKR(bal)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'isSystem',
      label: 'Lock',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.isSystem ? (
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              <Shield className="w-3 h-3 text-indigo-400" /> Default COA
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-800/50">
              <Users className="w-3 h-3" /> Custom
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => {
        if (row.isSystem) {
          return <span className="text-xs text-slate-500 italic">Protected</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              title="Edit Account"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Delete or Deactivate Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const journalColumns = [
    {
      key: 'entryNumber',
      label: 'Journal #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.entryNumber}</span>,
    },
    {
      key: 'description',
      label: 'Memo / Description',
      render: (row: any) => (
        <div>
          <span className="text-slate-200 font-medium">{row.description || 'General Ledger Entry'}</span>
          {row.lines && row.lines.length > 0 && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              {row.lines.map((l: any) => l.account?.name || l.accountId).join(' ➔ ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'totalDebit',
      label: 'Balanced Amount',
      render: (row: any) => {
        const amount =
          row.lines && row.lines.length > 0
            ? row.lines.reduce((s: number, l: any) => s + (parseFloat(l.debitAmount) || 0), 0)
            : row.totalDebit || 0;
        return <span className="font-semibold text-emerald-400 tabular-nums">{formatPKR(amount)}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <StatusBadge status={row.status || 'posted'} />,
    },
    {
      key: 'entryDate',
      label: 'Posted Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.entryDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" /> General Ledger & Financial Statement (P&L)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated Chart of Accounts, Income Statement (Profit & Loss), and balanced double-entry accounting engine
          </p>
        </div>
        {activeTab === 'coa' && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500">
            <Plus className="w-4 h-4" /> Add New Account
          </Button>
        )}
        {activeTab === 'journals' && (
          <Button onClick={() => setShowJournalModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500">
            <Plus className="w-4 h-4" /> Post Journal Entry
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pnl'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" /> Profit & Loss Statement (P&L)
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'coa'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Chart of Accounts (COA)
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'journals'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Journal Entries
        </button>
      </div>

      {/* TAB 1: P&L */}
      {activeTab === 'pnl' ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400" /> Official Income Statement (Profit & Loss)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accrual-basis financial statement auto-posted from sales and expense ledger entries
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Net Profit Margin</span>
                <div
                  className={`text-xl font-black tabular-nums ${
                    netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {netProfitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Operating Revenue Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Operating Revenue</div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">4100 — Vehicle Sales Revenue</div>
                  <div className="text-xs text-slate-400">{sales.length} completed vehicle sale transactions</div>
                </div>
                <div className="text-base font-bold text-white tabular-nums">{formatPKR(totalSalesRevenue)}</div>
              </div>
            </div>

            {/* Cost of Goods Sold Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Cost of Goods Sold (COGS)</div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-300">5100 — Cost of Vehicles Sold</div>
                  <div className="text-xs text-slate-400">Capitalized purchase price + pre-sale repair cost basis</div>
                </div>
                <div className="text-base font-bold text-slate-300 tabular-nums">{formatPKR(totalCogs)}</div>
              </div>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Gross Vehicle Profit</div>
                <div className="text-xs text-slate-400">Total Revenue minus Cost of Vehicles Sold</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xl font-black tabular-nums ${
                    totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {totalGrossProfit >= 0 ? '+' : ''}
                  {formatPKR(totalGrossProfit)}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">{grossProfitMargin.toFixed(1)}% Gross Margin</div>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Operating Expenses</div>
              {expenses.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center bg-slate-800/30 rounded-xl">
                  No operating expenses recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {exp.account?.name || exp.description || 'Operating Expense'}
                        </div>
                        <div className="text-slate-400">
                          {formatDate(exp.expenseDate)} • {exp.expenseNumber}
                        </div>
                      </div>
                      <div className="font-bold text-slate-300 tabular-nums">{formatPKR(exp.amount)}</div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between font-semibold text-xs text-slate-300">
                    <span>Total Operating Expenses</span>
                    <span className="tabular-nums font-bold text-slate-200">{formatPKR(totalOperatingExpenses)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Net Operating Income Summary */}
            <div
              className={`p-5 rounded-2xl border flex items-center justify-between ${
                netOperatingProfit >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div>
                <div className="text-base font-black uppercase tracking-wider text-white">
                  Net Dealership Operating Profit / (Loss)
                </div>
                <div className="text-xs text-slate-400">Gross Vehicle Profit minus Total Operating Expenses</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-black tabular-nums ${
                    netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {netOperatingProfit >= 0 ? '+' : ''}
                  {formatPKR(netOperatingProfit)}
                </div>
                <div className="text-xs font-semibold text-slate-300">{netProfitMargin.toFixed(1)}% Net Margin</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'coa' ? (
        /* TAB 2: CHART OF ACCOUNTS */
        <div className="space-y-5">
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Total Accounts</div>
              <div className="text-xl font-bold text-white mt-1">{accounts.length} Accounts</div>
              <div className="text-[11px] text-indigo-400 mt-0.5">{coaStats.customCount} user-created custom</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Assets (1xxx)</div>
              <div className="text-xl font-bold text-sky-400 mt-1">{coaStats.assetsCount} Accounts</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cash, Banks, Loans Given</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Liabilities (2xxx)</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{coaStats.liabilitiesCount} Accounts</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Payables, Borrowed Loans</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Equity (3xxx)</div>
              <div className="text-xl font-bold text-purple-400 mt-1">{coaStats.equityCount} Accounts</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Owner & Partner Capital</div>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={coaSearch}
                onChange={(e) => setCoaSearch(e.target.value)}
                placeholder="Search account name, code, category, or note..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All', value: 'all' },
                { label: 'Assets', value: 'asset' },
                { label: 'Liabilities', value: 'liability' },
                { label: 'Equity', value: 'equity' },
                { label: 'Revenue', value: 'revenue' },
                { label: 'Expenses', value: 'expense' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedType === t.value
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <label className="flex items-center gap-1.5 text-xs text-slate-400 ml-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                Show Inactive
              </label>
            </div>
          </div>

          {/* Accounts DataTable */}
          <DataTable
            columns={coaColumns}
            data={filteredAccounts}
            isLoading={accountsLoading}
            emptyMessage="No Chart of Accounts match the selected filters."
          />
        </div>
      ) : (
        /* TAB 3: JOURNAL ENTRIES */
        <div className="space-y-4">
          <DataTable
            columns={journalColumns}
            data={entries}
            isLoading={entriesLoading}
            emptyMessage="No posted journal entries found."
          />
        </div>
      )}

      {/* MODAL: CREATE CHART OF ACCOUNT */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Account in Chart of Accounts" size="lg">
        <form onSubmit={handleCreateAccount} className="space-y-5">
          {createError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Quick Preset Selector Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Account Purpose / Scenario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Preset 1: Money Given to Person */}
              <div
                onClick={() => handlePresetSelect('loan_given')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'loan_given'
                    ? 'bg-sky-950/40 border-sky-500/80 shadow-md ring-1 ring-sky-500'
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-sky-400">
                  <HandCoins className="w-4 h-4" /> Give Money to Person (Loan / Advance)
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Track money lent or advanced to an individual or third party. Stored as an <strong>Asset (Receivable)</strong>.
                </div>
                <div className="text-[11px] text-sky-300/80 mt-1.5 font-mono">
                  Code Range: 1150–1199 • Normal Balance: DEBIT
                </div>
              </div>

              {/* Preset 2: Borrow Investment from Person */}
              <div
                onClick={() => handlePresetSelect('borrowing_received')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'borrowing_received'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500'
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-amber-400">
                  <Coins className="w-4 h-4" /> Borrow Investment / Loan from Person
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Track money or loan borrowed from a person/lender to be repaid. Stored as a <strong>Liability (Payable)</strong>.
                </div>
                <div className="text-[11px] text-amber-300/80 mt-1.5 font-mono">
                  Code Range: 2120–2199 • Normal Balance: CREDIT
                </div>
              </div>

              {/* Preset 3: Partner Capital */}
              <div
                onClick={() => handlePresetSelect('partner_equity')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'partner_equity'
                    ? 'bg-purple-950/40 border-purple-500/80 shadow-md ring-1 ring-purple-500'
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-purple-400">
                  <Landmark className="w-4 h-4" /> Partner / Investor Capital (Equity)
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Permanent capital or equity invested by business partner/investor. Stored as <strong>Equity</strong>.
                </div>
                <div className="text-[11px] text-purple-300/80 mt-1.5 font-mono">
                  Code Range: 3300–3399 • Normal Balance: CREDIT
                </div>
              </div>

              {/* Preset 4: Custom Account */}
              <div
                onClick={() => handlePresetSelect('custom')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'custom'
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-indigo-400">
                  <BookOpen className="w-4 h-4" /> General Custom Account
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Configure custom expense, asset, liability, revenue, or COGS account freely.
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Select any category and customized normal balance
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder={
                  selectedPreset === 'loan_given'
                    ? 'e.g. Loan to Usman Tariq'
                    : selectedPreset === 'borrowing_received'
                    ? 'e.g. Loan Borrowed from Bilal Khan'
                    : selectedPreset === 'partner_equity'
                    ? 'e.g. Partner Capital - Tariq Mahmood'
                    : 'e.g. Custom Account Name'
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sub-Type / Category
              </label>
              <input
                type="text"
                value={createForm.subType}
                onChange={(e) => setCreateForm({ ...createForm, subType: e.target.value })}
                placeholder="e.g. Loans & Advances"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Classification <span className="text-rose-400">*</span>
              </label>
              <select
                value={createForm.accountType}
                onChange={(e: any) => {
                  const newType = e.target.value;
                  const newBalance =
                    newType === 'asset' || newType === 'expense' || newType === 'cogs' ? 'debit' : 'credit';
                  setCreateForm({
                    ...createForm,
                    accountType: newType,
                    normalBalance: newBalance,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="asset">Asset (1xxx) — e.g. Loan Given, Receivables, Cash/Bank</option>
                <option value="liability">Liability (2xxx) — e.g. Borrowed Loan, Payables</option>
                <option value="equity">Equity (3xxx) — e.g. Partner / Investor Capital</option>
                <option value="revenue">Revenue (4xxx) — e.g. Sales, Fees</option>
                <option value="cogs">Cost of Goods Sold (5xxx)</option>
                <option value="expense">Operating Expense (6xxx)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Code <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                placeholder="Auto-generated if left empty"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave blank to automatically assign the next free code.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Normal Balance</label>
              <select
                value={createForm.normalBalance}
                onChange={(e: any) => setCreateForm({ ...createForm, normalBalance: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="debit">DEBIT (Standard for Assets and Expenses)</option>
                <option value="credit">CREDIT (Standard for Liabilities, Equity, Revenue)</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={createForm.allowDirectPosting}
                  onChange={(e) => setCreateForm({ ...createForm, allowDirectPosting: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                Allow Direct Journal Posting
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Person Details / Notes
            </label>
            <textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="e.g. Contact number, CNIC, loan repayment agreement, interest-free term, or specific notes..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSubmitting} className="bg-indigo-600 hover:bg-indigo-500">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT CHART OF ACCOUNT */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Chart of Account" size="md">
        <form onSubmit={handleUpdateAccount} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Name</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Code</label>
              <input
                type="text"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sub-Type</label>
              <input
                type="text"
                value={editForm.subType}
                onChange={(e) => setEditForm({ ...editForm, subType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={editForm.allowDirectPosting}
                onChange={(e) => setEditForm({ ...editForm, allowDirectPosting: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              Allow Direct Posting
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              Active Account
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={editSubmitting} className="bg-indigo-600 hover:bg-indigo-500">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE / DEACTIVATE CONFIRMATION */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete / Deactivate Account" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove or deactivate account{' '}
            <strong className="text-white">
              {deleteTarget?.code} — {deleteTarget?.name}
            </strong>
            ?
          </p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              If this account has recorded journal transactions, it will be safely deactivated to preserve your general ledger audit history.
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDeleteAccount}>
              Confirm Delete / Deactivate
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: POST BALANCED JOURNAL ENTRY */}
      <Modal isOpen={showJournalModal} onClose={() => setShowJournalModal(false)} title="Post Double-Entry Journal Transaction" size="lg">
        <form onSubmit={handlePostJournal} className="space-y-4">
          {journalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{journalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Memo / Description <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={journalMemo}
                onChange={(e) => setJournalMemo(e.target.value)}
                placeholder="e.g. Disbursed loan to Usman Tariq from Cash on Hand"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Journal Entry Lines</span>
              <button
                type="button"
                onClick={() =>
                  setJournalLines([
                    ...journalLines,
                    { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
                  ])
                }
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            {journalLines.map((line, idx) => (
              <div key={idx} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[11px] text-slate-400 mb-0.5">Account #{idx + 1}</label>
                  <select
                    required
                    value={line.accountId}
                    onChange={(e) => {
                      const updated = [...journalLines];
                      updated[idx].accountId = e.target.value;
                      setJournalLines(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Account...</option>
                    {accounts
                      .filter((a: any) => a.allowDirectPosting && a.isActive)
                      .map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name} ({a.accountType.toUpperCase()})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-span-5 md:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-0.5">Debit (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={line.debitAmount || ''}
                    onChange={(e) => {
                      const updated = [...journalLines];
                      updated[idx].debitAmount = parseFloat(e.target.value) || 0;
                      if (parseFloat(e.target.value) > 0) updated[idx].creditAmount = 0;
                      setJournalLines(updated);
                    }}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-5 md:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-0.5">Credit (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={line.creditAmount || ''}
                    onChange={(e) => {
                      const updated = [...journalLines];
                      updated[idx].creditAmount = parseFloat(e.target.value) || 0;
                      if (parseFloat(e.target.value) > 0) updated[idx].debitAmount = 0;
                      setJournalLines(updated);
                    }}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 md:col-span-1 flex justify-end pt-3">
                  {journalLines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setJournalLines(journalLines.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Balancing Indicator */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              isJournalBalanced
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isJournalBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Journal Entry is Balanced</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>
                    Unbalanced by {formatPKR(Math.abs(totalDebitSum - totalCreditSum))}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 tabular-nums">
              <span>Total Debits: {formatPKR(totalDebitSum)}</span>
              <span>Total Credits: {formatPKR(totalCreditSum)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowJournalModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isJournalBalanced}
              loading={journalSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Post Journal Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
