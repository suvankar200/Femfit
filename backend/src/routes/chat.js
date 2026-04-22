import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getLatestAssessments } from '../models/Assessment.js';
import { findByUserId as findCycleByUserId } from '../models/Cycle.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const LANG_MAP = {
  en: 'English',
  bn: 'Bengali (বাংলা)',
  hi: 'Hindi (हिन्दी)'
};

// ── Greeting detector ────────────────────────────────────────────────────────
const GREETINGS = ['hi','hello','hey','hii','helo','hai','hiya','sup','namaste','namaskar','good morning','good afternoon','good evening','goodmorning'];
const isGreeting = (msg) => {
  const lower = msg.toLowerCase().trim();
  return GREETINGS.some(g => lower === g || lower.startsWith(g + ' ') || lower.endsWith(' ' + g));
};

// ── Always-warm fallback — NEVER a cold "sorry" ──────────────────────────────
const getWarmFallback = (userName, message, language) => {
  const name = (userName || 'dear').split(' ')[0];
  const lower = message.toLowerCase().trim();
  if (isGreeting(lower)) {
    if (language === 'hi') return `नमस्ते ${name}! 😊 आप कैसी हैं? मैं आपकी स्वास्थ्य सहेली हूं। बताइए, आज मैं आपकी कैसे मदद कर सकती हूं?`;
    if (language === 'bn') return `হ্যালো ${name}! 😊 কেমন আছেন? আমি আপনার স্বাস্থ্য বন্ধু। আজ আপনার জন্য কী করতে পারি?`;
    return `Hello ${name}! 😊 It's so lovely to hear from you! How are you feeling today? I'm here for all your health questions — periods, PCOS, nutrition, sleep, you name it. What would you like to talk about?`;
  }
  if (lower.includes('how are you') || lower.includes('how r u') || lower === 'how r you') {
    return `I'm doing wonderful, ${name}! 🌸 Always energised to help you feel your best. What's on your mind today?`;
  }
  if (lower.startsWith('thank') || lower === 'ty' || lower === 'thx') {
    return `You're most welcome, ${name}! 🌷 Anytime you have a question — I'm always right here for you!`;
  }
  return `Hey ${name}! 😊 I'm just a moment away — could you ask that again? I'd love to help you!`;
};

// ── GROQ (primary) — native fetch, no package needed ────────────────────────
const callGroq = async (groqKey, systemPrompt, userMessage) => {
  const GROQ_MODELS = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];

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
          max_tokens: 800,
          temperature: 0.75
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

// ── Gemini (fallback) ────────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

const callGemini = async (geminiKey, systemPrompt, userMessage) => {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const fullPrompt = `${systemPrompt}\n\nUser's question: ${userMessage}`;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text()?.trim();
      if (text) {
        console.log(`✓ Chat answered by Gemini: ${modelName}`);
        return text;
      }
    } catch (err) {
      console.error(`✗ Gemini ${modelName} — status: ${err?.status}, msg: ${err?.message?.substring(0, 80)}`);
      continue;
    }
  }
  throw new Error('All Gemini models failed');
};

// ── Helper: format date ───────────────────────────────────────────────────────
const formatDate = (isoString) => {
  if (!isoString) return 'Unknown';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return isoString; }
};

// ── Helper: get current cycle phase ──────────────────────────────────────────
const getCyclePhase = (predictions) => {
  if (!predictions) return 'Unknown';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const toD = (s) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };

  if (predictions.isOnPeriod) return `Menstrual Phase (Day ${predictions.periodDay} of period)`;
  const fertStart = predictions.fertileStart ? toD(predictions.fertileStart) : null;
  const fertEnd   = predictions.fertileEnd   ? toD(predictions.fertileEnd)   : null;
  const follStart = predictions.follicularStart ? toD(predictions.follicularStart) : null;
  const follEnd   = predictions.follicularEnd   ? toD(predictions.follicularEnd)   : null;
  const lutStart  = predictions.lutealStart ? toD(predictions.lutealStart) : null;
  const lutEnd    = predictions.lutealEnd   ? toD(predictions.lutealEnd)   : null;

  if (fertStart && fertEnd && today >= fertStart && today <= fertEnd) return 'Fertile Window / Ovulation Phase';
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

  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const userName  = req.user?.name || 'User';

  try {
    // ── Build cycle context ──
    let cycleContext = '';
    try {
      const cycle = await findCycleByUserId(req.user._id);
      if (cycle) {
        const predictions = cycleData?.predictions || null;
        const phase      = predictions ? getCyclePhase(predictions) : 'Not available';
        const nextPeriod = predictions?.nextPeriod ? formatDate(predictions.nextPeriod) : 'Unknown';
        const lastPeriod = cycle.lastPeriodDate ? formatDate(cycle.lastPeriodDate) : 'Unknown';

        cycleContext = `
--- CYCLE & PERIOD DATA ---
User's Name: ${userName}
Last Period Start Date: ${lastPeriod}
Cycle Length: ${cycle.cycleLength} days
Period Duration: ${cycle.periodDuration} days
Current Cycle Phase: ${phase}
Next Expected Period: ${nextPeriod}
Currently On Period: ${predictions?.isOnPeriod ? `Yes (Day ${predictions.periodDay})` : 'No'}
Next Ovulation: ${predictions?.ovulation ? formatDate(predictions.ovulation) : 'Unknown'}
Fertile Window: ${predictions?.fertileStart ? formatDate(predictions.fertileStart) : '?'} to ${predictions?.fertileEnd ? formatDate(predictions.fertileEnd) : '?'}
`;
      } else {
        cycleContext = `\nNote: ${userName} has not set up period tracking yet. Encourage them to complete onboarding.\n`;
      }
    } catch (e) {
      console.warn('Could not fetch cycle data:', e.message);
    }

    // ── Build health assessment context ──
    let healthContext = '';
    try {
      const latest = await getLatestAssessments(req.user._id);
      if (Object.keys(latest).length > 0) {
        healthContext = '\n--- HEALTH ASSESSMENT RESULTS ---\n';
        for (const [type, assessment] of Object.entries(latest)) {
          if (assessment?.result) {
            const r = assessment.result;
            const a = assessment.answers || {};
            healthContext += `\n${r.title || type.toUpperCase()} (taken ${formatDate(assessment.createdAt)}):`;
            if (r.bmi)  healthContext += `\n  BMI: ${r.bmi} — Category: ${r.category}`;
            if (r.band) healthContext += `\n  Risk Level: ${r.band.toUpperCase()}`;
            if (r.points !== undefined) healthContext += `\n  Score: ${r.points} out of ${r.maxPoints} points`;
            if (r.contributors?.length)  healthContext += `\n  Key Risk Factors: ${r.contributors.join(', ')}`;
            if (r.recommendation)        healthContext += `\n  Doctor's Note: ${r.recommendation}`;
            const relevantAnswers = Object.entries(a)
              .filter(([k, v]) => v === true || (typeof v === 'number' && v > 0))
              .map(([k]) => k.replace(/([A-Z])/g, ' $1').toLowerCase())
              .slice(0, 5);
            if (relevantAnswers.length > 0) healthContext += `\n  Reported Symptoms: ${relevantAnswers.join(', ')}`;
            healthContext += '\n';
          }
        }
      } else {
        healthContext = `\nNote: ${userName} has not completed any health assessments yet. Encourage her to take them in the app.\n`;
      }
    } catch (e) {
      console.warn('Could not fetch assessments:', e.message);
    }

    const responseLang = LANG_MAP[language] || 'English';

    // ── Build AI system prompt ──
    const systemPrompt = `You are "Swastha Saheli" (meaning "Health Friend"), a warm, knowledgeable AI health companion for an Indian women's health app called Swasthasaheli.

YOU KNOW THIS USER PERSONALLY:
${cycleContext}
${healthContext}
--- END USER DATA ---

YOUR PERSONALITY & RULES:
1. Always respond ONLY in ${responseLang}. Never switch languages.
2. Address the user by their first name "${userName.split(' ')[0]}" occasionally to feel personal.
3. You are a close, caring friend who also has medical knowledge. Be warm, NOT clinical.
4. HEALTH QUESTIONS (women's health, periods, PCOS, anemia, nutrition, BMI, fitness, mental health, pregnancy, reproductive health): Answer thoroughly and helpfully. Use the user's actual data above when relevant. Give practical, actionable advice.
5. GENERAL KNOWLEDGE questions (history, geography, science, etc.): Answer briefly and helpfully. Say something like "Sure! [answer]. But what I'm really great at is your health — ask me anything! 😊"
6. GREETINGS like "hi", "hello", "hey": Respond warmly with the user's name, ask how they're feeling, and invite a health question.
7. TRULY UNRELATED questions (politics, sports scores, etc.): Be warm, say you're not the best resource for that, and gently redirect to health topics.
8. Never say "I cannot" or "I'm not able to" — always try to help in some way.
9. Keep responses friendly, use emojis sparingly, and keep answers to 2-4 paragraphs max.
10. If you see a high-risk result in the user's data, proactively mention it and give appropriate advice.
11. Never make diagnoses — always suggest consulting a doctor for serious concerns.`;

    // ── Try Groq first, Gemini as fallback ──
    let reply = null;

    if (groqKey && groqKey !== 'paste_your_groq_key_here') {
      try {
        reply = await callGroq(groqKey, systemPrompt, message);
      } catch (e) {
        console.warn('Groq failed, trying Gemini...', e.message?.substring(0,60));
      }
    }

    if (!reply && geminiKey) {
      try {
        reply = await callGemini(geminiKey, systemPrompt, message);
      } catch (e) {
        console.warn('Gemini also failed:', e.message?.substring(0,60));
      }
    }

    if (reply) {
      return res.json({ reply });
    }

    // Both failed — return warm fallback
    return res.json({ reply: getWarmFallback(userName, message, language) });

  } catch (error) {
    console.error('Chat route error:', error?.message?.substring(0, 120));
    return res.json({ reply: getWarmFallback(userName, message, language) });
  }
});

export default router;
