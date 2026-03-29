import type { Planet } from "@/types/planet";

export interface NasaRow {
  pl_name: string;
  pl_rade: number;
  pl_bmasse: number | null;
  pl_orbper: number | null;
  st_dist: number;
  pl_eqt: number;
  ra: number;
  dec: number;
}

export async function fetchRawPlanets(): Promise<NasaRow[]> {
  const query =
    "select top 300 pl_name, pl_rade, pl_bmasse, pl_orbper, st_dist, pl_eqt, ra, dec from pscomppars where pl_rade < 2 and pl_rade > 0 and pl_eqt > 0 and st_dist > 0";
  const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `NASA Exoplanet Archive request failed with status ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as NasaRow[];
}

export function mapRow(row: NasaRow): Planet {
  return {
    id: row.pl_name.toLowerCase().replaceAll(" ", "-"),
    name: row.pl_name,
    radius: row.pl_rade,
    mass: row.pl_bmasse,
    temp: row.pl_eqt,
    distanceLy: Math.round(row.st_dist * 3.26 * 10) / 10,
    period: row.pl_orbper,
    ra: row.ra,
    dec: row.dec,
    cvi: 0,
  };
}
