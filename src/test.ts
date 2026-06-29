import { JourneyCalculator } from "./JourneyCalculator";
import { Geocoder } from "./CoordAddressConverter";

async function main() {
  const geocoder = new Geocoder();
  const journeyCalc = new JourneyCalculator();

  await journeyCalc.addLeg("ship", "Aberdeen, Scotland", "Singapore");
  await journeyCalc.addLeg("ship", "Singapore", "Shanghai, China");
  await journeyCalc.addLeg("air", "Lowell Field", "Grass Patch Airport");

  const coords = await geocoder.geocode("Aberdeen, Scotland");
  console.log(coords);

  await journeyCalc.addLeg("truck", "1600 Amphitheatre Parkway, Mountain View, CA", "1 Infinite Loop, Cupertino, CA");

  const legs = await journeyCalc.getLegs();
  console.log(legs);

}

main().catch(console.error);