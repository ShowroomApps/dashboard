'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Wallet,
  BookOpen,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  Shield,
  Key,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vehicle Inventory', href: '/vehicles', icon: Car },
  { name: 'Sales Transactions', href: '/sales', icon: TrendingUp },
  { name: 'Acquisitions / Purchases', href: '/purchases', icon: ShoppingBag },
  { name: 'Inbound & Outbound Payments', href: '/payments', icon: Receipt },
  { name: 'Operating Expenses', href: '/expenses', icon: Wallet },
  { name: 'General Ledger & Accounts', href: '/accounting', icon: BookOpen },
  { name: 'Customers & Sellers', href: '/contacts', icon: Users },
  { name: 'Showroom Staff & Admins', href: '/users', icon: Shield },
  { name: 'SaaS Showrooms (Platform)', href: '/admin/organizations', icon: Building2 },
  { name: 'Subscriptions & Licensing', href: '/admin/subscriptions', icon: Key },
  { name: 'Organization Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col justify-between p-4 sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">ShowroomOS</h1>
            <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              Dealership SaaS
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <a
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
                {item.name}
              </a>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-3 glass-panel rounded-xl border border-slate-800 flex items-center gap-3 mt-6">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <div>
          <div className="text-xs font-semibold text-slate-200">System Healthy</div>
          <div className="text-[10px] text-slate-400">PostgreSQL RLS Active</div>
        </div>
      </div>
    </aside>
  );
}
