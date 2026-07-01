import * as fs from "fs";
import { haversineKm } from './HaversineKm';
import { ParseCoordinates } from './ParseCoordinates';

interface Airport {
  name: string;
  latitude: number;
  longitude: number;
}

export class AirportDistanceCalculator {
    private airports: Airport[];

    constructor(dataFilePath: string) {
        this.airports = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    }

    private findAirport(name: string): Airport | null {
        const parsed = ParseCoordinates.tryParseCoords(name);
        if (parsed) {
            return { name, latitude: parsed.latitude, longitude: parsed.longitude };
        }
        const q = name.toLowerCase();
        return (
            this.airports.find(a => a.name.toLowerCase() === q) ??
            this.airports.find(a => a.name.toLowerCase().includes(q)) ??
            null
        );
    }

    getDistance(nameA: string, nameB: string): { distanceKm: number } | null {
        const airportA = this.findAirport(nameA);
        const airportB = this.findAirport(nameB);
        if (!airportA) { console.error(`Airport not found: "${nameA}"`); return null; }
        if (!airportB) { console.error(`Airport not found: "${nameB}"`); return null; }
        return {
            distanceKm: Math.round(haversineKm(
                airportA.latitude, airportA.longitude,
                airportB.latitude, airportB.longitude
            ))
        };
    }

    getAirportCoordinates(name: string): { latitude: number; longitude: number } | null {
        const airport = this.findAirport(name);
        if (!airport) {
            console.error(`Airport not found: "${name}"`);
            return null;
        }
        return { latitude: airport.latitude, longitude: airport.longitude };
    }
}