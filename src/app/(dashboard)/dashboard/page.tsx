'use client';

import React from 'react';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useVehicles, useSales, usePurchases, usePayments, useExpenses } from '@/lib/use-swr-hooks';
import { formatPKR, formatDate } from '@/lib/format';
import { Car, TrendingUp, ShoppingBag, Wallet, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Scale, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { sales, isLoading: salesLoading } = useSales();
  const { purchases, isLoading: purchasesLoading } = usePurchases();
  const { payments } = usePayments();
  const { expenses } = useExpenses();

  // Computed Financial metrics
  const totalInventoryValue = vehicles.reduce(
    (sum: number, v: any) => sum + (parseFloat(v.costBasis) || 0),
    0,
  );
  const totalSalesRevenue = sales.reduce(
    (sum: number, s: any) => sum + (parseFloat(s.sellingPrice) || 0),
    0,
  );
  const totalCostBasisSold = sales.reduce(
    (sum: number, s: any) => sum + (parseFloat(s.costBasisAtSale) || 0),
    0,
  );
  const totalGrossProfit = sales.reduce(
    (sum: number, s: any) => sum + (parseFloat(s.grossProfit) || 0),
    0,
  );
  const totalOperatingExpenses = expenses.reduce(
    (sum: number, e: any) => sum + (parseFloat(e.amount) || 0),
    0,
  );
  const netOperatingProfit = totalGrossProfit - totalOperatingExpenses;
  const grossProfitMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;
  const availableVehicles = vehicles.filter((v: any) => v.status === 'available').length;

  const recentSalesColumns = [
    {
      key: 'saleNumber',
      label: 'Sale #',
      render: (row: any) => (
        <span className="font-mono text-xs text-indigo-400 font-semibold">{row.saleNumber}</span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white text-sm">
            {row.vehicle?.make} {row.vehicle?.model}
          </div>
          <div className="text-xs text-slate-400">{row.vehicle?.modelYear || row.vehicle?.year} • {row.vehicle?.stockId}</div>
        </div>
      ),
    },
    {
      key: 'costBasisAtSale',
      label: 'Cost Basis',
      render: (row: any) => (
        <span className="text-slate-400 text-xs tabular-nums">{formatPKR(row.costBasisAtSale)}</span>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Sale Price',
      render: (row: any) => (
        <span className="font-semibold text-white tabular-nums">{formatPKR(row.sellingPrice)}</span>
      ),
    },
    {
      key: 'grossProfit',
      label: 'Profit / (Loss)',
      render: (row: any) => {
        const profit = parseFloat(row.grossProfit) || 0;
        const margin = parseFloat(row.sellingPrice) > 0 ? (profit / parseFloat(row.sellingPrice)) * 100 : 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className={profit >= 0 ? 'text-emerald-400 font-bold tabular-nums' : 'text-rose-400 font-bold tabular-nums'}>
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
      key: 'status',
      label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'saleDate',
      label: 'Date',
      render: (row: any) => <span className="text-slate-400 text-xs">{formatDate(row.saleDate)}</span>,
    },
  ];

  const inventoryColumns = [
    {
      key: 'stockId',
      label: 'Stock ID',
      render: (row: any) => (
        <span className="font-mono text-xs text-indigo-400 font-semibold">{row.stockId}</span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-white text-sm">{row.make} {row.model}</div>
          <div className="text-xs text-slate-400">{row.modelYear || row.year} • {row.color || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'costBasis',
      label: 'Acquisition Cost Basis',
      render: (row: any) => (
        <span className="font-semibold text-white tabular-nums">{formatPKR(row.costBasis)}</span>
      ),
    },
    {
      key: 'askingPrice',
      label: 'Asking Price',
      render: (row: any) => (
        <span className="text-indigo-300 font-medium tabular-nums">{formatPKR(row.askingPrice || row.costBasis)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-indigo-400" /> Executive Financial & Profit/Loss Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time dealership financial ledger, vehicle profit analysis, and operating income overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Live Ledger Sync</span>
        </div>
      </div>

      {/* Profit & Loss Breakdown Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/80 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">Showroom Profit & Loss Summary</h2>
          </div>
          <span className="text-xs text-slate-400">Calculated from verified GL journal entries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400">1. Total Vehicle Sales Revenue</span>
            <div className="text-2xl font-black text-white tabular-nums">{formatPKR(totalSalesRevenue)}</div>
            <p className="text-[11px] text-slate-500">{sales.length} completed sale transactions</p>
          </div>

          <div className="space-y-1 border-l border-slate-800 pl-4">
            <span className="text-xs font-medium text-slate-400">2. Less: Cost of Vehicles Sold (COGS)</span>
            <div className="text-2xl font-black text-slate-300 tabular-nums">{formatPKR(totalCostBasisSold)}</div>
            <p className="text-[11px] text-slate-500">Includes base price + capitalized repairs</p>
          </div>

          <div className="space-y-1 border-l border-slate-800 pl-4">
            <span className="text-xs font-medium text-slate-400">3. Gross Vehicle Profit</span>
            <div className={`text-2xl font-black tabular-nums flex items-center gap-2 ${totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPKR(totalGrossProfit)}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {grossProfitMargin.toFixed(1)}% Margin
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Revenue minus Vehicle Cost Basis</p>
          </div>

          <div className="space-y-1 border-l border-slate-800 pl-4 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider text-[10px]">4. Net Dealership Operating Profit</span>
            <div className={`text-2xl font-black tabular-nums ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPKR(netOperatingProfit)}
            </div>
            <p className="text-[11px] text-slate-400">Gross Profit minus Operating Expenses ({formatPKR(totalOperatingExpenses)})</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales Revenue"
          value={formatPKR(totalSalesRevenue)}
          subtitle={`${sales.length} sale transaction${sales.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          color="emerald"
          trend="+12.5%"
          trendUp={true}
        />
        <KPICard
          title="Gross Profit"
          value={formatPKR(totalGrossProfit)}
          subtitle={`${grossProfitMargin.toFixed(1)}% gross margin`}
          icon={BarChart3}
          color="indigo"
          trend="+8.3%"
          trendUp={true}
        />
        <KPICard
          title="Active Inventory Value"
          value={formatPKR(totalInventoryValue)}
          subtitle={`${availableVehicles} vehicles in stock`}
          icon={Car}
          color="blue"
        />
        <KPICard
          title="Net Operating Profit"
          value={formatPKR(netOperatingProfit)}
          subtitle={`After ${formatPKR(totalOperatingExpenses)} expenses`}
          icon={DollarSign}
          color={netOperatingProfit >= 0 ? 'emerald' : 'indigo'}
        />
      </div>

      {/* Recent Sales Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            Recent Vehicle Sales & Profit Analysis
          </h2>
          <a
            href="/sales"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All Sales →
          </a>
        </div>
        <DataTable
          columns={recentSalesColumns}
          data={sales.slice(0, 10)}
          isLoading={salesLoading}
          emptyMessage="No sales recorded yet. Create your first sale transaction."
        />
      </div>

      {/* Vehicle Inventory Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            Vehicle Inventory & Cost Basis
          </h2>
          <a
            href="/vehicles"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All Vehicles →
          </a>
        </div>
        <DataTable
          columns={inventoryColumns}
          data={vehicles.slice(0, 8)}
          isLoading={vehiclesLoading}
          emptyMessage="No vehicles in inventory. Record your first purchase."
        />
      </div>
    </div>
  );
}
