import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null, currency: string = 'SAR'): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return `${num.toFixed(2)} ${currency}`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function generateBookingReference(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AHT-${y}${m}${d}-${rand}`;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${date.getFullYear()}-${rand}`;
}
