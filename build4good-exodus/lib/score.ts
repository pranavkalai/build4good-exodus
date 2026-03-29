import type { Planet } from "@/types/planet";

export function computeCVI(planet: Omit<Planet, "cvi">): number {
  let score = 0;

  if (planet.temp >= 260 && planet.temp <= 310) {
    score += 40;
  } else if (planet.temp >= 200 && planet.temp <= 320) {
    score += 25;
  } else if (planet.temp >= 150 && planet.temp <= 370) {
    score += 10;
  }

  if (planet.radius >= 0.8 && planet.radius <= 1.3) {
    score += 35;
  } else if (planet.radius >= 0.5 && planet.radius <= 1.6) {
    score += 18;
  }

  if (planet.mass === null) {
    score += 12;
  } else if (planet.mass >= 0.5 && planet.mass <= 3) {
    score += 25;
  } else if (planet.mass >= 0.1 && planet.mass <= 6) {
    score += 12;
  }

  return Math.max(0, Math.min(100, score));
}
