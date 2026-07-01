import { haversineKm } from "./HaversineKm";
import { ParseCoordinates } from "./ParseCoordinates";
import { Geocoder } from "./CoordAddressConverter";

export class CarDistanceCalculator {

    private static geocoder = new Geocoder("NiscaiCO2Calculator");

  /**
   * Fetches the road distance in kilometers between two locations using the OSRM API.
   * Accepts either coordinate strings ("lat, lon") or plain addresses.
   * Falls back to Haversine with a detour factor if OSRM fails.
   */
  static async getRoadDistanceKm(origin: string, destination: string): Promise<number | null> {
  const parsedOrigin = ParseCoordinates.tryParseCoords(origin);
  const parsedDest = ParseCoordinates.tryParseCoords(destination);

  const [coordsA, coordsB] = parsedOrigin && parsedDest
    ? [parsedOrigin, parsedDest]
    : await Promise.all([
        parsedOrigin ?? this.geocoder.geocode(origin),
        parsedDest   ?? this.geocoder.geocode(destination),
      ]);

  if (!coordsA || !coordsB) return null;

  const url = `http://router.project-osrm.org/route/v1/driving/${coordsA.longitude},${coordsA.latitude};${coordsB.longitude},${coordsB.latitude}?overview=false`;

  const DETOUR_FACTOR = 1.3;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok") {
      return haversineKm(coordsA.latitude, coordsA.longitude, coordsB.latitude, coordsB.longitude) * DETOUR_FACTOR;
    }
    return data.routes[0].distance / 1000;
  } catch {
    return haversineKm(coordsA.latitude, coordsA.longitude, coordsB.latitude, coordsB.longitude) * DETOUR_FACTOR;
  }
}
}