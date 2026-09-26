# UI/UX & Design System Reference

## Design Philosophy: Islamic Luxury & Operational Precision

Al Harmain Travels blends Islamic heritage hospitality with high-precision operational fleet management. The UI combines deep onyx and obsidian backgrounds with jewel-emerald accents (`brand-*`), warm desert gold highlights (`gold-*`), and crisp typography.

---

## 1. Color Tokens & Semantic Variables

Defined in `src/app/globals.css` and mapped in `tailwind.config.ts`:

### Dark Mode (Default Theme)
- Page Background: `--bg-page: #090d16`
- Card Container: `--bg-card: #0f172a`
- Elevated Layer: `--bg-elevated: #1e293b`
- Surface/Input: `--bg-surface: #020817`, `--bg-input: #020817`
- Primary Text: `--text-primary: #f1f5f9`
- Secondary Text: `--text-secondary: #cbd5e1`
- Muted/Caption Text: `--text-muted: #94a3b8`
- Borders: `--border-base: #1e293b`, `--border-strong: #334155`

### Light Mode
- Page Background: `--bg-page: #f4f7f5`
- Card Container: `--bg-card: #ffffff`
- Elevated Layer: `--bg-elevated: #eef2f0`
- Surface/Input: `--bg-surface: #e8eeeb`, `--bg-input: #ffffff`
- Primary Text: `--text-primary: #0f172a`
- Secondary Text: `--text-secondary: #334155`
- Muted/Caption Text: `--text-muted: #64748b`
- Borders: `--border-base: #d8e0db`, `--border-strong: #b8c5be`

### Brand Accents
- **Emerald Green** (`brand-50` to `brand-950`):
  - Primary Action / Status Active: `bg-emerald-600 hover:bg-emerald-500`
  - Subtle Badges: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
- **Pilgrimage Gold** (`gold-50` to `gold-900`):
  - VIP GMC & Luxury Badges: `text-amber-400`, `bg-amber-500/10 border-amber-500/20`
  - Rating Stars: `text-amber-400 fill-amber-400`

---

## 2. Typography Hierarchy

The app uses two Google Fonts via `next/font/google`:
1. **Cormorant Garamond** (`var(--font-display)`):
   - Used on marketing display headers, section titles, and hero branding (`font-display`).
   - Generates an elegant, warm Middle Eastern luxury presence.
2. **Plus Jakarta Sans** (`var(--font-body)`):
   - Used for all UI chrome, dashboard stats, buttons, forms, tables, and modal copy (`font-sans`).
   - Exceptional legibility for dense dispatch tables and numbers.

### Typography Scale Classes (Tailwind)
- `text-2xs`: Compact indicators and uppercase tracking tags (`0.625rem`)
- `text-caption`: Labels, chips, timestamps (`0.6875rem`)
- `text-ui`: Buttons, navigation links, dropdown actions (`0.8125rem`)
- `text-body`: Standard body paragraphs (`0.9375rem`, line height 1.65)
- `text-title`: Card, panel, and table section headings (`1.0625rem`)
- `text-page`: Portal page title clamp (`clamp(1.5rem, 1.2rem + 1.2vw, 2rem)`)
- `text-section`: Section marketing title (`clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)`)
- `text-display` / `text-hero`: Hero marketing banner (`clamp(2.25rem, 1.4rem + 3.5vw, 4rem)`)

---

## 3. UI Component Patterns

### Page Wrapper (`PageShell.tsx`)
Standardizes responsive padding across dashboards:
```tsx
import PageShell from '@/components/layout/PageShell';

export default function CustomerDashboard() {
  return (
    <PageShell className="py-8 space-y-6">
      {/* Content */}
    </PageShell>
  );
}
```

### Cards & Glassmorphism Panels
Use `bg-card border border-base rounded-2xl p-5 shadow-soft hover:border-strong transition-colors` to ensure consistent elevation and border contrast in both dark and light modes.

### Status Badges
Format status badges with low-opacity backgrounds and crisp borders:
```tsx
// Active / Completed
<span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  Confirmed
</span>

// Pending / Warning
<span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
  Driver Arriving
</span>

// Cancelled / Danger
<span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
  Cancelled
</span>
```

### Notifications & Toasts
All asynchronous actions trigger `sonner` toasts (`toast.success`, `toast.error`, `toast.info`, `toast.warning`) while logging events to `AppContext.notifications` so staff and customers have persistent historical records.

### Accessibility Standards
- Contrast ratio checks adhere to WCAG AA.
- `#main-content` skip link (`.skip-link`) present in `layout.tsx`.
- Form controls include associated `<label>` tags and descriptive placeholders.
- Screen-reader friendly aria tags on modals, notification bell, and theme toggles.
