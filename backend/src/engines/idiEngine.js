import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * Iron Deficiency Index (IDI)
 * Captures hidden iron deficiency (normal Hb but low ferritin)
 * Risk: 0-4 Low | 5-9 Moderate | 10+ High (Ferritin test)
 */
export function runIronDeficiencyEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 7;

  // Hair fall +2
  if (inputs.hairFall !== undefined) {
    answered++;
    if (inputs.hairFall) {
      points += 2;
      contributors.push({ key: "Hair fall", points: 2 });
    }
  }

  // Brittle nails +2
  if (inputs.brittleNails !== undefined) {
    answered++;
    if (inputs.brittleNails) {
      points += 2;
      contributors.push({ key: "Brittle nails", points: 2 });
    }
  }

  // Restless legs +3
  if (inputs.restlessLegs !== undefined) {
    answered++;
    if (inputs.restlessLegs) {
      points += 3;
      contributors.push({ key: "Restless legs", points: 3 });
    }
  }

  // Cold intolerance +2
  if (inputs.coldIntolerance !== undefined) {
    answered++;
    if (inputs.coldIntolerance) {
      points += 2;
      contributors.push({ key: "Cold intolerance", points: 2 });
    }
  }

  // Poor concentration +2
  if (inputs.poorConcentration !== undefined) {
    answered++;
    if (inputs.poorConcentration) {
      points += 2;
      contributors.push({ key: "Poor concentration", points: 2 });
    }
  }

  // Fatigue (overlap) +1
  if (inputs.fatigue !== undefined) {
    answered++;
    if (inputs.fatigue) {
      points += 1;
      contributors.push({ key: "Fatigue", points: 1 });
    }
  }

  // Lab: Ferritin low +5
  if (inputs.ferritinLow !== undefined) {
    answered++;
    if (inputs.ferritinLow) {
      points += 5;
      contributors.push({ key: "Low ferritin (lab)", points: 5 });
    }
  }

  const band = getRawBand(points, [4, 9]);
  const confidence = getConfidence(answered, total);

  let recommendation = "Iron levels appear adequate. Continue a balanced diet.";
  if (band === "moderate") recommendation = "Moderate risk of hidden iron deficiency. Consider iron-rich foods and a ferritin test.";
  if (band === "high") recommendation = "High risk of iron deficiency. A Ferritin test is strongly recommended.";

  return {
    engine: "idi",
    title: "Iron Deficiency Index",
    points,
    maxPoints: 17,
    band,
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: band === "high" ? "Serum Ferritin" : null
  };
}
