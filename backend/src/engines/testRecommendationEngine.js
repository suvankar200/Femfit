/**
 * Test Recommendation Engine
 * Aggregates results from all risk scores and recommends appropriate lab tests.
 */
export function runTestRecommendationEngine(results = {}) {
  const tests = [];

  if (results.pcos === "high") {
    tests.push({
      test: "Hormone Panel",
      reason: "High PCOS risk detected",
      description: "Includes LH, FSH, Testosterone, DHEA-S, AMH, and Thyroid panel"
    });
  }

  if (results.anemia === "high") {
    tests.push({
      test: "CBC (Complete Blood Count)",
      reason: "High anemia risk detected",
      description: "Checks hemoglobin, RBC count, MCV, and other blood parameters"
    });
  }

  if (results.idi === "high") {
    tests.push({
      test: "Serum Ferritin",
      reason: "High iron deficiency risk",
      description: "Measures stored iron levels — can detect deficiency even with normal hemoglobin"
    });
  }

  // General fatigue across multiple modules
  const hasFatigue = results.anemia === "moderate" || results.idi === "moderate" || results.mental === "moderate";
  if (hasFatigue) {
    tests.push({
      test: "Vitamin D",
      reason: "General fatigue across assessments",
      description: "Low Vitamin D is common and causes fatigue, bone pain, and mood issues"
    });
  }

  // Combined high risk = full panel
  const highCount = Object.values(results).filter(v => v === "high").length;
  if (highCount >= 2) {
    tests.push({
      test: "Full Health Panel",
      reason: "Multiple high-risk areas detected",
      description: "Comprehensive panel including CBC, Iron studies, Hormones, Thyroid, Vitamin D, and Blood Sugar"
    });
  }

  return {
    engine: "testRecommendation",
    title: "Test Recommendations",
    tests,
    hasRecommendations: tests.length > 0
  };
}
