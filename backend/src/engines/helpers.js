export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function normalize(points, maxPoints) {
  if (!maxPoints) return 0;
  return clamp(Math.round((points / maxPoints) * 100));
}

/**
 * Raw-point band using custom thresholds.
 * thresholds = [lowMax, moderateMax]  — anything above moderateMax is "high"
 */
export function getRawBand(points, thresholds) {
  const [lowMax, modMax] = thresholds;
  if (points <= lowMax) return "low";
  if (points <= modMax) return "moderate";
  return "high";
}

/** Kept for backward-compat if needed */
export function getBand(score) {
  if (score <= 30) return "low";
  if (score <= 60) return "moderate";
  return "high";
}

export function getConfidence(answered, total) {
  if (!total) return { score: 0, label: "confidenceLow" };

  const score = clamp(Math.round((answered / total) * 100));
  if (score >= 80) return { score, label: "confidenceHigh" };
  if (score >= 55) return { score, label: "confidenceMedium" };
  return { score, label: "confidenceLow" };
}

export function topContributors(items, count = 3) {
  return items
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, count)
    .map((item) => item.key);
}
