import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * Anemia Risk Score (ARS)
 * Risk: 0-5 Low | 6-10 Moderate | 11+ High (CBC recommended)
 */
export function runAnemiaRiskEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 13;

  // Heavy bleeding +3
  if (inputs.heavyBleeding !== undefined) {
    answered++;
    if (inputs.heavyBleeding) {
      points += 3;
      contributors.push({ key: "Heavy menstrual bleeding", points: 3 });
    }
  }

  // Period >5 days +2
  if (inputs.periodOver5Days !== undefined) {
    answered++;
    if (inputs.periodOver5Days) {
      points += 2;
      contributors.push({ key: "Period duration >5 days", points: 2 });
    }
  }

  // Fatigue +2
  if (inputs.fatigue !== undefined) {
    answered++;
    if (inputs.fatigue) {
      points += 2;
      contributors.push({ key: "Persistent fatigue", points: 2 });
    }
  }

  // Dizziness +2
  if (inputs.dizziness !== undefined) {
    answered++;
    if (inputs.dizziness) {
      points += 2;
      contributors.push({ key: "Dizziness", points: 2 });
    }
  }

  // Pale conjunctiva +3
  if (inputs.paleConjunctiva !== undefined) {
    answered++;
    if (inputs.paleConjunctiva) {
      points += 3;
      contributors.push({ key: "Pale conjunctiva", points: 3 });
    }
  }

  // BMI <18.5 +2
  if (inputs.bmiUnder18 !== undefined) {
    answered++;
    if (inputs.bmiUnder18) {
      points += 2;
      contributors.push({ key: "BMI <18.5 (underweight)", points: 2 });
    }
  }

  // Worm infestation history +2
  if (inputs.wormHistory !== undefined) {
    answered++;
    if (inputs.wormHistory) {
      points += 2;
      contributors.push({ key: "History of worm infestation", points: 2 });
    }
  }

  // Vegetarian no iron support +2
  if (inputs.vegNoIron !== undefined) {
    answered++;
    if (inputs.vegNoIron) {
      points += 2;
      contributors.push({ key: "Vegetarian without iron supplementation", points: 2 });
    }
  }

  // Low leafy vegetables +2
  if (inputs.lowLeafyVeg !== undefined) {
    answered++;
    if (inputs.lowLeafyVeg) {
      points += 2;
      contributors.push({ key: "Low leafy vegetable intake", points: 2 });
    }
  }

  // Tea/coffee with meals +1
  if (inputs.teaCoffeeWithMeals !== undefined) {
    answered++;
    if (inputs.teaCoffeeWithMeals) {
      points += 1;
      contributors.push({ key: "Tea/coffee with meals", points: 1 });
    }
  }

  // Lab: Hb low +4
  if (inputs.hbLow !== undefined) {
    answered++;
    if (inputs.hbLow) {
      points += 4;
      contributors.push({ key: "Low hemoglobin (lab)", points: 4 });
    }
  }

  // Lab: Low MCV +2
  if (inputs.mcvLow !== undefined) {
    answered++;
    if (inputs.mcvLow) {
      points += 2;
      contributors.push({ key: "Low MCV (lab)", points: 2 });
    }
  }

  // Lab: Low ferritin +4
  if (inputs.ferritinLow !== undefined) {
    answered++;
    if (inputs.ferritinLow) {
      points += 4;
      contributors.push({ key: "Low ferritin (lab)", points: 4 });
    }
  }

  const band = getRawBand(points, [5, 10]);
  const confidence = getConfidence(answered, total);

  let recommendation = "Your anemia risk is low. Keep eating iron-rich foods!";
  if (band === "moderate") recommendation = "Moderate risk. Increase iron-rich foods and consider getting a CBC test.";
  if (band === "high") recommendation = "High risk detected. A Complete Blood Count (CBC) test is strongly recommended.";

  return {
    engine: "anemia",
    title: "Anemia Risk Score",
    points,
    maxPoints: 31,
    band,
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: band === "high" ? "CBC (Complete Blood Count)" : null
  };
}
