'use client';

import React from 'react';
import { usePayments } from '@/lib/use-swr-hooks';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatPKR, formatDate } from '@/lib/format';
import { Receipt } from 'lucide-react';

export default function PaymentsPage() {
  const { payments, isLoading } = usePayments();

  const columns = [
    {
      key: 'paymentNumber', label: 'Payment #',
      render: (row: any) => <span className="font-mono text-xs text-indigo-400 font-semibold">{row.paymentNumber}</span>,
    },
    {
      key: 'direction', label: 'Type',
      render: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${row.direction === 'inbound' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
          {row.direction}
        </span>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: (row: any) => <span className="font-semibold text-white tabular-nums">{formatPKR(row.amount)}</span>,
    },
    {
      key: 'paymentMethod', label: 'Method',
      render: (row: any) => <span className="capitalize text-slate-300 text-xs">{row.paymentMethod?.replace('_', ' ')}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'paymentDate', label: 'Date',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDate(row.paymentDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Receipt className="w-6 h-6 text-purple-400" /> Inbound & Outbound Payments
        </h1>
        <p className="text-sm text-slate-400 mt-1">Payment receipts from customers & disbursements to vehicle sellers with GL audit trail</p>
      </div>

      <DataTable columns={columns} data={payments} isLoading={isLoading} emptyMessage="No payment transactions recorded yet." />
    </div>
  );
}
