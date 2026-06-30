export type TransportMode = "air" | "train" | "ship" | "truck";

export interface TransportLeg {
    mode: TransportMode;
    origin: string;
    destination: string;
    distanceKm: number;
    totalCO2Kg: number; 
}

export interface CalculationResult {
    totalCO2Kg: number;
}