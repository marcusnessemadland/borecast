'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell empty-state">
      <span className="eyebrow">NOE GIKK SKEIS</span>
      <h1>En bølge traff serveren.</h1>
      <p>Prøv på nytt. Hvis det fortsatt lugger, er dataene sannsynligvis på vei tilbake.</p>
      <button className="button primary" onClick={reset}>
        Prøv igjen
      </button>
    </main>
  );
}
