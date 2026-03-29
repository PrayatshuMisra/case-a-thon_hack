const { Blob } = require('buffer');
const { env } = require('./env');

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

function mapLanguage(language) {
  if (!language) return undefined;
  const normalized = String(language).toLowerCase();
  if (normalized.startsWith('hi')) return 'hi';
  if (normalized.startsWith('kn') || normalized.includes('kannada')) return 'kn';
  if (normalized.startsWith('en')) return 'en';
  return undefined;
}

async function transcribeAudio({ buffer, fileName, mimeType, language }) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required for STT. Add it in .env or case-a-thon src/.env.');
  }

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([buffer], { type: mimeType || 'audio/m4a' }),
    fileName || 'voice.m4a'
  );
  formData.append('model', env.GROQ_STT_MODEL);
  formData.append('response_format', 'json');

  const mappedLanguage = mapLanguage(language);
  if (mappedLanguage) {
    formData.append('language', mappedLanguage);
  }

  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: formData,
  });

  const raw = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw };
  }

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.message || raw || `STT failed (${response.status}).`;
    throw new Error(detail);
  }

  const text = String(payload?.text || '').trim();
  if (!text) {
    throw new Error('No speech recognized by STT provider.');
  }

  return text;
}

module.exports = {
  transcribeAudio,
};
