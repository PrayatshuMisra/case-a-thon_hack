import React, { useEffect, useRef, useState } from 'react';
import { 
  Ship, 
  MapPin, 
  Thermometer, 
  ShieldCheck, 
  ChevronRight, 
  Award, 
  Clock, 
  Package, 
  Truck, 
  Home,
  Waves,
  CheckCircle2,
  AlertCircle,
  Scale,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/api/client';
import { LiveRouteMap, type RoutePoint } from '@/src/components/LiveRouteMap';
import homeBg from "@/src/assets/home-bg.avif";

export const Logistics = ({ onNavigate, orderId }: { onNavigate?: (tab: string) => void; orderId?: string | null }) => {
  const [tracking, setTracking] = useState<any>(null);
  const [info, setInfo] = useState('');
  // How many timeline steps are currently visible (animated reveal)
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) {
      setInfo('No active order selected. Reserve from home to enable live tracking.');
      return;
    }
    api.getTracking(orderId)
      .then((data) => {
        setTracking(data);
        setInfo(`Tracking loaded for order ${orderId.slice(0, 8)}...`);
      })
      .catch(() => setInfo('Unable to fetch tracking details right now.'));
  }, [orderId]);

  const timeline = tracking?.timeline ?? [
    { label: 'Landed at Malpe Harbor', sub: 'Verified landing at MAL-74 Sea King berth.', time: '04:12 AM', done: true },
    { label: 'Quality Hub Inbound', sub: 'Initial grading and freshness assessment complete.', time: '05:45 AM', done: true },
    { label: 'Processing & Packing', sub: 'Cleaned, cut, and vacuum-sealed at 2°C.', time: '08:20 AM', done: true },
    { label: 'Cold-Chain Transit', sub: 'Vehicle MH-04-AX-2912 dispatched to Bangalore.', time: '10:30 AM', current: true },
    { label: 'Urban Hub Arrival', sub: 'Expected arrival at Whitefield Distribution Node.', time: '04:00 AM', pending: true },
  ];

  // Animate timeline steps appearing one by one with 5-7 second gaps
  useEffect(() => {
    setVisibleCount(0);
    let count = 0;
    const total = timeline.length;

    // Show first step after 800ms so the page renders first
    const firstTimeout = setTimeout(() => {
      count = 1;
      setVisibleCount(1);

      if (count < total) {
        // Subsequent steps every 5-7 seconds (randomised)
        const scheduleNext = () => {
          const delay = 5000 + Math.random() * 2000; // 5–7s
          intervalRef.current = setTimeout(() => {
            count += 1;
            setVisibleCount(count);
            
            // Send SMS notification for the new shipment status update
            const nextStep = timeline[count - 1];
            if (nextStep && tracking?.phone) {
              api.sendSms({
                phone: tracking.phone,
                message: `Update on your ${tracking.product_name} order: ${nextStep.label} - ${nextStep.sub || ''}`
              }).catch(console.error);
            }

            if (count < total) scheduleNext();
          }, delay) as unknown as ReturnType<typeof setInterval>;
        };
        scheduleNext();
      }
    }, 800);

    return () => {
      clearTimeout(firstTimeout);
      if (intervalRef.current) clearTimeout(intervalRef.current as unknown as ReturnType<typeof setTimeout>);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.length]);

  const routePointsBase = [
    { lat: 13.3409, lng: 74.7421, label: 'Malpe Harbor', subtitle: 'Catch landed' },
    { lat: 13.0087, lng: 74.7973, label: 'Mangalore Cold Node', subtitle: 'Quality hub' },
    { lat: 12.9092, lng: 75.7928, label: 'Sakleshpur Transit', subtitle: 'Mountain corridor' },
    { lat: 12.9716, lng: 77.5946, label: 'Bangalore Hub', subtitle: 'Urban distribution' },
    { lat: 12.9698, lng: 77.7500, label: tracking?.apartment_name ?? 'Whitefield Community', subtitle: 'Final delivery cluster' },
  ];

  const routePoints: RoutePoint[] = routePointsBase.map((pt, i) => {
    const isPast = i < visibleCount - 1;
    const isCurrent = i === visibleCount - 1;
    return {
      ...pt,
      status: (isPast ? 'done' : isCurrent ? 'current' : 'upcoming') as RoutePoint['status']
    };
  });

  return (
    <div className="relative pb-24">
      {/* Fixed Full Page Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={homeBg}
          alt="Malpe Coast"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 mt-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Logistics Tracking</h2>
            <p className="text-slate-600 text-base font-medium">Real-time supervision of your premium catch from Malpe Harbor.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase">Live Updates Active</span>
            </div>
          </div>
        </header>

        {/* 12-Column Asymmetric Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-0">
          
          {/* ================= LEFT COLUMN (Width: 8/12) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6 relative z-10">
            
            {/* Route Intelligence Map */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Route Intelligence</h3>
                <span className="bg-white/40 px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide text-slate-700 border border-white/20 uppercase">Satellite Sync</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 h-[300px] md:h-[400px]">
                <LiveRouteMap points={routePoints} currentStep={visibleCount} />
              </div>
            </div>

            {/* 3 Mini Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vessel Identity */}
              <div className="p-4 md:p-5 bg-white/40 backdrop-blur-md rounded-xl flex flex-col justify-between shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white/40 text-slate-700 border border-white/20 flex items-center justify-center shrink-0">
                    <Ship size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Vessel Identity</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{tracking?.source_boat ?? 'MAL-74 Sea King'}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Origin Zone</span>
                  <span className="text-slate-700 font-semibold bg-white/40 px-2 py-1 rounded truncate max-w-[100px]">{tracking?.catch_zone ?? 'Malpe Zone A'}</span>
                </div>
              </div>

              {/* Cold Chain */}
              <div className="p-4 md:p-5 bg-white/40 backdrop-blur-md rounded-xl flex flex-col justify-between shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Thermometer size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Thermal Stability</p>
                    <p className="text-xs md:text-sm font-bold text-slate-900 mt-0.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                      {tracking?.cold_chain_maintained ? '2.1°C' : 'Fluctuating'} 
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold",
                        tracking?.cold_chain_maintained ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      )}>
                        {tracking?.cold_chain_maintained ? 'OPTIMAL' : 'AT RISK'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cold Chain</span>
                  <span className={cn(
                    "font-semibold bg-white/40 px-2 py-1 rounded flex items-center gap-1.5",
                    tracking?.cold_chain_maintained ? "text-blue-700" : "text-red-700"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", tracking?.cold_chain_maintained ? "bg-blue-500" : "bg-red-500")}></span>
                    {tracking?.cold_chain_maintained ? 'Protected' : 'Compromised'}
                  </span>
                </div>
              </div>

              {/* Freshness Index */}
              <div className="p-4 md:p-5 bg-white/40 backdrop-blur-md rounded-xl flex flex-col justify-between shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Freshness Index</p>
                    <p className="text-xs md:text-sm font-bold text-slate-900 mt-0.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                      {tracking?.freshness_score ?? 94}/100 
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold">
                        {tracking?.freshness_label ?? 'GRADE A'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Verified by</span>
                  <span className="text-slate-700 font-semibold bg-emerald-100 px-2 py-1 rounded flex items-center gap-1 border border-emerald-100">
                    <ShieldCheck size={12} /> ML Engine v1.2
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 2 Cards (Stream & Insights) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* Live Logistics Stream (Dark Glass) */}
              <div className="bg-slate-950/60 backdrop-blur-lg text-white rounded-2xl p-6 shadow-lg border border-slate-700/50 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-bold tracking-tight mb-5">Live Logistics Stream</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Current Temp', val: tracking?.cold_chain_maintained ? '2.1°C' : '4.8°C', icon: Thermometer, status: tracking?.cold_chain_maintained ? 'Optimal' : 'Checking' },
                      { label: 'Malpe Hub', val: 'Outbound', icon: Package, status: 'Completed' },
                      { label: 'Cold-Chain', val: 'Active', icon: Truck, status: 'In Transit' },
                      { label: 'ETA', val: tracking ? new Date(tracking.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '07:00 AM', icon: Clock, status: 'On Track' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center border border-slate-600/50">
                            <item.icon size={16} className="text-slate-300" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <p className="text-sm font-semibold text-slate-100">{item.val}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest bg-slate-700 px-2 py-1 rounded border border-slate-600 shrink-0">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-slate-800">
                  <button onClick={() => onNavigate?.('proof')} className="w-full py-3 bg-white text-slate-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                    <ShieldCheck size={16} />
                    <span>View Full Proof Logs</span>
                  </button>
                </div>
              </div>

              {/* Vessel Insights */}
              <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Vessel Insights</h3>
                  <div className="relative h-40 rounded-xl overflow-hidden border border-white/20 mb-5 shadow-inner">
                    <img 
                      src="https://picsum.photos/seed/boat/600/400" 
                      alt="Boat" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span className="text-white/90 text-[10px] font-semibold uppercase tracking-wider">Tracking Active</span>
                      </div>
                      <p className="text-white font-bold text-lg tracking-tight">{tracking?.source_boat ?? 'MAL-74 Sea King'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100/50 pb-2.5">
                      <span className="text-slate-500 font-medium text-[11px] uppercase tracking-widest">Captain</span>
                      <span className="text-slate-900 font-bold">K. Manjunath</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100/50 pb-2.5">
                      <span className="text-slate-500 font-medium text-[11px] uppercase tracking-widest">Method</span>
                      <span className="text-slate-900 font-bold">Line Caught</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100/50 pb-2.5">
                      <span className="text-slate-500 font-medium text-[11px] uppercase tracking-widest">Sustainability</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">Verified High</span>
                    </div>
                  </div>
                </div>
                <div className="p-3.5 bg-white/40 rounded-xl flex items-start gap-3 border border-white/20 mt-5 shadow-inner">
                  <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This vessel uses <span className="font-semibold text-slate-700">satellite precision</span> to minimize bycatch and ensure fuel efficiency.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (Sidebar - Width: 4/12) ================= */}
          <div className="lg:col-span-4 flex flex-col h-full relative z-10">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 flex flex-col h-full">
              
              {/* Order Status & Product Banner */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-[10px] md:text-xs font-semibold tracking-wide uppercase mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                  Order Status: In Transit
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-2">Your catch is reserved.</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">
                  {tracking ? `Tracking ${tracking.product_name} for ${tracking.customer_name}. ETA: ${new Date(tracking.eta).toLocaleString()}` : 'Currently being processed at the Malpe Quality Hub. Expected delivery tomorrow by sunrise.'}
                </p>
                
                <div className="bg-white/40 border border-white/20 p-3 md:p-4 rounded-xl flex items-center gap-4 shadow-inner">
                  <img 
                    src="https://picsum.photos/seed/seerfish/200/200" 
                    alt="Catch" 
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover border border-slate-200 bg-white shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Product</p>
                    <p className="text-sm md:text-base font-bold text-slate-900 leading-tight">{tracking?.product_name ?? 'Seer Fish'}</p>
                    <p className="text-[10px] md:text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      <Scale size={12} className="text-slate-400" />
                      {tracking ? `${tracking.quantity_kg}kg • ${tracking.freshness_label}` : '1.2kg • Premium Cut'}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100/50 mb-8" />

              {/* Shipment Journey & Intelligence Audit Container */}
              <div className="flex-1 space-y-8">
                {/* Vertical Timeline */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Shipment Journey</h4>
                    {visibleCount < timeline.length && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/40 text-[9px] font-semibold tracking-wider uppercase text-slate-500 rounded-md border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                        Syncing
                      </span>
                    )}
                  </div>
                  
                  <div className="relative pl-8 space-y-8">
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>
                    
                    {timeline.map((originalStep: any, i: number) => {
                      if (i >= visibleCount) return null;
                      
                      const step = {
                        ...originalStep,
                        done: i < visibleCount - 1,
                        current: i === visibleCount - 1,
                        pending: false,
                      };
                      
                      return (
                        <div key={i} className="relative animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className={cn(
                            "absolute -left-8 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center -ml-[3px] z-10",
                            step.done ? "border-blue-600 bg-blue-600 text-white" : step.current ? "border-blue-600 text-blue-600" : "border-slate-300"
                          )}>
                            {step.done ? <CheckCircle2 size={14} /> : (step.current && <div className="w-2 h-2 rounded-full bg-blue-600"></div>)}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className={cn("text-sm font-bold", step.pending ? "text-slate-400" : "text-slate-900")}>{step.label}</p>
                              <span className="text-[10px] font-bold text-slate-500 bg-white/40 px-2 py-0.5 rounded border border-white/20 shrink-0 whitespace-nowrap">
                                {step.time ?? (step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed pr-4">{step.sub ?? ''}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Placeholder rows */}
                    {timeline.slice(visibleCount).map((_: any, i: number) => (
                      <div key={`placeholder-${i}`} className="relative opacity-40 flex flex-col gap-1">
                        <div className="absolute -left-8 w-6 h-6 rounded-full border-2 border-slate-200 bg-white -ml-[3px] z-10" />
                        <div className="flex justify-between items-start gap-2">
                          <div className="h-4 w-32 bg-slate-200 rounded-md" />
                          <div className="h-4 w-14 bg-slate-100 rounded-md shrink-0" />
                        </div>
                        <div className="h-3 w-48 bg-slate-100 rounded-md mt-1" />
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100/50" />

                {/* Freshness Intelligence Audit */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Intelligence Audit</h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">ML Analysis</span>
                  </div>
                  
                  <div className="space-y-3">
                    {tracking?.freshness_audit?.length > 0 ? (
                      tracking.freshness_audit.map((audit: any, i: number) => (
                        <div key={i} className="bg-white/60 border border-white/40 p-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border text-[10px]",
                              audit.status === 'pass' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                              audit.status === 'warn' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                              {audit.status === 'pass' ? <CheckCircle2 size={16} /> : 
                               audit.status === 'warn' ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{audit.label}</p>
                              <p className="text-xs font-bold text-slate-900">{audit.value}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-[10px] font-black tracking-tight",
                              audit.impact.includes('-') ? "text-amber-600" : "text-emerald-600"
                            )}>{audit.impact}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                        <Loader2 className="animate-spin text-slate-300 mb-2" size={20} />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generating Audit...</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl text-white mt-6 shadow-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Model Reasoning</p>
                    </div>
                    <p className="text-[11px] leading-relaxed font-medium opacity-90 italic">
                      "Catch-to-door timeline and thermal stability indexes suggest maximum protein integrity. No shelf-life warnings detected by ML v1.2."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {info && (
          <div className="px-4 lg:px-0">
             <p className="text-sm font-medium text-slate-500 text-center">{info}</p>
          </div>
        )}
      </div>
    </div>
  );
};