import { JourneyCalculator } from "./JourneyCalculator";

const journeyCalc = new JourneyCalculator();
journeyCalc.addLeg("ship", "Aberdeen, Scotland", "Singapore");
journeyCalc.addLeg("ship", "Singapore", "Shanghai, China");

var legs = journeyCalc.getLegs();

console.log(legs);