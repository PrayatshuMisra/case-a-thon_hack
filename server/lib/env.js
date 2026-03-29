const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..', '..');

const candidateEnvFiles = [
  path.join(projectRoot, '.env'),
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '..', 'case-a-thon_hack', 'backend', '.env'),
  path.join(projectRoot, '..', 'case-a-thon_hack', 'src', '.env'),
  path.join(projectRoot, '..', 'case-a-thon_hack', 'src', '.env.local'),
];

const loadedEnvFiles = [];
for (const envPath of candidateEnvFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
    loadedEnvFiles.push(envPath);
  }
}

function getEnv(name, fallback = '') {
  const value = process.env[name];
  if (value == null) return fallback;
  return String(value).trim();
}

const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: Number(getEnv('PORT', '3100')),
  CALL_RING_DEFAULT_CHANNEL: getEnv('CALL_RING_DEFAULT_CHANNEL', 'local-rn'),

  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_KEY: getEnv('SUPABASE_KEY') || getEnv('SUPABASE_ANON_KEY'),

  // Preferred: xAI Grok provider.
  GROK_API_KEY: getEnv('GROK_API_KEY') || getEnv('XAI_API_KEY'),
  GROK_MODEL: getEnv('GROK_MODEL', 'grok-3-mini'),
  GROK_BASE_URL: getEnv('GROK_BASE_URL', 'https://api.x.ai/v1'),

  // Optional Groq fallback and STT provider.
  GROQ_API_KEY: getEnv('GROQ_API_KEY') || getEnv('VITE_GROQ_API_KEY'),
  GROQ_LLM_MODEL: getEnv('GROQ_LLM_MODEL') || getEnv('VITE_GROQ_MODEL', 'llama-3.3-70b-versatile'),
  GROQ_STT_MODEL: getEnv('GROQ_STT_MODEL', 'whisper-large-v3-turbo'),

  REQUEST_TIMEOUT_MS: Number(getEnv('REQUEST_TIMEOUT_MS', '30000')),
  SNAPSHOT_TTL_MS: Number(getEnv('SNAPSHOT_TTL_MS', '45000')),
  MAX_TABLE_ROWS: Number(getEnv('MAX_TABLE_ROWS', '5000')),
};

function getActiveLlmProvider() {
  if (env.GROK_API_KEY) {
    return {
      name: 'grok',
      apiKey: env.GROK_API_KEY,
      model: env.GROK_MODEL,
      baseUrl: env.GROK_BASE_URL,
    };
  }

  if (env.GROQ_API_KEY) {
    return {
      name: 'groq',
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_LLM_MODEL,
      baseUrl: 'https://api.groq.com/openai/v1',
    };
  }

  return null;
}

module.exports = {
  env,
  projectRoot,
  loadedEnvFiles,
  getActiveLlmProvider,
};
