interface Coordinates {
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export class Geocoder {
  private readonly userAgent: string;
  private readonly baseUrl = "https://nominatim.openstreetmap.org/search";
  private lastRequestTime = 0;

  constructor(appName = "Co2Calculator") {
    this.userAgent = appName;
  }

  async geocode(address: string): Promise<Coordinates | null> {
    await this.rateLimit();

    const url = `${this.baseUrl}?q=${encodeURIComponent(address)}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`Nominatim request failed: ${res.status} ${res.statusText}`);
    }

    const data: NominatimResult[] = await res.json();

    if (!data.length) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  }

  // Set by nomination, sets a request limit 1 per second
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}