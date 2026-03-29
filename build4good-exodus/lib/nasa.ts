import type { Planet } from "@/types/planet";

export interface NasaRow {
  pl_name: string;
  pl_rade: number;
  pl_bmasse: number | null;
  pl_orbper: number | null;
  sy_dist: number;
  pl_eqt: number;
  ra: number;
  dec: number;
}

export interface EnrichedNasaRow extends NasaRow {
  radiusScore: number;
  tempScore: number;
  habitabilityScore: number;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function esiComponent(x: number, xEarth: number, w = 1): number {
  if (x <= 0 || xEarth <= 0) {
    return 0;
  }

  const component = Math.pow(1 - Math.abs((x - xEarth) / (x + xEarth)), w);
  return clampScore(component);
}

function enrichRow(row: NasaRow): EnrichedNasaRow | null {
  if (row.pl_rade <= 0 || row.pl_eqt <= 0) {
    return null;
  }

  const radiusScore = esiComponent(row.pl_rade, 1);
  const tempScore = esiComponent(row.pl_eqt, 288);
  const habitabilityScore = clampScore(Math.sqrt(radiusScore * tempScore));

  return {
    ...row,
    radiusScore,
    tempScore,
    habitabilityScore,
  };
}

export async function fetchRawPlanets(): Promise<EnrichedNasaRow[]> {
  const query =
    "select top 300 pl_name, pl_rade, pl_bmasse, pl_orbper, sy_dist, pl_eqt, ra, dec from pscomppars where pl_rade < 2 and pl_rade > 0 and pl_eqt > 0 and sy_dist > 0";
  const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `NASA Exoplanet Archive request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const rows = (await response.json()) as NasaRow[];

  return rows
    .map(enrichRow)
    .filter((row): row is EnrichedNasaRow => row !== null)
    .sort((left, right) => right.habitabilityScore - left.habitabilityScore);
}

export function mapRow(row: EnrichedNasaRow): Planet {
  const distanceLy = Math.round(row.sy_dist * 3.26 * 10) / 10;
  const baseCvi = Math.round(row.habitabilityScore * 100);
  const distancePenalty = Math.round(distanceLy / 50);
  const cvi = Math.max(0, baseCvi - distancePenalty);

  return {
    id: row.pl_name.toLowerCase().replaceAll(" ", "-"),
    name: row.pl_name,
    radius: row.pl_rade,
    mass: row.pl_bmasse,
    temp: row.pl_eqt,
    distanceLy,
    period: row.pl_orbper,
    ra: row.ra,
    dec: row.dec,
    cvi,
  };
}