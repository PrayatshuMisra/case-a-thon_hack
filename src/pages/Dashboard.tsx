import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  DollarSign, 
  Award,
  Download,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { api, type DashboardMetrics, type MlScenarioPrediction, type TomorrowRecommendation } from '@/src/api/client';
import { LiveRouteMap, type RoutePoint } from '@/src/components/LiveRouteMap';
import { generatePilotGroqInsight } from '@/src/lib/groq';
import {
  evaluateStockScenarios,
  getStrategyCatalog,
  recommendBestOption,
  type Commitment,
  type FishStock,
  type OrderRecord,
} from '@/src/ml/pilot_decision_engine';

const data = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 400 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 800 },
  { name: 'Sun', value: 700 },
];

const demandData = [
  { name: 'HSR', value: 120 },
  { name: 'KRM', value: 85 },
  { name: 'IND', value: 210 },
  { name: 'WHT', value: 180 },
];

const productData = [
  { name: 'Seer Fish', value: 48, color: '#001e40' },
  { name: 'Pomfret', value: 32, color: '#006a6a' },
  { name: 'Prawns', value: 20, color: '#611b00' },
];

const PROCESSING_OPTION_IDS = ['pickling', 'drying_salting', 'minced_products', 'fish_silage', 'fishmeal', 'collagen', 'chitosan', 'fertilizer'] as const;

const formatCurrency = (value: number): string => `₹${Math.round(value).toLocaleString('en-IN')}`;
const formatNullableCurrency = (value: number | null | undefined): string => (value == null ? 'N/A' : formatCurrency(value));

export const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recommendation, setRecommendation] = useState<TomorrowRecommendation | null>(null);
  const [status, setStatus] = useState('');
  const [range, setRange] = useState<'7D' | '30D'>('7D');
  const [selectedStockId, setSelectedStockId] = useState('stock-seer');
  const [selectedOptionId, setSelectedOptionId] = useState('premium_fresh');
  const [selectedRecoveryPlanId, setSelectedRecoveryPlanId] = useState('');
  const [implementedMix, setImplementedMix] = useState<{ stockId: string; baseOptionId: string; recoveryId: string; appliedAt: string } | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MlScenarioPrediction | null>(null);
  const [mlPredictionError, setMlPredictionError] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    api.getDashboardMetrics().then(setMetrics).catch(() => setStatus('Live metrics unavailable. Showing fallback values.'));
    api.getTomorrowRecommendation().then(setRecommendation).catch(() => setStatus('ML recommendations unavailable.'));
  }, []);

  const logTopArmExperiment = async () => {
    const top = recommendation?.top_arms?.[0];
    if (!top) {
      setStatus('No recommendation arm available to log.');
      return;
    }
    try {
      const impressions = 100;
      const orders = Math.max(1, Math.round(top.conversion_probability * impressions));
      const revenue = Number((orders * (top.expected_gmv / Math.max(top.expected_orders, 1))).toFixed(2));
      const result = await api.logExperiment({
        arm_id: top.arm_id,
        locality: top.locality,
        product_name: top.product_name,
        channel: top.channel,
        offer: top.offer,
        impressions,
        orders,
        revenue,
      });
      setStatus(`Experiment logged. Next best arm: ${result.next_best_arm_id}`);
    } catch {
      setStatus('Failed to log experiment.');
    }
  };

  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        { label: 'Daily Orders', value: '42', trend: '+12%', color: 'bg-secondary' },
        { label: 'Revenue Captured', value: '₹52,400', sub: 'Awaiting Settlement' },
        { label: 'Repeat Proxy', value: '68%', progress: true },
        { label: 'Freshness Score', value: '94.2', sub: 'Premium Grade', icon: Award },
        { label: 'Active Fishers', value: '14', sub: 'Malpe Harbor Cluster' },
        { label: 'Signed LOIs', value: '6', sub: 'Ready for Studio', alert: true },
      ];
    }
    return [
      { label: 'Daily Orders', value: String(metrics.kpis.daily_orders), trend: '+Live', color: 'bg-secondary' },
      { label: 'Revenue Captured', value: `₹${metrics.kpis.revenue_captured}`, sub: 'Awaiting Settlement' },
      { label: 'Repeat Proxy', value: `${metrics.kpis.repeat_purchase_proxy}%`, progress: true },
      { label: 'Freshness Score', value: String(metrics.kpis.avg_freshness), sub: 'Premium Grade', icon: Award },
      { label: 'Active Fishers', value: String(metrics.kpis.active_fishers), sub: 'Malpe Harbor Cluster' },
      { label: 'Signed LOIs', value: String(metrics.kpis.signed_lois), sub: 'Ready for Studio', alert: true },
    ];
  }, [metrics]);

  const areaData = range === '7D' ? (metrics?.charts.orders_over_time ?? data) : [...(metrics?.charts.orders_over_time ?? data), ...(metrics?.charts.orders_over_time ?? data), ...(metrics?.charts.orders_over_time ?? data), ...(metrics?.charts.orders_over_time ?? data).slice(0, 2)];
  const apartmentDemandData = metrics?.charts.apartment_demand_split ?? demandData;
  const productDemandData = (metrics?.charts.product_demand_split ?? productData).map((item, idx) => ({ ...item, color: (item as any).color ?? productData[idx % productData.length].color }));

  const localityPoints: RoutePoint[] = [
    { lat: 13.3409, lng: 74.7421, label: 'Malpe Harbor', subtitle: 'Source Cluster', status: 'done' },
    { lat: 12.9716, lng: 77.5946, label: 'Bangalore Urban Hub', subtitle: 'Central Dispatch', status: 'current' },
    { lat: 12.9352, lng: 77.6245, label: 'HSR Layout', subtitle: 'High demand zone', status: 'upcoming' },
    { lat: 12.9698, lng: 77.7500, label: 'Whitefield', subtitle: 'Subscriber towers', status: 'upcoming' },
  ];

  const currentStocks: FishStock[] = [
    {
      id: 'stock-seer',
      species: 'Seer Fish',
      availableKg: 42,
      freshnessScore: 92,
      healthScore: 93,
      basePricePerKg: 349,
      coldChainMaintained: true,
    },
    {
      id: 'stock-pomfret',
      species: 'Pomfret',
      availableKg: 30,
      freshnessScore: 86,
      healthScore: 88,
      basePricePerKg: 429,
      coldChainMaintained: true,
    },
    {
      id: 'stock-prawns',
      species: 'Prawns',
      availableKg: 24,
      freshnessScore: 64,
      healthScore: 71,
      basePricePerKg: 389,
      coldChainMaintained: false,
    },
    {
      id: 'stock-sardine',
      species: 'Sardine',
      availableKg: 38,
      freshnessScore: 54,
      healthScore: 67,
      basePricePerKg: 189,
      coldChainMaintained: false,
    },
  ];

  const commitments: Commitment[] = [
    {
      id: 'c1',
      buyerName: 'Sobha Dream Acres Tower Committee',
      buyerType: 'Customer',
      species: 'Seer Fish',
      dailyQtyKg: 14,
      agreedPricePerKg: 352,
      priority: 'High',
    },
    {
      id: 'c2',
      buyerName: 'Coastal Leaf Bistro',
      buyerType: 'Restaurant',
      species: 'Pomfret',
      dailyQtyKg: 8,
      agreedPricePerKg: 438,
      priority: 'High',
    },
    {
      id: 'c3',
      buyerName: 'Marina Spice Kitchens',
      buyerType: 'Restaurant',
      species: 'Prawns',
      dailyQtyKg: 6,
      agreedPricePerKg: 396,
      priority: 'Medium',
    },
    {
      id: 'c4',
      buyerName: 'Weekly Community Subscription Pool',
      buyerType: 'Customer',
      species: 'Sardine',
      dailyQtyKg: 10,
      agreedPricePerKg: 178,
      priority: 'Medium',
    },
  ];

  const fallbackOrders: OrderRecord[] = [
    { orderId: 'MM-1001', species: 'Seer Fish', quantityKg: 2, pricePerKg: 349, buyerType: 'Customer', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1002', species: 'Seer Fish', quantityKg: 1.5, pricePerKg: 344, buyerType: 'Restaurant', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1003', species: 'Pomfret', quantityKg: 2.2, pricePerKg: 430, buyerType: 'Customer', createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1004', species: 'Prawns', quantityKg: 1.4, pricePerKg: 372, buyerType: 'Restaurant', createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1005', species: 'Sardine', quantityKg: 3.5, pricePerKg: 172, buyerType: 'Customer', createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1006', species: 'Prawns', quantityKg: 2.1, pricePerKg: 359, buyerType: 'Customer', createdAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString() },
    { orderId: 'MM-1007', species: 'Seer Fish', quantityKg: 1.9, pricePerKg: 351, buyerType: 'Restaurant', createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() },
  ];

  const orderHistory: OrderRecord[] = useMemo(() => {
    if (!metrics?.live_reservations?.length) {
      return fallbackOrders;
    }
    return metrics.live_reservations.map((row) => ({
      orderId: row.order_id,
      species: (['Seer Fish', 'Pomfret', 'Prawns', 'Sardine'].includes(row.product_name) ? row.product_name : 'Seer Fish') as FishStock['species'],
      quantityKg: row.quantity_kg,
      pricePerKg: row.total_amount / Math.max(row.quantity_kg, 1),
      buyerType: 'Customer',
      createdAt: row.created_at,
    }));
  }, [metrics]);

  const selectedStock = useMemo(() => currentStocks.find((item) => item.id === selectedStockId) ?? currentStocks[0], [selectedStockId]);

  const strategyCatalog = useMemo(() => getStrategyCatalog(), []);

  const selectedStockScenarios = useMemo(
    () => evaluateStockScenarios(selectedStock, orderHistory, commitments),
    [selectedStock, orderHistory]
  );

  const selectedScenario = useMemo(
    () => selectedStockScenarios.find((s) => s.option.id === selectedOptionId) ?? selectedStockScenarios[0],
    [selectedStockScenarios, selectedOptionId]
  );

  const bestScenario = useMemo(
    () => recommendBestOption(selectedStock, orderHistory, commitments),
    [selectedStock, orderHistory]
  );

  const inventorySnapshot = useMemo(() => {
    return currentStocks.map((stock) => {
      const best = recommendBestOption(stock, orderHistory, commitments);
      const impliedPricePerKg = best && best.projectedRevenue != null && best.fulfillmentKg > 0
        ? Math.round(best.projectedRevenue / best.fulfillmentKg)
        : stock.basePricePerKg;
      return {
        ...stock,
        bestOption: best?.option.label ?? 'Manual review',
        forecastDemandKg: best?.forecastDemandKg ?? 0,
        projectedWastagePct: best?.wastagePercentage ?? 100,
        impliedPricePerKg,
      };
    });
  }, [orderHistory]);

  const fishSourceMeta = useMemo(
    () => ({
      'stock-seer': { fisher: 'Raghav Poojary', boat: 'MALPE-07', landedAt: '05:30 AM', zone: 'Deep Sea Grid 4' },
      'stock-pomfret': { fisher: 'Suhas Naik', boat: 'MALPE-11', landedAt: '05:50 AM', zone: 'Outer Reef Belt' },
      'stock-prawns': { fisher: 'Naveen Kunder', boat: 'MALPE-03', landedAt: '06:20 AM', zone: 'Shelf Edge Zone' },
      'stock-sardine': { fisher: 'Prasad Bangera', boat: 'MALPE-15', landedAt: '06:35 AM', zone: 'Nearshore Ring 2' },
    }),
    []
  );

  const commitmentDemandKg = useMemo(
    () => commitments.filter((c) => c.species === selectedStock.species).reduce((acc, c) => acc + c.dailyQtyKg, 0),
    [selectedStock]
  );

  const scenarioInsights = useMemo(() => {
    if (!selectedScenario || !selectedScenario.feasible) {
      return {
        confidenceScore: 0,
        commitmentCoveragePct: 0,
        demandGapKg: selectedScenario?.forecastDemandKg ?? 0,
      };
    }
    const option = selectedScenario.option;
    const freshnessCenter = (option.minFreshness + option.maxFreshness) / 2;
    const freshnessSpread = Math.max((option.maxFreshness - option.minFreshness) / 2, 1);
    const freshnessFit = Math.max(0, 1 - Math.abs(selectedStock.freshnessScore - freshnessCenter) / freshnessSpread);
    const healthFactor = Math.min(1, selectedStock.healthScore / 100);
    const coldChainFactor = selectedStock.coldChainMaintained ? 1 : 0.7;
    const confidenceScore = Math.round((freshnessFit * 0.45 + healthFactor * 0.35 + coldChainFactor * 0.2) * 100);

    const commitmentCoveragePct = commitmentDemandKg > 0
      ? Math.min(100, (selectedScenario.fulfillmentKg / commitmentDemandKg) * 100)
      : 100;
    const demandGapKg = Math.max(0, selectedScenario.forecastDemandKg - selectedScenario.fulfillmentKg);

    return {
      confidenceScore,
      commitmentCoveragePct,
      demandGapKg,
    };
  }, [selectedScenario, selectedStock, commitmentDemandKg]);

  const wasteReductionSuggestions = useMemo(() => {
    if (!selectedScenario) {
      return [] as Array<{
        id: string;
        label: string;
        recoveredKg: number;
        residualWastagePct: number;
        additionalRevenue: number;
        additionalCost: number;
        additionalProfit: number;
        totalProfitAfterSwitch: number;
      }>;
    }

    const leftoverKg = selectedScenario.wastageKg;
    if (leftoverKg <= 0) {
      return [];
    }

    const qualityBoost = 1 + (selectedStock.healthScore - 80) / 200;
    const coldChainBoost = selectedStock.coldChainMaintained ? 1.03 : 0.94;
    const baseProfit = selectedScenario.projectedProfit ?? 0;

    return strategyCatalog
      .filter((option) => PROCESSING_OPTION_IDS.includes(option.id as (typeof PROCESSING_OPTION_IDS)[number]))
      .filter((option) => !option.applicableSpecies || option.applicableSpecies.includes(selectedStock.species))
      .map((option) => {
        const recoveredKg = leftoverKg * option.yieldRatio;
        const residualWastageKg = leftoverKg * (1 - option.yieldRatio);
        const residualWastagePct = selectedStock.availableKg > 0
          ? Math.round((residualWastageKg / selectedStock.availableKg) * 1000) / 10
          : 0;

        const processPrice = selectedStock.basePricePerKg * option.priceMultiplier * qualityBoost * coldChainBoost * 0.92;
        const additionalRevenue = recoveredKg * processPrice;
        const additionalCost = leftoverKg * option.processingCostPerKg + leftoverKg * selectedStock.basePricePerKg * 0.08;
        const additionalProfit = additionalRevenue - additionalCost;

        return {
          id: option.id,
          label: option.label,
          recoveredKg,
          residualWastagePct,
          additionalRevenue,
          additionalCost,
          additionalProfit,
          totalProfitAfterSwitch: baseProfit + additionalProfit,
        };
      })
      .sort((a, b) => b.totalProfitAfterSwitch - a.totalProfitAfterSwitch)
      .slice(0, 3);
  }, [selectedScenario, selectedStock, strategyCatalog]);

  const selectedRecoveryPlan = useMemo(
    () => wasteReductionSuggestions.find((s) => s.id === selectedRecoveryPlanId) ?? wasteReductionSuggestions[0],
    [wasteReductionSuggestions, selectedRecoveryPlanId]
  );

  const blendedPlanView = useMemo(() => {
    if (!selectedScenario || !selectedRecoveryPlan) {
      return null;
    }

    const baseRevenue = selectedScenario.projectedRevenue ?? 0;
    const baseCost = selectedScenario.projectedCost ?? 0;
    const baseProfit = selectedScenario.projectedProfit ?? 0;
    const blendedRevenue = baseRevenue + selectedRecoveryPlan.additionalRevenue;
    const blendedCost = baseCost + selectedRecoveryPlan.additionalCost;
    const blendedProfit = baseProfit + selectedRecoveryPlan.additionalProfit;
    return {
      blendedRevenue,
      blendedCost,
      blendedProfit,
      blendedWastagePct: selectedRecoveryPlan.residualWastagePct,
      recoveredKg: selectedRecoveryPlan.recoveredKg,
      upliftVsBase: selectedRecoveryPlan.additionalProfit,
    };
  }, [selectedScenario, selectedRecoveryPlan]);

  const isImplementedMixActive = useMemo(() => {
    if (!implementedMix) {
      return false;
    }
    return (
      implementedMix.stockId === selectedStockId &&
      implementedMix.baseOptionId === selectedOptionId &&
      implementedMix.recoveryId === (selectedRecoveryPlan?.id ?? '')
    );
  }, [implementedMix, selectedStockId, selectedOptionId, selectedRecoveryPlan]);

  const activeScenarioView = useMemo(() => {
    if (!selectedScenario) {
      return null;
    }
    if (isImplementedMixActive && blendedPlanView) {
      return {
        forecastDemandKg: selectedScenario.forecastDemandKg,
        projectedRevenue: blendedPlanView.blendedRevenue,
        projectedCost: blendedPlanView.blendedCost,
        projectedProfit: blendedPlanView.blendedProfit,
        unmetCommitmentKg: selectedScenario.unmetCommitmentKg,
        wastagePercentage: blendedPlanView.blendedWastagePct,
      };
    }
    return {
      forecastDemandKg: selectedScenario.forecastDemandKg,
      projectedRevenue: selectedScenario.projectedRevenue,
      projectedCost: selectedScenario.projectedCost,
      projectedProfit: selectedScenario.projectedProfit,
      unmetCommitmentKg: selectedScenario.unmetCommitmentKg,
      wastagePercentage: selectedScenario.wastagePercentage,
    };
  }, [selectedScenario, isImplementedMixActive, blendedPlanView]);

  const scenarioViewForDisplay = useMemo(() => {
    if (!activeScenarioView) {
      return null;
    }
    if (isImplementedMixActive) {
      return activeScenarioView;
    }
    if (!mlPrediction) {
      return activeScenarioView;
    }
    return {
      ...activeScenarioView,
      projectedProfit: mlPrediction.predicted_profit,
      wastagePercentage: mlPrediction.predicted_wastage_pct,
    };
  }, [activeScenarioView, isImplementedMixActive, mlPrediction]);

  useEffect(() => {
    if (selectedStockScenarios.length) {
      setSelectedOptionId(selectedStockScenarios[0].option.id);
    }
  }, [selectedStockId]);

  useEffect(() => {
    setSelectedRecoveryPlanId('');
    setImplementedMix(null);
  }, [selectedStockId, selectedOptionId]);

  useEffect(() => {
    setAiInsight('');
    setAiError('');
  }, [selectedStockId, selectedOptionId]);

  useEffect(() => {
    if (!selectedScenario) {
      setMlPrediction(null);
      setMlPredictionError('');
      return;
    }

    let cancelled = false;

    api
      .predictMlScenario({
        species: selectedStock.species,
        strategy_id: selectedScenario.option.id,
        freshness_score: selectedStock.freshnessScore,
        health_score: selectedStock.healthScore,
        available_kg: selectedStock.availableKg,
        forecast_demand_kg: selectedScenario.forecastDemandKg,
        base_price_per_kg: selectedStock.basePricePerKg,
        cold_chain_maintained: selectedStock.coldChainMaintained,
      })
      .then((pred) => {
        if (cancelled) return;
        setMlPrediction(pred);
        setMlPredictionError('');
      })
      .catch(() => {
        if (cancelled) return;
        setMlPrediction(null);
        setMlPredictionError('Trained model service unavailable. Showing local fallback logic.');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStockId, selectedOptionId, selectedScenario]);

  const requestAiInsight = async () => {
    if (!selectedScenario) {
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const text = await generatePilotGroqInsight({
        species: selectedStock.species,
        freshnessScore: selectedStock.freshnessScore,
        healthScore: selectedStock.healthScore,
        availableKg: selectedStock.availableKg,
        selectedOption: selectedScenario.option.label,
        feasible: selectedScenario.feasible,
        forecastDemandKg: activeScenarioView?.forecastDemandKg ?? selectedScenario.forecastDemandKg,
        fulfillmentKg: selectedScenario.fulfillmentKg,
        projectedRevenue: activeScenarioView?.projectedRevenue ?? selectedScenario.projectedRevenue,
        projectedCost: activeScenarioView?.projectedCost ?? selectedScenario.projectedCost,
        projectedProfit: activeScenarioView?.projectedProfit ?? selectedScenario.projectedProfit,
        wastageKg: selectedScenario.wastageKg,
        wastagePercentage: activeScenarioView?.wastagePercentage ?? selectedScenario.wastagePercentage,
        unmetCommitmentKg: selectedScenario.unmetCommitmentKg,
        bestOption: bestScenario?.option.label ?? 'No feasible option',
        bestOptionProfit: bestScenario?.projectedProfit ?? null,
        notes: selectedScenario.notes,
        alternatives: selectedStockScenarios.slice(0, 4).map((scenario) => ({
          option: scenario.option.label,
          feasible: scenario.feasible,
          projectedProfit: scenario.projectedProfit,
        })),
      });
      setAiInsight(text);
    } catch (error: any) {
      setAiError(error?.message ?? 'Unable to generate AI insight right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const exportLogs = () => {
    const payload = JSON.stringify(metrics ?? { fallback: true }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'launchos-dashboard-logs.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Dashboard logs exported.');
  };
  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Operational Intelligence</h2>
          <p className="text-on-surface-variant font-medium">Monitoring the bridge between Malpe and Bangalore's communities.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</p>
            <p className="text-sm font-semibold text-secondary flex items-center justify-end">
              <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse"></span>
              Live Nodes Active
            </p>
          </div>
          <img 
            src="https://picsum.photos/seed/admin/100/100" 
            alt="Admin" 
            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <section className="premium-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">ML Decision Engine</p>
            <h3 className="text-xl font-black text-primary mt-1">Tomorrow Recommendation</h3>
            <p className="text-sm text-on-surface-variant mt-1">Highest expected GMV arm under current freshness/SLA constraints.</p>
          </div>
          <button onClick={logTopArmExperiment} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
            Log Pilot Experiment
          </button>
        </div>

        {recommendation?.top_arms?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {recommendation.top_arms.map((arm) => (
              <div key={arm.arm_id} className="rounded-2xl border border-outline-variant/30 bg-white p-4">
                <p className="text-xs font-black text-secondary uppercase tracking-widest">{arm.confidence_band} Confidence</p>
                <h4 className="text-lg font-black text-primary mt-1">{arm.locality} • {arm.product_name}</h4>
                <p className="text-xs text-slate-500 mt-1">{arm.channel} • {arm.offer}</p>
                <div className="mt-3 space-y-1 text-sm font-semibold text-primary">
                  <p>Expected Orders: {arm.expected_orders}</p>
                  <p>Expected GMV: ₹{arm.expected_gmv}</p>
                  <p>SLA Confidence: {Math.round(arm.sla_confidence * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-4">No recommendation data available yet.</p>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-primary">{kpi.value}</span>
              {kpi.trend && <span className="text-xs font-bold text-secondary">{kpi.trend}</span>}
            </div>
            {kpi.progress && (
              <div className="flex space-x-1">
                <span className="w-full h-1 bg-secondary rounded-full"></span>
                <span className="w-full h-1 bg-secondary rounded-full"></span>
                <span className="w-1/2 h-1 bg-surface-container-low rounded-full"></span>
              </div>
            )}
            {kpi.sub && (
              <p className={cn("text-[10px] font-bold", kpi.alert ? "text-tertiary-container" : "text-slate-400")}>
                {kpi.icon && <kpi.icon size={12} className="inline mr-1" />}
                {kpi.sub}
              </p>
            )}
            {kpi.color && !kpi.progress && (
              <div className="h-1 bg-surface-container-low rounded-full overflow-hidden">
                <div className={cn("h-full w-3/4", kpi.color)}></div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-surface-container-low rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-primary">Volume Trajectory</h3>
            <div className="flex space-x-2">
              <button onClick={() => setRange('7D')} className={cn("px-3 py-1 rounded-full text-[10px] font-bold shadow-sm cursor-pointer", range === '7D' ? 'bg-white text-primary' : 'text-slate-400')}>7D</button>
              <button onClick={() => setRange('30D')} className={cn("px-3 py-1 rounded-full text-[10px] font-bold shadow-sm cursor-pointer", range === '30D' ? 'bg-white text-primary' : 'text-slate-400')}>30D</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006a6a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#006a6a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                  dy={10}
                />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#006a6a" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-primary text-white rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6">Investor Readiness</h3>
            <div className="space-y-6">
              {[
                { label: 'Market Demand', status: 'Strong', val: 85, color: 'bg-secondary-container' },
                { label: 'Supply Velocity', status: 'Strong', val: 90, color: 'bg-secondary-container' },
                { label: 'Community Trust', status: 'Moderate', val: 65, color: 'bg-orange-400' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="uppercase tracking-widest opacity-60">{item.label}</span>
                    <span className="text-secondary-container">{item.status}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Proof Score</p>
              <p className="text-4xl font-black italic">86<span className="text-xl font-normal opacity-50">/100</span></p>
            </div>
            <Award size={48} className="opacity-20" />
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary-container opacity-10 rounded-full blur-3xl"></div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="premium-card premium-hover p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-primary">Pilot Localities</h3>
            <span className="text-xs font-bold text-secondary uppercase tracking-tighter">Live Map</span>
          </div>
          <LiveRouteMap points={localityPoints} className="mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'HSR Layout', count: '1.2k members' },
              { name: 'Koramangala', count: '850 members' },
              { name: 'Indiranagar', count: '2.1k members' },
              { name: 'Whitefield', count: '3.4k members' },
            ].map((loc, i) => (
              <div key={i} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <p className="text-sm font-bold text-primary">{loc.name}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{loc.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-primary mb-6">Apartment Demand Split</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apartmentDemandData}>
                <Bar dataKey="value" fill="#003366" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-primary mb-6">Product Demand</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productDemandData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productDemandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {productDemandData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span> 
                  {item.name}
                </div>
                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-primary">Current Fish Availability & Freshness</h3>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Live Freshness Desk</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-3 pr-4">Species</th>
                  <th className="py-3 pr-4">Available</th>
                  <th className="py-3 pr-4">Freshness</th>
                  <th className="py-3 pr-4">Health</th>
                  <th className="py-3 pr-4">Cold Chain</th>
                  <th className="py-3 text-right">Recommended Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentStocks.map((stock) => {
                  const recommended = recommendBestOption(stock, orderHistory, commitments);
                  return (
                    <tr key={stock.id} className="hover:bg-surface-container-low cursor-pointer" onClick={() => setSelectedStockId(stock.id)}>
                      <td className="py-4 pr-4 text-sm font-bold text-primary">{stock.species}</td>
                      <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{stock.availableKg}kg</td>
                      <td className="py-4 pr-4">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-black',
                          stock.freshnessScore >= 85 ? 'bg-emerald-100 text-emerald-700' : stock.freshnessScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        )}>
                          {stock.freshnessScore}/100
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{stock.healthScore}/100</td>
                      <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{stock.coldChainMaintained ? 'Intact' : 'Broken'}</td>
                      <td className="py-4 text-right text-[11px] font-black text-primary">{recommended?.option.label ?? 'Inspect manually'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-primary">Current Orders & Daily Commitments</h3>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Operations</span>
          </div>
          <div className="space-y-4 mb-6">
            {commitments.map((commitment) => (
              <div key={commitment.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-primary">{commitment.buyerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{commitment.buyerType} • {commitment.species}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-1 rounded-full font-black uppercase', commitment.priority === 'High' ? 'bg-rose-100 text-rose-700' : commitment.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700')}>
                    {commitment.priority}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold text-slate-600">
                  <span>Daily {commitment.dailyQtyKg}kg</span>
                  <span>{formatCurrency(commitment.agreedPricePerKg)}/kg</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-primary text-white">
            <p className="text-[10px] uppercase tracking-widest font-black opacity-70">Current Orders (Last 24h)</p>
            <p className="text-2xl font-black mt-1">{orderHistory.filter((o) => Date.now() - new Date(o.createdAt).getTime() <= 24 * 60 * 60 * 1000).length} orders</p>
            <p className="text-xs opacity-80 mt-1">Auto-fed into demand model for next-cycle production planning.</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-primary">All Available Fishes (Quantity, Price, Freshness, Wastage)</h3>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">Market Sheet</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="py-3 pr-4">Fish</th>
                <th className="py-3 pr-4">Available Qty</th>
                <th className="py-3 pr-4">Base Price</th>
                <th className="py-3 pr-4">Recommended Price</th>
                <th className="py-3 pr-4">Freshness</th>
                <th className="py-3 pr-4">Forecast Demand</th>
                <th className="py-3 pr-4">Projected Wastage</th>
                <th className="py-3">Best Option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventorySnapshot.map((fish) => (
                <tr key={fish.id} className="text-sm hover:bg-surface-container-low">
                  <td className="py-3 pr-4 font-bold text-primary">{fish.species}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{fish.availableKg}kg</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{formatCurrency(fish.basePricePerKg)}/kg</td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{formatCurrency(fish.impliedPricePerKg)}/kg</td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-black',
                      fish.freshnessScore >= 85 ? 'bg-emerald-100 text-emerald-700' : fish.freshnessScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    )}>
                      {fish.freshnessScore}/100
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-700">{fish.forecastDemandKg.toFixed(1)}kg</td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-black',
                      fish.projectedWastagePct <= 10 ? 'bg-emerald-100 text-emerald-700' : fish.projectedWastagePct <= 25 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    )}>
                      {fish.projectedWastagePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-xs font-bold text-primary">{fish.bestOption}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-primary">Fish Source Detail Cards</h3>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Per Fish View</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {inventorySnapshot.map((fish) => {
            const meta = fishSourceMeta[fish.id as keyof typeof fishSourceMeta];
            return (
              <div key={fish.id} className="rounded-xl border border-slate-200 bg-surface-container-low p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">{fish.species}</p>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-[10px] font-black',
                    fish.freshnessScore >= 85 ? 'bg-emerald-100 text-emerald-700' : fish.freshnessScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  )}>
                    {fish.freshnessScore}/100
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-700">Fisher:</span> {meta?.fisher ?? 'Unknown'}</p>
                  <p><span className="font-semibold text-slate-700">Boat:</span> {meta?.boat ?? 'Unknown'}</p>
                  <p><span className="font-semibold text-slate-700">Landing:</span> {meta?.landedAt ?? '--'}</p>
                  <p><span className="font-semibold text-slate-700">Zone:</span> {meta?.zone ?? '--'}</p>
                  <p><span className="font-semibold text-slate-700">Stock:</span> {fish.availableKg}kg</p>
                  <p><span className="font-semibold text-slate-700">Base:</span> {formatCurrency(fish.basePricePerKg)}/kg</p>
                  <p><span className="font-semibold text-slate-700">Recommended:</span> {formatCurrency(fish.impliedPricePerKg)}/kg</p>
                  <p><span className="font-semibold text-slate-700">Projected Wastage:</span> {fish.projectedWastagePct.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <span>Freshness</span>
                      <span>{fish.freshnessScore}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={cn('h-full', fish.freshnessScore >= 85 ? 'bg-emerald-500' : fish.freshnessScore >= 70 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${fish.freshnessScore}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      <span>Projected Wastage</span>
                      <span>{fish.projectedWastagePct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={cn('h-full', fish.projectedWastagePct <= 10 ? 'bg-emerald-500' : fish.projectedWastagePct <= 25 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${Math.min(100, fish.projectedWastagePct)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Best Option</p>
                  <p className="text-xs font-bold text-primary mt-1">{fish.bestOption}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-primary">Pilot Decision Engine (Fish.docx Strategy Model)</h3>
            <p className="text-sm text-slate-500 mt-1">Compares Premium, Flash Drop, Pickling, Drying, Silage, Fishmeal, Collagen, Chitosan, and Fertilizer paths by forecast demand and projected profit.</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedStockId}
              onChange={(e) => setSelectedStockId(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-primary bg-white"
            >
              {currentStocks.map((stock) => (
                <option key={stock.id} value={stock.id}>{stock.species} ({stock.freshnessScore}/100)</option>
              ))}
            </select>
            <select
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-primary bg-white"
            >
              {strategyCatalog.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forecast Demand</p>
            <p className="text-2xl font-black text-primary mt-1">{scenarioViewForDisplay?.forecastDemandKg.toFixed(1) ?? '0.0'}kg</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projected Revenue</p>
            <p className="text-2xl font-black text-primary mt-1">{formatNullableCurrency(scenarioViewForDisplay?.projectedRevenue)}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projected Profit</p>
            <p className={cn('text-2xl font-black mt-1', (scenarioViewForDisplay?.projectedProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {scenarioViewForDisplay?.projectedProfit == null ? 'N/A' : formatCurrency(scenarioViewForDisplay.projectedProfit)}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commitment Risk</p>
            <p className={cn('text-2xl font-black mt-1', (scenarioViewForDisplay?.unmetCommitmentKg ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600')}>
              {(scenarioViewForDisplay?.unmetCommitmentKg ?? 0).toFixed(1)}kg
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wastage</p>
            <p className={cn('text-2xl font-black mt-1', (scenarioViewForDisplay?.wastagePercentage ?? 100) <= 10 ? 'text-emerald-600' : (scenarioViewForDisplay?.wastagePercentage ?? 100) <= 25 ? 'text-amber-600' : 'text-rose-600')}>
              {scenarioViewForDisplay ? `${scenarioViewForDisplay.wastagePercentage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-xs font-semibold text-slate-600">
            {mlPrediction
              ? `Trained Model Active (${mlPrediction.model_version}) • Feasibility ${Math.round(mlPrediction.feasible_probability * 100)}% • ${mlPrediction.recommended_action}`
              : mlPredictionError || 'Model status pending...'}
          </p>
          {isImplementedMixActive && <span className="text-[10px] font-black uppercase tracking-widest text-primary">Using Implemented Mix Override</span>}
        </div>

        {bestScenario && (
          <div className="p-4 rounded-xl bg-primary text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Best Action</p>
              <p className="text-lg font-black mt-1">
                {selectedStock.species}: {isImplementedMixActive && selectedRecoveryPlan ? `${selectedScenario?.option.label} + ${selectedRecoveryPlan.label}` : bestScenario.option.label}
              </p>
              <p className="text-xs opacity-80 mt-1">{bestScenario.notes}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Expected Profit</p>
              <p className="text-2xl font-black mt-1">{formatNullableCurrency(scenarioViewForDisplay?.projectedProfit ?? bestScenario.projectedProfit)}</p>
            </div>
          </div>
        )}

        {isImplementedMixActive && selectedRecoveryPlan && (
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-sm font-bold">
              Implemented Mix Active: {selectedScenario?.option.label} + {selectedRecoveryPlan.label}
            </p>
            <button
              type="button"
              onClick={() => setImplementedMix(null)}
              className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-white border border-emerald-300 hover:bg-emerald-100"
            >
              Clear Implementation
            </button>
          </div>
        )}

        {selectedScenario && selectedScenario.wastagePercentage > 10 && wasteReductionSuggestions.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Waste Reduction Planner</p>
              <p className="text-sm mt-1">
                Current strategy leaves <strong>{selectedScenario.wastageKg.toFixed(1)}kg ({selectedScenario.wastagePercentage.toFixed(1)}%)</strong> unutilized.
                Use one of these secondary processing paths to reduce waste and improve margin.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {wasteReductionSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRecoveryPlanId(item.id)}
                  className={cn(
                    'rounded-lg bg-white border p-3 text-left transition-all',
                    selectedRecoveryPlan?.id === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-amber-200 hover:border-amber-300'
                  )}
                >
                  <p className="text-xs font-black text-primary uppercase tracking-widest">{item.label}</p>
                  <p className="text-xs text-slate-600 mt-2">Recovered Output: <strong>{item.recoveredKg.toFixed(1)}kg</strong></p>
                  <p className="text-xs text-slate-600">Residual Wastage: <strong>{item.residualWastagePct.toFixed(1)}%</strong></p>
                  <p className="text-xs text-slate-600">Added Profit: <strong>{formatCurrency(item.additionalProfit)}</strong></p>
                  <p className="text-xs text-slate-600">Total Profit After Mix: <strong>{formatCurrency(item.totalProfitAfterSwitch)}</strong></p>
                </button>
              ))}
            </div>
            {blendedPlanView && (
              <div className="p-3 rounded-lg bg-primary text-white grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 font-black">Selected Recovery Plan</p>
                  <p className="text-sm font-black mt-1">{selectedRecoveryPlan?.label}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 font-black">Waste After Mix</p>
                  <p className="text-sm font-black mt-1">{blendedPlanView.blendedWastagePct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 font-black">Recovered Quantity</p>
                  <p className="text-sm font-black mt-1">{blendedPlanView.recoveredKg.toFixed(1)}kg</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 font-black">Profit After Mix</p>
                  <p className="text-sm font-black mt-1">{formatCurrency(blendedPlanView.blendedProfit)} ({formatCurrency(blendedPlanView.upliftVsBase)} uplift)</p>
                </div>
              </div>
            )}
            {blendedPlanView && selectedRecoveryPlan && (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setImplementedMix({
                      stockId: selectedStockId,
                      baseOptionId: selectedOptionId,
                      recoveryId: selectedRecoveryPlan.id,
                      appliedAt: new Date().toISOString(),
                    })
                  }
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90"
                >
                  Implement Selected Mix
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decision Confidence</p>
            <p className={cn('text-2xl font-black mt-1', scenarioInsights.confidenceScore >= 75 ? 'text-emerald-600' : scenarioInsights.confidenceScore >= 50 ? 'text-amber-600' : 'text-rose-600')}>
              {selectedScenario?.feasible ? `${scenarioInsights.confidenceScore}/100` : 'Low'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Based on freshness-fit, fish health, and cold-chain integrity.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commitment Coverage</p>
            <p className={cn('text-2xl font-black mt-1', scenarioInsights.commitmentCoveragePct >= 95 ? 'text-emerald-600' : scenarioInsights.commitmentCoveragePct >= 75 ? 'text-amber-600' : 'text-rose-600')}>
              {selectedScenario?.feasible ? `${scenarioInsights.commitmentCoveragePct.toFixed(0)}%` : '0%'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Coverage against today’s apartment + restaurant commitments.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Demand Gap</p>
            <p className={cn('text-2xl font-black mt-1', scenarioInsights.demandGapKg <= 0.5 ? 'text-emerald-600' : scenarioInsights.demandGapKg <= 4 ? 'text-amber-600' : 'text-rose-600')}>
              {selectedScenario?.feasible ? `${scenarioInsights.demandGapKg.toFixed(1)}kg` : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Predicted demand not fulfilled under selected strategy.</p>
          </div>
        </div>

        {!selectedScenario?.feasible && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
            <p className="text-xs font-black uppercase tracking-widest">Why This Option Shows N/A</p>
            <p className="text-sm mt-1">{selectedScenario?.notes}</p>
            <p className="text-xs mt-1">Pick a feasible option for this fish stock, or choose a different stock profile from the first dropdown.</p>
          </div>
        )}

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Groq AI Decision Insight</p>
              <p className="text-sm text-slate-600 mt-1">Generates plain-language action guidance from the selected strategy scenario.</p>
            </div>
            <button
              type="button"
              onClick={requestAiInsight}
              disabled={aiLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors',
                aiLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'
              )}
            >
              {aiLoading ? 'Generating...' : 'Generate AI Insight'}
            </button>
          </div>
          {aiError && <p className="mt-3 text-xs font-semibold text-rose-600">{aiError}</p>}
          {aiInsight && (
            <div className="mt-3 rounded-lg bg-surface-container-low p-3 border border-outline-variant/20">
              <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="py-3 pr-3">Option</th>
                <th className="py-3 pr-3">Feasible</th>
                <th className="py-3 pr-3">Fulfillment</th>
                <th className="py-3 pr-3">Wastage %</th>
                <th className="py-3 pr-3">Revenue</th>
                <th className="py-3 pr-3">Cost</th>
                <th className="py-3 pr-3">Profit</th>
                <th className="py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedStockScenarios.map((scenario) => (
                <tr key={scenario.option.id} className={cn('text-sm', scenario.option.id === bestScenario?.option.id ? 'bg-emerald-50/60' : '')}>
                  <td className="py-3 pr-3 font-bold text-primary">{scenario.option.label}</td>
                  <td className="py-3 pr-3">
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-black uppercase', scenario.feasible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {scenario.feasible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-700 font-semibold">{scenario.fulfillmentKg.toFixed(1)}kg</td>
                  <td className="py-3 pr-3 text-slate-700 font-semibold">{scenario.wastagePercentage.toFixed(1)}%</td>
                  <td className="py-3 pr-3 text-slate-700 font-semibold">{formatNullableCurrency(scenario.projectedRevenue)}</td>
                  <td className="py-3 pr-3 text-slate-700 font-semibold">{formatNullableCurrency(scenario.projectedCost)}</td>
                  <td className={cn('py-3 pr-3 font-black', (scenario.projectedProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {scenario.projectedProfit == null ? 'N/A' : formatCurrency(scenario.projectedProfit)}
                  </td>
                  <td className="py-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      {scenario.unmetCommitmentKg > 0 && <AlertTriangle size={12} className="text-amber-500" />}
                      <span>{scenario.notes}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] overflow-hidden">
        <div className="p-8 flex justify-between items-center bg-surface-container-low/50">
          <h3 className="text-xl font-bold text-primary">Live Reservations Feed</h3>
          <button onClick={exportLogs} className="flex items-center space-x-2 text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg">
            <Download size={14} />
            <span>Export Logs</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low/30">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Apartment / Locality</th>
                <th className="px-8 py-4">Product / Qty</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4 text-center">Freshness</th>
                <th className="px-8 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(metrics?.live_reservations?.length ? metrics.live_reservations.map((row) => ({
                name: row.customer_name,
                initial: row.customer_name.split(' ').map((p) => p[0]).slice(0, 2).join(''),
                apt: row.apartment_name,
                loc: row.locality,
                prod: row.product_name,
                qty: `${row.quantity_kg}kg`,
                amt: `₹${row.total_amount}`,
                fresh: `${Math.round(row.freshness_score)}%`,
                time: new Date(row.created_at).toLocaleString(),
              })) : [
                { name: 'Aditya V.', initial: 'AV', apt: 'Sobha Dream', loc: 'Whitefield', prod: 'Seer Fish', qty: '1kg • Fresh Cut', amt: '₹1,240', fresh: '94%', time: '4m ago' },
                { name: 'Priya K.', initial: 'PK', apt: 'Prestige Shantiniketan', loc: 'Whitefield', prod: 'Pomfret', qty: '500g • Whole', amt: '₹860', fresh: '96%', time: '12m ago' },
                { name: 'Rohan N.', initial: 'RN', apt: 'Mantri Alpyne', loc: 'Indiranagar', prod: 'Tiger Prawns', qty: '250g • Deveined', amt: '₹540', fresh: '92%', time: '22m ago' },
              ]).map((row, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">{row.initial}</div>
                      <span className="text-sm font-bold text-primary">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-primary">{row.apt}</p>
                    <p className="text-[10px] font-medium text-slate-400">{row.loc}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-primary">{row.prod}</p>
                    <p className="text-[10px] font-bold text-secondary">{row.qty}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-primary">{row.amt}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-secondary-container text-primary rounded-full text-[10px] font-black">{row.fresh}</span>
                  </td>
                  <td className="px-8 py-5 text-right text-xs font-bold text-slate-400">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 text-center border-t border-slate-50">
          <button onClick={() => onNavigate?.('proof')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors">View All Transactions</button>
        </div>
      </section>
      {status && <p className="text-sm font-semibold text-primary">{status}</p>}
    </div>
  );
};
