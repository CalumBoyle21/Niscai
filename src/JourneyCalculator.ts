import { PortDistanceCalculator } from "./PortDistanceCalculator";
import { getDistanceBetweenAirports } from './AirportDistanceCalculator';
import { TransportLeg, TransportMode, CalculationResult } from "./types";

export class JourneyCalculator {
    private legs: TransportLeg[] = [];
    private shipCalc: PortDistanceCalculator;

    constructor() {
        this.shipCalc = new PortDistanceCalculator("./PUB151_distances.json");
    }

    addLeg(mode: TransportMode, origin: string, destination: string): void {
        switch (mode) {
            case "ship":
                const EMISSION_FACTOR_SHIP = 0.015; // TODO: Replace with actual emission factor for ships in kg CO2 per km

                if (!this.shipCalc.searchPorts(origin) || !this.shipCalc.searchPorts(destination)) {
                    throw new Error(`Invalid port names: "${origin}" or "${destination}"`);
                }
    
                const result = this.shipCalc.findRoute(origin, destination);
                if (!result) {
                    throw new Error(`No route found between "${origin}" and "${destination}"`);
                }
    
                this.legs.push({ mode: "ship", distanceKm: result.distanceKm, totalCO2Kg: result.distanceKm * EMISSION_FACTOR_SHIP });
                break;
                
            case "air":
                const airDistance = getDistanceBetweenAirports(origin, destination);
                if (!airDistance) {
                    throw new Error(`An error occurred while calculating the distance between airports "${origin}" and "${destination}".`);
                }

                this.legs.push({ mode: "air", distanceKm: airDistance.distanceKm, totalCO2Kg: 0 });

                break;
            case "truck":

                this.legs.push({ mode: "truck", distanceKm: 0, totalCO2Kg: 0 });

                break;
            case "train":
                this.legs.push({ mode: "train", distanceKm: 0, totalCO2Kg: 0 });

                break;
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