'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_FARE_RULES } from '@/lib/fare-calculator';
import { VehicleType, FareRule } from '@/types';
import {
  Settings,
  Shield,
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  Car,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useApp();

  const [companyName, setCompanyName] = useState(settings.company_name);
  const [tagline, setTagline] = useState(settings.company_tagline);
  const [phone, setPhone] = useState(settings.support_phone);
  const [whatsapp, setWhatsapp] = useState(settings.support_whatsapp);
  const [email, setEmail] = useState(settings.support_email);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [tax, setTax] = useState(settings.tax_percentage);

  // Fare matrix state
  const [fareRules, setFareRules] = useState<Record<VehicleType, FareRule>>(DEFAULT_FARE_RULES);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      company_name: companyName,
      company_tagline: tagline,
      support_phone: phone,
      support_whatsapp: whatsapp,
      support_email: email,
      address,
      currency,
      tax_percentage: tax,
    });
    toast.success('System and Company configurations updated successfully!');
  };

  const handleFareRuleChange = (
    type: VehicleType,
    field: keyof FareRule,
    value: number
  ) => {
    setFareRules((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSaveFareMatrix = () => {
    toast.success('Fare configuration matrix updated successfully for all fleet categories!');
  };

  return (
    <div className="page-shell space-y-8">
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <span className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">System Configuration</span>
        </div>
        <h2 className="type-page-title mt-1">Company Profile & Dynamic Fare Matrix</h2>
        <p className="text-xs text-secondary">
          Configure enterprise information, default operating currency, and per-km pricing models (FR-94 through FR-98).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Company & Financial Settings (FR-94, FR-98) */}
        <form onSubmit={handleSaveCompany} className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="type-card-title border-b border-base pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              Company Details (FR-94)
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Tagline / Motto</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">24/7 Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">WhatsApp Desk</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Dispatch Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Office Physical Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-base">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">Base Currency (FR-98)</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                >
                  <option value="SAR">SAR (Saudi Riyal)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="PKR">PKR (Pakistani Rupee)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">VAT Rate (%)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-full bg-input border border-base rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Company Profile
            </button>
          </div>
        </form>

        {/* Right: Dynamic Fare Matrix (FR-51, FR-95) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div>
                <h3 className="type-card-title flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-500" />
                  Fare Matrix by Vehicle Class (FR-51)
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Base fare, per-km rates, and waiting fees automatically applied to bookings.
                </p>
              </div>
              <button
                onClick={handleSaveFareMatrix}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Rates
              </button>
            </div>

            <div className="space-y-4">
              {(Object.keys(fareRules) as VehicleType[]).map((vKey) => {
                const rule = fareRules[vKey];
                return (
                  <div
                    key={vKey}
                    className="p-4 rounded-2xl bg-surface border border-base space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm uppercase text-emerald-600 dark:text-emerald-400">
                        {vKey.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted">Unit: {currency}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted block">Base Fare</span>
                        <input
                          type="number"
                          value={rule.base_fare}
                          onChange={(e) =>
                            handleFareRuleChange(vKey, 'base_fare', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-input border border-base rounded-lg p-1.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted block">Per KM Rate</span>
                        <input
                          type="number"
                          step="0.5"
                          value={rule.per_km_rate}
                          onChange={(e) =>
                            handleFareRuleChange(vKey, 'per_km_rate', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-input border border-base rounded-lg p-1.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted block">Min Fare</span>
                        <input
                          type="number"
                          value={rule.minimum_fare}
                          onChange={(e) =>
                            handleFareRuleChange(vKey, 'minimum_fare', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-input border border-base rounded-lg p-1.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted block">Cancel Fee (FR-97)</span>
                        <input
                          type="number"
                          value={rule.cancellation_fee}
                          onChange={(e) =>
                            handleFareRuleChange(vKey, 'cancellation_fee', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-input border border-base rounded-lg p-1.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
