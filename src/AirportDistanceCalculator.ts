import * as fs from "fs";

interface Airport {
  name: string;
  latitude: number;
  longitude: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const airports: Airport[] = JSON.parse(
  fs.readFileSync("airports_coords.json", "utf8")
);

export function getAirportCoordinates(name: string): Coordinates | null {
  const q = name.toLowerCase();

  const match =
    airports.find(a => a.name.toLowerCase() === q) ??
    airports.find(a => a.name.toLowerCase().includes(q));

  if (!match) return null;

  return { latitude: match.latitude, longitude: match.longitude };
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth's radius dont change
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
    Math.cos(toRad(b.latitude)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(h));
}

export function getDistanceBetweenAirports(
  nameA: string,
  nameB: string
): { distanceKm: number; distanceMiles: number } | null {
  const coordsA = getAirportCoordinates(nameA);
  const coordsB = getAirportCoordinates(nameB);

  if (!coordsA) { console.error(`Airport not found: "${nameA}"`); return null; }
  if (!coordsB) { console.error(`Airport not found: "${nameB}"`); return null; }

  const distanceKm = haversineKm(coordsA, coordsB);
  return {
    distanceKm: Math.round(distanceKm),
    distanceMiles: Math.round(distanceKm * 0.621371),
  };
}