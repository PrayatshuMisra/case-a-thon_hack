import React from 'react';
import { 
  Timer, 
  Verified, 
  Waves, 
  Home as HomeIcon, 
  Package, 
  Truck, 
  Sun,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Ship,
  Award,
  Anchor
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Home = () => {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <header className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/malpe/1920/1080" 
            alt="Malpe Coast" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface"></div>
        </div>
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container text-primary font-semibold text-sm">
              <ShieldCheck size={16} />
              Fresh from Malpe. At your apartment by sunrise.
            </div>
            <h1 className="text-6xl md:text-8xl font-manrope font-extrabold tracking-tighter text-primary leading-tight">
              Malpe Meen <span className="text-secondary block">LaunchOS</span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl font-light leading-relaxed">
              Premium, traceable seafood sourced directly from Malpe fishing families and delivered with <span className="font-semibold text-primary">freshness intelligence</span>.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all">
                Reserve Today's Catch
              </button>
              <button className="px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg shadow-sm border border-outline-variant/20 hover:bg-surface-container-low transition-all">
                Track Active Fleet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Daily Catch Section */}
      <section className="container mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-manrope font-extrabold text-primary mb-4 tracking-tight">Today's Flash Drop</h2>
            <p className="text-on-surface-variant text-lg max-w-xl">Real-time availability from the morning landings. Limited quantities prioritized for subscriber apartments.</p>
          </div>
          <div className="bg-secondary-container px-6 py-4 rounded-2xl flex items-center gap-4">
            <Timer className="text-secondary animate-pulse" />
            <div>
              <p className="text-xs font-bold uppercase text-primary opacity-60">Closing in</p>
              <p className="text-xl font-black text-primary">02:45:12</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { name: 'Seer Fish', sci: 'Scomberomorus guttatus', price: '₹949', old: '₹1,200', score: 94, boat: 'MAL-74', img: 'seer' },
            { name: 'Silver Pomfret', sci: 'Pampus argenteus', price: '₹1,199', old: '₹1,450', score: 96, boat: 'MAL-31', img: 'pomfret' },
            { name: 'Tiger Prawns', sci: 'Penaeus monodon', price: '₹649', old: '₹850', score: 92, boat: 'MAL-88', img: 'prawns' },
          ].map((item, i) => (
            <div key={i} className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] hover:translate-y-[-8px] transition-all duration-500">
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${item.img}/600/400`} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-tertiary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Flash Drop</span>
                </div>
                <div className="absolute bottom-4 left-6 flex items-center gap-2 text-white bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                  <Ship size={12} />
                  <span className="text-xs font-medium">Boat ID: {item.boat}</span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-manrope font-bold text-primary">{item.name}</h3>
                    <p className="text-on-surface-variant text-sm">{item.sci}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm line-through text-slate-400">{item.old}</span>
                    <p className="text-2xl font-black text-primary">{item.price}<span className="text-sm font-normal text-on-surface-variant">/kg</span></p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Award size={20} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-secondary">Freshness Score</p>
                      <p className="text-lg font-black text-primary leading-none">{item.score}/100</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-secondary text-white text-[10px] font-bold rounded-full uppercase">Excellent</span>
                </div>
                <button className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors">
                  Reserve Now
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey Section */}
      <section className="bg-primary py-24 text-white overflow-hidden">
        <div className="container mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-manrope font-bold mb-4">Journey of Your Catch</h2>
            <p className="text-secondary-container max-w-2xl mx-auto">From the deep waters of the Arabian Sea to your kitchen in Bangalore, every mile is tracked with cold-chain precision.</p>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2 hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { label: 'Caught at Sea', sub: 'Satellite-guided precision', icon: Waves },
                { label: 'Landed at Malpe', sub: 'Quality graded by Masters', icon: HomeIcon },
                { label: 'Sorted & Packed', sub: 'Individually tracked at 2°C', icon: Package },
                { label: 'Cold Truck Transit', sub: 'Real-time thermal monitoring', icon: Truck },
                { label: 'Bangalore Sunrise', sub: 'Delivered to your doorstep', icon: Sun },
              ].map((step, i) => (
                <div key={i} className="relative z-10 text-center md:text-left">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-xl border-4 border-primary",
                    i === 4 ? "bg-secondary" : "bg-white/20 backdrop-blur-md"
                  )}>
                    <step.icon size={24} />
                  </div>
                  <h4 className="font-bold mb-2">{step.label}</h4>
                  <p className="text-white/60 text-sm">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="flex-1 p-12 lg:p-20">
            <div className="mb-12">
              <h2 className="text-4xl font-manrope font-extrabold text-primary mb-4 tracking-tight">Reserve Your Catch</h2>
              <p className="text-on-surface-variant">Enter your details to secure your priority morning drop. No payment required until fulfillment confirmation.</p>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary ml-1">Full Name</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary ml-1">Phone Number</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6" placeholder="+91 98XXX XXXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary ml-1">Apartment Name</label>
                <input className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6" placeholder="Sobha Windsor" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary ml-1">Locality</label>
                <select className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6">
                  <option>Whitefield</option>
                  <option>Indiranagar</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-8">
                <button className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-xl shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-3">
                  Reserve My Catch
                  <Anchor size={24} />
                </button>
              </div>
            </form>
          </div>
          <div className="w-full lg:w-[40%] bg-primary p-12 lg:p-20 relative flex flex-col justify-end overflow-hidden text-white">
            <img 
              src="https://picsum.photos/seed/seafood/800/1200" 
              alt="Seafood" 
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 space-y-8">
              <div className="glass-effect p-8 rounded-3xl">
                <p className="text-xl italic font-light leading-relaxed">"The transparency is unmatched. Knowing which boat caught my Seer fish makes it taste even better."</p>
                <div className="mt-6">
                  <p className="font-bold">Aditya Verma</p>
                  <p className="text-secondary-container text-sm">Sobha Dream Acres Resident</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-black">2.4k+</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Active Households</p>
                </div>
                <div className="h-10 w-px bg-white/20"></div>
                <div>
                  <p className="text-3xl font-black">4.9/5</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Trust Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
