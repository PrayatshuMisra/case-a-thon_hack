export type BuyerType = 'Customer' | 'Restaurant' | 'Retail' | 'Industrial';

export interface FishStock {
  id: string;
  species: 'Seer Fish' | 'Pomfret' | 'Prawns' | 'Sardine';
  availableKg: number;
  freshnessScore: number;
  healthScore: number;
  basePricePerKg: number;
  coldChainMaintained: boolean;
}

export interface OrderRecord {
  orderId: string;
  species: FishStock['species'];
  quantityKg: number;
  pricePerKg: number;
  buyerType: BuyerType;
  createdAt: string;
}

export interface Commitment {
  id: string;
  buyerName: string;
  buyerType: BuyerType;
  species: FishStock['species'];
  dailyQtyKg: number;
  agreedPricePerKg: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface StrategyOption {
  id:
    | 'premium_fresh'
    | 'standard_retail'
    | 'flash_drop'
    | 'pickling'
    | 'drying_salting'
    | 'minced_products'
    | 'fish_silage'
    | 'fishmeal'
    | 'collagen'
    | 'chitosan'
    | 'fertilizer';
  label: string;
  minFreshness: number;
  maxFreshness: number;
  processingCostPerKg: number;
  yieldRatio: number;
  priceMultiplier: number;
  demandMultiplier: number;
  applicableSpecies?: FishStock['species'][];
  channel: BuyerType;
}

export interface ScenarioResult {
  option: StrategyOption;
  feasible: boolean;
  forecastDemandKg: number;
  fulfillmentKg: number;
  wastageKg: number;
  wastagePercentage: number;
  projectedRevenue: number | null;
  projectedCost: number | null;
  projectedProfit: number | null;
  unmetCommitmentKg: number;
  notes: string;
}

const STRATEGIES: StrategyOption[] = [
  {
    id: 'premium_fresh',
    label: 'Premium D2C',
    minFreshness: 90,
    maxFreshness: 100,
    processingCostPerKg: 18,
    yieldRatio: 1,
    priceMultiplier: 1.25,
    demandMultiplier: 0.95,
    channel: 'Restaurant',
  },
  {
    id: 'standard_retail',
    label: 'Standard Retail',
    minFreshness: 80,
    maxFreshness: 90,
    processingCostPerKg: 22,
    yieldRatio: 1,
    priceMultiplier: 1.08,
    demandMultiplier: 1.12,
    channel: 'Customer',
  },
  {
    id: 'flash_drop',
    label: 'Flash Drop',
    minFreshness: 70,
    maxFreshness: 80,
    processingCostPerKg: 10,
    yieldRatio: 1,
    priceMultiplier: 0.88,
    demandMultiplier: 1.45,
    channel: 'Retail',
  },
  {
    id: 'pickling',
    label: 'Pickling / Meen Achar',
    minFreshness: 55,
    maxFreshness: 80,
    processingCostPerKg: 65,
    yieldRatio: 0.86,
    priceMultiplier: 1.5,
    demandMultiplier: 0.9,
    channel: 'Retail',
  },
  {
    id: 'drying_salting',
    label: 'Drying & Salting',
    minFreshness: 45,
    maxFreshness: 75,
    processingCostPerKg: 48,
    yieldRatio: 0.72,
    priceMultiplier: 1.35,
    demandMultiplier: 0.84,
    channel: 'Retail',
  },
  {
    id: 'minced_products',
    label: 'Minced / Ready-to-Cook',
    minFreshness: 50,
    maxFreshness: 75,
    processingCostPerKg: 78,
    yieldRatio: 0.8,
    priceMultiplier: 1.45,
    demandMultiplier: 0.96,
    channel: 'Customer',
  },
  {
    id: 'fish_silage',
    label: 'Fish Silage',
    minFreshness: 20,
    maxFreshness: 55,
    processingCostPerKg: 32,
    yieldRatio: 0.9,
    priceMultiplier: 0.62,
    demandMultiplier: 0.78,
    channel: 'Industrial',
  },
  {
    id: 'fishmeal',
    label: 'Fishmeal',
    minFreshness: 10,
    maxFreshness: 50,
    processingCostPerKg: 40,
    yieldRatio: 0.68,
    priceMultiplier: 0.95,
    demandMultiplier: 0.82,
    channel: 'Industrial',
  },
  {
    id: 'collagen',
    label: 'Collagen Extraction',
    minFreshness: 15,
    maxFreshness: 60,
    processingCostPerKg: 110,
    yieldRatio: 0.18,
    priceMultiplier: 4.2,
    demandMultiplier: 0.5,
    applicableSpecies: ['Seer Fish', 'Pomfret'],
    channel: 'Industrial',
  },
  {
    id: 'chitosan',
    label: 'Chitosan (Shell Waste)',
    minFreshness: 10,
    maxFreshness: 60,
    processingCostPerKg: 95,
    yieldRatio: 0.24,
    priceMultiplier: 2.8,
    demandMultiplier: 0.56,
    applicableSpecies: ['Prawns'],
    channel: 'Industrial',
  },
  {
    id: 'fertilizer',
    label: 'Organic Fertilizer',
    minFreshness: 0,
    maxFreshness: 25,
    processingCostPerKg: 20,
    yieldRatio: 0.95,
    priceMultiplier: 0.4,
    demandMultiplier: 0.7,
    channel: 'Industrial',
  },
];

const daysBetween = (a: Date, b: Date): number => {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const predictDemandKg = (
  orders: OrderRecord[],
  commitments: Commitment[],
  species: FishStock['species']
): number => {
  const now = new Date();
  const scopedOrders = orders
    .filter((o) => o.species === species)
    .map((o) => {
      const ageDays = daysBetween(now, new Date(o.createdAt));
      const recencyWeight = clamp(1.4 - ageDays * 0.12, 0.2, 1.4);
      return { ...o, recencyWeight };
    })
    .filter((o) => o.recencyWeight > 0);

  const weightedQty = scopedOrders.reduce((acc, o) => acc + o.quantityKg * o.recencyWeight, 0);
  const weightTotal = scopedOrders.reduce((acc, o) => acc + o.recencyWeight, 0);
  const baseline = weightTotal > 0 ? weightedQty / weightTotal : 0;

  const threeDay = scopedOrders
    .filter((o) => daysBetween(now, new Date(o.createdAt)) <= 3)
    .reduce((acc, o) => acc + o.quantityKg, 0);
  const previousFourDay = scopedOrders
    .filter((o) => {
      const age = daysBetween(now, new Date(o.createdAt));
      return age > 3 && age <= 7;
    })
    .reduce((acc, o) => acc + o.quantityKg, 0);

  const trend = previousFourDay > 0 ? (threeDay - previousFourDay) / previousFourDay : 0.1;
  const commitmentQty = commitments
    .filter((c) => c.species === species)
    .reduce((acc, c) => acc + c.dailyQtyKg, 0);

  const demand = Math.max(commitmentQty, baseline * 8 * (1 + trend * 0.35));
  return Math.round(clamp(demand, 2, 250) * 10) / 10;
};

const getWastePenalty = (freshness: number): number => {
  if (freshness >= 85) return 12;
  if (freshness >= 70) return 18;
  if (freshness >= 50) return 24;
  return 32;
};

const isOptionFeasible = (stock: FishStock, option: StrategyOption): boolean => {
  const inRange = stock.freshnessScore >= option.minFreshness && stock.freshnessScore <= option.maxFreshness;
  const speciesMatch = !option.applicableSpecies || option.applicableSpecies.includes(stock.species);
  return inRange && speciesMatch;
};

export const evaluateStockScenarios = (
  stock: FishStock,
  orders: OrderRecord[],
  commitments: Commitment[]
): ScenarioResult[] => {
  const demand = predictDemandKg(orders, commitments, stock.species);
  const commitmentQty = commitments
    .filter((c) => c.species === stock.species)
    .reduce((acc, c) => acc + c.dailyQtyKg, 0);

  return STRATEGIES.map((option) => {
    const feasible = isOptionFeasible(stock, option);
    if (!feasible) {
      const freshnessNote = `Needs freshness ${option.minFreshness}-${option.maxFreshness}; current ${stock.freshnessScore}.`;
      const speciesNote = option.applicableSpecies && !option.applicableSpecies.includes(stock.species)
        ? ` Applicable for ${option.applicableSpecies.join(', ')} only.`
        : '';
      return {
        option,
        feasible,
        forecastDemandKg: demand,
        fulfillmentKg: 0,
        wastageKg: stock.availableKg,
        wastagePercentage: 100,
        projectedRevenue: null,
        projectedCost: null,
        projectedProfit: null,
        unmetCommitmentKg: commitmentQty,
        notes: `${freshnessNote}${speciesNote}`,
      };
    }

    const processableKg = stock.availableKg * option.yieldRatio;
    const demandAdjusted = demand * option.demandMultiplier;
    const forecastDemandKg = option.channel === 'Industrial'
      ? Math.max(demandAdjusted, commitmentQty * 0.45)
      : Math.max(demandAdjusted, commitmentQty * 0.9);
    const fulfillmentKg = Math.min(processableKg, forecastDemandKg);
    const utilizedRawKg = Math.min(stock.availableKg, fulfillmentKg / Math.max(option.yieldRatio, 0.01));
    const wastageKg = Math.max(0, stock.availableKg - utilizedRawKg);
    const wastagePercentage = stock.availableKg > 0 ? Math.round((wastageKg / stock.availableKg) * 1000) / 10 : 0;

    const qualityBoost = 1 + (stock.healthScore - 80) / 200;
    const coldChainBoost = stock.coldChainMaintained ? 1.03 : 0.94;
    const sellPrice = stock.basePricePerKg * option.priceMultiplier * qualityBoost * coldChainBoost;

    const projectedRevenue = fulfillmentKg * sellPrice;
    const processingCost = stock.availableKg * option.processingCostPerKg;
    const sourcingCost = stock.availableKg * stock.basePricePerKg * 0.48;
    const wastePenalty = Math.max(0, stock.availableKg - fulfillmentKg) * getWastePenalty(stock.freshnessScore);
    const projectedCost = processingCost + sourcingCost + wastePenalty;
    const projectedProfit = projectedRevenue - projectedCost;

    const unmetCommitmentKg = Math.max(0, commitmentQty - fulfillmentKg);
    const notes = unmetCommitmentKg > 0
      ? `Risk: ${unmetCommitmentKg.toFixed(1)}kg commitment shortfall.`
      : 'Commitments can be fulfilled under this option.';

    return {
      option,
      feasible,
      forecastDemandKg,
      fulfillmentKg,
      wastageKg,
      wastagePercentage,
      projectedRevenue,
      projectedCost,
      projectedProfit,
      unmetCommitmentKg,
      notes,
    };
  }).sort((a, b) => {
    if (a.feasible !== b.feasible) {
      return a.feasible ? -1 : 1;
    }
    const aProfit = a.projectedProfit ?? Number.NEGATIVE_INFINITY;
    const bProfit = b.projectedProfit ?? Number.NEGATIVE_INFINITY;
    return bProfit - aProfit;
  });
};

export const recommendBestOption = (
  stock: FishStock,
  orders: OrderRecord[],
  commitments: Commitment[]
): ScenarioResult | null => {
  const scenarios = evaluateStockScenarios(stock, orders, commitments).filter((s) => s.feasible);
  if (!scenarios.length) {
    return null;
  }
  return scenarios[0];
};

export const getStrategyCatalog = (): StrategyOption[] => STRATEGIES;
