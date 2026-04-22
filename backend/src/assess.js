import { runPcosRiskEngine } from "./engines/pcosEngine.js";
import { runIronDeficiencyEngine } from "./engines/idiEngine.js";
import { runAnemiaRiskEngine } from "./engines/anemiaEngine.js";
import { runInfectionRiskEngine } from "./engines/infectionEngine.js";
import { runMentalWellbeingEngine } from "./engines/mentalEngine.js";
import { runLifestyleEngine } from "./engines/lifestyleEngine.js";
import { runBmiEngine } from "./engines/bmiEngine.js";

export function runAllEngines(inputs) {
  return [
    runPcosRiskEngine(inputs),
    runAnemiaRiskEngine(inputs),
    runIronDeficiencyEngine(inputs),
    runMentalWellbeingEngine(inputs),
    runInfectionRiskEngine(inputs),
    runLifestyleEngine(inputs),
    runBmiEngine(inputs)
  ];
}
