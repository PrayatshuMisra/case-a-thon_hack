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
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildPrompt = (input: PilotGroqInsightInput): string => {
  return [
    'You are an operations analyst for seafood supply chain optimization.',
    'Use the provided scenario to produce practical decision guidance.',
    'Output format:',
    '1) One-line recommendation.',
    '2) Three bullet points: Why, Risk, Immediate action.',
    '3) One fallback option if demand changes by +/-20%.',
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
    `Commitment shortfall: ${input.unmetCommitmentKg}kg`,
    `Best option by model: ${input.bestOption}`,
    `Best option profit: ${input.bestOptionProfit == null ? 'N/A' : input.bestOptionProfit.toFixed(2)}`,
    `Notes: ${input.notes}`,
    `Alternatives: ${input.alternatives.map((a) => `${a.option} (${a.feasible ? 'feasible' : 'not feasible'}, profit=${a.projectedProfit == null ? 'N/A' : a.projectedProfit.toFixed(2)})`).join('; ')}`,
    '',
    'Keep it under 140 words and use plain language for an operations manager.',
  ].join('\n');
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
      temperature: 0.2,
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

  return content.trim();
};
