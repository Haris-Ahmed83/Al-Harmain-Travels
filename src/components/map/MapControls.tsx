'use client';

import React from 'react';
import { Plus, Minus, Crosshair, Layers } from 'lucide-react';

export type MapViewMode = 'standard' | 'satellite';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCurrentLocation: () => void;
  mapMode: MapViewMode;
  onMapModeChange: (mode: MapViewMode) => void;
  isLocating?: boolean;
  className?: string;
  currentLocationTitle?: string;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onCurrentLocation,
  mapMode,
  onMapModeChange,
  isLocating = false,
  className = '',
  currentLocationTitle = 'Center on Current GPS Location',
}: MapControlsProps) {
  const toggleMapMode = () => {
    onMapModeChange(mapMode === 'satellite' ? 'standard' : 'satellite');
  };

  return (
    <div className={`absolute top-3.5 right-3.5 z-[400] flex flex-col gap-1.5 ${className}`}>
      <div className="bg-card/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-base shadow-xl flex flex-col gap-1 select-none pointer-events-auto">
        {/* Zoom In (+) */}
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
          className="w-8 h-8 rounded-xl hover:bg-surface text-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out (−) */}
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (−)"
          aria-label="Zoom Out"
          className="w-8 h-8 rounded-xl hover:bg-surface text-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Subtle Divider */}
        <div className="h-px bg-base mx-1 my-0.5" />

        {/* Current Location (GPS) */}
        <button
          type="button"
          onClick={onCurrentLocation}
          title={currentLocationTitle}
          aria-label="Center on Current GPS Location"
          className={`w-8 h-8 rounded-xl hover:bg-surface text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isLocating ? 'bg-emerald-500/20 ring-2 ring-emerald-500/40 animate-pulse text-emerald-500' : ''
          }`}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* Map View Toggle Button (Direct Shift between Standard and Satellite) */}
        <button
          type="button"
          onClick={toggleMapMode}
          title={mapMode === 'satellite' ? 'Switch to Standard Map View' : 'Switch to Satellite View'}
          aria-label={mapMode === 'satellite' ? 'Switch to Standard Map View' : 'Switch to Satellite View'}
          className={`w-8 h-8 rounded-xl text-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            mapMode === 'satellite'
              ? 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 shadow-sm'
              : 'hover:bg-surface text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
