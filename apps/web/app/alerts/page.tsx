import type { Metadata } from 'next';
import { AlertsPanel } from '@/components/AlertsPanel';

export const metadata: Metadata = { title: 'Surfvarsler' };

export default function AlertsPage() {
  return (
    <main className="shell page-shell">
      <header className="page-header">
        <span className="eyebrow">LOKALT · UTEN KONTO</span>
        <h1>Surfvarsler</h1>
        <p>Bli vekket når Bore våkner. Ikke for hvert lille vindkast.</p>
      </header>
      <AlertsPanel />
    </main>
  );
}
