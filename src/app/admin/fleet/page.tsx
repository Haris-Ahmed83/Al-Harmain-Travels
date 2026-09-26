'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Vehicle, VehicleType, VehicleStatus } from '@/types';
import {
  Car,
  Users,
  PlusCircle,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CardGridSkeleton, TableSkeletonRows, EmptyStateView } from '@/components/ui/DataStateSkeletons';

export default function AdminFleetPage() {
  const { vehicles, drivers, settings, addVehicle, updateVehicle, isDataLoading } = useApp();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'maintenance'>('vehicles');
  const [modalOpen, setModalOpen] = useState(false);

  // New vehicle form state
  const [plateNum, setPlateNum] = useState('');
  const [make, setMake] = useState('GMC');
  const [model, setModel] = useState('Yukon Denali XL');
  const [vType, setVType] = useState<VehicleType>('vip_gmc');
  const [seats, setSeats] = useState(7);
  const [color, setColor] = useState('Obsidian Black');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNum) {
      toast.error('License plate number is required.');
      return;
    }
    await addVehicle({
      plate_number: plateNum,
      make,
      model,
      year: new Date().getFullYear(),
      vehicle_type: vType,
      color,
      seating_capacity: seats,
      status: 'available',
    });
    setModalOpen(false);
    setPlateNum('');
  };

  return (
    <div className="page-shell space-y-6">
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Fleet Operations</span>
          <h2 className="type-page-title mt-1">Vehicles & Chauffeur Registry</h2>
          <p className="text-xs text-muted">
            Manage MOT licensed vehicles, driver allocations, and periodic technical maintenance.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> + Register Vehicle (FR-16)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-base pb-3">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vehicles' ? 'bg-emerald-600 text-white shadow' : 'bg-card text-muted hover:text-primary border border-base'
          }`}
        >
          <Car className="w-4 h-4" /> Vehicles Inventory ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'drivers' ? 'bg-emerald-600 text-white shadow' : 'bg-card text-muted hover:text-primary border border-base'
          }`}
        >
          <Users className="w-4 h-4" /> Chauffeur Roster ({drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'maintenance' ? 'bg-emerald-600 text-white shadow' : 'bg-card text-muted hover:text-primary border border-base'
          }`}
        >
          <Wrench className="w-4 h-4" /> Periodic Maintenance (FR-19)
        </button>
      </div>

      {/* Tab 1: Vehicles */}
      {activeTab === 'vehicles' && (
        isDataLoading ? (
          <CardGridSkeleton count={6} heightClass="h-48" />
        ) : vehicles.length === 0 ? (
          <EmptyStateView
            icon={Car}
            title="No Vehicles Registered"
            description="No vehicles registered in the commercial fleet inventory yet."
            actionLabel="+ Register Vehicle"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-card border border-base hover:border-strong p-5 rounded-3xl shadow-xl space-y-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                      {v.plate_number}
                    </span>
                    <h3 className="type-card-title mt-1.5">{v.make} {v.model}</h3>
                    <p className="text-xs uppercase font-semibold text-emerald-600 dark:text-emerald-400">{v.vehicle_type.replace('_', ' ')}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-surface text-secondary border border-base">
                    {v.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-secondary pt-2 border-t border-base">
                  <div className="flex justify-between">
                    <span className="text-muted">Color:</span>
                    <span>{v.color || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Seating Capacity:</span>
                    <span>{v.seating_capacity} Passengers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Insurance Expiry:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{v.insurance_expiry || 'Valid'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">MOT Inspection:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{v.inspection_expiry || 'Certified'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab 2: Drivers */}
      {activeTab === 'drivers' && (
        <div className="bg-card border border-base rounded-3xl p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs text-secondary">
            <thead className="bg-surface text-muted uppercase font-bold text-[10px] border-b border-base">
              <tr>
                <th className="p-3">Chauffeur</th>
                <th className="p-3">License & ID</th>
                <th className="p-3">Assigned Vehicle</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rating</th>
                <th className="p-3 text-right">Lifetime Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base">
              {isDataLoading ? (
                <TableSkeletonRows rows={5} cols={6} />
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No chauffeurs found in fleet registry.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                <tr key={d.id} className="hover:bg-elevated">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-emerald-500"
                      />
                      <div>
                        <p className="font-bold text-primary">{d.profile?.full_name}</p>
                        <p className="text-muted text-[11px]">{d.profile?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-secondary">
                    <p>{d.license_number || 'DL-PENDING'}</p>
                    <p className="text-muted text-[10px]">ID: {d.national_id}</p>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-primary">{d.assigned_vehicle?.make} {d.assigned_vehicle?.model}</span>
                    <span className="block font-mono text-amber-500 dark:text-amber-400 text-[10px]">{d.assigned_vehicle?.plate_number}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-surface text-emerald-600 dark:text-emerald-400 border border-base">
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-amber-500 dark:text-amber-400 font-bold">★ {d.rating}</td>
                  <td className="p-3 text-right font-bold tabular-nums text-primary">
                    {d.total_earnings.toFixed(2)} {settings.currency}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-primary">Fleet Periodic Maintenance Schedule (FR-19)</h3>
            <span className="text-xs text-muted">All vehicles inspected per Saudi transport safety norms</span>
          </div>
          <div className="p-4 rounded-2xl bg-surface border border-base flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-primary">VIP GMC Yukon Denali (KSA 7788)</h4>
                <p className="text-muted">Scheduled 50,000 KM Engine & Brake Fluids Service</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Status: Completed</span>
              <span className="text-muted text-[11px]">Cost: 1,450 SAR</span>
            </div>
          </div>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddVehicle}
            className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-primary">Register New Fleet Vehicle (FR-16)</h3>
            <div className="space-y-1">
              <label className="text-xs text-secondary font-semibold">License Plate *</label>
              <input
                type="text"
                required
                value={plateNum}
                onChange={(e) => setPlateNum(e.target.value)}
                placeholder="e.g. KSA 8899"
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-secondary font-semibold">Make</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary font-semibold">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-secondary font-semibold">Category</label>
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value as VehicleType)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary"
                >
                  <option value="vip_gmc">VIP GMC Yukon</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="bus">Coach Bus</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-secondary font-semibold">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value) || 4)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-muted hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
