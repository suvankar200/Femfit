/**
 * BMI Calculator Engine
 * Takes weight (kg) and height (cm), returns BMI + category.
 */
export function runBmiEngine(inputs = {}) {
  const { weightKg, heightCm } = inputs;

  if (!weightKg || !heightCm || heightCm <= 0) {
    return {
      engine: "bmi",
      title: "BMI Calculator",
      bmi: null,
      category: null,
      band: null,
      recommendation: "Please provide valid weight and height values."
    };
  }

  const heightM = Number(heightCm) / 100;
  const bmi = Number((Number(weightKg) / (heightM * heightM)).toFixed(1));

  let category, band, recommendation;

  if (bmi < 18.5) {
    category = "Underweight";
    band = "high";
    recommendation = "You are underweight. Focus on nutrition-rich meals and consult a dietitian if needed.";
  } else if (bmi < 25) {
    category = "Normal";
    band = "low";
    recommendation = "Your BMI is in the healthy range. Keep maintaining a balanced diet and exercise!";
  } else if (bmi < 30) {
    category = "Overweight";
    band = "moderate";
    recommendation = "You are slightly overweight. Consider regular exercise and a balanced diet.";
  } else {
    category = "Obese";
    band = "high";
    recommendation = "Your BMI indicates obesity. Please consult a healthcare provider for a personalized plan.";
  }

  return {
    engine: "bmi",
    title: "BMI Calculator",
    bmi,
    category,
    band,
    recommendation
  };
}
