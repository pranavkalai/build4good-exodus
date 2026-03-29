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
