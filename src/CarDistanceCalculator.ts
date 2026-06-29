export class CarDistanceCalculator {
/**
 * Fetches the road distance in kilometers between two geographic coordinates using the OSRM API.
 * @param originLat - The latitude of the origin point.
 * @param originLon - The longitude of the origin point.
 * @param destLat - The latitude of the destination point.
 * @param destLon - The longitude of the destination point.
 */
    static async getRoadDistanceKm(
    originLat: number, originLon: number,
    destLat: number, destLon: number
    ): Promise<number | null> {

  const url = `http://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.code !== "Ok") return null;

  return data.routes[0].distance / 1000; 
}
}

