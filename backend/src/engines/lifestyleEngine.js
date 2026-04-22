import { getRawBand, getConfidence, topContributors } from "./helpers.js";

/**
 * Lifestyle & Sleep Module
 * Risk: 0-3 Good | 4-7 Needs Improvement | 8+ Poor Lifestyle
 */
export function runLifestyleEngine(inputs = {}) {
  const contributors = [];
  let points = 0;
  let answered = 0;
  const total = 5;

  // Sleep <6 hrs +3
  if (inputs.sleepUnder6 !== undefined) {
    answered++;
    if (inputs.sleepUnder6) {
      points += 3;
      contributors.push({ key: "Sleep less than 6 hours", points: 3 });
    }
  }

  // Screen time before bed >2 hrs +2
  if (inputs.screenBeforeBed !== undefined) {
    answered++;
    if (inputs.screenBeforeBed) {
      points += 2;
      contributors.push({ key: "High screen time before bed", points: 2 });
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

  // No exercise +2
  if (inputs.noExercise !== undefined) {
    answered++;
    if (inputs.noExercise) {
      points += 2;
      contributors.push({ key: "No regular exercise", points: 2 });
    }
  }

  // High stress +2
  if (inputs.highStress !== undefined) {
    answered++;
    if (inputs.highStress) {
      points += 2;
      contributors.push({ key: "High stress levels", points: 2 });
    }
  }

  const band = getRawBand(points, [3, 7]);
  const confidence = getConfidence(answered, total);

  const bandLabels = { low: "Good", moderate: "Needs Improvement", high: "Poor Lifestyle" };

  let recommendation = "Great lifestyle habits! Keep it up.";
  if (band === "moderate") recommendation = "Room for improvement. Focus on sleep hygiene, reducing screen time, and adding exercise.";
  if (band === "high") recommendation = "Your lifestyle needs attention. Poor sleep and stress can impact PCOS, mental health, and hormonal balance.";

  return {
    engine: "lifestyle",
    title: "Lifestyle & Sleep Score",
    points,
    maxPoints: 11,
    band,
    bandLabel: bandLabels[band],
    confidence,
    contributors: topContributors(contributors, 5),
    recommendation,
    recommendedTest: null
  };
}
