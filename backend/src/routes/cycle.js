import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { findByUserId, upsertCycle } from '../models/Cycle.js';

const router = express.Router();

/**
 * Core cycle calculation engine.
 * Rolls forward from lastPeriodDate by cycleLength until we find
 * the current cycle (the one we're in right now or the next upcoming one).
 * Returns predictions that are ALWAYS relevant to the current date.
 */
function calculateCycle(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cycleLength = data.cycleLength;
  const periodDuration = data.periodDuration;

  // Find the current cycle start by rolling forward from lastPeriodDate
  let currentCycleStart = new Date(data.lastPeriodDate);
  currentCycleStart.setHours(0, 0, 0, 0);

  // Roll forward until currentCycleStart + cycleLength > today
  // Guard: max 1000 iterations to prevent infinite loop (DoS protection)
  let safetyCounter = 0;
  while (safetyCounter < 1000) {
    safetyCounter++;
    const nextCycleStart = new Date(currentCycleStart);
    nextCycleStart.setDate(nextCycleStart.getDate() + cycleLength);
    if (nextCycleStart > today) break;
    currentCycleStart = nextCycleStart;
  }

  // Now currentCycleStart is the start of the cycle we're currently in
  const periodEnd = new Date(currentCycleStart);
  periodEnd.setDate(periodEnd.getDate() + periodDuration - 1);

  const nextPeriod = new Date(currentCycleStart);
  nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

  const ovulation = new Date(nextPeriod);
  ovulation.setDate(ovulation.getDate() - 14);

  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 2);

  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 2);

  // Follicular phase: from end of period to day before ovulation
  const follicularStart = new Date(periodEnd);
  follicularStart.setDate(follicularStart.getDate() + 1);

  const follicularEnd = new Date(ovulation);
  follicularEnd.setDate(ovulation.getDate() - 1);

  // Luteal phase: from day after ovulation to day before next period
  const lutealStart = new Date(ovulation);
  lutealStart.setDate(ovulation.getDate() + 1);

  const lutealEnd = new Date(nextPeriod);
  lutealEnd.setDate(nextPeriod.getDate() - 1);

  // Determine if we're currently in a period
  const isOnPeriod = today >= currentCycleStart && today <= periodEnd;
  const periodDay = isOnPeriod
    ? Math.floor((today - currentCycleStart) / (1000 * 60 * 60 * 24)) + 1
    : null;

  // Build multiple cycles for the calendar (3 past + current + 2 future)
  const cycles = [];
  let cycleStart = new Date(data.lastPeriodDate);
  cycleStart.setHours(0, 0, 0, 0);

  // Start from original lastPeriodDate and generate all cycles up to 2 future ones
  const endLimit = new Date(nextPeriod);
  endLimit.setDate(endLimit.getDate() + cycleLength * 2);

  while (cycleStart <= endLimit) {
    const cPeriodEnd = new Date(cycleStart);
    cPeriodEnd.setDate(cPeriodEnd.getDate() + periodDuration - 1);

    const cNextPeriod = new Date(cycleStart);
    cNextPeriod.setDate(cNextPeriod.getDate() + cycleLength);

    const cOvulation = new Date(cNextPeriod);
    cOvulation.setDate(cOvulation.getDate() - 14);

    const cFertileStart = new Date(cOvulation);
    cFertileStart.setDate(cOvulation.getDate() - 2);

    const cFertileEnd = new Date(cOvulation);
    cFertileEnd.setDate(cOvulation.getDate() + 2);

    const cFollicularStart = new Date(cPeriodEnd);
    cFollicularStart.setDate(cFollicularStart.getDate() + 1);

    const cFollicularEnd = new Date(cOvulation);
    cFollicularEnd.setDate(cOvulation.getDate() - 1);

    const cLutealStart = new Date(cOvulation);
    cLutealStart.setDate(cOvulation.getDate() + 1);

    const cLutealEnd = new Date(cNextPeriod);
    cLutealEnd.setDate(cNextPeriod.getDate() - 1);

    cycles.push({
      periodStart: cycleStart.toISOString(),
      periodEnd: cPeriodEnd.toISOString(),
      ovulation: cOvulation.toISOString(),
      fertileStart: cFertileStart.toISOString(),
      fertileEnd: cFertileEnd.toISOString(),
      follicularStart: cFollicularStart.toISOString(),
      follicularEnd: cFollicularEnd.toISOString(),
      lutealStart: cLutealStart.toISOString(),
      lutealEnd: cLutealEnd.toISOString(),
    });

    cycleStart = new Date(cNextPeriod);
  }

  return {
    currentCycleStart: currentCycleStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    nextPeriod: nextPeriod.toISOString(),
    ovulation: ovulation.toISOString(),
    fertileStart: fertileStart.toISOString(),
    fertileEnd: fertileEnd.toISOString(),
    follicularStart: follicularStart.toISOString(),
    follicularEnd: follicularEnd.toISOString(),
    lutealStart: lutealStart.toISOString(),
    lutealEnd: lutealEnd.toISOString(),
    isOnPeriod,
    periodDay,
    cycles,
  };
}

// @route   POST /api/cycle
router.post('/', protect, async (req, res) => {
  const { cycleLength, periodDuration, lastPeriodDate } = req.body;

  // ── Input validation (prevents crashes + DoS) ──────────────────────────────
  const cl = Number(cycleLength);
  const pd = Number(periodDuration);
  if (!cl || cl < 20 || cl > 45) {
    return res.status(400).json({ message: 'Cycle length must be between 20 and 45 days.' });
  }
  if (!pd || pd < 1 || pd > 10) {
    return res.status(400).json({ message: 'Period duration must be between 1 and 10 days.' });
  }
  if (!lastPeriodDate || isNaN(new Date(lastPeriodDate).getTime())) {
    return res.status(400).json({ message: 'A valid last period date is required.' });
  }
  if (new Date(lastPeriodDate) > new Date()) {
    return res.status(400).json({ message: 'Last period date cannot be in the future.' });
  }

  try {
    const cycle = await upsertCycle(req.user._id, {
      cycleLength: cl,
      periodDuration: pd,
      lastPeriodDate,
    });
    res.status(200).json(cycle);
  } catch (error) {
    console.error('[CYCLE POST]', error.message);
    res.status(500).json({ message: 'Could not save cycle data.' });
  }
});

// @route   GET /api/cycle
router.get('/', protect, async (req, res) => {
  try {
    const cycle = await findByUserId(req.user._id);
    if (!cycle) {
      return res.status(404).json({ message: 'No cycle data found. Please complete onboarding.' });
    }
    const predictions = calculateCycle(cycle);
    res.status(200).json({ cycle, predictions });
  } catch (error) {
    console.error('[CYCLE GET]', error.message);
    res.status(500).json({ message: 'Could not fetch cycle data.' });
  }
});

export default router;
