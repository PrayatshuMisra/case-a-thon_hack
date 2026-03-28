export interface PilotGroqInsightInput {
  species: string;
  freshnessScore: number;
  healthScore: number;
  availableKg: number;
  selectedOption: string;
  feasible: boolean;
  forecastDemandKg: number;
  fulfillmentKg: number;
  projectedRevenue: number | null;
  projectedCost: number | null;
  projectedProfit: number | null;
  wastageKg: number;
  wastagePercentage: number;
  unmetCommitmentKg: number;
  bestOption: string;
  bestOptionProfit: number | null;
  notes: string;
  alternatives: Array<{
    option: string;
    feasible: boolean;
    projectedProfit: number | null;
  }>;
  implementationState?: 'implemented' | 'preview' | 'none';
  recoveryPlanLabel?: string;
  baseDestination?: string;
  recoveryDestination?: string;
  baseProfit?: number | null;
  finalProfit?: number | null;
  baseWastageKg?: number | null;
  residualWasteKg?: number | null;
  recoveredKg?: number | null;
  requestId?: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VARIATION_STYLES = [
  'Focus on profitability first, then operational risk.',
  'Focus on wastage control first, then margin impact.',
  'Focus on commitment fulfillment first, then downside risk.',
  'Focus on short-term execution clarity with one quantified tradeoff.',
];

const hashText = (text: string): number => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildPrompt = (input: PilotGroqInsightInput): string => {
  const signature = [
    input.species,
    input.selectedOption,
    input.forecastDemandKg.toFixed(1),
    input.availableKg.toFixed(1),
    (input.projectedProfit ?? 0).toFixed(2),
    input.requestId ?? '',
  ].join('|');
  const style = VARIATION_STYLES[hashText(signature) % VARIATION_STYLES.length];

  return [
    'You are an operations analyst for seafood supply chain optimization.',
    'Use the provided scenario to produce practical decision guidance in very simple words.',
    `Narrative angle: ${style}`,
    `Run ID: ${input.requestId ?? 'n/a'}`,
    'Output format:',
    '1) One-line recommendation.',
    '2) Fish flow in simple words: primary route, secondary route, and leftover waste.',
    '3) Money change in INR only: base profit -> final profit -> uplift.',
    '4) One risk line and one immediate action line.',
    '5) One fallback option if demand changes by +/-20%.',
    '',
    `Species: ${input.species}`,
    `Freshness: ${input.freshnessScore}/100`,
    `Health: ${input.healthScore}/100`,
    `Available: ${input.availableKg}kg`,
    `Selected option: ${input.selectedOption}`,
    `Selected feasible: ${input.feasible}`,
    `Forecast demand: ${input.forecastDemandKg}kg`,
    `Fulfillment: ${input.fulfillmentKg}kg`,
    `Projected revenue: ${input.projectedRevenue == null ? 'N/A' : input.projectedRevenue.toFixed(2)}`,
    `Projected cost: ${input.projectedCost == null ? 'N/A' : input.projectedCost.toFixed(2)}`,
    `Projected profit: ${input.projectedProfit == null ? 'N/A' : input.projectedProfit.toFixed(2)}`,
    `Projected wastage: ${input.wastageKg.toFixed(2)}kg (${input.wastagePercentage.toFixed(1)}%)`,
    `Waste planner state: ${input.implementationState ?? 'none'}`,
    `Recovery plan: ${input.recoveryPlanLabel ?? 'none'}`,
    `Base destination: ${input.baseDestination ?? 'unknown'}`,
    `Recovery destination: ${input.recoveryDestination ?? 'none'}`,
    `Base profit: ${input.baseProfit == null ? 'N/A' : input.baseProfit.toFixed(2)}`,
    `Final profit: ${input.finalProfit == null ? 'N/A' : input.finalProfit.toFixed(2)}`,
    `Base waste kg: ${input.baseWastageKg == null ? 'N/A' : input.baseWastageKg.toFixed(2)}`,
    `Residual waste kg: ${input.residualWasteKg == null ? 'N/A' : input.residualWasteKg.toFixed(2)}`,
    `Recovered kg: ${input.recoveredKg == null ? 'N/A' : input.recoveredKg.toFixed(2)}`,
    `Commitment shortfall: ${input.unmetCommitmentKg}kg`,
    `Best option by model: ${input.bestOption}`,
    `Best option profit: ${input.bestOptionProfit == null ? 'N/A' : input.bestOptionProfit.toFixed(2)}`,
    `Notes: ${input.notes}`,
    `Alternatives: ${input.alternatives.map((a) => `${a.option} (${a.feasible ? 'feasible' : 'not feasible'}, profit=${a.projectedProfit == null ? 'N/A' : a.projectedProfit.toFixed(2)})`).join('; ')}`,
    '',
    'Use INR only with symbol ₹. Never use $ or USD.',
    'Keep it under 170 words and use plain language for an operations manager.',
    'Do not use complex words or jargon.',
    'If planner state is implemented or preview, you must explicitly compare Before vs After in numbers.',
    'Vary phrasing and sentence structure across runs while keeping numeric facts accurate.',
  ].join('\n');
};

const normalizeInsightText = (text: string): string => {
  return text
    .replace(/\$/g, '₹')
    .replace(/\bUSD\b/gi, 'INR')
    .replace(/\bdollars?\b/gi, 'rupees');
};

export const generatePilotGroqInsight = async (input: PilotGroqInsightInput): Promise<string> => {
  const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_GROQ_API_KEY in env.');
  }

  const model = ((import.meta as any).env?.VITE_GROQ_MODEL as string | undefined) ?? 'llama-3.3-70b-versatile';

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      top_p: 0.95,
      frequency_penalty: 0.2,
      presence_penalty: 0.3,
      max_tokens: 260,
      messages: [
        {
          role: 'system',
          content: 'You provide concise and practical operations decisions for seafood logistics.',
        },
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Groq response did not contain insight text.');
  }

  return normalizeInsightText(content.trim());
};
