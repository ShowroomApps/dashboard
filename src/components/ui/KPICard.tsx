import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'blue';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp = true,
  color = 'indigo',
}: KPICardProps) {
  const iconBgClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200 hover:border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', iconBgClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
        {value}
      </div>

      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span className={clsx(trendUp ? 'text-emerald-400' : 'text-rose-400')}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
          <span className="text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
