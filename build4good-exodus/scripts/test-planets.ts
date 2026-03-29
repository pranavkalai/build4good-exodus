import type { Planet } from "../types/planet";

type PlanetsResponse = {
  data: Planet[];
  fallback: boolean;
};

function logAssertion(label: string, passed: boolean) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
}

async function main() {
  const response = await fetch("http://localhost:3000/api/planets");

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as PlanetsResponse;
  const planets = payload.data;
  const topPlanet = planets[0];

  console.log(`fallback: ${payload.fallback}`);
  console.log("top 5 planets by CVI:");

  planets.slice(0, 5).forEach((planet, index) => {
    console.log(
      `${index + 1}. ${planet.name} | cvi=${planet.cvi} | temp=${planet.temp} | radius=${planet.radius} | distanceLy=${planet.distanceLy}`,
    );
  });

  logAssertion("Top result has cvi > 50", Boolean(topPlanet && topPlanet.cvi > 50));
  logAssertion(
    "Top result temp is between 150 and 400",
    Boolean(topPlanet && topPlanet.temp >= 150 && topPlanet.temp <= 400),
  );
  logAssertion("Top result distanceLy > 0", Boolean(topPlanet && topPlanet.distanceLy > 0));
  logAssertion("Array has at least 10 planets", planets.length >= 10);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`FAIL: ${message}`);
  process.exit(1);
});
