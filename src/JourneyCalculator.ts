import { PortDistanceCalculator } from "./PortDistanceCalculator";
import { getDistanceBetweenAirports } from './AirportDistanceCalculator';
import { Geocoder } from "./CoordAddressConverter";
import { TransportLeg, TransportMode } from "./types";
import { CarDistanceCalculator } from "./CarDistanceCalculator";

const EMISSION_FACTOR_SHIP = 0.015;
const EMISSION_FACTOR_AIR = 0.7;
const EMISSION_FACTOR_TRUCK = 0.2;
const EMISSION_FACTOR_TRAIN = 0.03;

export class JourneyCalculator {
    private legs: TransportLeg[] = [];
    private shipCalc: PortDistanceCalculator;
    private geocoder: Geocoder;

    constructor() {
        this.shipCalc = new PortDistanceCalculator("./PUB151_distances.json");
        this.geocoder = new Geocoder();
    }

    async addLeg(mode: TransportMode, origin: string, destination: string): Promise<void> {
        switch (mode) {
            case "ship": {
                if (!this.shipCalc.searchPorts(origin) || !this.shipCalc.searchPorts(destination)) {
                    throw new Error(`Invalid port names: "${origin}" or "${destination}"`);
                }
                const result = this.shipCalc.findRoute(origin, destination);
                if (!result) {
                    throw new Error(`No route found between "${origin}" and "${destination}"`);
                }
                this.legs.push({ mode: "ship", distanceKm: result.distanceKm, totalCO2Kg: result.distanceKm * EMISSION_FACTOR_SHIP });
                break;
            }
            case "air": {
                const airDistance = getDistanceBetweenAirports(origin, destination);
                if (!airDistance) {
                    throw new Error(`Could not calculate air distance between "${origin}" and "${destination}"`);
                }
                this.legs.push({ mode: "air", distanceKm: airDistance.distanceKm, totalCO2Kg: airDistance.distanceKm * EMISSION_FACTOR_AIR });
                break;
            }
            case "truck": {
                const [coordsA, coordsB] = await Promise.all([
                this.geocoder.geocode(origin),
                this.geocoder.geocode(destination),
                ]);

                if (!coordsA || !coordsB) {
                    throw new Error(`Could not geocode addresses: "${origin}" or "${destination}"`);
                }

                const distanceKm = await CarDistanceCalculator.getRoadDistanceKm(
                    coordsA.latitude, coordsA.longitude,
                    coordsB.latitude, coordsB.longitude
                );

                if (distanceKm === null) {
                    throw new Error(`Could not calculate road distance between "${origin}" and "${destination}"`);
                }
                
                this.legs.push({ mode: "truck", distanceKm, totalCO2Kg: distanceKm * EMISSION_FACTOR_TRUCK });
                break;
            }
            case "train": {
                this.legs.push({ mode: "train", distanceKm: 0, totalCO2Kg: 0 });
                break;
            }
            default:
                throw new Error(`Unsupported transport mode: ${mode}`);
        }
    }

    getLegs(): TransportLeg[] {
        return this.legs;
    }

    resetLegs(): void {
        this.legs = [];
    }
}