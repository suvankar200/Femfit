import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * PCOS Risk Score (PRS)
 * Exact point table from spec:
 *   Cycle >35 days        +4
 *   <8 cycles/year        +4
 *   Amenorrhea >3 months  +5
 *   Acne (moderate/severe)+2
 *   Facial hair growth    +3
 *   Hair thinning         +2
 *   BMI >25               +2
 *   Waist >80 cm          +2
 *   Family history diabetes+2
 *   Acanthosis nigricans  +3
 *   Sleep <6 hrs          +2
 *   High screen before bed+1
 *
 * Risk: 0-5 Low | 6-12 Moderate | 13+ High
 */
export function runPcosRiskEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 12;

  // Cycle >35 days
  if (inputs.cycleOver35 !== undefined) {
    answered++;
    if (inputs.cycleOver35) {
      points += 4;
      contributors.push({ key: "Cycle length >35 days", points: 4 });
    }
  }

  // <8 cycles per year
  if (inputs.lessThan8Cycles !== undefined) {
    answered++;
    if (inputs.lessThan8Cycles) {
      points += 4;
      contributors.push({ key: "Less than 8 cycles/year", points: 4 });
    }
  }

  // Amenorrhea >3 months
  if (inputs.amenorrhea3Months !== undefined) {
    answered++;
    if (inputs.amenorrhea3Months) {
      points += 5;
      contributors.push({ key: "Amenorrhea >3 months", points: 5 });
    }
  }

  // Acne moderate/severe
  if (inputs.acneModSevere !== undefined) {
    answered++;
    if (inputs.acneModSevere) {
      points += 2;
      contributors.push({ key: "Moderate/severe acne", points: 2 });
    }
  }

  // Facial hair growth
  if (inputs.facialHair !== undefined) {
    answered++;
    if (inputs.facialHair) {
      points += 3;
      contributors.push({ key: "Facial hair growth", points: 3 });
    }
  }

  // Hair thinning
  if (inputs.hairThinning !== undefined) {
    answered++;
    if (inputs.hairThinning) {
      points += 2;
      contributors.push({ key: "Hair thinning", points: 2 });
    }
  }

  // BMI >25
  if (inputs.bmiOver25 !== undefined) {
    answered++;
    if (inputs.bmiOver25) {
      points += 2;
      contributors.push({ key: "BMI >25", points: 2 });
    }
  }

  // Waist >80 cm
  if (inputs.waistOver80 !== undefined) {
    answered++;
    if (inputs.waistOver80) {
      points += 2;
      contributors.push({ key: "Waist >80 cm", points: 2 });
    }
  }

  // Family history diabetes
  if (inputs.familyDiabetes !== undefined) {
    answered++;
    if (inputs.familyDiabetes) {
      points += 2;
      contributors.push({ key: "Family history of diabetes", points: 2 });
    }
  }

  // Acanthosis nigricans
  if (inputs.acanthosis !== undefined) {
    answered++;
    if (inputs.acanthosis) {
      points += 3;
      contributors.push({ key: "Acanthosis nigricans", points: 3 });
    }
  }

  // Sleep <6 hrs
  if (inputs.sleepUnder6 !== undefined) {
    answered++;
    if (inputs.sleepUnder6) {
      points += 2;
      contributors.push({ key: "Sleep <6 hours", points: 2 });
    }
  }

  // High screen time before bed
  if (inputs.highScreenBeforeBed !== undefined) {
    answered++;
    if (inputs.highScreenBeforeBed) {
      points += 1;
      contributors.push({ key: "High screen time before bed", points: 1 });
    }
  }

  const band = getRawBand(points, [5, 12]);
  const confidence = getConfidence(answered, total);

  let recommendation = "Your PCOS risk looks low. Keep maintaining a healthy lifestyle!";
  if (band === "moderate") recommendation = "Moderate risk detected. Consider lifestyle changes and consult a doctor if symptoms persist.";
  if (band === "high") recommendation = "High risk detected. A hormone panel test is strongly recommended. Please consult a gynecologist.";

  return {
    engine: "pcos",
    title: "PCOS Risk Score",
    points,
    maxPoints: 32,
    band,
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: band === "high" ? "Hormone Panel" : null
  };
}
