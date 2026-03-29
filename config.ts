export const BASE_URL = 'http://127.0.0.1:3100';
export const CALL_RING_CHANNEL = 'local-rn';

export const ENDPOINTS = {
  health: `${BASE_URL}/api/health`,
  agent: `${BASE_URL}/api/agent`,
  stt: `${BASE_URL}/api/stt`,
  callRingPoll: `${BASE_URL}/api/call/ring/poll`
};

export const NETWORK_TIMEOUT_MS = 15000;
