import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function WaveIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 15c3.2 0 3.2-3 6.4-3s3.2 3 6.4 3 3.2-3 6.4-3" />
      <path d="M2 19c3.2 0 3.2-2 6.4-2s3.2 2 6.4 2 3.2-2 6.4-2" />
      <path d="M7 8.5c2.6-4 7.5-4.7 10.8-1.2-3.8-.8-6.3.2-7.8 3.1" />
    </svg>
  );
}
export function WindIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8h11.5c2.9 0 2.9-4 0-4-1.2 0-2.1.6-2.4 1.5" />
      <path d="M3 12h16c2.7 0 2.7 4 0 4-1.1 0-1.9-.5-2.3-1.3" />
      <path d="M3 16h8" />
    </svg>
  );
}
export function ThermometerIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0Z" />
      <path d="M12 8v9" />
    </svg>
  );
}
export function TideIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M3 17c2.2 0 2.2-1.5 4.4-1.5S9.6 17 11.8 17s2.2-1.5 4.4-1.5S18.4 17 20.6 17" />
      <path d="M3 21c2.2 0 2.2-1.5 4.4-1.5S9.6 21 11.8 21s2.2-1.5 4.4-1.5S18.4 21 20.6 21" />
    </svg>
  );
}
export function SunIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
export function BellIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}
export function ArrowIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}
export function CloseIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
