'use client';

import React from 'react';
import { clsx } from 'clsx';

interface DataTableProps {
  columns: { key: string; label: string; className?: string; render?: (row: any) => React.ReactNode }[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-800/60 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export function DataTable({ columns, data, isLoading, emptyMessage = 'No records found', onRowClick }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400',
                  col.className,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)}

          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!isLoading &&
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-slate-800/40 transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : '',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx('px-4 py-3 text-slate-300', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
