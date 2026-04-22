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

// GET /api/assess/latest — Get latest assessment for each type
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await getLatestAssessments(req.user._id);
    res.json(latest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/assess/recommend-tests — Get test recommendations
router.post('/recommend-tests', protect, async (req, res) => {
  try {
    const result = runTestRecommendationEngine(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/assess/history/:type — Get assessment history
router.get('/history/:type', protect, async (req, res) => {
  try {
    const history = await getAssessmentsByUser(req.user._id, req.params.type);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/assess/:type — Run an assessment
router.post('/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const engine = engines[type];

    if (!engine) {
      return res.status(400).json({ message: `Unknown assessment type: ${type}` });
    }

    const result = engine(req.body);

    // Save the result
    const saved = await saveAssessment(req.user._id, type, req.body, result);

    res.json({ ...result, assessmentId: saved._id });
  } catch (error) {
    console.error(`Assessment error (${req.params.type}):`, error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
