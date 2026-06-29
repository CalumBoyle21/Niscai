import * as fs from "fs";
import * as readline from "readline";

interface Station {
  name: string;
  latitude: number;
  longitude: number;
}

async function quick(inputPath: string, outputPath: string): Promise<void> {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const stations: Station[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // skip header

    const cols = line.split(";");
    const name = cols[1]?.trim();
    const lat = parseFloat(cols[5]);
    const lon = parseFloat(cols[6]);

    if (!name || isNaN(lat) || isNaN(lon)) continue;

    stations.push({ name, latitude: lat, longitude: lon });
  }

  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2), "utf8");
  console.log(`✓ Extracted ${stations.length} stations → ${outputPath}`);
}

quick("stations.csv", "stations_coords.json").catch(console.error);