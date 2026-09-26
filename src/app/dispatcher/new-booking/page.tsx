'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { SAUDI_LANDMARKS } from '@/lib/geo';
import { VehicleType, BookingType } from '@/types';
import {
  Briefcase,
  Car,
  MapPin,
  Calendar,
  User,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DispatcherNewBookingPage() {
  const router = useRouter();
  const { createBooking, autoAssignDriver } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupLm, setPickupLm] = useState(SAUDI_LANDMARKS[0].id);
  const [destLm, setDestLm] = useState(SAUDI_LANDMARKS[2].id);
  const [customPickup, setCustomPickup] = useState('');
  const [customDest, setCustomDest] = useState('');
  const [vType, setVType] = useState<VehicleType>('vip_gmc');
  const [pax, setPax] = useState(3);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Customer name and contact number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const p = SAUDI_LANDMARKS.find((l) => l.id === pickupLm) || SAUDI_LANDMARKS[0];
      const d = SAUDI_LANDMARKS.find((l) => l.id === destLm) || SAUDI_LANDMARKS[2];

      const b = await createBooking({
        passenger_name: name,
        passenger_phone: phone,
        booking_type: 'immediate',
        pickup_address: customPickup.trim() || `${p.name} (${p.city})`,
        pickup_latitude: p.latitude,
        pickup_longitude: p.longitude,
        destination_address: customDest.trim() || `${d.name} (${d.city})`,
        destination_latitude: d.latitude,
        destination_longitude: d.longitude,
        vehicle_type: vType,
        passenger_count: pax,
        notes: `[Created by Staff on behalf of customer] ${notes}`,
      });

      await autoAssignDriver(b.id);
      toast.success(`Booking ${b.booking_reference} successfully placed and dispatched.`);
      router.push('/dispatcher/queue');
    } catch {
      toast.error('Error placing booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell max-w-4xl space-y-6">
      <div className="space-y-1">
        <span className="type-eyebrow">Staff Operations</span>
        <h1 className="type-page-title">Create Booking On Behalf of Customer</h1>
        <p className="text-xs text-secondary">
          Book immediate or scheduled transfers for phone callers, VIP guests, or walk-ins.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-card border border-base space-y-5 shadow-xl text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="type-label">Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Haji Mansoor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="type-label">Customer Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="+966 5X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="type-label">Pickup Landmark</label>
            <select
              value={pickupLm}
              onChange={(e) => setPickupLm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary focus:outline-none focus:border-emerald-500"
            >
              {SAUDI_LANDMARKS.map((l) => (
                <option key={`p-${l.id}`} value={l.id}>{l.city}: {l.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Custom pickup detail or gate..."
              value={customPickup}
              onChange={(e) => setCustomPickup(e.target.value)}
              className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-input border border-base text-primary placeholder:text-muted text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="type-label">Destination Landmark</label>
            <select
              value={destLm}
              onChange={(e) => setDestLm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary focus:outline-none focus:border-emerald-500"
            >
              {SAUDI_LANDMARKS.map((l) => (
                <option key={`d-${l.id}`} value={l.id}>{l.city}: {l.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Custom destination hotel or address..."
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-input border border-base text-primary placeholder:text-muted text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="type-label">Vehicle Class</label>
            <select
              value={vType}
              onChange={(e) => setVType(e.target.value as VehicleType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary focus:outline-none focus:border-emerald-500"
            >
              <option value="vip_gmc">VIP GMC Yukon XL</option>
              <option value="suv">Family SUV</option>
              <option value="sedan">Executive Sedan</option>
              <option value="van">Royal Van</option>
            </select>
          </div>

          <div>
            <label className="type-label">Passenger Count</label>
            <input
              type="number"
              min={1}
              max={14}
              value={pax}
              onChange={(e) => setPax(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="type-label">Flight Number or Dispatch Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special baggage requests, terminal meetup point, or customer preferences..."
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <Briefcase className="w-4 h-4" />
          <span>Confirm &amp; Dispatch Ride</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
