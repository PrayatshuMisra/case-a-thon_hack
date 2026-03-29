# Bharat Setu Call RN

React Native (Expo) call app + local Node backend. Your PC runs the full processing server.

Core loop:
- TTS bootstrap greeting
- STT from microphone audio
- LLM processing (Grok preferred)
- TTS response
- repeat

Supported spoken languages:
- English (`en`)
- Hindi (`hi`) with Devanagari responses for better native TTS pronunciation
- Kannada (`kn`)

The backend also reads full Supabase data snapshot and uses it for grounded responses.

## What is included

- Mobile app UI and call loop in [App.tsx](App.tsx) with a single `Call LaunchOS` entry point
- Local backend server in [server/index.js](server/index.js)
- Supabase snapshot reader in [server/lib/supabase.js](server/lib/supabase.js)
- LLM provider routing (Grok preferred, Groq fallback) in [server/lib/llm.js](server/lib/llm.js)
- STT using Groq Whisper API in [server/lib/stt.js](server/lib/stt.js)
- Env auto-loading from sibling case-a-thon env files in [server/lib/env.js](server/lib/env.js)

## Environment loading behavior

The backend loads env files in this order (first found values win):

1. [./.env](.env)
2. [./.env.local](.env.local)
3. [../case-a-thon_hack/backend/.env](../case-a-thon_hack/backend/.env)
4. [../case-a-thon_hack/src/.env](../case-a-thon_hack/src/.env)
5. [../case-a-thon_hack/src/.env.local](../case-a-thon_hack/src/.env.local)

So your existing keys from case-a-thon are automatically reused.

## Required env keys

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GROK_API_KEY` (preferred LLM provider)
- `GROQ_API_KEY` or `VITE_GROQ_API_KEY` (needed for STT)

Reference template: [./.env.example](.env.example)

## Install

```bash
cd D:\tccm\bharat-call-rn
npm install
```

## Run local backend (PC server)

```bash
cd D:\tccm\bharat-call-rn
npm run server
```

Server starts on `http://0.0.0.0:3100` by default.

Useful endpoints:
- `GET /api/health`
- `GET /api/context`
- `POST /api/stt`
- `POST /api/agent`
- `POST /api/call/bootstrap`
- `GET /api/call/ring/poll`
- `POST /api/call/ring`

## Run mobile app

```bash
cd D:\tccm\bharat-call-rn
npx expo start --host lan --clear
```

Open on device with Expo Go.

The app auto-detects your Metro host IP and sets backend URL from [config.ts](config.ts) base default.

## Runtime notes

- Keep laptop and phone on the same WiFi.
- If STT key is missing, `/api/stt` returns a clear error.
- If LLM key is missing or remote call fails, `/api/agent` falls back to local deterministic replies using Supabase summary data.

