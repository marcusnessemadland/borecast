export type WindRelation = 'offshore' | 'onshore' | 'cross-shore';

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function angularDifference(a: number, b: number): number {
  const difference = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(difference, 360 - difference);
}

export function compassDirection(degrees: number): string {
  const points = [
    'N',
    'NNØ',
    'NØ',
    'ØNØ',
    'Ø',
    'ØSØ',
    'SØ',
    'SSØ',
    'S',
    'SSV',
    'SV',
    'VSV',
    'V',
    'VNV',
    'NV',
    'NNV',
  ];
  const index = Math.round(normalizeDegrees(degrees) / 22.5) % 16;
  return points[index] ?? 'N';
}

/** Both values are meteorological "from" directions. shoreNormal points from land to sea. */
export function windRelation(windFromDeg: number, shoreNormalDeg: number): WindRelation {
  const seaDifference = angularDifference(windFromDeg, shoreNormalDeg);
  const landDifference = angularDifference(windFromDeg, shoreNormalDeg + 180);
  if (landDifference <= 55) return 'offshore';
  if (seaDifference <= 55) return 'onshore';
  return 'cross-shore';
}
