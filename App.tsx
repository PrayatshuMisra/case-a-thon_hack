import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL, CALL_RING_CHANNEL, NETWORK_TIMEOUT_MS } from './config';

type Screen = 'selection' | 'incoming' | 'call' | 'summary';
type Language = 'en' | 'hi' | 'kn';
type CallPhase = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'reconnecting' | 'ended';
type NetworkState = 'connected' | 'connecting' | 'reconnecting' | 'error';

type SpeechVoice = {
  identifier?: string;
  language?: string;
  quality?: string;
  name?: string;
};

type Agent = {
  key: string;
  name: string;
  description: string;
  icon: string;
};

type Contact = {
  id: string;
  name: string;
  number: string;
};

const LAUNCH_OS_AGENT_KEY = 'launchos';

function toBackendAgentKey(): string {
  return LAUNCH_OS_AGENT_KEY;
}

type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

type HandoffLinkData = {
  token?: string;
  agent?: string;
  continuationMode?: string;
};

type HandoffDebugMeta = {
  token: string;
  agent: string;
  continuationMode: string;
};

type PendingRingEvent = {
  callId: string;
  continuationToken: string;
  continuationMode: 'call_only' | 'chat_or_call';
  agentKey: string;
  language: string;
  digipin: string;
  userName: string;
  mobile: string;
  conversation: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>;
  createdAt: number;
};

type IncomingCall = {
  agent: Agent;
  handoff: HandoffLinkData;
  source: 'web' | 'manual';
  event?: PendingRingEvent;
};

const LAUNCH_OS_AGENT: Agent = {
  key: LAUNCH_OS_AGENT_KEY,
  name: 'LaunchOS',
  description: 'Unified voice copilot for Malpe Meen LaunchOS assisted calls.',
  icon: '🚀',
};

const CONTACTS: Contact[] = [
  { id: 'launchos', name: 'LaunchOS', number: '12 34 5678' },
  { id: 'ops', name: 'Ops Desk', number: '10 20 3040' },
  { id: 'field', name: 'Field Support', number: '18 22 9901' },
];

const KEYPAD_LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function phaseText(phase: CallPhase): string {
  if (phase === 'connecting') return 'Connecting...';
  if (phase === 'listening') return 'Listening...';
  if (phase === 'processing') return 'Processing...';
  if (phase === 'speaking') return 'Speaking...';
  if (phase === 'reconnecting') return 'Reconnecting...';
  if (phase === 'ended') return 'Call ended';
  return 'Ready';
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

function detectMetroHostIp(): string | null {
  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest?.debuggerHost;

  if (!hostUri) return null;

  const candidate = hostUri.split('/')[0].split(':')[0].trim();
  if (!candidate) return null;
  if (candidate === 'localhost' || candidate === '127.0.0.1' || candidate === '::1') return null;
  return candidate;
}

function parseHandoffUrl(url: string): HandoffLinkData {
  const queryIndex = url.indexOf('?');
  if (queryIndex < 0) return {};
  const query = url.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  return {
    token: params.get('token') || undefined,
    agent: params.get('agent') || undefined,
    continuationMode: params.get('continuationMode') || undefined,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPortFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  } catch {
    return '3100';
  }
}

function buildLanUrlFromDetectedIp(baseUrl: string, detectedIp: string): string {
  const port = extractPortFromUrl(baseUrl);
  return `http://${detectedIp}:${port}`;
}

function toSpeechLanguageTag(language: Language): string {
  if (language === 'hi') return 'hi-IN';
  if (language === 'kn') return 'kn-IN';
  return 'en-IN';
}

function normalizeAppLanguage(value: string | undefined | null): Language | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.startsWith('hi')) return 'hi';
  if (normalized.startsWith('kn') || normalized.includes('kannada')) return 'kn';
  if (normalized.startsWith('en')) return 'en';
  return null;
}

function pickVoiceIdentifier(voices: SpeechVoice[], language: Language): string | undefined {
  if (!voices.length) return undefined;

  const preferredTag = toSpeechLanguageTag(language).toLowerCase();
  const preferredBase = preferredTag.split('-')[0];
  let best: { id?: string; score: number } = { id: undefined, score: -1 };

  for (const voice of voices) {
    const id = voice.identifier;
    if (!id) continue;

    const voiceLanguage = String(voice.language || '').toLowerCase();
    const voiceName = String(voice.name || '').toLowerCase();
    const quality = String(voice.quality || '').toLowerCase();

    let score = 0;
    if (voiceLanguage === preferredTag) score += 100;
    if (voiceLanguage.startsWith(preferredBase)) score += 60;
    if (voiceLanguage.includes('-in')) score += 20;
    if (quality.includes('enhanced')) score += 8;
    if (language === 'hi' && (voiceName.includes('hindi') || voiceName.includes('india'))) score += 10;
    if (language === 'kn' && (voiceName.includes('kannada') || voiceName.includes('india'))) score += 10;
    if (language === 'en' && voiceName.includes('india')) score += 6;

    if (score > best.score) {
      best = { id, score };
    }
  }

  return best.id;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('selection');
  const [selectedAgent, setSelectedAgent] = useState<Agent>(LAUNCH_OS_AGENT);
  const [language, setLanguage] = useState<Language>('en');

  const [callActive, setCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callPhase, setCallPhase] = useState<CallPhase>('idle');
  const [networkState, setNetworkState] = useState<NetworkState>('connecting');
  const [seconds, setSeconds] = useState(0);

  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptMessage[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [textFallback, setTextFallback] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState(BASE_URL);
  const [handoffMeta, setHandoffMeta] = useState<HandoffDebugMeta | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeContact, setActiveContact] = useState<Contact>(CONTACTS[0]);
  const [secondaryLine, setSecondaryLine] = useState<Contact | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showAddCall, setShowAddCall] = useState(false);
  const [dialPadValue, setDialPadValue] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [speechVoices, setSpeechVoices] = useState<SpeechVoice[]>([]);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [dotCount, setDotCount] = useState(1);
  const lastHandledHandoffTokenRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);
  const autoLoopActiveRef = useRef(false);
  const callActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const ringSoundRef = useRef<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const languageLabel = language === 'hi' ? 'हिंदी' : language === 'kn' ? 'ಕನ್ನಡ' : 'English';
  const speechLanguageTag = useMemo(() => toSpeechLanguageTag(language), [language]);
  const preferredVoiceIdentifier = useMemo(
    () => pickVoiceIdentifier(speechVoices, language),
    [speechVoices, language],
  );
  const normalizedBaseUrl = backendUrl.trim().replace(/\/$/, '');
  const backendPort = useMemo(() => extractPortFromUrl(BASE_URL), []);

  const networkLabel = useMemo(() => {
    if (networkState === 'connected') return 'Connected to Local Server';
    if (networkState === 'reconnecting') return 'Reconnecting...';
    if (networkState === 'error') return 'Check WiFi connection';
    return 'Connecting...';
  }, [networkState]);

  const summaryText = useMemo(() => {
    if (!transcriptHistory.length) return 'No conversation captured.';
    const turns = transcriptHistory.slice(-6).map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`);
    return turns.join(' ');
  }, [transcriptHistory]);

  const stopIncomingRingtone = async () => {
    try {
      const current = ringSoundRef.current;
      if (current) {
        await current.stopAsync();
        await current.unloadAsync();
        ringSoundRef.current = null;
      }
    } catch {
    }
  };

  const playIncomingRingtone = async () => {
    await stopIncomingRingtone();
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg' },
        { isLooping: true, shouldPlay: true, volume: 1 },
      );
      ringSoundRef.current = sound;
    } catch {
      Speech.speak('Incoming call from Malpe Meen LaunchOS', { language: speechLanguageTag, rate: 0.9 });
    }
  };

  const presentIncomingCall = async (
    agent: Agent,
    handoff: HandoffLinkData,
    source: 'web' | 'manual' = 'web',
    event?: PendingRingEvent,
  ) => {
    setSelectedAgent(agent);
    setIncomingCall({ agent, handoff, source, event });
    setScreen('incoming');
    setCallPhase('idle');
    setErrorMessage(null);
    await playIncomingRingtone();
  };

  useEffect(() => {
    if (!callActive) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (callPhase !== 'processing') return;
    const dots = setInterval(() => setDotCount((value) => (value % 3) + 1), 450);
    return () => clearInterval(dots);
  }, [callPhase]);

  useEffect(() => {
    if (!isListening) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isListening, pulseAnim]);

  useEffect(() => {
    if (!isSpeaking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 350, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isSpeaking, glowAnim]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (Array.isArray(voices)) {
          setSpeechVoices(voices as SpeechVoice[]);
        }
      })
      .catch(() => {
      });
  }, []);

  useEffect(() => {
    return () => {
      stopAutoListeningLoop();
      void stopIncomingRingtone();
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    const detectedIp = detectMetroHostIp();
    if (!detectedIp) return;

    setBackendUrl((current) => {
      const normalizedCurrent = current.trim().replace(/\/$/, '');
      const normalizedDefault = BASE_URL.trim().replace(/\/$/, '');
      if (normalizedCurrent && normalizedCurrent !== normalizedDefault) {
        return current;
      }
      return buildLanUrlFromDetectedIp(BASE_URL, detectedIp);
    });
  }, []);

  useEffect(() => {
    const resolveAgent = (_agentKey?: string): Agent => LAUNCH_OS_AGENT;

    const handleHandoffUrl = async (url: string) => {
      if (!url?.startsWith('launchos://') && !url?.startsWith('malpemeenlaunchos://')) return;
      const handoff = parseHandoffUrl(url);
      if (!handoff.token) return;
      if (lastHandledHandoffTokenRef.current === handoff.token) return;
      lastHandledHandoffTokenRef.current = handoff.token;

      const mode = handoff.continuationMode || 'call_only';
      const agent = resolveAgent(handoff.agent);

      if (mode === 'call_only') {
        await presentIncomingCall(agent, handoff, 'web');
        return;
      }

      setSelectedAgent(agent);
      setScreen('selection');
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleHandoffUrl(url);
      })
      .catch(() => {
      });

    const subscription = Linking.addEventListener('url', (event) => {
      handleHandoffUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const resolveAgent = (_agentKey?: string): Agent => LAUNCH_OS_AGENT;

    const pollPendingRing = async () => {
      if (isPollingRef.current || callActive) return;
      isPollingRef.current = true;
      try {
        const response = await fetch(
          `${normalizedBaseUrl}/api/call/ring/poll?channel=${encodeURIComponent(CALL_RING_CHANNEL)}`,
        );
        if (!response.ok) return;
        const data = await response.json() as {
          pending?: boolean;
          event?: PendingRingEvent;
        };
        if (!data.pending || !data.event?.continuationToken) return;

        if (lastHandledHandoffTokenRef.current === data.event.continuationToken) return;
        lastHandledHandoffTokenRef.current = data.event.continuationToken;

        const event = data.event;
        const mode = event.continuationMode || 'call_only';
        const agent = resolveAgent(event.agentKey);

        if (mode === 'call_only') {
          const incomingLanguage = normalizeAppLanguage(event.language);
          if (incomingLanguage) {
            setLanguage(incomingLanguage);
          }
          await presentIncomingCall(agent, {
            token: event.continuationToken,
            agent: event.agentKey,
            continuationMode: mode,
          }, 'web', event);
        }
      } catch {
      } finally {
        isPollingRef.current = false;
      }
    };

    const timer = setInterval(() => {
      pollPendingRing();
    }, 1800);

    return () => clearInterval(timer);
  }, [callActive, normalizedBaseUrl]);

  async function withTimeout<T>(task: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout. Please retry.')), NETWORK_TIMEOUT_MS);
    });
    return Promise.race([task, timeoutPromise]);
  }

  async function checkServerHealth(state: NetworkState = 'connecting'): Promise<boolean> {
    setNetworkState(state);
    const startedAt = Date.now();
    try {
      const response = await withTimeout(fetch(`${normalizedBaseUrl}/api/health`));
      const latency = Date.now() - startedAt;
      console.log('[RN] health status', response.status, 'latencyMs', latency);
      if (!response.ok) throw new Error('Server health check failed');
      setNetworkState('connected');
      return true;
    } catch (error) {
      console.log('[RN] health error', error);
      setNetworkState('error');
      setErrorMessage('Server unreachable. Check WiFi connection.');
      return false;
    }
  }

  async function startCall(
    agent: Agent,
    source: 'manual' | 'web' = 'manual',
    handoff?: HandoffLinkData,
    preloadedConversation?: PendingRingEvent['conversation'],
  ) {
    await stopIncomingRingtone();
    if (source === 'web' && handoff?.token) {
      setHandoffMeta({
        token: handoff.token,
        agent: handoff.agent || agent.key,
        continuationMode: handoff.continuationMode || 'call_only',
      });
    } else {
      setHandoffMeta(null);
    }

    setSelectedAgent(agent);
    setScreen('call');
    setCallPhase('connecting');
    setCallActive(true);
    setSeconds(0);
    const preloadedHistory = (preloadedConversation || [])
      .map((item, index) => ({
        id: `${Date.now()}-preload-${index}`,
        role: item.role,
        text: String(item.content || '').trim(),
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now() + index,
      }))
      .filter((item) => item.text.length > 0);
    setTranscriptHistory(preloadedHistory);
    setErrorMessage(null);
    if (source === 'manual') {
      setActiveContact(CONTACTS[0]);
    }
    setSecondaryLine(null);
    setIsVideoOn(false);
    setDialPadValue('');
    const connected = await checkServerHealth('connecting');
    if (!connected) return;

    const preloadedAssistantMessage = preloadedHistory.find((item) => item.role === 'assistant')?.text || '';
    if (preloadedAssistantMessage) {
      setCallPhase('processing');
      await speakReply(preloadedAssistantMessage);
      setCallPhase('listening');
      startAutoListeningLoop();
      return;
    }

    try {
      setCallPhase('processing');
      const bootstrapResponse = await withTimeout(
        fetch(`${normalizedBaseUrl}/api/call/bootstrap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentKey: toBackendAgentKey(),
            language,
          }),
        })
      );

      if (bootstrapResponse.ok) {
        const bootstrap = await bootstrapResponse.json() as { greeting?: string };
        const greeting = (bootstrap?.greeting || '').trim();
        if (greeting) {
          const aiEntry: TranscriptMessage = {
            id: `${Date.now()}-bootstrap`,
            role: 'assistant',
            text: greeting,
            timestamp: Date.now(),
          };
          setTranscriptHistory((prev) => [...prev, aiEntry]);
          await speakReply(greeting);
        }
      }
    } catch {
    }

    setCallPhase('listening');
    startAutoListeningLoop();
  }

  async function recordForAutoTurn(maxMs = 4300): Promise<void> {
    if (!callActiveRef.current || isMutedRef.current || isProcessingRef.current || isSpeakingRef.current) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();
      setRecording(rec);
      setIsListening(true);
      setCallPhase('listening');

      await delay(maxMs);

      if (!callActiveRef.current || isMutedRef.current) {
        try {
          await rec.stopAndUnloadAsync();
        } catch {
        }
        setRecording(null);
        setIsListening(false);
        return;
      }

      setCallPhase('processing');
      setIsListening(false);
      await rec.stopAndUnloadAsync();
      setRecording(null);

      const uri = rec.getURI();
      if (!uri) return;

      const formData = new FormData();
      const audioType = Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a';
      const extension = Platform.OS === 'ios' ? 'wav' : 'm4a';
      formData.append('audio', {
        uri,
        name: `voice.${extension}`,
        type: audioType,
      } as unknown as Blob);
      formData.append('language', language);

      const response = await withTimeout(
        fetch(`${normalizedBaseUrl}/api/stt`, {
          method: 'POST',
          body: formData,
        })
      );

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();
      let payload: { text?: string; error?: string; message?: string } = {};
      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(rawBody) as { text?: string; error?: string; message?: string };
        } catch {
          payload = {};
        }
      }

      if (!response.ok) return;
      const text = (payload.text || '').trim();
      if (!text) return;

      await processAgentTurn(text);
    } catch {
      setRecording(null);
      setIsListening(false);
      if (callActiveRef.current) setCallPhase('listening');
    }
  }

  function startAutoListeningLoop() {
    if (autoLoopActiveRef.current) return;
    autoLoopActiveRef.current = true;

    void (async () => {
      while (autoLoopActiveRef.current && callActiveRef.current) {
        if (isMutedRef.current || isProcessingRef.current || isSpeakingRef.current) {
          await delay(300);
          continue;
        }
        await recordForAutoTurn(4300);
        await delay(250);
      }
    })();
  }

  function stopAutoListeningLoop() {
    autoLoopActiveRef.current = false;
  }

  async function stopRecordingAndTranscribe() {
    if (!recording) return;

    try {
      setCallPhase('processing');
      setIsListening(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('No speech captured. Please try again.');
      }

      const formData = new FormData();
      const audioType = Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a';
      const extension = Platform.OS === 'ios' ? 'wav' : 'm4a';
      formData.append('audio', {
        uri,
        name: `voice.${extension}`,
        type: audioType,
      } as unknown as Blob);
      formData.append('language', language);

      const startedAt = Date.now();
      const response = await withTimeout(
        fetch(`${normalizedBaseUrl}/api/stt`, {
          method: 'POST',
          body: formData,
        })
      );
      const latency = Date.now() - startedAt;
      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();
      let payload: { text?: string; error?: string; message?: string } = {};

      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(rawBody) as { text?: string; error?: string; message?: string };
        } catch {
          payload = {};
        }
      }

      console.log('[RN] /api/stt response', { status: response.status, payload, rawBodySnippet: rawBody.slice(0, 120) }, 'latencyMs', latency);

      if (!response.ok) {
        const backendMessage = payload.error || payload.message || `STT failed (${response.status}).`;
        throw new Error(backendMessage);
      }

      if (!payload?.text?.trim()) {
        throw new Error(payload?.error || payload?.message || 'No speech recognized.');
      }

      await processAgentTurn(payload.text as string);
    } catch (error) {
      console.log('[RN] stt error', error);
      setErrorMessage(error instanceof Error ? error.message : 'Microphone/STT failed. Use text fallback.');
      setCallPhase('listening');
    }
  }

  async function startRecording() {
    setErrorMessage(null);
    setIsListening(false);

    if (isMuted) {
      setErrorMessage('Mic is muted. Unmute to speak.');
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Microphone permission denied.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();
      setRecording(rec);
      setIsListening(true);
      setCallPhase('listening');
    } catch (error) {
      console.log('[RN] recording start error', error);
      setErrorMessage('Could not start microphone.');
    }
  }

  async function processAgentTurn(userMessage: string) {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      setErrorMessage('No speech detected. Please try again.');
      setCallPhase('listening');
      return;
    }

    const userEntry: TranscriptMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const requestHistory = [...transcriptHistory, userEntry]
      .slice(-12)
      .map((item) => ({
        role: item.role,
        content: item.text,
      }));

    setTranscriptHistory((prev) => [...prev, userEntry]);
    setIsProcessing(true);
    setCallPhase('processing');

    try {
      const startedAt = Date.now();
      const response = await withTimeout(
        fetch(`${normalizedBaseUrl}/api/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            agentKey: toBackendAgentKey(),
            language,
            history: requestHistory,
            profile: {},
          }),
        })
      );
      const latency = Date.now() - startedAt;
      const data = await response.json();
      console.log('[RN] /api/agent response', data, 'latencyMs', latency);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Backend response failed.');
      }

      const reply = (data?.reply || '').toString().trim();
      if (!reply) {
        throw new Error('Empty AI reply received.');
      }

      const aiEntry: TranscriptMessage = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      setTranscriptHistory((prev) => [...prev, aiEntry]);
      setIsProcessing(false);
      await speakReply(reply);
      setCallPhase('listening');
    } catch (error) {
      console.log('[RN] agent error', error);
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'Request failed. Retry.');
      setCallPhase('reconnecting');
      await checkServerHealth('reconnecting');
      setCallPhase('listening');
    }
  }

  function speakReply(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!text || isMuted) {
        resolve();
        return;
      }

      setIsSpeaking(true);
      setCallPhase('speaking');
      Speech.speak(text, {
        language: speechLanguageTag,
        voice: preferredVoiceIdentifier,
        rate: language === 'en' ? 0.96 : 0.9,
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: () => {
          setIsSpeaking(false);
          setErrorMessage('TTS playback failed.');
          resolve();
        },
      });
    });
  }

  async function endCall() {
    stopAutoListeningLoop();
    await stopIncomingRingtone();
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
    } catch {
    }

    Speech.stop();
    setRecording(null);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setCallActive(false);
    setCallPhase('ended');
    setShowTranscript(false);
    setShowKeypad(false);
    setShowContacts(false);
    setShowAddCall(false);
    setDialPadValue('');
    setSecondaryLine(null);
    setIsVideoOn(false);
    setScreen('summary');
  }

  function resetForNewCall() {
    stopAutoListeningLoop();
    setScreen('selection');
    setCallActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setCallPhase('idle');
    setTextFallback('');
    setErrorMessage(null);
    setHandoffMeta(null);
    setIncomingCall(null);
    setShowKeypad(false);
    setShowContacts(false);
    setShowAddCall(false);
    setDialPadValue('');
    setSecondaryLine(null);
    setIsVideoOn(false);
    setActiveContact(CONTACTS[0]);
  }

  async function onMicPress() {
    if (!callActive) return;

    if (isListening && recording) {
      await stopRecordingAndTranscribe();
      return;
    }

    await startRecording();
  }

  async function onTextSubmit() {
    const text = textFallback.trim();
    if (!text) return;
    setTextFallback('');
    await processAgentTurn(text);
  }

  function onSaveInteraction() {
    Alert.alert('Saved', 'Interaction saved locally in session state.');
  }

  function appendCallNote(note: string) {
    const entry: TranscriptMessage = {
      id: `${Date.now()}-note`,
      role: 'assistant',
      text: note,
      timestamp: Date.now(),
    };
    setTranscriptHistory((prev) => [...prev, entry]);
  }

  async function onMutePress() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted && recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
      }
      setRecording(null);
      setIsListening(false);
      setCallPhase('idle');
    }
  }

  function onSpeakerPress() {
    setIsSpeakerOn((prev) => !prev);
  }

  function onVideoPress() {
    setIsVideoOn((prev) => !prev);
  }

  function onKeypadDigitPress(digit: string) {
    setDialPadValue((prev) => `${prev}${digit}`.slice(-24));
  }

  function onKeypadBackspace() {
    setDialPadValue((prev) => prev.slice(0, -1));
  }

  async function onSendDtmf() {
    const tones = dialPadValue.trim();
    if (!tones) return;
    setDialPadValue('');
    setShowKeypad(false);
    await processAgentTurn(`DTMF tones entered: ${tones}`);
  }

  function onContactSelect(contact: Contact) {
    setActiveContact(contact);
    setShowContacts(false);
    appendCallNote(`Active contact switched to ${contact.name} (${contact.number}).`);
  }

  function onAddCallSelect(contact: Contact) {
    setSecondaryLine(contact);
    setShowAddCall(false);
    appendCallNote(`Added ${contact.name} (${contact.number}) to the conference line.`);
  }

  async function answerIncomingCall() {
    if (!incomingCall) return;
    const incomingMobile = (incomingCall.event?.mobile || '').trim();
    const incomingName = (incomingCall.event?.userName || '').trim();
    if (incomingMobile || incomingName) {
      setActiveContact({
        id: incomingCall.event?.callId || `incoming-${Date.now()}`,
        name: incomingName || 'Customer',
        number: incomingMobile || 'Unknown Number',
      });
    } else {
      setActiveContact(CONTACTS[0]);
    }
    await startCall(incomingCall.agent, 'web', incomingCall.handoff, incomingCall.event?.conversation);
    setIncomingCall(null);
  }

  async function declineIncomingCall() {
    await stopIncomingRingtone();
    setIncomingCall(null);
    setHandoffMeta(null);
    setScreen('selection');
  }

  const processingDots = '.'.repeat(dotCount);
  const addableContacts = CONTACTS.filter((contact) => contact.id !== activeContact.id);

  if (screen === 'selection') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.selectionScroll}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>MALPE MEEN LAUNCHOS</Text>
            <Text style={styles.heroTitle}>Voice Workflow Console</Text>
            <Text style={styles.heroSubtitle}>PC-hosted call loop with STT, LLM processing, and TTS responses for assisted citizen support.</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaText}>{languageLabel}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaText}>{networkLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.languageSwitch}>
              <Pressable style={[styles.languageButton, language === 'en' && styles.languageButtonActive]} onPress={() => setLanguage('en')}>
                <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>English</Text>
              </Pressable>
              <Pressable style={[styles.languageButton, language === 'hi' && styles.languageButtonActive]} onPress={() => setLanguage('hi')}>
                <Text style={[styles.languageButtonText, language === 'hi' && styles.languageButtonTextActive]}>हिंदी</Text>
              </Pressable>
              <Pressable style={[styles.languageButton, language === 'kn' && styles.languageButtonActive]} onPress={() => setLanguage('kn')}>
                <Text style={[styles.languageButtonText, language === 'kn' && styles.languageButtonTextActive]}>ಕನ್ನಡ</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, styles.backendTitleSpacing]}>Local Backend URL</Text>
            <TextInput
              value={backendUrl}
              onChangeText={setBackendUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={`http://192.168.x.x:${backendPort}`}
              placeholderTextColor="#8ea3c4"
              style={styles.backendInput}
            />

            <View style={styles.setupActionsRow}>
              <Pressable
                style={styles.detectButton}
                onPress={() => {
                  const detectedIp = detectMetroHostIp();
                  if (!detectedIp) {
                    Alert.alert('IP not detected', 'Could not auto-detect Metro host IP. Enter backend URL manually.');
                    return;
                  }
                  setBackendUrl(buildLanUrlFromDetectedIp(BASE_URL, detectedIp));
                }}
              >
                <Text style={styles.detectButtonText}>Auto-detect IP</Text>
              </Pressable>
              <Pressable
                style={styles.healthButton}
                onPress={async () => {
                  const healthy = await checkServerHealth('connecting');
                  Alert.alert(healthy ? 'Server reachable' : 'Server unavailable', healthy ? 'Connected to local backend.' : 'Check backend process and URL.');
                }}
              >
                <Text style={styles.healthButtonText}>Test Link</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.agentSectionTitle}>Ready To Call</Text>

          <View style={styles.singleLaunchCard}>
            <Text style={styles.launchIcon}>{LAUNCH_OS_AGENT.icon}</Text>
            <Text style={styles.launchTitle}>{LAUNCH_OS_AGENT.name}</Text>
            <Text style={styles.launchDescription}>{LAUNCH_OS_AGENT.description}</Text>
            <Text style={styles.launchNumber}>{activeContact.number}</Text>
            <Pressable style={styles.launchNowButton} onPress={() => startCall(LAUNCH_OS_AGENT)}>
              <Text style={styles.launchNowButtonText}>Call LaunchOS</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'summary') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.summaryWrap}>
          <View style={styles.summaryHeroCard}>
            <Text style={styles.summaryTitle}>Session Snapshot</Text>
            <Text style={styles.summaryBody}>Conversation ended. Review highlights before taking the next call.</Text>
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatLabel}>Duration</Text>
                <Text style={styles.summaryStatValue}>{formatDuration(seconds)}</Text>
              </View>
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatLabel}>Assistant</Text>
                <Text style={styles.summaryStatValue}>{selectedAgent.name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryPanel}>
            <Text style={styles.summaryBlockTitle}>Summary</Text>
            <Text style={styles.summaryBody}>{summaryText}</Text>
          </View>

          <View style={styles.summaryPanel}>
            <Text style={styles.summaryBlockTitle}>Transcript Preview</Text>
            <ScrollView style={styles.summaryPreview}>
              {transcriptHistory.slice(-10).map((item) => (
                <Text key={item.id} style={styles.summaryLine}>
                  {item.role === 'user' ? 'You' : 'AI'}: {item.text}
                </Text>
              ))}
            </ScrollView>
          </View>

          <Pressable style={styles.primaryAction} onPress={() => setScreen('call')}>
            <Text style={styles.primaryActionText}>Return to call screen</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={resetForNewCall}>
            <Text style={styles.secondaryActionText}>Start new call</Text>
          </Pressable>
          <Pressable style={styles.ghostAction} onPress={onSaveInteraction}>
            <Text style={styles.ghostActionText}>Save interaction</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'incoming') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.incomingWrap}>
          <Text style={styles.incomingCallerLabel}>Incoming assisted call</Text>
          <Animated.View style={[styles.incomingAvatar, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.incomingAvatarText}>{selectedAgent.icon}</Text>
          </Animated.View>
          <Text style={styles.incomingCallerName}>Malpe Meen LaunchOS</Text>
          <Text style={styles.incomingCallerSub}>{selectedAgent.name}</Text>

          <View style={styles.incomingInfoCard}>
            <Text style={styles.incomingInfoText}>Channel: {CALL_RING_CHANNEL}</Text>
            <Text style={styles.incomingInfoText}>Source: {incomingCall?.source === 'web' ? 'Web handoff' : 'Manual trigger'}</Text>
            <Text style={styles.incomingInfoText}>Language: {languageLabel}</Text>
          </View>

          <Text style={styles.incomingRingingText}>Ringing...</Text>

          <View style={styles.incomingActionsRow}>
            <Pressable style={[styles.incomingActionBtn, styles.declineBtn]} onPress={declineIncomingCall}>
              <Text style={styles.incomingActionText}>Decline</Text>
            </Pressable>
            <Pressable style={[styles.incomingActionBtn, styles.answerBtn]} onPress={answerIncomingCall}>
              <Text style={styles.incomingActionText}>Answer</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.phoneSafe}>
      <StatusBar style="light" />
      <View style={styles.phoneRoot}>
        <View style={styles.phoneCallerPane}>
          <View style={styles.phoneAvatarCircle}>
            <Ionicons name="person" size={70} color="#b8bbc5" />
          </View>
          <Text style={styles.phoneNumber}>{activeContact.number}</Text>
          <Text style={styles.phoneCallerName}>{activeContact.name}</Text>
          <Text style={styles.phoneStatusText}>
            {callPhase === 'connecting' ? 'Calling...' : `${phaseText(callPhase)}${callPhase === 'processing' ? processingDots : ''}`}
          </Text>
          <Text style={styles.phoneMetaText}>{networkLabel} • {formatDuration(seconds)} • {languageLabel}</Text>
          {secondaryLine && <Text style={styles.phoneMetaText}>Additional line: {secondaryLine.name}</Text>}
          {errorMessage && <Text style={styles.phoneInlineError}>{errorMessage}</Text>}
        </View>

        <View style={styles.phoneControlsPane}>
          <View style={styles.phoneControlsRow}>
            <Pressable style={[styles.phoneControlButton, isMuted && styles.phoneControlButtonActive]} onPress={() => void onMutePress()}>
              <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </Pressable>
            <Pressable style={styles.phoneControlButton} onPress={() => setShowKeypad(true)}>
              <Ionicons name="keypad-outline" size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>Keypad</Text>
            </Pressable>
            <Pressable style={[styles.phoneControlButton, isSpeakerOn && styles.phoneControlButtonActive]} onPress={onSpeakerPress}>
              <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-medium-outline'} size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>Speaker</Text>
            </Pressable>
          </View>

          <View style={styles.phoneControlsRow}>
            <Pressable style={[styles.phoneControlButton, isVideoOn && styles.phoneControlButtonActive]} onPress={onVideoPress}>
              <Ionicons name={isVideoOn ? 'videocam' : 'videocam-outline'} size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>Video call</Text>
            </Pressable>
            <Pressable style={styles.phoneControlButton} onPress={() => setShowAddCall(true)}>
              <Ionicons name="people-outline" size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>Add call</Text>
            </Pressable>
            <Pressable style={styles.phoneControlButton} onPress={() => setShowContacts(true)}>
              <Ionicons name="person-outline" size={30} color="#f2f4f8" />
              <Text style={styles.phoneControlLabel}>Contacts</Text>
            </Pressable>
          </View>

          <Pressable style={styles.phoneEndButton} onPress={() => void endCall()}>
            <Ionicons name="call" size={34} color="#ffffff" style={styles.phoneEndIcon} />
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={showKeypad} animationType="slide" onRequestClose={() => setShowKeypad(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Keypad</Text>
            <Text style={styles.keypadDisplay}>{dialPadValue || 'Tap digits'}</Text>
            <View style={styles.keypadGrid}>
              {KEYPAD_LAYOUT.map((digit) => (
                <Pressable key={digit} style={styles.keypadDigitButton} onPress={() => onKeypadDigitPress(digit)}>
                  <Text style={styles.keypadDigitText}>{digit}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <Pressable style={styles.closeButton} onPress={onKeypadBackspace}>
                <Text style={styles.closeButtonText}>Delete</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setDialPadValue('')}>
                <Text style={styles.closeButtonText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.copyButton} onPress={() => void onSendDtmf()}>
                <Text style={styles.copyButtonText}>Send</Text>
              </Pressable>
            </View>
            <Pressable style={styles.modalDismissButton} onPress={() => setShowKeypad(false)}>
              <Text style={styles.modalDismissText}>Close keypad</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showAddCall} animationType="slide" onRequestClose={() => setShowAddCall(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Call</Text>
            <ScrollView style={styles.sheetScroll}>
              {addableContacts.map((contact) => (
                <Pressable key={contact.id} style={styles.contactOption} onPress={() => onAddCallSelect(contact)}>
                  <Text style={styles.contactOptionName}>{contact.name}</Text>
                  <Text style={styles.contactOptionNumber}>{contact.number}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalDismissButton} onPress={() => setShowAddCall(false)}>
              <Text style={styles.modalDismissText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showContacts} animationType="slide" onRequestClose={() => setShowContacts(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Contacts</Text>
            <ScrollView style={styles.sheetScroll}>
              {CONTACTS.map((contact) => (
                <Pressable key={contact.id} style={styles.contactOption} onPress={() => onContactSelect(contact)}>
                  <Text style={styles.contactOptionName}>{contact.name}</Text>
                  <Text style={styles.contactOptionNumber}>{contact.number}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalDismissButton} onPress={() => setShowContacts(false)}>
              <Text style={styles.modalDismissText}>Close contacts</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showTranscript} animationType="slide" onRequestClose={() => setShowTranscript(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Transcript History</Text>
            <ScrollView style={styles.sheetScroll}>
              {transcriptHistory.length === 0 && <Text style={styles.sheetEmpty}>No conversation yet.</Text>}
              {transcriptHistory.map((item) => (
                <View key={item.id} style={[styles.sheetBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={styles.sheetBubbleText}>{item.role === 'user' ? 'You' : 'AI'}: {item.text}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable
                style={styles.copyButton}
                onPress={() => {
                  const merged = transcriptHistory.map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n');
                  Alert.alert('Transcript', merged || 'No history to copy.');
                }}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setShowTranscript(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b1f3a',
  },
  phoneSafe: {
    flex: 1,
    backgroundColor: '#2f3138',
  },
  phoneRoot: {
    flex: 1,
    justifyContent: 'space-between',
  },
  phoneCallerPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  phoneAvatarCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#f2f2f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  phoneNumber: {
    color: '#f2f3f7',
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: 1,
    textAlign: 'center',
  },
  phoneCallerName: {
    color: '#d8dae0',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 6,
  },
  phoneStatusText: {
    color: '#3fc2ff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  phoneMetaText: {
    color: '#babec8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  phoneInlineError: {
    marginTop: 10,
    color: '#ffd2d2',
    backgroundColor: '#8a2f3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
  phoneControlsPane: {
    backgroundColor: '#4a4c54',
    borderTopColor: '#2f3138',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },
  phoneControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  phoneControlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 6,
    backgroundColor: '#5a5d66',
  },
  phoneControlButtonActive: {
    backgroundColor: '#747984',
  },
  phoneControlLabel: {
    color: '#f2f4f8',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  phoneEndButton: {
    alignSelf: 'center',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#ff3b3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  phoneEndIcon: {
    transform: [{ rotate: '135deg' }],
  },
  selectionScroll: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  heroCard: {
    marginTop: 14,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#133760',
    borderWidth: 1,
    borderColor: '#2b5887',
  },
  heroEyebrow: {
    color: '#89e6ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  heroSubtitle: {
    color: '#d3e8ff',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  heroMetaPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0d2848',
    borderWidth: 1,
    borderColor: '#3e6ea3',
    marginRight: 8,
  },
  heroMetaText: {
    color: '#d5edff',
    fontSize: 12,
    fontWeight: '700',
  },
  setupCard: {
    borderRadius: 18,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#102f53',
    borderWidth: 1,
    borderColor: '#2d5a8e',
  },
  sectionTitle: {
    color: '#dff0ff',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  backendTitleSpacing: {
    marginTop: 12,
  },
  setupActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  healthButton: {
    backgroundColor: '#0f5d67',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginLeft: 8,
  },
  healthButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  agentSectionTitle: {
    color: '#ffffff',
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '800',
  },
  singleLaunchCard: {
    borderRadius: 16,
    backgroundColor: '#143960',
    borderWidth: 1,
    borderColor: '#2f6599',
    padding: 16,
    alignItems: 'center',
  },
  launchIcon: {
    fontSize: 38,
    marginBottom: 6,
  },
  launchTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  launchDescription: {
    color: '#c2d9f1',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  launchNumber: {
    color: '#8fd6ff',
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  launchNowButton: {
    marginTop: 14,
    backgroundColor: '#ff9933',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  launchNowButtonText: {
    color: '#1b1b1b',
    fontWeight: '800',
    fontSize: 16,
  },
  callScroll: {
    paddingHorizontal: 16,
    paddingBottom: 26,
  },
  callHeaderCard: {
    marginTop: 10,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#14365e',
    borderWidth: 1,
    borderColor: '#315f95',
  },
  callHeaderTitle: {
    color: '#8ce7ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  callHeaderSubtitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  callHeaderMeta: {
    color: '#c2daef',
    marginTop: 6,
    fontSize: 13,
  },
  callHeaderChips: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  callHeaderChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0f2847',
    borderWidth: 1,
    borderColor: '#3a679a',
    marginRight: 8,
    marginBottom: 8,
  },
  callHeaderChipDanger: {
    borderColor: '#ac4f5a',
    backgroundColor: '#4e2430',
  },
  callHeaderChipText: {
    color: '#e1efff',
    fontSize: 12,
    fontWeight: '700',
  },
  liveStageCard: {
    marginTop: 14,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#102d4f',
    borderWidth: 1,
    borderColor: '#2d5b8c',
  },
  quickTranscriptCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#112f52',
    borderWidth: 1,
    borderColor: '#2f5e93',
  },
  quickTranscriptTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  quickTranscriptEmpty: {
    color: '#adc9ea',
    fontSize: 13,
    lineHeight: 18,
  },
  quickTranscriptLine: {
    color: '#d8e9ff',
    marginBottom: 8,
    lineHeight: 19,
    fontSize: 13,
  },
  summaryHeroCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#14365f',
    borderWidth: 1,
    borderColor: '#305f93',
  },
  summaryStatsRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  summaryStatCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#0f2848',
    borderWidth: 1,
    borderColor: '#2f5f92',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  summaryStatLabel: {
    color: '#9fc7ea',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryPanel: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#102f53',
    borderWidth: 1,
    borderColor: '#2d5b8f',
    padding: 12,
  },
  incomingInfoCard: {
    marginTop: 18,
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#103155',
    borderWidth: 1,
    borderColor: '#2e5f95',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  incomingInfoText: {
    color: '#d2e7ff',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 2,
  },
  incomingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#08233f',
  },
  incomingCallerLabel: {
    color: '#9ec2ec',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
  },
  incomingAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f4e86',
    marginBottom: 18,
  },
  incomingAvatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  incomingCallerName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  incomingCallerSub: {
    color: '#c5daf4',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  incomingRingingText: {
    color: '#9ec2ec',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
  },
  incomingActionsRow: {
    flexDirection: 'row',
    marginTop: 44,
    width: '100%',
    justifyContent: 'space-between',
  },
  incomingActionBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  answerBtn: {
    backgroundColor: '#1ea857',
  },
  declineBtn: {
    backgroundColor: '#d94141',
  },
  incomingActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  brandHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  brandSub: {
    marginTop: 4,
    color: '#b6c8e5',
    fontSize: 14,
  },
  languageRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  languageLabel: {
    color: '#d6e3f5',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  languageSwitch: {
    flexDirection: 'row',
    backgroundColor: '#132d52',
    borderRadius: 12,
    padding: 4,
  },
  backendRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backendInput: {
    backgroundColor: '#0f2a4d',
    borderColor: '#2b4d78',
    borderWidth: 1,
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detectRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  detectButton: {
    backgroundColor: '#215d9e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  detectButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#1f7aec',
  },
  languageButtonText: {
    color: '#c7d8f1',
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#ffffff',
  },
  agentList: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132d52',
    borderRadius: 14,
    padding: 14,
    marginVertical: 7,
  },
  agentIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  agentTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  agentName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  agentDesc: {
    color: '#b9cbe7',
    fontSize: 13,
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#ff9933',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callButtonText: {
    color: '#1b1b1b',
    fontWeight: '800',
  },
  callTopBar: {
    alignItems: 'center',
    paddingTop: 14,
  },
  topLogo: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  topSub: {
    color: '#bfd0e9',
    marginTop: 4,
    fontSize: 13,
  },
  networkText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  successText: {
    color: '#26d07c',
  },
  errorText: {
    color: '#ff6f6f',
  },
  pendingText: {
    color: '#ffd166',
  },
  handoffBanner: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#17375f',
    borderColor: '#2e5f99',
    borderWidth: 1,
  },
  handoffBannerTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  handoffBannerText: {
    color: '#c9dcf6',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  avatarCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: '#1f3f73',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatarEmoji: {
    fontSize: 66,
  },
  centerName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerRole: {
    color: '#b9cbe7',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  callAudioMeta: {
    marginTop: 10,
    color: '#b8cdea',
    fontSize: 13,
    fontWeight: '600',
  },
  phaseText: {
    marginTop: 18,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
  },
  timerText: {
    marginTop: 10,
    color: '#8eb4ea',
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 8,
    color: '#b8e7ff',
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 14,
    color: '#ffffff',
    backgroundColor: '#c44242',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    textAlign: 'center',
  },
  wifiMode: {
    marginTop: 12,
    color: '#95b5df',
    fontSize: 12,
    fontWeight: '600',
  },
  inCallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 14,
    gap: 10,
  },
  inCallIconBtn: {
    width: 92,
    height: 82,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#5c7ea8',
    backgroundColor: '#153559',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inCallIconBtnActive: {
    backgroundColor: '#1f7aec',
    borderColor: '#84b6ff',
  },
  inCallIconGlyph: {
    fontSize: 20,
    marginBottom: 4,
  },
  inCallIconLabel: {
    color: '#d2e4fb',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  endCallWrap: {
    alignItems: 'center',
    marginBottom: 26,
  },
  endCallFab: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e33e3e',
    shadowColor: '#e33e3e',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  endCallFabText: {
    fontSize: 30,
    transform: [{ rotate: '135deg' }],
  },
  fallbackWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  fallbackInput: {
    flex: 1,
    backgroundColor: '#0f2a4d',
    borderColor: '#2b4d78',
    borderWidth: 1,
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#00a6a6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#16345f',
    marginHorizontal: 4,
  },
  controlText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  controlMuted: {
    backgroundColor: '#4a5362',
  },
  primaryMic: {
    backgroundColor: '#1f7aec',
  },
  endCall: {
    backgroundColor: '#d94141',
  },
  retryRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a78af',
  },
  retryText: {
    color: '#b9cbe7',
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f2748',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
  },
  sheetTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 12,
  },
  sheetScroll: {
    minHeight: 160,
    maxHeight: 320,
  },
  sheetEmpty: {
    color: '#aec1de',
    textAlign: 'center',
    marginVertical: 20,
  },
  sheetBubble: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#1c4e86',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#1d3553',
    alignSelf: 'flex-start',
  },
  sheetBubbleText: {
    color: '#ffffff',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  keypadDisplay: {
    backgroundColor: '#0c2241',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keypadDigitButton: {
    width: '30.5%',
    borderRadius: 14,
    backgroundColor: '#1e3f67',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  keypadDigitText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  modalDismissButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a6d94',
    alignItems: 'center',
    paddingVertical: 11,
  },
  modalDismissText: {
    color: '#d5e6fb',
    fontWeight: '700',
  },
  contactOption: {
    backgroundColor: '#123254',
    borderColor: '#2c5c8f',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  contactOptionName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  contactOptionNumber: {
    color: '#afc8e4',
    marginTop: 3,
    fontSize: 13,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#1f7aec',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  copyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2f4565',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  summaryMetric: {
    marginTop: 10,
    color: '#c6d8ef',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryBlockTitle: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryBody: {
    color: '#c6d8ef',
    marginTop: 8,
    lineHeight: 20,
  },
  summaryPreview: {
    marginTop: 8,
    backgroundColor: '#123055',
    borderRadius: 12,
    padding: 10,
    maxHeight: 180,
  },
  summaryLine: {
    color: '#d1e0f2',
    marginBottom: 6,
  },
  primaryAction: {
    marginTop: 16,
    backgroundColor: '#1f7aec',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  secondaryAction: {
    marginTop: 10,
    backgroundColor: '#2c4f79',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ghostAction: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#5f7fa8',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  ghostActionText: {
    color: '#b8cbe6',
    fontWeight: '700',
  },
});
