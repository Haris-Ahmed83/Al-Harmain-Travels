'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ServiceItem, VehicleType } from '@/types';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Car,
  DollarSign,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { CardGridSkeleton, EmptyStateView } from '@/components/ui/DataStateSkeletons';

export default function AdminServicesPage() {
  const { services, addService, updateService, deleteService, toggleServiceActive, settings, isDataLoading } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [basePrice, setBasePrice] = useState<number>(300);
  const [vehicleType, setVehicleType] = useState<VehicleType>('vip_gmc');
  const [features, setFeatures] = useState<string>('Direct Haram Access\nComplimentary Zamzam\nMultilingual Captain');

  const openAddModal = () => {
    setEditingServiceId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80');
    setBasePrice(350);
    setVehicleType('vip_gmc');
    setFeatures('Direct Haram Access\nComplimentary Zamzam\nMultilingual Captain');
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setTitle(service.title);
    setSlug(service.slug);
    setDescription(service.description);
    setImageUrl(service.image_url || '');
    setBasePrice(service.base_price);
    setVehicleType(service.vehicle_type);
    setFeatures((service.features || []).join('\n'));
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Title and description are required.');
      return;
    }

    const featureList = features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingServiceId) {
      await updateService(editingServiceId, {
        title,
        slug: generatedSlug,
        description,
        image_url: imageUrl,
        base_price: basePrice,
        vehicle_type: vehicleType,
        features: featureList,
      });
    } else {
      await addService({
        title,
        slug: generatedSlug,
        description,
        image_url: imageUrl,
        base_price: basePrice,
        vehicle_type: vehicleType,
        features: featureList,
        is_active: true,
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Marketing &amp; Catalog CMS</span>
          <h1 className="type-page-title mt-1">Services Management</h1>
          <p className="text-xs text-secondary">
            Add, update, or deactivate public travel services displayed on the public marketing website.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Grid */}
      {isDataLoading ? (
        <CardGridSkeleton count={6} heightClass="h-72" />
      ) : services.length === 0 ? (
        <EmptyStateView
          icon={Briefcase}
          title="No Services Configured"
          description="No pilgrimage or executive chauffeur services configured in the system yet."
          actionLabel="+ Create Service"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
          <div
            key={s.id}
            className={`p-6 rounded-3xl bg-card border transition-all flex flex-col justify-between shadow-xl ${
              s.is_active ? 'border-base' : 'border-rose-500/40 dark:border-rose-900/40 opacity-70'
            }`}
          >
            <div className="space-y-4">
              <div className="relative h-40 rounded-2xl overflow-hidden bg-surface">
                <img
                  src={s.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                  alt={s.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-slate-950/80 text-[11px] font-bold text-amber-400 border border-amber-400/30">
                  {s.base_price} {settings.currency}
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-950/80 text-[10px] uppercase font-bold text-emerald-300">
                  {s.vehicle_type}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-primary">{s.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      s.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {s.is_active ? 'Active on Web' : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1 line-clamp-2">{s.description}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Key Highlights:</span>
                {s.features && s.features.slice(0, 3).map((feat, idx) => (
                  <div key={idx} className="text-[11px] text-secondary flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-base flex items-center justify-between">
              <button
                onClick={() => toggleServiceActive(s.id)}
                className={`flex items-center gap-1 text-xs font-semibold ${
                  s.is_active ? 'text-amber-600 dark:text-amber-400 hover:text-amber-500' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                }`}
              >
                {s.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{s.is_active ? 'Deactivate' : 'Publish'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(s)}
                  className="p-1.5 rounded-lg bg-surface hover:bg-elevated text-secondary hover:text-primary transition-colors"
                  title="Edit Service"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteService(s.id)}
                  className="p-1.5 rounded-lg bg-surface hover:bg-rose-100 dark:hover:bg-rose-950 text-secondary hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Delete Service"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                <h3 className="type-card-title">
                  {editingServiceId ? 'Edit Service' : 'Add New Public Service'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="type-label">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jeddah Airport to Makkah VIP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label">Base Price (SAR) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="type-label">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary focus:outline-none focus:border-emerald-500"
                  >
                    <option value="vip_gmc">VIP GMC Yukon XL</option>
                    <option value="suv">Family SUV</option>
                    <option value="sedan">Executive Sedan</option>
                    <option value="van">Royal Van</option>
                    <option value="bus">Pilgrim Bus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="type-label">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Service Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of what the service offers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">
                  Features &amp; Inclusions (one per line)
                </label>
                <textarea
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Meet & Greet&#10;Direct Haram Access&#10;Water & Zamzam"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {editingServiceId ? 'Save Changes' : 'Publish Service'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
