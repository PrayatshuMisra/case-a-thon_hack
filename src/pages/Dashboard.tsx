import React from 'react';
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

export const Dashboard = () => {
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

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { label: 'Daily Orders', value: '42', trend: '+12%', color: 'bg-secondary' },
          { label: 'Revenue Captured', value: '₹52,400', sub: 'Awaiting Settlement' },
          { label: 'Repeat Proxy', value: '68%', progress: true },
          { label: 'Freshness Score', value: '94.2', sub: 'Premium Grade', icon: Award },
          { label: 'Active Fishers', value: '14', sub: 'Malpe Harbor Cluster' },
          { label: 'Signed LOIs', value: '6', sub: 'Ready for Studio', alert: true },
        ].map((kpi, i) => (
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
              <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-primary shadow-sm cursor-pointer">7D</span>
              <span className="px-3 py-1 text-[10px] font-bold text-slate-400 cursor-pointer">30D</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-primary">Pilot Localities</h3>
            <span className="text-xs font-bold text-secondary uppercase tracking-tighter">Live Map</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'HSR Layout', count: '1.2k members' },
              { name: 'Koramangala', count: '850 members' },
              { name: 'Indiranagar', count: '2.1k members' },
              { name: 'Whitefield', count: '3.4k members' },
            ].map((loc, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100/50">
                <span className="text-sm font-bold text-primary">{loc.name}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-slate-500">{loc.count}</span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-primary mb-6">Apartment Demand Split</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData}>
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
                  data={productData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {productData.map((item, i) => (
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
          <button className="flex items-center space-x-2 text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg">
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
              {[
                { name: 'Aditya V.', initial: 'AV', apt: 'Sobha Dream', loc: 'Whitefield', prod: 'Seer Fish', qty: '1kg • Fresh Cut', amt: '₹1,240', fresh: '94%', time: '4m ago' },
                { name: 'Priya K.', initial: 'PK', apt: 'Prestige Shantiniketan', loc: 'Whitefield', prod: 'Pomfret', qty: '500g • Whole', amt: '₹860', fresh: '96%', time: '12m ago' },
                { name: 'Rohan N.', initial: 'RN', apt: 'Mantri Alpyne', loc: 'Indiranagar', prod: 'Tiger Prawns', qty: '250g • Deveined', amt: '₹540', fresh: '92%', time: '22m ago' },
              ].map((row, i) => (
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
          <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors">View All Transactions</button>
        </div>
      </section>
    </div>
  );
};
