const { env, getActiveLlmProvider } = require('./env');

function normalizeVoiceReply(text) {
  const cleaned = String(text || '')
    .replace(/[#*_`>~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

async function fetchWithTimeout(url, options, timeoutMs = env.REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestChatCompletion({ messages, temperature = 0.3, maxTokens = 450 }) {
  const provider = getActiveLlmProvider();
  if (!provider) {
    throw new Error('No LLM provider configured. Set GROK_API_KEY (preferred) or GROQ_API_KEY.');
  }

  const endpoint = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const raw = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw };
  }

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.message || raw || `LLM request failed (${response.status}).`;
    throw new Error(detail);
  }

  const text = payload?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('LLM returned an empty reply.');
  }

  return {
    provider: provider.name,
    model: provider.model,
    reply: normalizeVoiceReply(text),
  };
}

module.exports = {
  requestChatCompletion,
};
