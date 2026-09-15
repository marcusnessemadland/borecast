'use client';

import { useEffect, useState } from 'react';
import type { AlertRule } from '@borecast/domain';
import { BellIcon } from './icons';

const storageKey = 'borecast.alert-rules.v1';
const initialRules: AlertRule[] = [
  { id: 'score', spotId: 'bore', enabled: true, type: 'score_threshold', threshold: 7.5 },
  { id: 'beginner', spotId: 'bore', enabled: false, type: 'beginner_friendly' },
  { id: 'firing', spotId: 'bore', enabled: true, type: 'firing' },
  { id: 'barrel', spotId: 'bore', enabled: false, type: 'barrel_potential' },
  { id: 'morning', spotId: 'bore', enabled: false, type: 'morning_summary' },
];

const labels: Record<AlertRule['type'], { title: string; text: string }> = {
  score_threshold: {
    title: 'Score over terskel',
    text: 'Varsle når et sammenhengende surfvindu passerer valgt score.',
  },
  beginner_friendly: {
    title: 'Nybegynnervennlig',
    text: 'Små, håndterlige bølger og levelige vindforhold.',
  },
  firing: { title: 'Det fyrer', text: 'Sjeldne vinduer med Bore Score 8,5 eller høyere.' },
  barrel_potential: {
    title: 'Barrel-potensial',
    text: 'Lang periode, god retning og clean vind. Aldri en garanti.',
  },
  morning_summary: {
    title: 'Morgenrapport',
    text: 'Dagens beste vindu oppsummert når du står opp.',
  },
};

export function AlertsPanel() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setRules(JSON.parse(stored) as AlertRule[]);
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
      setPermission(
        'Notification' in window && 'serviceWorker' in navigator
          ? Notification.permission
          : 'unsupported',
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function update(id: string, patch: Partial<AlertRule>) {
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
    setSaved(false);
  }
  function save() {
    localStorage.setItem(storageKey, JSON.stringify(rules));
    setSaved(true);
  }
  async function enableNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator))
      return setPermission('unsupported');
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('BoreCast er klar', {
        body: 'Du bestemmer når vi skal rope. Ingen spam.',
        icon: '/icon.svg',
        tag: 'borecast-welcome',
      });
    }
  }

  return (
    <div className="alerts-panel">
      <section className="permission-card">
        <div className="permission-icon">
          <BellIcon />
        </div>
        <div>
          <span className="eyebrow">NETTLESERVARSLER</span>
          <h2>
            {permission === 'granted'
              ? 'Varsler er tillatt'
              : permission === 'denied'
                ? 'Varsler er blokkert'
                : permission === 'unsupported'
                  ? 'Ikke støttet her'
                  : 'Gi BoreCast lov til å rope'}
          </h2>
          <p>
            {permission === 'granted'
              ? 'Reglene lagres lokalt på denne enheten.'
              : 'På iPhone må BoreCast først legges til på Hjem-skjermen. Nettstedet må kjøre over HTTPS.'}
          </p>
        </div>
        {permission !== 'granted' && permission !== 'unsupported' ? (
          <button className="button primary" onClick={enableNotifications}>
            Tillat varsler
          </button>
        ) : null}
      </section>

      <section className="rules-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DINE REGLER · BORE</span>
            <h2>Når skal vi gi lyd?</h2>
          </div>
          <p>Reglene er lokale og krever ingen konto.</p>
        </div>
        <div className="rules-list">
          {rules.map((rule) => (
            <div className="rule" key={rule.id}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(event) => update(rule.id, { enabled: event.target.checked })}
                />
                <span aria-hidden="true" />
              </label>
              <div>
                <strong>{labels[rule.type].title}</strong>
                <p>{labels[rule.type].text}</p>
                {rule.type === 'score_threshold' ? (
                  <label className="threshold">
                    Terskel{' '}
                    <input
                      type="range"
                      min="4"
                      max="9.5"
                      step="0.5"
                      value={rule.threshold ?? 7.5}
                      onChange={(event) =>
                        update(rule.id, { threshold: Number(event.target.value) })
                      }
                    />
                    <output>{(rule.threshold ?? 7.5).toFixed(1)}</output>
                  </label>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="save-row">
          <button className="button primary" onClick={save}>
            Lagre regler
          </button>
          {saved ? <span role="status">Lagret på denne enheten ✓</span> : null}
        </div>
      </section>
      <aside className="architecture-note">
        <strong>Om levering i bakgrunnen</strong>
        <p>
          Reglene og tillatelsen fungerer lokalt nå. Pålitelig varsling mens nettleseren er helt
          lukket krever VAPID-nøkler, en varig abonnementsdatabase og en serverjobb. BoreCast later
          ikke som lokal lagring alene kan gjøre dette.
        </p>
      </aside>
    </div>
  );
}
