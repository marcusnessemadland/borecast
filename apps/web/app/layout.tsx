import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Nav } from '@/components/Nav';
import { ServiceWorker } from '@/components/ServiceWorker';

export const metadata: Metadata = {
  title: { default: 'BoreCast — surfvarsel for Bore', template: '%s · BoreCast' },
  description: 'Bore Score, swell, vind, tidevann og beste surftidspunkt for Borestranda på Jæren.',
  applicationName: 'BoreCast',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BoreCast' },
  icons: { icon: '/icon.svg', apple: '/icon-maskable.svg' },
};

export const viewport: Viewport = {
  themeColor: '#f4f0e7',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="nb">
      <body>
        <ServiceWorker />
        <Nav />
        {children}
        <footer className="site-footer">
          <div className="shell">
            <span>BORECAST · JÆREN</span>
            <p>
              Et surfvarsel, ikke en fasit. Bygget med data fra MET Norway, Open-Meteo og
              Kartverket.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
