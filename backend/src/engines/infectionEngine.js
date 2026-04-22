import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * Discharge / Infection Risk Score (DRS)
 * Risk: 0-3 Normal | 4-7 Monitor | 8+ Gynecologist referral
 */
export function runInfectionRiskEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 4;

  // Abnormal discharge +3
  if (inputs.abnormalDischarge !== undefined) {
    answered++;
    if (inputs.abnormalDischarge) {
      points += 3;
      contributors.push({ key: "Abnormal discharge", points: 3 });
    }
  }

  // Foul smell +3
  if (inputs.foulSmell !== undefined) {
    answered++;
    if (inputs.foulSmell) {
      points += 3;
      contributors.push({ key: "Foul smell", points: 3 });
    }
  }

  // Itching +2
  if (inputs.itching !== undefined) {
    answered++;
    if (inputs.itching) {
      points += 2;
      contributors.push({ key: "Itching", points: 2 });
    }
  }

  // Pelvic pain +3
  if (inputs.pelvicPain !== undefined) {
    answered++;
    if (inputs.pelvicPain) {
      points += 3;
      contributors.push({ key: "Pelvic pain", points: 3 });
    }
  }

  const band = getRawBand(points, [3, 7]);
  const confidence = getConfidence(answered, total);

  const bandLabels = { low: "Normal", moderate: "Monitor", high: "Referral Needed" };

  let recommendation = "Everything looks normal. Maintain good hygiene practices.";
  if (band === "moderate") recommendation = "Some symptoms detected. Monitor closely and consult a doctor if they persist.";
  if (band === "high") recommendation = "Multiple concerning symptoms detected. A gynecologist visit is strongly recommended.";

  return {
    engine: "infection",
    title: "Discharge / Infection Risk",
    points,
    maxPoints: 11,
    band,
    bandLabel: bandLabels[band],
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: band === "high" ? "Gynecologist Consultation" : null
  };
}
