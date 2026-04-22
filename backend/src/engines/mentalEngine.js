import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * Mental Health Risk Score (MHR)
 * Risk: 0-5 Stable | 6-10 At risk | 11+ Needs intervention
 */
export function runMentalWellbeingEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 6;

  // Sleep <6 hrs +3
  if (inputs.sleepUnder6 !== undefined) {
    answered++;
    if (inputs.sleepUnder6) {
      points += 3;
      contributors.push({ key: "Sleep less than 6 hours", points: 3 });
    }
  }

  // Night awakenings +2
  if (inputs.nightAwakenings !== undefined) {
    answered++;
    if (inputs.nightAwakenings) {
      points += 2;
      contributors.push({ key: "Frequent night awakenings", points: 2 });
    }
  }

  // High screen time +2
  if (inputs.highScreenTime !== undefined) {
    answered++;
    if (inputs.highScreenTime) {
      points += 2;
      contributors.push({ key: "High screen time", points: 2 });
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

  // Mood swings +3
  if (inputs.moodSwings !== undefined) {
    answered++;
    if (inputs.moodSwings) {
      points += 3;
      contributors.push({ key: "Mood swings", points: 3 });
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

  const band = getRawBand(points, [5, 10]);
  const confidence = getConfidence(answered, total);

  const bandLabels = { low: "Stable", moderate: "At Risk", high: "Needs Intervention" };

  let recommendation = "Your mental health looks stable. Keep up healthy habits!";
  if (band === "moderate") recommendation = "You may be at risk. Focus on sleep quality, reduce screen time, and consider talking to someone.";
  if (band === "high") recommendation = "Intervention recommended. Please seek professional support — you deserve to feel better.";

  return {
    engine: "mental",
    title: "Mental Health Score",
    points,
    maxPoints: 14,
    band,
    bandLabel: bandLabels[band],
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: null
  };
}
