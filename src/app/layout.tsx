import type { Metadata } from 'next';
import './globals.css';
import { PantryProvider } from '@/lib/store';
import { ToastProvider } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://use-it-first.vercel.app'),
  title: {
    default: 'USE IT FIRST — See what you have. Use what matters first.',
    template: '%s | USE IT FIRST',
  },
  description:
    'Use It First is a household food-intelligence application. Understand the food you already own and decide what should be used first.',
  keywords: [
    'pantry management',
    'kitchen larder',
    'food waste prevention',
    'recipe matching',
    'use it first',
    'homecooked meals',
  ],
  authors: [{ name: 'Use It First' }],
  openGraph: {
    title: 'USE IT FIRST — See what you have. Use what matters first.',
    description:
      'Turn pantry inventory into an actionable decision: what should you use first? Connect prioritized ingredients directly to delicious meals.',
    type: 'website',
    locale: 'en_US',
    siteName: 'USE IT FIRST',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'USE IT FIRST — Household Food Intelligence',
    description: 'Decide what to eat first from what you already have.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'USE IT FIRST',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description:
      'Household food-intelligence application. Understand the food you already own and decide what should be used first.',
  };

  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="h-full flex flex-col font-sans bg-[#121513] bg-editorial-pattern text-[#EFF1EC] antialiased selection:bg-primary selection:text-white">
        <PantryProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <MobileNav />
          </ToastProvider>
        </PantryProvider>
      </body>
    </html>
  );
}
