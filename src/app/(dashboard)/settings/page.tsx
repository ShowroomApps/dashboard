'use client';

import React from 'react';
import { useCurrentOrg, useBranches } from '@/lib/use-swr-hooks';
import { Settings, Building2, MapPin, Globe, Facebook, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { organization } = useCurrentOrg();
  const { branches } = useBranches();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" /> Dealership Organization & Branding Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Multi-tenant profile, logo, website, social links, and physical showroom locations</p>
      </div>

      {/* Organization Info Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          {organization?.logoUrl ? (
            <img src={organization.logoUrl} alt={organization.name} className="w-16 h-16 rounded-2xl object-contain bg-slate-800 p-2 border border-slate-700 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xl shadow-lg">
              {organization?.name ? organization.name.charAt(0) : 'D'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{organization?.displayName || organization?.name || 'Diwan Automobiles'}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Slug: <span className="font-mono text-indigo-400">{organization?.slug || 'diwan-motors'}</span> • Currency: {organization?.currencyCode || 'PKR'}
            </div>

            {/* Website & Social links */}
            <div className="flex items-center gap-4 mt-2">
              {organization?.website && (
                <a href={organization.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {organization?.facebookPageUrl && (
                <a href={organization.facebookPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
                  <Facebook className="w-3.5 h-3.5" /> Facebook Page
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Timezone</span>
            <div className="font-semibold text-white mt-0.5">{organization?.timezone || 'Asia/Karachi'}</div>
          </div>
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Fiscal Year Start</span>
            <div className="font-semibold text-white mt-0.5">July 1 (FBR Standard)</div>
          </div>
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Cost Basis Accounting</span>
            <div className="font-semibold text-emerald-400 mt-0.5">Option A (Pre-sale Capitalized)</div>
          </div>
        </div>
      </div>

      {/* Showroom Branches */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" /> Showroom Branches
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.length === 0 ? (
            <div className="p-4 glass-card rounded-xl text-slate-400 text-sm">
              Main Showroom (Headquarters) — Active
            </div>
          ) : (
            branches.map((b: any) => (
              <div key={b.id} className="p-4 glass-card rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-base">{b.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{b.city || 'Karachi'} • Code: {b.code}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
