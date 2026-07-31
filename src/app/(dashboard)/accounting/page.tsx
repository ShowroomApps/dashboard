'use client';

import React, { useState } from 'react';
import { useChartOfAccounts, useJournalEntries, useSales, useExpenses } from '@/lib/use-swr-hooks';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatPKR, formatDate } from '@/lib/format';
import { BookOpen, Layers, FileText, Scale, TrendingUp, DollarSign, Calculator } from 'lucide-react';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'coa' | 'journals'>('pnl');
  const { accounts, isLoading: accountsLoading } = useChartOfAccounts();
  const { entries, isLoading: entriesLoading } = useJournalEntries();
  const { sales } = useSales();
  const { expenses } = useExpenses();

  // P&L Metrics
  const totalSalesRevenue = sales.reduce((s: number, r: any) => s + (parseFloat(r.sellingPrice) || 0), 0);
  const totalCogs = sales.reduce((s: number, r: any) => s + (parseFloat(r.costBasisAtSale) || 0), 0);
  const totalGrossProfit = sales.reduce((s: number, r: any) => s + (parseFloat(r.grossProfit) || 0), 0);
  const totalOperatingExpenses = expenses.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);
  const netOperatingProfit = totalGrossProfit - totalOperatingExpenses;
  const grossProfitMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;
  const netProfitMargin = totalSalesRevenue > 0 ? (netOperatingProfit / totalSalesRevenue) * 100 : 0;

  const coaColumns = [
    {
      key: 'code', label: 'Code',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-bold">{row.code}</span>,
    },
    {
      key: 'name', label: 'Account Name',
      render: (row: any) => <span className="font-semibold text-white">{row.name}</span>,
    },
    {
      key: 'accountType', label: 'Type',
      render: (row: any) => (
        <span className="uppercase text-xs font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          {row.accountType}
        </span>
      ),
    },
    {
      key: 'normalBalance', label: 'Normal Balance',
      render: (row: any) => (
        <span className={`text-xs font-semibold uppercase ${row.normalBalance === 'debit' ? 'text-blue-400' : 'text-purple-400'}`}>
          {row.normalBalance}
        </span>
      ),
    },
    {
      key: 'isSystem', label: 'System Lock',
      render: (row: any) => (
        <span className="text-xs text-slate-400">{row.isSystem ? '✓ Default COA' : 'Custom'}</span>
      ),
    },
  ];

  const journalColumns = [
    {
      key: 'entryNumber', label: 'Journal #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.entryNumber}</span>,
    },
    {
      key: 'memo', label: 'Memo / Narrative',
      render: (row: any) => <span className="text-slate-200">{row.memo || 'Auto-posted financial transaction'}</span>,
    },
    {
      key: 'totalDebit', label: 'Debit / Credit Balance',
      render: (row: any) => (
        <span className="font-semibold text-emerald-400 tabular-nums">
          {formatPKR(row.totalDebit)}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'entryDate', label: 'Posted Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.entryDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" /> General Ledger & Financial Statement (P&L)
        </h1>
        <p className="text-sm text-slate-400 mt-1">Automated Chart of Accounts, Income Statement (Profit & Loss), and balanced double-entry accounting engine</p>
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

      {activeTab === 'pnl' ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400" /> Official Income Statement (Profit & Loss)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Accrual-basis financial statement auto-posted from sales and expense ledger entries</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Net Profit Margin</span>
                <div className={`text-xl font-black tabular-nums ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                <div className={`text-xl font-black tabular-nums ${totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalGrossProfit >= 0 ? '+' : ''}{formatPKR(totalGrossProfit)}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">{grossProfitMargin.toFixed(1)}% Gross Margin</div>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Operating Expenses</div>
              {expenses.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center bg-slate-800/30 rounded-xl">No operating expenses recorded.</div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{exp.account?.name || exp.description || 'Operating Expense'}</div>
                        <div className="text-slate-400">{formatDate(exp.expenseDate)} • {exp.expenseNumber}</div>
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
            <div className={`p-5 rounded-2xl border flex items-center justify-between ${netOperatingProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <div>
                <div className="text-base font-black uppercase tracking-wider text-white">Net Dealership Operating Profit / (Loss)</div>
                <div className="text-xs text-slate-400">Gross Vehicle Profit minus Total Operating Expenses</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black tabular-nums ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netOperatingProfit >= 0 ? '+' : ''}{formatPKR(netOperatingProfit)}
                </div>
                <div className="text-xs font-semibold text-slate-300">{netProfitMargin.toFixed(1)}% Net Margin</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'coa' ? (
        <DataTable columns={coaColumns} data={accounts} isLoading={accountsLoading} emptyMessage="No Chart of Accounts found." />
      ) : (
        <DataTable columns={journalColumns} data={entries} isLoading={entriesLoading} emptyMessage="No posted journal entries found." />
      )}
    </div>
  );
}
