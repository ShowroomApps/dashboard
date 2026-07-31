'use client';

import React from 'react';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-slate-950">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
