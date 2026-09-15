import Link from 'next/link';

export function Nav() {
  return (
    <header className="site-header">
      <div className="shell nav-inner">
        <Link className="brand" href="/" aria-label="BoreCast hjem">
          <span className="brand-mark" aria-hidden="true">
            BC
          </span>
          <span>BORECAST</span>
        </Link>
        <nav aria-label="Hovedmeny">
          <Link href="/#forecast">Varsel</Link>
          <Link href="/alerts">Varsler</Link>
          <Link href="/about">Om</Link>
        </nav>
      </div>
    </header>
  );
}
