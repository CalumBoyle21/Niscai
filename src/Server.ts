import express, { Request, Response } from "express";
import cors from "cors";
import * as fs from "fs";
import { JourneyCalculator } from "./JourneyCalculator";
import { TransportMode } from "./types";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

interface LegRequest {
  mode: TransportMode;
  origin: string;
  destination: string;
}

// Gets list of airport names for dropdowns
app.get("/api/locations/airports", (_req: Request, res: Response) => {
  const data = JSON.parse(fs.readFileSync("airports_coords.json", "utf8"));
  res.json(data.map((a: { name: string }) => a.name).sort());
});

// Gets list of train station names for dropdowns
app.get("/api/locations/stations", (_req: Request, res: Response) => {
  const data = JSON.parse(fs.readFileSync("stations_coords.json", "utf8"));
  res.json(data.map((s: { name: string }) => s.name).sort());
});

// Gets list of port names for dropdowns
app.get("/api/locations/ports", (_req: Request, res: Response) => {
  const data = JSON.parse(fs.readFileSync("PUB151_distances.json", "utf8"));
  res.json(Object.keys(data).sort());
});

// Sends post request to calculate journey CO2 emissions and distance
app.post("/api/journey", async (req: Request, res: Response) => {
  const { legs } = req.body as { legs: LegRequest[] };

  if (!Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({ error: "Provide at least one leg." });
  }

  const VALID_MODES: TransportMode[] = ["ship", "air", "truck", "train"];
  for (const leg of legs) {
    if (!VALID_MODES.includes(leg.mode)) {
      return res.status(400).json({ error: `Invalid mode: "${leg.mode}". Must be one of: ${VALID_MODES.join(", ")}.` });
    }
    if (!leg.origin?.trim() || !leg.destination?.trim()) {
      return res.status(400).json({ error: "Each leg must have a non-empty origin and destination." });
    }
  }

  const calc = new JourneyCalculator();

  try {
    for (const leg of legs) {
      await calc.addLeg(leg.mode, leg.origin.trim(), leg.destination.trim());
    }
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }

  const resultLegs = calc.getLegs();

  const totalCO2Kg = Math.round(resultLegs.reduce((s, l) => s + l.totalCO2Kg, 0) * 100) / 100;
  const totalDistanceKm = resultLegs.reduce((s, l) => s + l.distanceKm, 0);

  const co2ByMode = resultLegs.reduce((acc, l) => {
    acc[l.mode] = Math.round(((acc[l.mode] ?? 0) + l.totalCO2Kg) * 100) / 100;
    return acc;
  }, {} as Record<string, number>);

  return res.json({
    legs: resultLegs,
    summary: {
      totalCO2Kg,
      totalDistanceKm,
      legCount: resultLegs.length,
      co2ByMode,
    },
  });
});

// Gets health status
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Starts the server
app.listen(PORT, () => {
  console.log(`Niscai API running at http://localhost:${PORT}`);
});