import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Om Bore Score' };

export default function AboutPage() {
  return (
    <main className="shell page-shell about-page">
      <header className="page-header">
        <span className="eyebrow">SÅNN TENKER BORECAST</span>
        <h1>
          Ikke bare vær.
          <br />
          Et surfvarsel.
        </h1>
        <p>
          Bore Score oversetter bølger, swell, vind og tidevann til én forklarlig vurdering fra 0
          til 10.
        </p>
      </header>
      <section className="about-grid">
        <article>
          <span className="chapter">01</span>
          <h2>Hva teller?</h2>
          <p>
            Scoren bruker swellhøyde, periode, retning, total bølgehøyde, lokal vind, tidevann og
            mixed swell. Gode ingredienser er ikke nok alene: hard onshore kan ødelegge en ellers
            flott swell.
          </p>
          <p>
            Temperatur påvirker draktråd og komfort, aldri bølgekvaliteten. Mørke merker
            surftidspunktet, men trekker ikke ned selve den fysiske kvaliteten.
          </p>
        </article>
        <article>
          <span className="chapter">02</span>
          <h2>Hvor sikkert er det?</h2>
          <p>
            Dette er prognoser fra vær- og bølgemodeller, ikke en live observasjon. Manglende felt
            forblir manglende og reduserer datagrunnlaget.
          </p>
          <p>
            Første scoringsprofil for Bore er en åpen, deterministisk heuristikk. Den må finjusteres
            ved å sammenligne varselet mot virkelige dager på stranden.
          </p>
        </article>
        <article>
          <span className="chapter">03</span>
          <h2>Hvem er det for?</h2>
          <p>
            Den universelle Bore Scoren er lik for alle. I tillegg viser vi egnethet for
            nybegynnere, viderekomne og erfarne. Stor, langperiodisk swell kan score høyt og
            samtidig være feil dag å lære på.
          </p>
          <p>
            Vi sier aldri at surfing er «trygt». Du må vurdere egen form, evner, strøm, folk i
            vannet og faktiske forhold.
          </p>
        </article>
        <article>
          <span className="chapter">04</span>
          <h2>Bølge vs. swell</h2>
          <p>
            <strong>Total bølgehøyde</strong> kombinerer energien fra vindbølger og flere
            swellkomponenter. <strong>Primærswell</strong> er den dominerende organiserte energien —
            retning og periode sier mye om hvordan den kan treffe Bore.
          </p>
          <p>
            Lokale sandbanker og bathymetri avgjør mer enn en grov modell kan se. Derfor sier vi
            barrel-potensial, aldri garanterte barrels.
          </p>
        </article>
      </section>
      <section className="sources-section">
        <span className="eyebrow">KILDER OG LISENSER</span>
        <h2>Data vi står på skuldrene til</h2>
        <div className="source-links">
          <a href="https://api.met.no/" target="_blank" rel="noreferrer">
            <strong>MET Norway</strong>
            <span>Atmosfærisk vær og soloppgang/-nedgang. Data under METs gjeldende vilkår.</span>
          </a>
          <a
            href="https://open-meteo.com/en/docs/marine-weather-api"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Open-Meteo Marine</strong>
            <span>Modellert bølge, swell og sjøtemperatur. Kystnøyaktighet varierer.</span>
          </a>
          <a
            href="https://www.kartverket.no/api-og-data/tidevann-og-vannstandsdata"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Kartverket</strong>
            <span>Tidevann relativt til middelvann. CC BY 4.0.</span>
          </a>
          <a
            href="https://www.nasjonaleturistveger.no/no/turistvegene/jaeren/borestranda/"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Statens vegvesen</strong>
            <span>Verifisert posisjon for Borestranda.</span>
          </a>
        </div>
      </section>
      <aside className="calibration-box">
        <span className="eyebrow">KALIBRERINGSSTATUS</span>
        <strong>Første heuristiske profil</strong>
        <p>
          Retningene og tersklene er samlet i spotkonfigurasjonen og kan tunes uten å skrive om
          motoren. Tidevannsprofilen er foreløpig med lav vekt til den er validert lokalt.
        </p>
      </aside>
      <Link className="button primary" href="/">
        Tilbake til Bore
      </Link>
    </main>
  );
}
