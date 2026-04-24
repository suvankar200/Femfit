import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { runPcosRiskEngine } from '../engines/pcosEngine.js';
import { runAnemiaRiskEngine } from '../engines/anemiaEngine.js';
import { runIronDeficiencyEngine } from '../engines/idiEngine.js';
import { runMentalWellbeingEngine } from '../engines/mentalEngine.js';
import { runInfectionRiskEngine } from '../engines/infectionEngine.js';
import { runLifestyleEngine } from '../engines/lifestyleEngine.js';
import { runBmiEngine } from '../engines/bmiEngine.js';
import { runTestRecommendationEngine } from '../engines/testRecommendationEngine.js';
import { saveAssessment, getAssessmentsByUser, getLatestAssessments } from '../models/Assessment.js';

const router = express.Router();

const engines = {
  pcos: runPcosRiskEngine,
  anemia: runAnemiaRiskEngine,
  idi: runIronDeficiencyEngine,
  mental: runMentalWellbeingEngine,
  infection: runInfectionRiskEngine,
  lifestyle: runLifestyleEngine,
  bmi: runBmiEngine
};

// GET /api/assess/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await getLatestAssessments(req.user._id);
    res.json(latest);
  } catch (error) {
    console.error('[ASSESS LATEST]', error.message);
    res.status(500).json({ message: 'Could not fetch assessments.' });
  }
});

// POST /api/assess/recommend-tests
router.post('/recommend-tests', protect, async (req, res) => {
  try {
    const result = runTestRecommendationEngine(req.body);
    res.json(result);
  } catch (error) {
    console.error('[ASSESS RECOMMEND]', error.message);
    res.status(500).json({ message: 'Could not generate recommendations.' });
  }
});

// GET /api/assess/history/:type
router.get('/history/:type', protect, async (req, res) => {
  try {
    const history = await getAssessmentsByUser(req.user._id, req.params.type);
    res.json(history);
  } catch (error) {
    console.error('[ASSESS HISTORY]', error.message);
    res.status(500).json({ message: 'Could not fetch history.' });
  }
});

// POST /api/assess/:type
router.post('/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const engine = engines[type];

    if (!engine) {
      // Don't reflect user input back in error message
      return res.status(400).json({ message: 'Invalid assessment type.' });
    }

    const result = engine(req.body);
    const saved = await saveAssessment(req.user._id, type, req.body, result);
    res.json({ ...result, assessmentId: saved._id });
  } catch (error) {
    console.error(`[ASSESS ${req.params.type}]`, error.message);
    res.status(500).json({ message: 'Assessment failed. Please try again.' });
  }
});

export default router;
