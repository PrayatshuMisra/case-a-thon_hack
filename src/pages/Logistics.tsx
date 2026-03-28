import React from 'react';
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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Logistics = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Logistics Intelligence</h2>
          <p className="text-on-surface-variant font-medium">Real-time tracking of your premium catch from Malpe Harbor.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Stream Active</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Tracking Card */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,30,64,0.08)] border border-slate-100 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                  Order Status: In Transit
                </div>
                <h3 className="text-4xl font-manrope font-black text-primary">Your catch is reserved.</h3>
                <p className="text-on-surface-variant max-w-md">Currently being processed at the Malpe Quality Hub. Expected delivery tomorrow by 7:00 AM.</p>
              </div>
              <div className="w-full md:w-auto bg-surface-container-low p-6 rounded-3xl flex items-center gap-6">
                <img 
                  src="https://picsum.photos/seed/seerfish/200/200" 
                  alt="Seer Fish" 
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Details</p>
                  <p className="text-xl font-black text-primary">Seer Fish</p>
                  <p className="text-xs font-bold text-secondary">1.2kg • Premium Cut</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                    <Ship size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vessel Identity</p>
                    <p className="text-sm font-black text-primary">MAL-74 Sea King</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                    <span>Landed at Malpe</span>
                    <span className="text-primary">04:12 AM</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center">
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cold Chain</p>
                    <p className="text-sm font-black text-primary">2.4°C <span className="text-[10px] font-bold text-secondary ml-2">OPTIMAL</span></p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                    <span>Last Sync</span>
                    <span className="text-primary">2m ago</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tertiary text-white flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freshness</p>
                    <p className="text-sm font-black text-primary">94/100 <span className="text-[10px] font-bold text-tertiary-container ml-2">GRADE A</span></p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                    <span>Verified by</span>
                    <span className="text-primary">LaunchOS AI</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-lg font-black text-primary font-manrope">Shipment Journey</h4>
              <div className="relative pl-10 space-y-10">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                
                {[
                  { label: 'Landed at Malpe Harbor', sub: 'Verified landing at MAL-74 Sea King berth.', time: '04:12 AM', done: true },
                  { label: 'Quality Hub Inbound', sub: 'Initial grading and freshness assessment complete.', time: '05:45 AM', done: true },
                  { label: 'Processing & Packing', sub: 'Cleaned, cut, and vacuum-sealed at 2°C.', time: '08:20 AM', done: true },
                  { label: 'Cold-Chain Transit', sub: 'Vehicle MH-04-AX-2912 dispatched to Bangalore.', time: '10:30 AM', current: true },
                  { label: 'Urban Hub Arrival', sub: 'Expected arrival at Whitefield Distribution Node.', time: '04:00 AM', pending: true },
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <div className={cn(
                      "absolute -left-10 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                      step.done ? "bg-secondary" : step.current ? "bg-primary animate-pulse" : "bg-slate-200"
                    )}>
                      {step.done && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={cn("text-sm font-black", step.pending ? "text-slate-400" : "text-primary")}>{step.label}</p>
                        <p className="text-xs font-medium text-on-surface-variant mt-1">{step.sub}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side Info Cards */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
            <h3 className="text-xl font-bold font-manrope mb-6">Live Logistics Stream</h3>
            <div className="space-y-6">
              {[
                { label: 'Current Temp', val: '2.4°C', icon: Thermometer, status: 'Optimal' },
                { label: 'Malpe Hub', val: 'Outbound', icon: Package, status: 'Completed' },
                { label: 'Cold-Chain', val: 'Active', icon: Truck, status: 'In Transit' },
                { label: 'ETA', val: '07:00 AM', icon: Clock, status: 'On Track' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <item.icon size={20} className="text-secondary-container" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-black">{item.val}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-secondary-container uppercase">{item.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <button className="w-full py-4 bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                <span>View Full Proof Logs</span>
              </button>
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary opacity-10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold font-manrope text-primary">Vessel Insights</h3>
            <div className="relative h-48 rounded-2xl overflow-hidden">
              <img 
                src="https://picsum.photos/seed/boat/600/400" 
                alt="Boat" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-black text-lg">MAL-74 Sea King</p>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Malpe Harbor Cluster</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Captain</span>
                <span className="text-primary font-bold">K. Manjunath</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Method</span>
                <span className="text-primary font-bold">Line Caught</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sustainability</span>
                <span className="text-secondary font-bold">High (Verified)</span>
              </div>
            </div>
            <div className="p-4 bg-secondary-container rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-primary leading-relaxed">
                This vessel uses satellite-guided precision to minimize bycatch and ensure fuel efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
