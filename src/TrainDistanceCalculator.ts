import * as fs from "fs";
import { haversineKm } from './HaversineKm';
import { ParseCoordinates } from './ParseCoordinates';

interface Station {
  name: string;
  latitude: number;
  longitude: number;
}

const RAIL_DETOUR_FACTOR = 1.2;

export class TrainDistanceCalculator {
    private stations: Station[];

    constructor(dataFilePath: string) {
        this.stations = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    }

    private findStation(name: string): Station | null {
        const parsed = ParseCoordinates.tryParseCoords(name);
        if (parsed) {
            return { name, latitude: parsed.latitude, longitude: parsed.longitude };
        }
        const q = name.toLowerCase();
        return (
            this.stations.find(s => s.name.toLowerCase() === q) ??
            this.stations.find(s => s.name.toLowerCase().includes(q)) ??
            null
        );
    }

    getDistance(nameA: string, nameB: string): { distanceKm: number } | null {
        const stationA = this.findStation(nameA);
        const stationB = this.findStation(nameB);
        if (!stationA) { console.error(`Station not found: "${nameA}"`); return null; }
        if (!stationB) { console.error(`Station not found: "${nameB}"`); return null; }
        return {
            distanceKm: Math.round(haversineKm(
                stationA.latitude, stationA.longitude,
                stationB.latitude, stationB.longitude
            ) * RAIL_DETOUR_FACTOR)
        };
    }
}