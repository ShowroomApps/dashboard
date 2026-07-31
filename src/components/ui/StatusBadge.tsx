import React from 'react';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() || 'unknown';

  const badgeStyles: Record<string, string> = {
    available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    reserved: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    sold: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    delivered: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    under_repair: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    in_transit: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    posted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    reversed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const style = badgeStyles[normalized] || 'bg-slate-700 text-slate-300 border-slate-600';

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-wide',
        style,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {normalized.replace('_', ' ')}
    </span>
  );
}
