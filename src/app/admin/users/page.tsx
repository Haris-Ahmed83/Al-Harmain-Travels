'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  UserPlus,
  Shield,
  Car,
  UserCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Search,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeletonRows } from '@/components/ui/DataStateSkeletons';

export default function AdminUsersPage() {
  const {
    usersList,
    drivers,
    vehicles,
    createStaffAccount,
    createDriverAccount,
    toggleUserStatus,
    deleteUser,
    isDataLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customers' | 'staff' | 'drivers'>('customers');
  const [search, setSearch] = useState('');

  // Staff creation modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  // Driver creation modal
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPhone) {
      toast.error('All fields are required.');
      return;
    }

    await createStaffAccount({
      full_name: staffName,
      email: staffEmail,
      phone: staffPhone,
    });

    setIsStaffModalOpen(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverEmail || !driverPhone || !licenseNumber) {
      toast.error('All driver fields including license number are required.');
      return;
    }

    await createDriverAccount({
      full_name: driverName,
      email: driverEmail,
      phone: driverPhone,
      license_number: licenseNumber,
      vehicle_id: assignedVehicleId || undefined,
    });

    setIsDriverModalOpen(false);
    setDriverName('');
    setDriverEmail('');
    setDriverPhone('');
    setLicenseNumber('');
    setAssignedVehicleId('');
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to permanently delete the profile for "${name}"?\n\nThis will remove the account from the database immediately.`)) {
      await deleteUser(id);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (activeTab === 'customers') return u.role === 'customer';
    if (activeTab === 'staff') return u.role === 'dispatcher';
    if (activeTab === 'drivers') return u.role === 'driver';
    return false;
  }).filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">Administration Module</span>
          <h1 className="type-page-title mt-1">User &amp; Access Management</h1>
          <p className="text-xs text-secondary">
            Exclusive executive controls: Onboard new dispatchers and drivers, manage credentials, and toggle account states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff</span>
          </button>
          <button
            onClick={() => setIsDriverModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow flex items-center gap-1.5 transition-all"
          >
            <Car className="w-4 h-4" />
            <span>Create Driver</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-base text-xs font-bold">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'customers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Customers ({usersList.filter((u) => u.role === 'customer').length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'staff'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Staff / Dispatchers ({usersList.filter((u) => u.role === 'dispatcher').length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'drivers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Drivers ({drivers.length})
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-base rounded-xl pl-10 pr-4 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-base rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-secondary">
          <thead className="bg-surface text-secondary uppercase font-bold text-[10px] border-b border-base">
            <tr>
              <th className="p-3">User Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Phone Number</th>
              <th className="p-3">Role</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {isDataLoading ? (
              <TableSkeletonRows rows={6} cols={7} />
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No {activeTab === 'customers' ? 'customers' : activeTab === 'staff' ? 'staff dispatchers' : 'drivers'} found matching this criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 font-bold text-primary flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-surface text-amber-500 flex items-center justify-center font-bold text-xs border border-base">
                      {u.full_name.slice(0, 1)}
                    </div>
                    <span>{u.full_name}</span>
                  </td>
                  <td className="p-3 text-secondary">{u.email || 'N/A'}</td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-mono">{u.phone || 'N/A'}</td>
                  <td className="p-3 uppercase font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">{u.role}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        u.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          u.status === 'active'
                            ? 'bg-surface hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-300'
                            : 'bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        title={`Delete ${u.full_name}`}
                        className="p-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Staff Account */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStaff}
            className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 className="type-card-title">Create Staff / Dispatcher Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="type-label">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faisal Al-Harbi"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Staff Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="faisal@alharmaintravel.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+966 5X XXX XXXX"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Create Staff Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Driver Account */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDriver}
            className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                <h3 className="type-card-title">Onboard Fleet Driver</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="type-label">Captain Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain Tariq"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="captain@example.com"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+966 5X XXX XXXX"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Commercial Driving License # *</label>
                <input
                  type="text"
                  required
                  placeholder="SA-DL-XXXXXX"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Assign Initial Vehicle</label>
                <select
                  value={assignedVehicleId}
                  onChange={(e) => setAssignedVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No vehicle assigned yet</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.make} {v.model} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                Onboard Driver
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
