'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Users, Phone, Mail, CheckCircle2, Search, Car } from 'lucide-react';
import { TableSkeletonRows } from '@/components/ui/DataStateSkeletons';

export default function DispatcherCustomersPage() {
  const { usersList, bookings, isDataLoading } = useApp();
  const [search, setSearch] = useState('');

  const customers = usersList.filter((u) => u.role === 'customer');

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="page-shell space-y-6">
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Customer Operations</span>
          <h1 className="type-page-title mt-1">Registered Customer Directory</h1>
          <p className="text-xs text-secondary">
            View verified pilgrim accounts, contact coordinates, and historical travel counts.
          </p>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-base rounded-xl pl-10 pr-4 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-card border border-base rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-secondary">
          <thead className="bg-surface text-secondary uppercase font-bold text-[10px] border-b border-base">
            <tr>
              <th className="p-3">Customer Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Phone (WhatsApp)</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Trips Count</th>
              <th className="p-3 text-right">Quick Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {isDataLoading ? (
              <TableSkeletonRows rows={5} cols={6} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  No customers found in directory.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
              const customerTripCount = bookings.filter(
                (b) => b.customer_id === c.id || b.passenger_phone === c.phone
              ).length;

              return (
                <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 font-bold text-primary flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-300 dark:border-emerald-800/60">
                      {c.full_name.slice(0, 1)}
                    </div>
                    <span>{c.full_name}</span>
                  </td>
                  <td className="p-3 text-secondary">{c.email || 'N/A'}</td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-mono">{c.phone || 'N/A'}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Customer
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-primary">{customerTripCount} rides</td>
                  <td className="p-3 text-right">
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call / WhatsApp</span>
                    </a>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
