import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BoreCast — surfvarsel for Bore',
    short_name: 'BoreCast',
    description: 'Bore Score, swell, vind, tidevann og beste surftidspunkt for Borestranda.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f4f0e7',
    theme_color: '#f4f0e7',
    lang: 'nb',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
