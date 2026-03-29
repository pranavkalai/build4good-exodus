# `/api/planets` Contract

Endpoint: `GET /api/planets`

Auth: none required

## Response Shape

```ts
export interface Planet {
  id: string;
  name: string;
  radius: number;
  mass: number | null;
  temp: number;
  distanceLy: number;
  period: number | null;
  ra: number;
  dec: number;
  cvi: number;
}

type PlanetsResponse = {
  data: Planet[];
  fallback: boolean;
};
```

The response always has this shape:

```json
{
  "data": [],
  "fallback": false
}
```

## Field Units

- `distanceLy`: light years
- `temp`: Kelvin
- `radius`: Earth radii
- `mass`: Earth masses
- `cvi`: `0–100`

## Fallback Behavior

If `fallback` is `true`, NASA was unreachable and mock data was returned instead.

Frontend can show a subtle warning or badge in this state so users know they are viewing backup data.

## Curl Example

```bash
curl http://localhost:3000/api/planets
```

## Local Mock Data

To use mock data locally without hitting the API:

```ts
import { MOCK_PLANETS } from '@/lib/mock/planets'
```

Mock file location: [lib/mock/planets.ts](/home/virtual/build4good-exodus/build4good-exodus/lib/mock/planets.ts)
