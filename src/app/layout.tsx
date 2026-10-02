import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollProgressBar from '@/components/layout/ScrollProgressBar';
import { Toaster } from 'sonner';

/* Display: elegant serif for brand & marketing headings */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  adjustFontFallback: true,
});

/* Body: geometric sans for UI, forms, dashboards, and high-readability copy */
const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#072118' },
  ],
};

export const metadata: Metadata = {
  title: 'Al Harmain Travels — Premium Taxi & Umrah Booking',
  description:
    'VIP chauffeur transfers across Makkah, Madinah, and Jeddah. Book airport pickups, Haram transfers, and pilgrimage journeys in minutes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Al Harmain',
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#faf8f4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem('alharmain-theme');
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased selection:bg-emerald-700 selection:text-white bg-[var(--background)] text-[var(--foreground)] font-sans text-body">
        <ScrollProgressBar />
        <AppProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors theme="light" closeButton />
        </AppProvider>
      </body>
    </html>
  );
}
