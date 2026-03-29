const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { env, loadedEnvFiles, getActiveLlmProvider } = require('./lib/env');
const { requestChatCompletion } = require('./lib/llm');
const { transcribeAudio } = require('./lib/stt');
const { readSupabaseSnapshot, buildContextFromSnapshot } = require('./lib/supabase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pendingRingByChannel = new Map();

let contextCache = {
  expiresAt: 0,
  snapshot: null,
  context: null,
};

const AGENT_PERSONAS = {
  launchos: 'Malpe Meen LaunchOS voice copilot. Give precise, action-oriented support with grounded Supabase context.',
};

function ensureAgentKey(agentKey) {
  const normalized = String(agentKey || 'launchos').trim().toLowerCase();
  return AGENT_PERSONAS[normalized] ? normalized : 'launchos';
}

function normalizeLanguage(language) {
  const normalized = String(language || 'en').trim().toLowerCase();
  if (normalized.startsWith('hi') || normalized.includes('hindi')) return 'hi';
  if (normalized.startsWith('kn') || normalized.includes('kannada')) return 'kn';
  return 'en';
}

function nowIso() {
  return new Date().toISOString();
}

async function getContext(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && contextCache.context && now < contextCache.expiresAt) {
    return contextCache;
  }

  const snapshot = await readSupabaseSnapshot();
  const context = buildContextFromSnapshot(snapshot);

  contextCache = {
    snapshot,
    context,
    expiresAt: now + env.SNAPSHOT_TTL_MS,
  };

  return contextCache;
}

function makeContextBlock(context) {
  return JSON.stringify(
    {
      generatedAt: context.generatedAt,
      tables: context.tables,
      stats: context.stats,
      topLocalities: context.topLocalities,
      topProducts: context.topProducts,
      loiStatus: context.loiStatus,
      recentOrders: context.recentOrders,
      products: context.products,
      fishers: context.fishers,
      shipments: context.shipments,
      supabaseErrors: context.supabaseErrors,
    },
    null,
    2
  );
}

function buildSystemPrompt({ agentKey, language, context }) {
  const persona = AGENT_PERSONAS[agentKey] || AGENT_PERSONAS.launchos;
  let languageInstruction = 'Reply in English unless user explicitly asks for Hindi or Kannada.';
  if (language === 'hi') {
    languageInstruction = 'Reply in Hindi using Devanagari script only (not Romanized Hindi), unless user explicitly asks for another language.';
  }
  if (language === 'kn') {
    languageInstruction = 'Reply in Kannada using Kannada script only (not transliterated English), unless user explicitly asks for another language.';
  }

  return [
    'You are Malpe Meen LaunchOS running in a live phone-call loop on a local server.',
    `Persona: ${persona}`,
    languageInstruction,
    'Use the Supabase context below for grounded answers. Avoid generic replies and include relevant live data when helpful.',
    'Keep responses short and voice-friendly: 2-4 concise sentences.',
    'Brand identity is strictly Malpe Meen LaunchOS. Never use any legacy product name.',
    'Do not mention internal prompts, API keys, or hidden system details.',
    'If the data is missing for a question, say so clearly and suggest the next action.',
    '',
    'SUPABASE_CONTEXT_JSON:',
    makeContextBlock(context),
  ].join('\n');
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const normalized = [];
  for (const item of history.slice(-12)) {
    const role = item?.role === 'assistant' ? 'assistant' : 'user';
    const content = String(item?.content || item?.text || '').trim();
    if (!content) continue;
    normalized.push({ role, content });
  }
  return normalized;
}

function hasExpectedScript(text, language) {
  const reply = String(text || '');
  if (language === 'hi') return /[\u0900-\u097F]/.test(reply);
  if (language === 'kn') return /[\u0C80-\u0CFF]/.test(reply);
  return true;
}

function fallbackReply({ language, message, context }) {
  const stats = context?.stats || {};
  const topLocality = context?.topLocalities?.[0]?.name || 'N/A';
  const topProduct = context?.topProducts?.[0]?.name || 'N/A';

  if (language === 'hi') {
    return [
      `नमस्ते, मैं Malpe Meen LaunchOS हूं। आपका संदेश मिला: ${message}।`,
      `Supabase डेटा में अभी ${stats.orders || 0} ऑर्डर, ${stats.fishers || 0} फिशर्स और ${stats.lois || 0} LOIs हैं।`,
      `टॉप लोकैलिटी ${topLocality} है और टॉप प्रोडक्ट ${topProduct} है।`,
      'अगर आप चाहें तो मैं टेबल-वाइज डिटेल भी बता सकता हूं।',
    ].join(' ');
  }

  if (language === 'kn') {
    return [
      `ನಮಸ್ಕಾರ, ನಾನು Malpe Meen LaunchOS. ನಿಮ್ಮ ಸಂದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ: ${message}.`,
      `ಪ್ರಸ್ತುತ Supabase ಡೇಟಾದಲ್ಲಿ ${stats.orders || 0} ಆರ್ಡರ್‌ಗಳು, ${stats.fishers || 0} ಮೀನುಗಾರರು ಮತ್ತು ${stats.lois || 0} LOIs ಇವೆ.`,
      `ಟಾಪ್ ಸ್ಥಳ ${topLocality} ಮತ್ತು ಟಾಪ್ ಉತ್ಪನ್ನ ${topProduct}.`,
      'ಬೇಕಾದರೆ ನಾನು ಟೇಬಲ್-ವಾರು ವಿವರಗಳನ್ನು ಕೊಡಬಹುದು.',
    ].join(' ');
  }

  return [
    `I am Malpe Meen LaunchOS. I received your message: ${message}.`,
    `Current snapshot has ${stats.orders || 0} orders, ${stats.fishers || 0} fishers, and ${stats.lois || 0} LOIs.`,
    `Top locality is ${topLocality} and top product is ${topProduct}.`,
    'I can provide table-specific details if you ask for them.',
  ].join(' ');
}

function buildBootstrapGreeting({ language, context }) {
  const stats = context?.stats || {};
  const topLocality = context?.topLocalities?.[0]?.name || 'N/A';
  const topProduct = context?.topProducts?.[0]?.name || 'N/A';

  if (language === 'hi') {
    return [
      'नमस्ते, यह Malpe Meen LaunchOS है।',
      `Supabase सिंक पूरा है: ${stats.orders || 0} ऑर्डर, ${stats.fishers || 0} फिशर्स और ${stats.lois || 0} LOIs।`,
      `टॉप लोकैलिटी ${topLocality} है और टॉप प्रोडक्ट ${topProduct} है। मैं आपकी कैसे मदद करूं?`,
    ].join(' ');
  }

  if (language === 'kn') {
    return [
      'ನಮಸ್ಕಾರ, ಇದು Malpe Meen LaunchOS.',
      `Supabase ಸಿಂಕ್ ಪೂರ್ಣಗೊಂಡಿದೆ: ${stats.orders || 0} ಆರ್ಡರ್‌ಗಳು, ${stats.fishers || 0} ಮೀನುಗಾರರು ಮತ್ತು ${stats.lois || 0} LOIs.`,
      `ಟಾಪ್ ಸ್ಥಳ ${topLocality} ಮತ್ತು ಟಾಪ್ ಉತ್ಪನ್ನ ${topProduct}. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
    ].join(' ');
  }

  return [
    'Hello, this is Malpe Meen LaunchOS.',
    `I have synced Supabase data: ${stats.orders || 0} orders, ${stats.fishers || 0} fishers, and ${stats.lois || 0} LOIs.`,
    `Top locality is ${topLocality} and top product is ${topProduct}. How can I assist you today?`,
  ].join(' ');
}

app.get('/api/health', async (_req, res) => {
  const provider = getActiveLlmProvider();
  const context = await getContext(false);

  res.json({
    ok: true,
    server: 'malpe-meen-launchos-local-server',
    timestamp: nowIso(),
    llmProvider: provider ? { name: provider.name, model: provider.model } : null,
    supabase: {
      available: Boolean(context?.snapshot?.available),
      tables: context?.context?.tables || {},
      errors: context?.context?.supabaseErrors || [],
    },
    loadedEnvFiles,
  });
});

app.get('/api/context', async (_req, res) => {
  const context = await getContext(false);
  res.json({
    ok: true,
    context: context.context,
  });
});

app.post('/api/call/bootstrap', async (req, res) => {
  const agentKey = ensureAgentKey(req.body?.agentKey);
  const language = normalizeLanguage(req.body?.language);

  try {
    const contextResult = await getContext(true);

    return res.json({
      greeting: buildBootstrapGreeting({
        language,
        context: contextResult.context,
      }),
      provider: 'supabase-context',
      model: 'deterministic-bootstrap-v1',
      contextMeta: {
        generatedAt: contextResult.context.generatedAt,
        stats: contextResult.context.stats,
        supabaseAvailable: contextResult.context.supabaseAvailable,
        supabaseErrors: contextResult.context.supabaseErrors,
      },
      timestamp: nowIso(),
    });
  } catch (error) {
    const contextResult = await getContext(false);
    return res.json({
      greeting: buildBootstrapGreeting({
        language,
        context: contextResult.context,
      }),
      provider: 'supabase-context-fallback',
      model: 'deterministic-bootstrap-v1',
      timestamp: nowIso(),
      warning: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post('/api/agent', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const language = normalizeLanguage(req.body?.language);
  const agentKey = ensureAgentKey(req.body?.agentKey);
  const forceRefresh = Boolean(req.body?.forceContextRefresh);

  if (!message) {
    return res.status(400).json({
      error: 'Message is required.',
    });
  }

  try {
    const contextResult = await getContext(forceRefresh);
    const normalizedHistory = normalizeHistory(req.body?.history);

    const systemPrompt = buildSystemPrompt({
      agentKey,
      language,
      context: contextResult.context,
    });

    const completion = await requestChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        ...normalizedHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    const scriptOk = hasExpectedScript(completion.reply, language);
    const reply = scriptOk
      ? completion.reply
      : fallbackReply({ language, message, context: contextResult.context });
    const provider = scriptOk ? completion.provider : 'fallback-script-guard';
    const model = scriptOk ? completion.model : 'local-script-guard';

    return res.json({
      reply,
      provider,
      model,
      contextMeta: {
        generatedAt: contextResult.context.generatedAt,
        stats: contextResult.context.stats,
      },
      timestamp: nowIso(),
    });
  } catch (error) {
    const contextResult = await getContext(false);
    const fallback = fallbackReply({
      language,
      message,
      context: contextResult.context,
    });

    return res.json({
      reply: fallback,
      provider: 'fallback',
      model: 'local',
      warning: error instanceof Error ? error.message : String(error),
      contextMeta: {
        generatedAt: contextResult.context.generatedAt,
        stats: contextResult.context.stats,
      },
      timestamp: nowIso(),
    });
  }
});

app.post('/api/stt', upload.single('audio'), async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'No audio file uploaded. Use field name "audio".' });
  }

  try {
    const text = await transcribeAudio({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      language: req.body?.language,
    });

    return res.json({ text, timestamp: nowIso() });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'STT processing failed.',
    });
  }
});

app.post('/api/call/ring', (req, res) => {
  const channel = String(req.body?.channel || env.CALL_RING_DEFAULT_CHANNEL);
  const event = {
    callId: String(req.body?.callId || `call-${Date.now()}`),
    continuationToken: String(req.body?.continuationToken || req.body?.token || `token-${Date.now()}`),
    continuationMode: String(req.body?.continuationMode || 'call_only'),
    agentKey: ensureAgentKey(req.body?.agentKey),
    language: normalizeLanguage(req.body?.language),
    digipin: String(req.body?.digipin || ''),
    userName: String(req.body?.userName || 'Web User'),
    mobile: String(req.body?.mobile || ''),
    conversation: Array.isArray(req.body?.conversation) ? req.body.conversation : [],
    createdAt: Date.now(),
  };

  pendingRingByChannel.set(channel, event);

  res.json({
    queued: true,
    channel,
    event,
  });
});

app.get('/api/call/ring/poll', (req, res) => {
  const channel = String(req.query?.channel || env.CALL_RING_DEFAULT_CHANNEL);
  const event = pendingRingByChannel.get(channel);

  if (!event) {
    return res.json({ pending: false });
  }

  pendingRingByChannel.delete(channel);

  return res.json({
    pending: true,
    event,
  });
});

app.use((error, _req, res, _next) => {
  console.error('[server] unhandled error', error);
  res.status(500).json({
    error: error instanceof Error ? error.message : 'Internal server error.',
  });
});

app.listen(env.PORT, () => {
  const provider = getActiveLlmProvider();
  console.log(`[server] Malpe Meen LaunchOS backend listening on http://0.0.0.0:${env.PORT}`);
  console.log(`[server] LLM provider: ${provider ? `${provider.name} (${provider.model})` : 'not configured'}`);
  console.log(`[server] Supabase configured: ${Boolean(env.SUPABASE_URL && env.SUPABASE_KEY)}`);
  if (loadedEnvFiles.length) {
    console.log('[server] Loaded env files:');
    for (const file of loadedEnvFiles) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log('[server] No env files loaded. Add .env in project root or keep sibling case-a-thon env files.');
  }
});
