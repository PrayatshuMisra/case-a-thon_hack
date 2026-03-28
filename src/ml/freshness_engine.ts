/**
 * Freshness Intelligence + Zero-Waste Pricing Engine
 * 
 * Simulated ML/Rules Engine:
 * Takes temporal variables (catch, landing, packing, dispatch) and computes
 * an exact freshness confidence score (0-100) and executes dynamic pricing 
 * thresholds to enforce zero-waste unit economics.
 */

export interface LogisticsInput {
  catchTime: Date;
  landingTime: Date;
  packingTime: Date;
  dispatchTime: Date;
  arrivalEta: Date;
  species: 'Prawns' | 'Sardine' | 'Seer Fish' | 'Pomfret';
  coldChainMaintained: boolean;
  basePricePerKg: number;
}

export interface IntelligenceOutput {
  freshnessScore: number;
  freshnessLabel: 'Excellent' | 'High' | 'Moderate' | 'At Risk';
  dynamicPrice: number;
  flashDrop: boolean;
  spoilageRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  wastagePercentage: number;
}

const SPECIES_SENSITIVITY: Record<string, number> = {
  'Prawns': 1.8,    // Highly sensitive
  'Sardine': 1.6,   // Highly sensitive
  'Pomfret': 1.2,   // Medium
  'Seer Fish': 1.0  // More stable
};

/**
 * Computes difference in hours between two dates.
 */
const diffHours = (start: Date, end: Date): number => {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
};

export const calculateFreshnessIntelligence = (input: LogisticsInput): IntelligenceOutput => {
  let score = 100;
  
  // 1. Calculate time gaps
  const hoursSinceCatch = diffHours(input.catchTime, new Date());
  const packingDelay = diffHours(input.landingTime, input.packingTime);
  const dispatchDelay = diffHours(input.packingTime, input.dispatchTime);
  const transitTime = diffHours(input.dispatchTime, new Date());
  
  // 2. Identify Species Multiplier
  const sensitivityMultiplier = SPECIES_SENSITIVITY[input.species] || 1.5;

  // 3. Apply Time Degradation Penalties
  // Baseline decay simply for being out of ocean
  score -= (hoursSinceCatch * 1.5 * sensitivityMultiplier);
  
  // Severe penalty for delays arriving to the cold chain (landing to packing)
  score -= (packingDelay * 2.5 * sensitivityMultiplier);
  
  // Mild penalty for dispatch idle time
  score -= (dispatchDelay * 1.0);
  
  // Transit degradation
  score -= (transitTime * 0.8 * sensitivityMultiplier);

  // 4. Cold Chain Break Penalty (Absolute Dealbreaker)
  if (!input.coldChainMaintained) {
    score -= 35; // Massive penalty for breaking temp limits
  }

  // Bound score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // 5. Determine State Labels
  let freshnessLabel: IntelligenceOutput['freshnessLabel'];
  let spoilageRisk: IntelligenceOutput['spoilageRisk'];

  if (score >= 90) {
    freshnessLabel = 'Excellent';
    spoilageRisk = 'Low';
  } else if (score >= 80) {
    freshnessLabel = 'High';
    spoilageRisk = 'Medium';
  } else if (score >= 70) {
    freshnessLabel = 'Moderate';
    spoilageRisk = 'High';
  } else {
    freshnessLabel = 'At Risk';
    spoilageRisk = 'Critical';
  }

  // 6. Dynamic Pricing (Zero-Waste Logic)
  // Ensure unit economics are preserved while minimizing raw spoilage loss.
  let dynamicPrice = input.basePricePerKg;
  let flashDrop = false;

  if (score >= 90) {
    // 90+ -> Full Premium Price
    dynamicPrice = input.basePricePerKg;
  } else if (score >= 80) {
    // 80-89 -> Mild markdown (5-8%)
    dynamicPrice = Math.round(input.basePricePerKg * 0.94);
  } else if (score >= 70) {
    // 70-79 -> Flash Drop to clear stock fast (15-20% off)
    dynamicPrice = Math.round(input.basePricePerKg * 0.82);
    flashDrop = true;
  } else {
    // <70 -> Aggressive markdown just to recover logistics cost (40% off)
    dynamicPrice = Math.round(input.basePricePerKg * 0.60);
    flashDrop = true;
  }

  // 7. Wastage Probability Proxy (%)
  let wastagePercentage = 0;
  if (score >= 90) {
    wastagePercentage = 4;
  } else if (score >= 80) {
    wastagePercentage = 9;
  } else if (score >= 70) {
    wastagePercentage = 18;
  } else {
    wastagePercentage = 32;
  }

  if (!input.coldChainMaintained) {
    wastagePercentage += 10;
  }
  wastagePercentage = Math.max(0, Math.min(95, Math.round(wastagePercentage)));

  return {
    freshnessScore: score,
    freshnessLabel,
    dynamicPrice,
    flashDrop,
    spoilageRisk,
    wastagePercentage,
  };
};
