const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

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
};
