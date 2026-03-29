import { NextResponse } from "next/server";

import { MOCK_PLANETS } from "@/lib/mock/planets";
import { fetchRawPlanets, mapRow } from "@/lib/nasa";
import { computeCVI } from "@/lib/score";
import type { Planet } from "@/types/planet";

export async function GET() {
  try {
    const rows = await fetchRawPlanets();

    const planets: Planet[] = rows
      .map((row) => {
        const planet = mapRow(row);
        const cvi = computeCVI({
          id: planet.id,
          name: planet.name,
          radius: planet.radius,
          mass: planet.mass,
          temp: planet.temp,
          distanceLy: planet.distanceLy,
          period: planet.period,
          ra: planet.ra,
          dec: planet.dec,
        });

        return {
          ...planet,
          cvi,
        };
      })
      .filter((planet) => planet.cvi !== 0)
      .sort((left, right) => right.cvi - left.cvi);

    return NextResponse.json({ data: planets, fallback: false });
  } catch {
    return NextResponse.json({ data: MOCK_PLANETS, fallback: true }, { status: 200 });
  }
}
