import React, { useState } from 'react';
import {
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  ArrowRightCircle,
  Store,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  TrendingDown,
  XCircle,
  ChevronRight,
  Loader2,
  FlaskConical,
  Eye,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api, type SpoilageRerouteDecision } from '@/src/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────
type Scenario = 'd2c_safe' | 'flash_discount' | 'reroute_restaurant' | 'hold_and_inspect';

const SCENARIO_META: Record<Scenario, { label: string; description: string; icon: any; tempC: number; color: string }> = {
  d2c_safe: {
    label: 'D2C Safe',
    description: 'Nominal cold-chain. Fish survives delivery.',
    icon: CheckCircle2,
    tempC: 2.1,
    color: 'emerald',
  },
  flash_discount: {
    label: 'Mild Drift',
    description: '5.5°C for 45 min. Borderline survival. Flash discount applied.',
    icon: Zap,
    tempC: 5.5,
    color: 'amber',
  },
  reroute_restaurant: {
    label: 'Critical Drift → Re-route',
    description: '7.8°C for 90 min. D2C not viable. Restaurant partner selected.',
    icon: Store,
    tempC: 7.8,
    color: 'orange',
  },
  hold_and_inspect: {
    label: 'Extreme Drift → Hold',
    description: '12°C for 2h. Inspection required before any action.',
    icon: XCircle,
    tempC: 12.0,
    color: 'rose',
  },
};

// ─── Action badge config ─────────────────────────────────────────────────────
const ACTION_CONFIG = {
  d2c_safe: {
    label: 'D2C Safe — Proceed Normally',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  flash_discount: {
    label: 'Flash Discount Applied (10%)',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: Zap,
    iconColor: 'text-amber-500',
  },
  reroute_restaurant: {
    label: 'Re-routed → Restaurant Partner',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: ArrowRightCircle,
    iconColor: 'text-orange-500',
  },
  hold_and_inspect: {
    label: 'Held for Physical Inspection',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: AlertTriangle,
    iconColor: 'text-rose-500',
  },
};

// ─── Drift severity badge ────────────────────────────────────────────────────
const SEVERITY_BADGE: Record<string, string> = {
  none:     'bg-emerald-100 text-emerald-700',
  mild:     'bg-amber-100 text-amber-700',
  moderate: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
};

// ─── Survival probability arc ────────────────────────────────────────────────
const SurvivalArc: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
      <circle
        cx={50} cy={50} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={50} y={53} textAnchor="middle" fontSize={14} fontWeight={800} fill={color}>
        {pct}%
      </text>
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const SpoilageRerouter: React.FC = () => {
  const [result, setResult] = useState<SpoilageRerouteDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Custom telemetry form
  const [customSpecies, setCustomSpecies] = useState('Seer Fish');
  const [customTemp, setCustomTemp] = useState(6.5);
  const [customDrift, setCustomDrift] = useState(60);
  const [runningCustom, setRunningCustom] = useState(false);

  const runScenario = async (scenario: Scenario) => {
    setLoading(true);
    setError(null);
    setActiveScenario(scenario);
    try {
      const data = await api.simulateSpoilageScenario(scenario);
      setResult(data);
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('Not Found') || msg.includes('404')) {
        setError('ROUTES_NOT_LOADED');
      } else {
        setError(msg || 'Could not connect to the backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  const runCustom = async () => {
    setRunningCustom(true);
    setError(null);
    setActiveScenario(null);
    const now = new Date();
    const catchTime = new Date(now.getTime() - 10 * 3600_000);
    const eta = new Date(now.getTime() + 5 * 3600_000);
    try {
      const data = await api.evaluateSpoilageReroute({
        order_id: 'CUSTOM-DEMO',
        species: customSpecies,
        catch_time: catchTime.toISOString(),
        arrival_eta: eta.toISOString(),
        current_temp_c: customTemp,
        drift_event: customTemp > 4 ? {
          detected_at: new Date(now.getTime() - customDrift * 60_000).toISOString(),
          observed_temp_c: customTemp,
          duration_minutes: customDrift,
        } : null,
        quantity_kg: 1.5,
        original_price_per_kg: 949,
      });
      setResult(data);
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('Not Found') || msg.includes('404')) {
        setError('ROUTES_NOT_LOADED');
      } else {
        setError(msg || 'Could not connect to the backend.');
      }
    } finally {
      setRunningCustom(false);
    }
  };

  const cfg = result ? ACTION_CONFIG[result.action] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0">
            <Thermometer size={20} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">
              Dynamic Spoilage Re-routing
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ML-powered cold-chain drift detection · Q10 decay kinetics · Revenue salvage engine
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ─── Left: Scenario Picker + Custom Telemetry ─── */}
        <div className="xl:col-span-4 space-y-6">

          {/* Pre-built scenarios */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Simulation Scenarios
            </p>
            {(Object.entries(SCENARIO_META) as [Scenario, typeof SCENARIO_META[Scenario]][]).map(([key, meta]) => {
              const Icon = meta.icon;
              const isActive = activeScenario === key && !loading;
              return (
                <button
                  key={key}
                  onClick={() => runScenario(key)}
                  disabled={loading}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    isActive
                      ? `border-${meta.color}-200 bg-${meta.color}-50`
                      : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      `bg-${meta.color}-100`
                    )}>
                      <Icon size={16} className={`text-${meta.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-primary truncate">{meta.label}</p>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{meta.description}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 shrink-0 tabular-nums">
                      {meta.tempC}°C
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom telemetry */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical size={14} className="text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Custom Telemetry
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Fish Species
                </label>
                <select 
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-primary rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors"
                >
                  <option value="Seer Fish">Seer Fish</option>
                  <option value="Pomfret">Pomfret</option>
                  <option value="Prawns">Prawns</option>
                  <option value="Mackerel">Mackerel</option>
                  <option value="Squid">Squid</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Temperature: <span className="text-primary font-black">{customTemp}°C</span>
                </label>
                <input
                  type="range" min={0} max={15} step={0.1}
                  value={customTemp}
                  onChange={e => setCustomTemp(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                  <span>0°C</span><span className="text-emerald-600">Safe ≤ 4°C</span><span>15°C</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Drift duration: <span className="text-primary font-black">{customDrift} min</span>
                </label>
                <input
                  type="range" min={0} max={180} step={5}
                  value={customDrift}
                  onChange={e => setCustomDrift(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                  <span>0 min</span><span>3 hours</span>
                </div>
              </div>
              <button
                onClick={runCustom}
                disabled={runningCustom}
                className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center gap-2"
              >
                {runningCustom ? <><Loader2 size={14} className="animate-spin" /> Running ML Engine...</> : <><Eye size={14} /> Evaluate Now</>}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Right: Result Panel ─── */}
        <div className="xl:col-span-8">
          {loading && (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm gap-4">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-sm font-bold text-slate-500">Running ML Decision Engine...</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Q10 kinetics · Sigmoid survival model · Haversine routing</p>
            </div>
          )}

          {error && !loading && (
            error === 'ROUTES_NOT_LOADED' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shrink-0">
                    <RefreshCw size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-800">Backend needs a restart</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      The backend is running but the new spoilage routes weren't loaded — uvicorn's hot-reload doesn't pick up <strong>new</strong> files automatically.
                    </p>
                  </div>
                </div>
                <div className="bg-amber-900 rounded-xl p-4 space-y-2">
                  <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest">Fix: stop the backend and restart it</p>
                  <code className="block text-xs text-amber-100 font-mono">cd backend</code>
                  <code className="block text-xs text-amber-100 font-mono">uvicorn app.main:app --reload</code>
                </div>
                <p className="text-[10px] text-amber-600">After restarting, click any scenario again — it will work immediately.</p>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
                <XCircle size={24} className="text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-rose-700">Engine Offline</p>
                <p className="text-xs text-rose-600">{error}</p>
                <div className="mt-2 bg-slate-900 rounded-xl p-3 text-left">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Start the backend</p>
                  <code className="text-xs text-emerald-400 font-mono">cd backend && uvicorn app.main:app --reload</code>
                </div>
              </div>
            )
          )}


          {!loading && !error && !result && (
            <div className="h-96 flex flex-col items-center justify-center bg-white/60 rounded-2xl border border-slate-100 border-dashed gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <Thermometer size={28} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">Select a scenario or set custom telemetry</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest">ML engine will evaluate the cold-chain drift</p>
            </div>
          )}

          {!loading && result && cfg && (
            <div className="space-y-5">
              {/* Action Banner */}
              <div className={cn(
                'rounded-2xl border p-5 flex items-center gap-4',
                cfg.bg, cfg.border
              )}>
                <div className={cn('w-12 h-12 rounded-xl bg-white flex items-center justify-center border shadow-sm shrink-0', cfg.border)}>
                  <cfg.icon size={22} className={cfg.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-black uppercase tracking-widest flex items-center gap-1.5', cfg.text)}>
                    <span>ML Decision</span>
                    <span className="opacity-50">&bull;</span>
                    <span>{result.species}</span>
                  </p>
                  <p className={cn('text-lg font-black mt-0.5', cfg.text)}>{cfg.label}</p>
                </div>
                <div className={cn('text-right shrink-0')}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confidence</p>
                  <p className={cn('text-2xl font-black', cfg.text)}>{Math.round(result.confidence * 100)}%</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Survival probability */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center justify-center shadow-sm gap-2">
                  <SurvivalArc pct={result.survival_probability_pct} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">
                    Survival Probability
                  </p>
                </div>

                {/* Shelf life */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Shelf Life Left</p>
                  <p className="text-3xl font-black text-primary">{result.projected_shelf_life_hours}<span className="text-sm text-slate-400 font-normal">h</span></p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={10} className="text-slate-400" />
                    <p className="text-[9px] text-slate-500">{result.hours_to_d2c_eta}h to ETA</p>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', result.projected_shelf_life_hours > result.hours_to_d2c_eta ? 'bg-emerald-500' : 'bg-rose-500')}
                      style={{ width: `${Math.min(100, (result.projected_shelf_life_hours / 36) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Drift severity */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Drift Severity</p>
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase', SEVERITY_BADGE[result.drift_severity])}>
                    {result.drift_severity}
                  </span>
                  <p className="text-2xl font-black text-primary mt-2 tabular-nums">
                    {result.ml_features.drift_temp_c}°C
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">{result.ml_features.drift_duration_min} min</p>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Revenue Action</p>
                  {result.salvage_discount_pct > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <TrendingDown size={14} className="text-rose-500" />
                        <span className="text-xs font-black text-rose-600">−{result.salvage_discount_pct}% Salvage</span>
                      </div>
                      <p className="text-xl font-black text-primary mt-1">₹{result.salvage_price_per_kg}<span className="text-xs text-slate-400">/kg</span></p>
                      <p className="text-[9px] text-slate-400 line-through mt-0.5">₹{result.original_price_per_kg}/kg</p>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} className="text-emerald-500 mb-1" />
                      <p className="text-xl font-black text-primary">₹{result.original_price_per_kg}<span className="text-xs text-slate-400">/kg</span></p>
                      <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Full price retained</p>
                    </>
                  )}
                </div>
              </div>

              {/* Restaurant Partner Card */}
              {result.restaurant_partner && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                      <Store size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Emergency Re-route Destination</p>
                      <p className="text-lg font-black text-orange-900">{result.restaurant_partner.name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black">Distance</p>
                      <p className="text-xl font-black text-orange-700">{result.restaurant_partner.distance_km} km</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Locality', value: result.restaurant_partner.locality },
                      { label: 'Cuisine', value: result.restaurant_partner.cuisine },
                      { label: 'Capacity', value: `${result.restaurant_partner.capacity_kg} kg` },
                      { label: 'Contact', value: result.restaurant_partner.contact },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/60 rounded-xl p-3 border border-orange-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">{label}</p>
                        <p className="text-xs font-bold text-orange-900 mt-0.5 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ML Rationale */}
              <div className="bg-primary rounded-2xl p-5 text-white space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw size={14} className="text-secondary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">ML Rationale</p>
                </div>
                {result.rationale.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <ChevronRight size={12} className="text-secondary shrink-0 mt-0.5" />
                    <p className="text-xs text-white/80 leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>

              {/* ML Features raw */}
              <details className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  Raw ML Feature Vector
                </summary>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {Object.entries(result.ml_features).map(([k, v]) => (
                    <div key={k} className="bg-white rounded-xl border border-slate-100 p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-black text-primary mt-1">{typeof v === 'number' ? v.toFixed(2) : v}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
