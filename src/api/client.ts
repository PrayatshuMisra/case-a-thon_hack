// When VITE_API_URL is not set, use empty string so /api/* paths go through
// the Vite dev-server proxy (configured in vite.config.ts) which forwards
// them to the FastAPI backend on localhost:8000.
// In production, set VITE_API_URL to the deployed backend URL.
const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LiveDropProduct = {
  product_name: string;
  base_price: number;
  current_price: number;
  freshness_score: number;
  freshness_label: string;
  flash_drop: boolean;
  available_kg: number;
  source_boat: string;
  eta: string;
  apartment_delivery_eta: string;
  timeline: Array<{ label: string; timestamp: string }>;
};

export type DashboardMetrics = {
  kpis: {
    daily_orders: number;
    revenue_captured: number;
    repeat_purchase_proxy: number;
    avg_freshness: number;
    active_fishers: number;
    signed_lois: number;
  };
  charts: {
    orders_over_time: Array<{ name: string; value: number }>;
    apartment_demand_split: Array<{ name: string; value: number }>;
    product_demand_split: Array<{ name: string; value: number }>;
  };
  live_reservations: Array<{
    order_id: string;
    customer_name: string;
    apartment_name: string;
    locality: string;
    product_name: string;
    quantity_kg: number;
    total_amount: number;
    freshness_score: number;
    created_at: string;
  }>;
  traction_summary: {
    avg_basket_value: number;
    apartment_count: number;
    total_kg_reserved: number;
    freshness_avg: number;
  };
  investor_readiness: {
    demand: string;
    supply: string;
    trust: string;
    overall_proof_score: number;
  };
  investor_proof: {
    pilot_status: string;
    total_reservations: number;
    apartment_communities: number;
    average_basket_value: number;
    total_kg_reserved: number;
    top_locality: string;
    fishers_onboarded: number;
    weekly_supply_committed: number;
    avg_catch_per_fisher: number;
    avg_freshness_score: number;
    provenance_visibility: string;
    cold_chain_confidence: string;
    spoilage_prevention: string;
    lois_generated: number;
    buyer_type_mix: Record<string, number>;
    pilot_evidence_strength_score: number;
    readiness: Record<string, string>;
  };
};

export type MlScenarioPrediction = {
  model_version: string;
  feasible_probability: number;
  predicted_profit: number;
  predicted_wastage_pct: number;
  recommended_action: string;
};

export type TomorrowRecommendationArm = {
  arm_id: string;
  locality: string;
  product_name: string;
  channel: string;
  offer: string;
  expected_orders: number;
  expected_gmv: number;
  conversion_probability: number;
  sla_confidence: number;
  confidence_band: string;
  risk_flags: string[];
};

export type TomorrowRecommendation = {
  generated_at: string;
  budget_context_inr: number;
  top_arms: TomorrowRecommendationArm[];
  rationale: string[];
};

export type ExperimentLogResponse = {
  status: string;
  arm_id: string;
  updated_alpha: number;
  updated_beta: number;
  empirical_conversion_rate: number;
  next_best_arm_id: string;
};

export type ModelTractionScoreComponent = {
  name: string;
  score: number;
  label: string;
};

export type ModelTractionScore = {
  generated_at: string;
  traction_score: number;
  components: ModelTractionScoreComponent[];
  notes: string[];
};

export const api = {
  getLiveDrop: () => request<{ products: LiveDropProduct[]; trust_signals: string[] }>('/api/live-drop'),

  reserveOrder: (payload: {
    customer_name: string;
    phone: string;
    apartment_name: string;
    locality: string;
    product_name: string;
    quantity_kg: number;
  }) =>
    request<{
      order_id: string;
      freshness_score: number;
      freshness_label: string;
      price_per_kg: number;
      total_amount: number;
      flash_drop: boolean;
      tracking_url: string;
    }>('/api/reserve-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDashboardMetrics: () => request<DashboardMetrics>('/api/dashboard-metrics'),

  addFisher: (payload: {
    name: string;
    boat_id: string;
    species_focus: string;
    avg_weekly_catch_kg: number;
    commitment_level: string;
    mobile_number?: string;
  }) => request('/api/add-fisher', { method: 'POST', body: JSON.stringify(payload) }),

  getFishers: () => request<Array<any>>('/api/fishers'),

  generateLoi: (payload: {
    buyer_type: string;
    buyer_name: string;
    monthly_volume_kg: number;
    duration_days: number;
    price_note: string;
    delivery_terms: string;
    special_notes?: string;
    status?: string;
  }) => request('/api/generate-loi', { method: 'POST', body: JSON.stringify(payload) }),

  getLois: () => request<Array<any>>('/api/lois'),

  getTracking: (orderId: string) => request<any>(`/api/order-tracking/${orderId}`),

  getTomorrowRecommendation: () => request<TomorrowRecommendation>('/api/recommendation/tomorrow'),

  getModelTractionScore: () => request<ModelTractionScore>('/api/model/traction-score'),

  logExperiment: (payload: {
    arm_id: string;
    locality: string;
    product_name: string;
    channel: string;
    offer: string;
    impressions: number;
    orders: number;
    revenue: number;
  }) => request<ExperimentLogResponse>('/api/experiment/log', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  predictMlScenario: (payload: {
    species: string;
    strategy_id: string;
    freshness_score: number;
    health_score: number;
    available_kg: number;
    forecast_demand_kg: number;
    base_price_per_kg: number;
    cold_chain_maintained: boolean;
  }) => request<MlScenarioPrediction>('/api/ml/predict-scenario', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  sendSms: (payload: {
    phone: string;
    message: string;
  }) => request('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // ── Dynamic Spoilage Re-routing ───────────────────────────
  evaluateSpoilageReroute: (payload: {
    order_id: string;
    species: string;
    catch_time: string;
    arrival_eta: string;
    current_temp_c: number;
    drift_event?: {
      detected_at: string;
      observed_temp_c: number;
      duration_minutes: number;
    } | null;
    delivery_lat?: number;
    delivery_lng?: number;
    quantity_kg?: number;
    original_price_per_kg?: number;
  }) => request<SpoilageRerouteDecision>('/api/spoilage/evaluate-reroute', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  simulateSpoilageScenario: (
    scenario: 'd2c_safe' | 'flash_discount' | 'reroute_restaurant' | 'hold_and_inspect'
  ) => request<SpoilageRerouteDecision & { scenario: string }>(
    `/api/spoilage/simulate/${scenario}`
  ),
};

export type SpoilageRerouteDecision = {
  order_id: string;
  species: string;
  action: 'd2c_safe' | 'flash_discount' | 'reroute_restaurant' | 'hold_and_inspect';
  confidence: number;
  survival_probability_pct: number;
  projected_shelf_life_hours: number;
  hours_to_d2c_eta: number;
  salvage_discount_pct: number;
  restaurant_partner: {
    id: string;
    name: string;
    locality: string;
    lat: number;
    lng: number;
    cuisine: string;
    capacity_kg: number;
    contact: string;
    distance_km: number;
  } | null;
  original_price_per_kg: number;
  salvage_price_per_kg: number;
  rationale: string[];
  drift_severity: 'none' | 'mild' | 'moderate' | 'critical';
  ml_features: Record<string, number | string>;
};
