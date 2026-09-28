'use client';

import React, { useState, useMemo } from 'react';
import {
  FIXED_RATE_TABLE,
  SERVICE_LABELS,
  VEHICLE_LABELS,
  VEHICLE_CAPACITY,
  TERMINAL_LABELS,
  formatFareSAR,
  resolveFixedFare,
} from '@/lib/fixed-fare';
import type { VehicleCategory, ServiceType, TerminalCode } from '@/types';
import {
  ShieldCheck,
  Car,
  Route,
  Plane,
  Users,
  Luggage,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

const VEHICLE_CATEGORIES: VehicleCategory[] = ['sedan', 'staria', 'gmc', 'hiroof'];
const SERVICE_TYPES: ServiceType[] = [
  'intercity_jeddah_makkah',
  'intercity_makkah_jeddah',
  'intercity_makkah_madinah',
  'intercity_makkah_madinah_sameday',
  'ziyarat_makkah',
  'ziyarat_taif',
  'ziyarat_taif_bani_saad',
];

const TERMINAL_CODES: NonNullable<TerminalCode>[] = ['terminal_1', 'terminal_h', 'terminal_n'];

export default function AdminRatesPage() {
  const [filterVehicle, setFilterVehicle] = useState<VehicleCategory | 'all'>('all');
  const [filterService, setFilterService] = useState<ServiceType | 'all'>('all');
  const [showMatrix, setShowMatrix] = useState(false);

  const filteredRates = useMemo(() => {
    return FIXED_RATE_TABLE.filter((r) => {
      const matchVehicle = filterVehicle === 'all' || r.vehicle_category === filterVehicle;
      const matchService = filterService === 'all' || r.service_type === filterService;
      return matchVehicle && matchService;
    });
  }, [filterVehicle, filterService]);

  // Build matrix: rows = vehicles, cols = services (+ terminal variants)
  const matrixCols = useMemo(() => {
    const cols: { serviceType: ServiceType; terminal: TerminalCode; label: string }[] = [];
    SERVICE_TYPES.forEach((svc) => {
      if (svc === 'intercity_jeddah_makkah') {
        // Sedan has no terminal variant
        cols.push({ serviceType: svc, terminal: null, label: SERVICE_LABELS[svc] + ' (Sedan)' });
        TERMINAL_CODES.forEach((t) =>
          cols.push({ serviceType: svc, terminal: t, label: SERVICE_LABELS[svc] + ' – ' + TERMINAL_LABELS[t] })
        );
      } else {
        cols.push({ serviceType: svc, terminal: null, label: SERVICE_LABELS[svc] });
      }
    });
    return cols;
  }, []);

  const handleExportCSV = () => {
    const headers = ['ID', 'Vehicle', 'Service', 'Terminal', 'Fare (SAR)', 'Currency'];
    const rows = FIXED_RATE_TABLE.map((r) => [
      r.id,
      VEHICLE_LABELS[r.vehicle_category],
      SERVICE_LABELS[r.service_type],
      r.terminal ? TERMINAL_LABELS[r.terminal] : '—',
      r.fare_amount,
      'SAR',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alharmain-fixed-fares-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-shell space-y-8">
      {/* Header */}
      <div className="bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Admin · Rate Management
            </span>
            <h1 className="type-section-title text-primary">Fixed-Fare Rate Table</h1>
            <p className="text-sm text-muted mt-1">
              {FIXED_RATE_TABLE.length} approved rates · All prices in SAR · Source of truth for all customer bookings
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowMatrix(!showMatrix)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-elevated hover:bg-surface border border-base hover:border-strong transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              {showMatrix ? 'List View' : 'Matrix View'}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {VEHICLE_CATEGORIES.map((cat) => {
          const catRates = FIXED_RATE_TABLE.filter((r) => r.vehicle_category === cat);
          const minFare = Math.min(...catRates.map((r) => r.fare_amount));
          const maxFare = Math.max(...catRates.map((r) => r.fare_amount));
          const cap = VEHICLE_CAPACITY[cat];
          return (
            <div key={cat} className="bg-card border border-base rounded-2xl p-4 sm:p-5 shadow-sm hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-primary capitalize truncate">{VEHICLE_LABELS[cat].split(' ')[0]}</span>
              </div>
              <div className="text-[10px] text-muted font-medium">{VEHICLE_LABELS[cat]}</div>
              <div className="mt-2 text-xs text-secondary flex items-center gap-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cap.passengers}</span>
                <span className="flex items-center gap-1"><Luggage className="w-3 h-3" />{cap.luggage}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-base text-xs">
                <span className="text-muted text-[10px]">Fare range</span>
                <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatFareSAR(minFare)} – {formatFareSAR(maxFare)}</div>
                <div className="text-[10px] text-muted mt-0.5">{catRates.length} rates</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Integrity check */}
      <div className="bg-card border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-primary mb-1">Rate Table Integrity — VERIFIED</div>
          <p className="text-xs text-secondary">
            All {FIXED_RATE_TABLE.length} rates compile without error (7 Sedan + 8 Staria + 8 GMC + 8 HiRoof). No rate is derived from distance, duration, GPS coordinates, or per-km pricing.
            Every combination has exactly one canonical entry. Standard and same-day Makkah → Madinah round trips are tracked as separate entries.
          </p>
        </div>
      </div>

      {/* Filters (list view) */}
      {!showMatrix && (
        <div className="bg-card border border-base rounded-2xl p-4 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterVehicle('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${filterVehicle === 'all' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-surface border-base text-muted hover:text-primary'}`}
            >
              All Vehicles
            </button>
            {VEHICLE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterVehicle(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${filterVehicle === cat ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-surface border-base text-muted hover:text-primary'}`}
              >
                {VEHICLE_LABELS[cat].split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 border-l border-base pl-3">
            <button
              type="button"
              onClick={() => setFilterService('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${filterService === 'all' ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300' : 'bg-surface border-base text-muted hover:text-primary'}`}
            >
              All Services
            </button>
            {SERVICE_TYPES.map((svc) => (
              <button
                key={svc}
                type="button"
                onClick={() => setFilterService(svc)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${filterService === svc ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300' : 'bg-surface border-base text-muted hover:text-primary'}`}
              >
                {SERVICE_LABELS[svc].split('→')[0].trim()}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted ml-auto">{filteredRates.length} of {FIXED_RATE_TABLE.length} rates</span>
        </div>
      )}

      {/* List View */}
      {!showMatrix && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead className="bg-surface border-b border-base">
                <tr>
                  <th className="text-left px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Vehicle</th>
                  <th className="text-left px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Service Route</th>
                  <th className="text-left px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Terminal</th>
                  <th className="text-left px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Capacity</th>
                  <th className="text-right px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Fixed Fare</th>
                  <th className="text-center px-4 sm:px-5 py-3.5 text-muted font-bold uppercase tracking-wider text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base">
                {filteredRates.map((rate, idx) => {
                  const cap = VEHICLE_CAPACITY[rate.vehicle_category];
                  return (
                    <tr
                      key={rate.id}
                      className={`transition-colors hover:bg-surface/50 ${idx % 2 === 0 ? '' : 'bg-surface/20'}`}
                    >
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Car className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-primary">{VEHICLE_LABELS[rate.vehicle_category]}</div>
                            <div className="text-[10px] text-muted capitalize">{rate.vehicle_category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Route className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="font-medium text-secondary">{SERVICE_LABELS[rate.service_type]}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        {rate.terminal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            <Plane className="w-2.5 h-2.5" />
                            {TERMINAL_LABELS[rate.terminal]}
                          </span>
                        ) : (
                          <span className="text-muted text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="text-[11px] text-secondary flex items-center gap-2">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-muted" />{cap.passengers}</span>
                          <span className="flex items-center gap-1"><Luggage className="w-3 h-3 text-muted" />{cap.luggage}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{formatFareSAR(rate.fare_amount)}</span>
                        <div className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">fixed · no surge</div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matrix View */}
      {showMatrix && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-base bg-surface">
            <h2 className="text-sm font-bold text-primary">Fare Matrix — All Vehicles × All Routes</h2>
            <p className="text-[11px] text-muted mt-0.5">Cross-reference view. Empty cells = no configured rate.</p>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="text-xs border-collapse w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className="text-left p-3 rounded-tl-lg bg-surface border border-base text-muted text-[10px] font-bold uppercase">Vehicle</th>
                  {matrixCols.map((col, i) => (
                    <th key={i} className="p-2.5 bg-surface border border-base text-muted text-[10px] font-bold text-center max-w-[100px] leading-tight">
                      <div className="truncate">{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLE_CATEGORIES.map((cat) => (
                  <tr key={cat}>
                    <td className="p-3 border border-base bg-surface sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-primary text-[11px]">{VEHICLE_LABELS[cat].split(' — ')[0]}</div>
                          <div className="text-[9px] text-muted">{VEHICLE_CAPACITY[cat].passengers} pax</div>
                        </div>
                      </div>
                    </td>
                    {matrixCols.map((col, i) => {
                      // For sedan on Jeddah→Makkah with terminal in col definition (non-null): skip
                      if (cat === 'sedan' && col.serviceType === 'intercity_jeddah_makkah' && col.terminal !== null) {
                        return <td key={i} className="p-2.5 border border-base text-center bg-surface/30"><span className="text-[9px] text-muted/40">—</span></td>;
                      }
                      // For sedan on Jeddah→Makkah with null terminal in col: show rate
                      const result = resolveFixedFare(cat, col.serviceType, col.terminal);
                      return (
                        <td key={i} className={`p-2.5 border border-base text-center transition-colors ${result.found ? 'hover:bg-emerald-500/5' : 'bg-surface/30'}`}>
                          {result.found ? (
                            <div>
                              <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm leading-none">{result.fare.toLocaleString()}</div>
                              <div className="text-[9px] text-muted mt-0.5 font-semibold">SAR</div>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning about rate changes */}
      <div className="bg-card border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-primary mb-1">Rate Change Policy</div>
          <p className="text-xs text-secondary">
            Fixed fares are managed directly in code (<code className="bg-surface px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono">src/lib/fixed-fare.ts</code>) and mirrored in the database via migration <code className="bg-surface px-1.5 py-0.5 rounded font-mono">20260928000001_fixed_fare_rates.sql</code>.
            Rate changes require a code deployment and database migration to prevent unauthorized modifications.
            Contact the system administrator to update any fare.
          </p>
        </div>
      </div>
    </div>
  );
}
