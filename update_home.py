import os

file_path = r"c:\Users\Om Raj\Desktop\mm\case-a-thon_hack\src\pages\Home.tsx"

new_content = """import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Ship, Award, ArrowRight, Clock, 
  Thermometer, Truck, MapPin, CheckCircle2, Waves, Radar,
  Anchor
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!videoRef.current) return;
      const scrollY = window.scrollY;
      const parallax = -(scrollY * 0.15);
      const scale = 1.06 + (scrollY * 0.0003);
      videoRef.current.style.transform = `scale(${scale}) translateY(${parallax}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen font-inter selection:bg-white/30 selection:text-white pb-32">
      {/* Background Video layer fixed to the viewport */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#001e40]">
         <video
            ref={videoRef}
            className="ocean-bg-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/ocean-bg.mp4" type="video/mp4" />
          </video>
          {/* Deep dark glass grade over the video for pure contrast */}
          <div className="ocean-bg-grade" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 pt-16 md:pt-32 space-y-32">
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium text-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] mx-auto"
          >
            <ShieldCheck size={18} className="text-[#00e5ff]" />
            Fresh from Malpe. At your apartment by sunrise.
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-manrope font-extrabold tracking-tighter text-white leading-tight drop-shadow-2xl"
          >
            Malpe Meen <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#90efef] to-[#00e5ff] drop-shadow-lg">LaunchOS</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-md"
          >
            Premium, traceable seafood sourced directly from Malpe fishing families and delivered with <strong className="text-white font-semibold">freshness intelligence</strong>.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 pt-6"
          >
             <button className="px-8 py-4 bg-gradient-to-r from-[#00e5ff] to-[#00b3cc] text-[#001e40] rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(0,229,255,0.6)] hover:-translate-y-1 transition-all">
                Reserve Today's Catch
             </button>
             <button className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 hover:-translate-y-1 transition-all">
                Track Active Fleet
             </button>
          </motion.div>
        </section>

        {/* TRUST BANNER - Liquid Glass */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {[
            { icon: Radar, title: "ISRO Powered", desc: "Catch intelligence via INCOIS" },
            { icon: Thermometer, title: "0-Degree Chain", desc: "Monitored transit to your door" },
            { icon: Ship, title: "Direct Source", desc: "From Malpe families, no middlemen" },
            { icon: MapPin, title: "Premium Pilots", desc: "Exclusive Bangalore communities" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-5 text-[#00e5ff] shadow-inner">
                <item.icon size={26} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* PROVENANCE STRIP */}
        <section className="space-y-16 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-white tracking-tight drop-shadow-xl">The Journey to Your Plate</h2>
            <p className="text-white/60 text-xl font-light">Traceable from the absolute moment of catch.</p>
          </div>

          <div className="relative pt-4">
            <div className="absolute top-[2.5rem] left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent hidden md:block" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
              {[
                { time: "05:00 AM", step: "Caught at Sea", icon: Waves },
                { time: "11:30 AM", step: "Landed at Harbour", icon: Anchor },
                { time: "01:00 PM", step: "Sorted & Packed", icon: CheckCircle2 },
                { time: "02:30 PM", step: "Loaded in Cold Truck", icon: Truck },
                { time: "06:00 AM", step: "Arriving at Apartment", icon: MapPin }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className={cn(
                    "w-20 h-20 rounded-[1.5rem] backdrop-blur-3xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300 mb-6",
                    i === 4 ? "bg-[#00e5ff]/20 border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.3)]" : "bg-black/30 border-white/20 text-white/90"
                  )}>
                    <item.icon size={32} />
                  </div>
                  <h4 className="text-white font-semibold text-center mb-1">{item.step}</h4>
                  <p className="text-[#00e5ff] text-sm font-mono tracking-wider">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DAILY CATCH CUBES */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-manrope font-extrabold text-white mb-4 tracking-tighter drop-shadow-xl">Today's Flash Drop</h2>
              <p className="text-white/70 text-xl font-light">Real-time availability from morning landings. Prices dynamically optimized to lock in freshness.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/20 px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
              <div className="p-3 bg-[#00e5ff]/10 rounded-full border border-[#00e5ff]/20 animate-pulse">
                <Clock className="text-[#00e5ff]" size={28} />
              </div>
              <div>
                 <p className="text-xs font-bold uppercase text-white/50 tracking-widest block mb-1">Window Closing</p>
                 <p className="text-3xl font-mono font-bold text-white tracking-tight">02:45:12</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Pure Seer Fish', sci: 'Scomberomorus guttatus', price: '₹349', old: '₹550', score: 94, boat: 'MAL-74', hrs: 3, qty: 42, img: 'seer' },
              { name: 'Silver Pomfret', sci: 'Pampus argenteus', price: '₹429', old: '₹600', score: 96, boat: 'MAL-31', hrs: 2, qty: 18, img: 'pomfret' },
              { name: 'Tiger Prawns', sci: 'Penaeus monodon', price: '₹389', old: '₹450', score: 88, boat: 'MAL-88', hrs: 4, qty: 25, img: 'prawns' },
            ].map((item, i) => (
              <div key={i} className="group relative bg-[#000d1f]/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] hover:border-white/30 transition-all duration-500">
                {/* Image Top */}
                <div className="relative h-72 overflow-hidden bg-[#001e40]">
                  <img src={`https://picsum.photos/seed/${item.img}/800/600`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 mix-blend-luminosity" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000d1f] via-transparent to-transparent opacity-90" />
                  
                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <span className="bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                      Flash Drop
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                    <Ship size={14} className="text-[#00e5ff]"/>
                    <span className="text-sm font-medium">Landed: {item.qty}kg</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-manrope font-bold text-white mb-2">{item.name}</h3>
                      <p className="text-white/50 text-sm font-mono">{item.sci}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm line-through text-white/40 block mb-1">{item.old}</span>
                      <p className="text-3xl font-bold text-white tracking-tighter">{item.price}<span className="text-base font-normal text-white/50">/kg</span></p>
                    </div>
                  </div>

                  {/* Freshness Intelligence */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-white/80 bg-white/5 rounded-2xl px-5 py-4 border border-white/5">
                       <span className="flex items-center gap-2"><Clock size={16} className="text-[#90efef]" /> Caught {item.hrs}h ago</span>
                       <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#90efef]" /> Boat: {item.boat}</span>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-[#00e5ff]/10 flex items-center justify-center border border-[#00e5ff]/30 shadow-inner">
                          <Award size={24} className="text-[#00e5ff]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-[#00e5ff] tracking-widest mb-1">Freshness Score</p>
                          <p className="text-2xl font-bold text-white leading-none">{item.score}<span className="text-lg text-white/40">/100</span></p>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 bg-[#00e5ff]/20 text-[#00e5ff] text-xs font-bold rounded-full uppercase border border-[#00e5ff]/30">Excellent</span>
                    </div>
                  </div>
                  
                  <button className="w-full py-5 rounded-2xl bg-white text-[#001e40] font-bold text-lg hover:bg-[#00e5ff] hover:text-[#001e40] transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2">
                    Reserve Now <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RESERVE FORM - The Ultimate Liquid Glass Panel */}
        <section className="max-w-4xl mx-auto pt-16">
          <div className="bg-[#000a18]/40 backdrop-blur-[40px] border border-white/10 p-10 md:p-16 rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff]/50 to-transparent"></div>
            
            <div className="text-center mb-12">
              <h2 className="text-4xl font-manrope font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">Lock in Your Catch</h2>
              <p className="text-white/60 text-lg font-light">No payment required now. Direct delivery to your apartment by sunrise.</p>
            </div>
            
            <form className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Full Name</label>
                  <input type="text" placeholder="John Doe" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/50 focus:bg-black/40 transition-all font-medium text-lg leading-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Phone</label>
                  <input type="tel" placeholder="+91 98765 43210" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/50 focus:bg-black/40 transition-all font-medium text-lg leading-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Apartment Name</label>
                  <input type="text" placeholder="Sobha Dream Acres" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5ff]/50 focus:bg-black/40 transition-all font-medium text-lg leading-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Locality</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-[#00e5ff]/50 focus:bg-black/40 transition-all font-medium text-lg appearance-none cursor-pointer">
                    <option className="bg-[#001e40] text-white">HSR Layout</option>
                    <option className="bg-[#001e40] text-white">Koramangala</option>
                    <option className="bg-[#001e40] text-white">Indiranagar</option>
                    <option className="bg-[#001e40] text-white">Whitefield</option>
                  </select>
                </div>
              </div>

              <button type="button" className="w-full mt-8 bg-gradient-to-r from-[#00e5ff] to-[#00b3cc] text-[#00142A] font-black text-xl rounded-2xl py-6 hover:shadow-[0_0_50px_rgba(0,229,255,0.4)] transition-all transform hover:-translate-y-1">
                Confirm Reservation
              </button>
              
              <p className="text-center text-sm text-white/40 mt-6 flex items-center justify-center gap-2 font-medium">
                <ShieldCheck size={16} className="text-[#00e5ff]/60" /> Safe, secure, and 100% traceable to source.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Home.tsx updated seamlessly.")
