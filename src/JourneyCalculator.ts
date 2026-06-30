import { PortDistanceCalculator } from "./PortDistanceCalculator";
import { AirportDistanceCalculator } from './AirportDistanceCalculator';
import { Geocoder } from "./CoordAddressConverter";
import { TransportLeg, TransportMode } from "./types";
import { CarDistanceCalculator } from "./CarDistanceCalculator";
import { TrainDistanceCalculator } from "./TrainDistanceCalculator";

const EMISSION_FACTOR_SHIP = 0.015;
const EMISSION_FACTOR_AIR = 0.7;
const EMISSION_FACTOR_TRUCK = 0.2;
const EMISSION_FACTOR_TRAIN = 0.03;

export class JourneyCalculator {
    private legs: TransportLeg[] = [];
    private shipCalc: PortDistanceCalculator;
    private airCalc: AirportDistanceCalculator;
    private trainCalc: TrainDistanceCalculator;
    private geocoder: Geocoder;

    constructor() {
        this.shipCalc = new PortDistanceCalculator("./PUB151_distances.json");
        this.airCalc = new AirportDistanceCalculator("./airports_coords.json");
        this.trainCalc = new TrainDistanceCalculator("./stations_coords.json");
        this.geocoder = new Geocoder();
    }

    /**
     * Adds a transport leg to the journey.
     * @param mode Type of transport mode: "air", "train", "ship", or "truck"
     * @param origin Origin location
     * @param destination Destination location
     */
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
                this.legs.push({ mode: "ship", origin, destination, distanceKm: result.distanceKm, totalCO2Kg: result.distanceKm * EMISSION_FACTOR_SHIP });
                break;
            }

            case "air": {
                const airDistance = this.airCalc.getDistance(origin, destination);
                if (!airDistance) {
                    throw new Error(`Could not calculate air distance between "${origin}" and "${destination}"`);
                }
                this.legs.push({ mode: "air", origin, destination, distanceKm: airDistance.distanceKm, totalCO2Kg: airDistance.distanceKm * EMISSION_FACTOR_AIR });
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
                this.legs.push({ mode: "truck", origin, destination, distanceKm: distanceKm, totalCO2Kg: distanceKm * EMISSION_FACTOR_TRUCK });
                break;
            }

            case "train": {
                const trainDistance = this.trainCalc.getDistance(origin, destination);
                if (!trainDistance) {
                    throw new Error(`Could not find stations "${origin}" or "${destination}"`);
                }
                this.legs.push({ mode: "train", origin, destination, distanceKm: trainDistance.distanceKm, totalCO2Kg: trainDistance.distanceKm * EMISSION_FACTOR_TRAIN });
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