import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  Anchor, 
  Award, 
  CheckCircle2, 
  Rocket, 
  Truck, 
  TrendingUp, 
  Package, 
  ClipboardCheck,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const ProofEngine = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 bg-secondary-container text-primary rounded-full text-xs font-bold tracking-tight uppercase">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse"></span>
            Pilot Status: Investor-Ready
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-manrope tracking-tighter text-primary">
            LaunchOS Proof Engine
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            A live proof engine for Malpe Meen’s 90-day traction plan. Real-time diligence data for maritime high-value logistics.
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Evidence Strength</p>
            <p className="text-2xl font-black text-secondary">92<span className="text-sm font-medium text-on-surface-variant">/100</span></p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-secondary-container flex items-center justify-center relative">
            <ShieldCheck className="text-secondary" size={24} />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <h3 className="text-xl font-bold font-manrope text-primary">Demand Proof</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Total Reservations</p>
              <p className="text-3xl font-black text-primary">1,240</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Communities</p>
              <p className="text-3xl font-black text-primary">14</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Avg Basket</p>
              <p className="text-3xl font-black text-primary">₹980</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-semibold mb-1">Total Weight</p>
              <p className="text-3xl font-black text-primary">840kg</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Primary Locality Focus</span>
            <span className="px-4 py-1.5 bg-secondary-container text-primary rounded-full text-sm font-bold">Whitefield, Bengaluru</span>
          </div>
        </div>

        <div className="md:col-span-5 bg-primary text-white rounded-[2rem] p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xl font-bold font-manrope">Investor Proof</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-secondary-container font-medium">LOIs Generated</span>
                <span className="text-4xl font-black">6</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold tracking-widest text-secondary-container mb-3">Buyer Type Mix</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">RWA</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">Restaurant</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">Export</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <img key={i} className="w-10 h-10 rounded-full border-2 border-primary object-cover" src={`https://picsum.photos/seed/inv${i}/100/100`} alt="Investor" referrerPolicy="no-referrer" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-secondary-container text-primary flex items-center justify-center text-xs font-bold">+4</div>
            </div>
            <p className="text-xs font-medium text-secondary-container leading-tight">Active institutional interest growing weekly</p>
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container-low rounded-[2rem] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <Anchor size={20} />
              </div>
              <h3 className="text-xl font-bold font-manrope text-primary">Supply Proof</h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              STRONG READINESS
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-primary">14</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-1">Fishers Onboarded</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-primary">3,200kg</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-1">Weekly Supply</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-primary">240kg</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-1">Avg Catch/Fisher</p>
            </div>
          </div>
          <div className="h-32 w-full bg-surface-container-highest rounded-2xl relative overflow-hidden">
            <img className="w-full h-full object-cover opacity-40 mix-blend-multiply" src="https://picsum.photos/seed/harbor/800/400" alt="Harbor" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="md:col-span-6 bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-primary">
              <Award size={20} />
            </div>
            <h3 className="text-xl font-bold font-manrope text-primary">Trust Proof</h3>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Avg Freshness Score', val: '94.2%', icon: Award },
              { label: 'Provenance Visibility', val: '100%', icon: ShieldCheck },
              { label: 'Cold-chain Confidence', val: 'HIGH', badge: true },
              { label: 'Spoilage Reduction', val: '22%', down: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-secondary" />
                  <span className="text-sm font-semibold text-on-surface">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-3 py-1 bg-secondary-container text-primary rounded text-xs font-black">HIGH</span>
                ) : (
                  <span className="text-lg font-black text-primary">
                    {item.val} {item.down && <ArrowDown size={14} className="inline text-secondary" />}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-black font-manrope text-primary mb-8 tracking-tight">System Readiness Scoreboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Launch', icon: Rocket },
            { label: 'Logistics', icon: Truck },
            { label: 'Demand', icon: TrendingUp },
            { label: 'Supply', icon: Package },
            { label: 'Proof', icon: ClipboardCheck },
          ].map((item, i) => (
            <div key={i} className="bg-surface-container-low p-6 rounded-3xl flex flex-col items-center text-center space-y-3 group hover:bg-primary hover:text-white transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center">
                <item.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70">{item.label}</p>
                <p className="font-black text-lg">Ready</p>
              </div>
              <div className="text-[10px] font-bold px-2 py-0.5 bg-secondary-container text-primary rounded group-hover:bg-white/20 group-hover:text-white">STRONG</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-primary-container p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-white">
        <div className="relative z-10">
          <p className="text-secondary-container font-bold text-sm mb-2">Platform Integrity</p>
          <h4 className="text-2xl font-black font-manrope">Diligence-Verified Infrastructure</h4>
        </div>
        <div className="w-full md:w-1/2 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-secondary-container mb-2 uppercase tracking-widest">
            <span>Pilot Phase: 65% Complete</span>
            <span className="text-secondary-container">Target: Day 90 Launch</span>
          </div>
          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-secondary-container" style={{ width: '65%' }}></div>
          </div>
        </div>
      </footer>
    </div>
  );
};
