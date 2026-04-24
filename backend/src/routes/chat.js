import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getLatestAssessments } from '../models/Assessment.js';
import { findByUserId as findCycleByUserId } from '../models/Cycle.js';

const router = express.Router();

const LANG_MAP = {
  en: 'English',
  bn: 'Bengali (বাংলা)',
  hi: 'Hindi (हिन्दी)'
};

// ── Greeting detector ─────────────────────────────────────────────────────────
const GREETINGS = ['hi','hello','hey','hii','helo','hai','hiya','sup','namaste','namaskar','good morning','good afternoon','good evening'];
const isGreeting = (msg) => {
  const lower = msg.toLowerCase().trim();
  return GREETINGS.some(g => lower === g || lower.startsWith(g + ' ') || lower.endsWith(' ' + g));
};

// ── Warm fallback (if Groq is down) ──────────────────────────────────────────
const getWarmFallback = (userName, message, language) => {
  const name = (userName || 'dear').split(' ')[0];
  const lower = message.toLowerCase().trim();
  if (isGreeting(lower)) {
    if (language === 'hi') return `नमस्ते ${name}! 😊 आप कैसी हैं? मैं आपकी स्वास्थ्य सहेली हूं। आज मैं आपकी कैसे मदद कर सकती हूं?`;
    if (language === 'bn') return `হ্যালো ${name}! 😊 কেমন আছেন? আজ আপনার জন্য কী করতে পারি?`;
    return `Hello ${name}! 😊 How are you feeling today? Ask me anything about your health — periods, PCOS, nutrition or sleep!`;
  }
  if (lower.includes('how are you') || lower.includes('how r u') || lower === 'how r you') {
    return `I'm doing wonderful, ${name}! 🌸 What health topic can I help you with today?`;
  }
  if (lower.startsWith('thank') || lower === 'ty' || lower === 'thx') {
    return `You're most welcome, ${name}! 🌷 I'm always here whenever you need me!`;
  }
  return `Hey ${name}! 😊 I'm just a moment away — could you ask that again? I'd love to help!`;
};

// ── GROQ — Groq-only, no Gemini ──────────────────────────────────────────────
const callGroq = async (groqKey, systemPrompt, userMessage) => {
  // Try faster/cheaper model first, then the powerful one as fallback
  const GROQ_MODELS = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 450,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`✗ Groq ${model} — HTTP ${res.status}:`, err?.error?.message?.substring(0, 80));
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log(`✓ Chat answered by Groq: ${model}`);
        return text;
      }
    } catch (err) {
      console.error(`✗ Groq ${model} fetch error:`, err.message?.substring(0, 80));
      continue;
    }
  }
  throw new Error('All Groq models failed');
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (isoString) => {
  if (!isoString) return 'Unknown';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return isoString; }
};

const getCyclePhase = (predictions) => {
  if (!predictions) return 'Unknown';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const toD = (s) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };

  if (predictions.isOnPeriod) return `Menstrual Phase (Day ${predictions.periodDay})`;
  const fertStart = predictions.fertileStart ? toD(predictions.fertileStart) : null;
  const fertEnd   = predictions.fertileEnd   ? toD(predictions.fertileEnd)   : null;
  const follStart = predictions.follicularStart ? toD(predictions.follicularStart) : null;
  const follEnd   = predictions.follicularEnd   ? toD(predictions.follicularEnd)   : null;
  const lutStart  = predictions.lutealStart ? toD(predictions.lutealStart) : null;
  const lutEnd    = predictions.lutealEnd   ? toD(predictions.lutealEnd)   : null;

  if (fertStart && fertEnd && today >= fertStart && today <= fertEnd) return 'Fertile / Ovulation Phase';
  if (follStart && follEnd && today >= follStart && today <= follEnd) return 'Follicular Phase';
  if (lutStart  && lutEnd  && today >= lutStart  && today <= lutEnd)  return 'Luteal Phase';
  return 'Between Cycles';
};

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  const { message, language = 'en', cycleData } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const groqKey  = process.env.GROQ_API_KEY;
  const userName = req.user?.name || 'User';

  try {
    // Build cycle context
    let cycleContext = '';
    try {
      const cycle = await findCycleByUserId(req.user._id);
      if (cycle) {
        const predictions = cycleData?.predictions || null;
        const phase      = predictions ? getCyclePhase(predictions) : 'Not available';
        const nextPeriod = predictions?.nextPeriod ? formatDate(predictions.nextPeriod) : 'Unknown';
        const lastPeriod = cycle.lastPeriodDate ? formatDate(cycle.lastPeriodDate) : 'Unknown';
        cycleContext = `
USER CYCLE DATA:
Name: ${userName}
Last Period: ${lastPeriod} | Cycle: ${cycle.cycleLength} days | Period lasts: ${cycle.periodDuration} days
Current Phase: ${phase} | Next Period: ${nextPeriod}
On Period Now: ${predictions?.isOnPeriod ? `Yes (Day ${predictions.periodDay})` : 'No'}
`;
      }
    } catch (e) {
      console.warn('Could not fetch cycle data:', e.message);
    }

    // Build assessment context
    let healthContext = '';
    try {
      const latest = await getLatestAssessments(req.user._id);
      if (Object.keys(latest).length > 0) {
        healthContext = 'HEALTH RESULTS: ';
        for (const [, assessment] of Object.entries(latest)) {
          if (assessment?.result) {
            const r = assessment.result;
            if (r.bmi)  healthContext += `BMI ${r.bmi} (${r.category}). `;
            if (r.band) healthContext += `${r.title || ''} risk: ${r.band}. `;
          }
        }
        healthContext += '\n';
      }
    } catch (e) {
      console.warn('Could not fetch assessments:', e.message);
    }

    const responseLang = LANG_MAP[language] || 'English';

    // ── System prompt — enforces clean, short answers ──
    const systemPrompt = `You are "Swastha Saheli", a warm and knowledgeable AI health companion for Indian women using a period tracking app.

${cycleContext}${healthContext}
RULES YOU MUST FOLLOW:
1. Reply ONLY in ${responseLang}. Never mix languages.
2. Keep answers SHORT and CLEAN — max 2 to 3 short paragraphs. No long essays.
3. Write in plain sentences. Do NOT use markdown symbols like **, ##, or dashes for bullets.
4. Use the user's first name "${userName.split(' ')[0]}" once naturally in the reply.
5. For health questions (periods, PCOS, nutrition, BMI, sleep, mental health): give a helpful, specific, caring answer. Use her personal data above when relevant.
6. For greetings: be warm, ask how she is feeling, invite a health question.
7. For general knowledge questions: answer briefly, then gently redirect to health topics.
8. Never say "I cannot" or "I'm sorry, I don't". Always try to help.
9. For serious symptoms, calmly suggest seeing a doctor.
10. Tone: caring close friend who knows women's health well. Warm but not overly dramatic.`;

    let reply = null;
    if (groqKey) {
      try {
        reply = await callGroq(groqKey, systemPrompt, message);
      } catch (e) {
        console.warn('Groq failed:', e.message?.substring(0, 60));
      }
    }

    return res.json({ reply: reply || getWarmFallback(userName, message, language) });

  } catch (error) {
    console.error('Chat route error:', error?.message?.substring(0, 120));
    return res.json({ reply: getWarmFallback(userName, message, language) });
  }
});

export default router;
