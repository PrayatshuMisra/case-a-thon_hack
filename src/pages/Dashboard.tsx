import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  DollarSign, 
  Award,
  Download,
  ArrowUpRight
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
import { api, type DashboardMetrics, type TomorrowRecommendation } from '@/src/api/client';
import { LiveRouteMap, type RoutePoint } from '@/src/components/LiveRouteMap';

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

export const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recommendation, setRecommendation] = useState<TomorrowRecommendation | null>(null);
  const [status, setStatus] = useState('');
  const [range, setRange] = useState<'7D' | '30D'>('7D');

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
