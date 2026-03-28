const fs = require('fs');
const path = require('path');

const dir = String.raw`c:\Users\Om Raj\Desktop\mm\case-a-thon_hack\src`;

// 1. Rewrite App.tsx to have the video background globally and the right-centered nav
const appTsx = `import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/Navigation';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Logistics } from './pages/Logistics';
import { ProofEngine } from './pages/ProofEngine';
import { FisherStudio } from './pages/FisherStudio';
import { motion, AnimatePresence } from 'motion/react';
import { HomeIcon, Truck, LayoutDashboard, Anchor, ShieldCheck } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!videoRef.current) return;
      const scrollY = window.scrollY;
      const parallax = -(scrollY * 0.15);
      const scale = 1.06 + (scrollY * 0.0003);
      videoRef.current.style.transform = \\\`scale(\${scale}) translateY(\${parallax}px)\\\`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home />;
      case 'dashboard': return <Dashboard />;
      case 'logistics': return <Logistics />;
      case 'proof': return <ProofEngine />;
      case 'fisher':
      case 'loi': return <FisherStudio />;
      default: return <Home />;
    }
  };

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'logistics', icon: Truck, label: 'Logistics' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'fisher', icon: Anchor, label: 'Fisher Studio' },
    { id: 'proof', icon: ShieldCheck, label: 'Proof View' },
  ];

  return (
    <div className="min-h-screen font-inter selection:bg-white/30 selection:text-white">
      {/* GLOBAL BACKGROUND VIDEO */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#001e40]">
         <video ref={videoRef} className="ocean-bg-video" autoPlay muted loop playsInline>
            <source src="/ocean-bg.mp4" type="video/mp4" />
         </video>
         <div className="ocean-bg-grade" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <TopNav />
        
        {/* RIGHT CENTERED FLOATING NAV */}
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 bg-[#000a18]/40 backdrop-blur-3xl border border-white/10 p-3 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={\`p-3 rounded-full transition-all duration-300 flex items-center justify-center \${activeTab === item.id ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)] border border-[#00e5ff]/30 scale-110' : 'text-white/50 hover:text-white hover:bg-white/10 border border-transparent'}\`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </button>
          ))}
        </div>

        <main className="flex-1 pb-24 mr-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
`;
fs.writeFileSync(path.join(dir, 'App.tsx'), appTsx);

// 2. Rewrite Navigation.tsx (just TopNav, transparent glassy)
const navTsx = `import React from 'react';
import { Ship, Bell, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const TopNav = () => {
  return (
    <nav className="w-full relative z-50 px-8 py-6 max-w-[1400px] mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#00b3cc] flex items-center justify-center text-[#001e40] shadow-[0_0_20px_rgba(0,229,255,0.4)]">
          <Ship size={24} />
        </div>
        <div className="text-2xl font-black tracking-tighter text-white uppercase font-manrope drop-shadow-xl flex items-center gap-2">
          Malpe Meen <span className="text-[#00e5ff] font-medium tracking-widest text-xs ml-2 border border-[#00e5ff]/30 rounded-full px-2 py-0.5 bg-[#00e5ff]/10 hidden md:block">OS</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-[#00e5ff] hover:border-[#00e5ff]/50 transition-all backdrop-blur-md">
          <Bell size={18} />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
          <img 
            src="https://picsum.photos/seed/user/100/100" 
            alt="User" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </nav>
  );
};
`;
fs.writeFileSync(path.join(dir, 'components', 'Navigation.tsx'), navTsx);

// 3. Strip Home.tsx video logic as it is now in App.tsx
let homeContent = fs.readFileSync(path.join(dir, 'pages', 'Home.tsx'), 'utf-8');
homeContent = homeContent.replace(
  /\s*{\/\* Background Video layer fixed to the viewport \*\/}[\s\S]*?(<div className="relative z-10 container)/m, 
  "\n      $1"
);
// remove scroll logic
homeContent = homeContent.replace(/const containerRef = useRef<HTMLDivElement>\(null\);\s*const videoRef = useRef<HTMLVideoElement>\(null\);(?:[\s\S]*?)(?=return \()/, "");
homeContent = homeContent.replace(/import React, { useRef, useEffect } from 'react';/, "import React from 'react';");
homeContent = homeContent.replace(/<div ref={containerRef} className="min-h-screen font-inter selection:bg-white\/30 selection:text-white pb-32">/, `<div className="pb-32">`);
// Remove import { motion } if duplicate
fs.writeFileSync(path.join(dir, 'pages', 'Home.tsx'), homeContent);

// 4. Logistics.tsx 
const logisticsTsx = `import React from 'react';
import { Ship, MapPin, Thermometer, ShieldCheck, CheckCircle2, Truck, Package, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const Logistics = () => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-12 px-8 pt-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-manrope drop-shadow-xl">Logistics Intelligence</h2>
          <p className="text-white/60 font-light text-xl">Real-time tracking of your premium catch from Malpe Harbor.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 backdrop-blur-2xl px-5 py-3 rounded-full border border-[#00e5ff]/30 shadow-[0_0_30px_rgba(0,229,255,0.1)] flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-pulse shadow-[0_0_10px_#00e5ff]"></div>
            <span className="text-sm font-bold text-[#00e5ff] uppercase tracking-widest">Live Stream Active</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#000a18]/50 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden">       
            {/* Inner glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/40 to-transparent"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 text-white">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 font-medium text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  In Transit to Bangalore
                </div>
                <h3 className="text-4xl font-bold font-manrope">Shipment #TRK-892</h3>
                <p className="text-white/50 flex items-center gap-2"><MapPin size={18} /> Last seen: Hassan Highway (2h ago)</p>
              </div>
              <div className="text-left md:text-right bg-black/30 p-6 rounded-3xl border border-white/5">
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold mb-1">Estimated Arrival</p>
                <p className="text-4xl font-mono font-black text-[#00e5ff]">06:15 AM</p>
                <p className="text-white/60 mt-1 font-medium text-sm">Ahead of schedule</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[39px] before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
              {[
                { time: '05:30 AM', title: 'Catch Landed', desc: 'Scomberomorus guttatus recorded at Malpe Harbor', icon: Ship, active: true, passed: true },
                { time: '06:45 AM', title: 'Quality Graded & Packed', desc: 'Packed at strictly 2°C with intelligent sensors', icon: ShieldCheck, active: true, passed: true },
                { time: '08:15 AM', title: 'Dispatched in Cold Truck', desc: 'Vehicle KA-19-MC-8822 departed', icon: Truck, active: true, passed: true },
                { time: 'Now', title: 'In Transit', desc: 'Currently near Hassan Highway. Temperature steady at 2.1°C', icon: MapPin, active: true, passed: false, current: true },
                { time: '06:15 AM', title: 'Bangalore Arrival', desc: 'Scheduled delivery to local hub for apartment drops', icon: Package, active: false, passed: false }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex gap-6">
                  <div className={\`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 \${
                    step.current ? 'bg-[#00e5ff] border-[#00e5ff]/30 text-[#001e40] shadow-[0_0_30px_rgba(0,229,255,0.6)]' :
                    step.passed ? 'bg-[#00e5ff]/20 border-transparent text-[#00e5ff]' : 'bg-black/50 border-white/10 text-white/30'
                  }\`}>
                    <step.icon size={20} />
                  </div>
                  <div className="pt-2">
                    <p className={\`text-sm font-mono mb-1 \${step.current ? 'text-[#00e5ff]' : 'text-white/40'}\`}>{step.time}</p>
                    <h4 className={\`text-xl font-bold mb-2 \${step.active ? 'text-white' : 'text-white/40'}\`}>{step.title}</h4>
                    <p className="text-white/60 font-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#000a18]/50 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 text-white shadow-xl">
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-[#00e5ff]/10 text-[#00e5ff] rounded-2xl border border-[#00e5ff]/30"><Thermometer size={24} /></div>
               <h3 className="font-bold text-xl">Thermal Status</h3>
             </div>
             <div className="text-center py-8">
               <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-[#00e5ff]/30 relative mb-4">
                 <div className="absolute inset-2 rounded-full border-4 border-[#00e5ff] border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                 <span className="text-4xl font-extrabold font-mono text-[#00e5ff]">2.1°C</span>
                 <span className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">Optimum</span>
               </div>
               <p className="text-white/60 mt-4 leading-relaxed font-light">Cold chain intact for <strong className="text-white">6h 12m</strong> with zero fluctuations.</p>
             </div>
          </div>
          
          <div className="bg-[#000a18]/50 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 text-white shadow-xl flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Driver Contact</p>
              <p className="text-lg font-bold">Ramesh Kumar</p>
              <p className="text-[#00e5ff] font-mono mt-1">+91 99887 76655</p>
            </div>
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <Clock className="text-white/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(dir, 'pages', 'Logistics.tsx'), logisticsTsx);

// 5. Dashboard.tsx -> liquid glass styling
const dashboardTsx = `import React from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Mon', value: 400 }, { name: 'Tue', value: 300 }, { name: 'Wed', value: 600 },
  { name: 'Thu', value: 400 }, { name: 'Fri', value: 500 }, { name: 'Sat', value: 800 }, { name: 'Sun', value: 700 }
];
const demandData = [
  { name: 'HSR Layout', value: 400 }, { name: 'Indiranagar', value: 300 },
  { name: 'Koramangala', value: 300 }, { name: 'Whitefield', value: 200 }
];
const COLORS = ['#00e5ff', '#00b3cc', '#90efef', '#ffffff'];

export const Dashboard = () => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-10 px-8 pt-8">
      <header className="flex justify-between items-end">
        <div className="space-y-2 text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-manrope drop-shadow-xl">LaunchOS Overview</h2>
          <p className="text-white/60 font-light text-xl">Real-time traction, logistics, and unit economics.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Daily Orders', val: '142', sub: '+12% from yesterday', icon: ShoppingBag, color: 'text-white' },
          { label: 'Revenue Captured', val: '₹48.2k', sub: 'Today\\'s reservations', icon: DollarSign, color: 'text-[#00e5ff]' },
          { label: 'Avg Freshness', val: '93/100', sub: 'Excellent grade', icon: Award, color: 'text-[#90efef]' },
          { label: 'Active Fishers', val: '24', sub: 'Onboarded on platform', icon: Users, color: 'text-white' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#000a18]/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-lg relative overflow-hidden group hover:border-white/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <kpi.icon size={48} className={kpi.color} />
            </div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">{kpi.label}</p>
            <p className={\`text-4xl font-extrabold mb-2 font-mono \${kpi.color}\`}>{kpi.val}</p>
            <p className="text-white/60 text-sm">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#000a18]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Revenue Trajectory</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip contentStyle={{backgroundColor: '#001e40', border:'1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff'}} />
                <Area type="monotone" dataKey="value" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#000a18]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Demand by Locality</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demandData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                  {demandData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#001e40', border:'1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(dir, 'pages', 'Dashboard.tsx'), dashboardTsx);

// 6. ProofEngine.tsx
const proofTsx = `import React from 'react';
import { ShieldCheck, CheckCircle2, FileText, Download } from 'lucide-react';

export const ProofEngine = () => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-12 px-8 pt-8 text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold tracking-tight uppercase shadow-lg">      
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] mr-2 animate-pulse shadow-[0_0_10px_#00e5ff]"></span>
            Pilot Status: Investor-Ready
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-manrope tracking-tighter drop-shadow-xl">
            LaunchOS Proof Engine
          </h1>
          <p className="text-white/60 max-w-2xl leading-relaxed text-xl font-light">     
            A live proof engine for Malpe Meen’s 90-day traction plan. Real-time diligence data for maritime high-value logistics.
          </p>
        </div>
        <div className="bg-[#000a18]/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-xl flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Evidence Strength</p>
            <p className="text-4xl font-black text-[#00e5ff] font-mono tracking-tighter">92<span className="text-xl font-medium text-white/40">/100</span></p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-[#00e5ff]/30 flex items-center justify-center shadow-inner">
            <ShieldCheck className="text-[#00e5ff]" size={32} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-[#000a18]/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10">
            <h3 className="text-2xl font-bold font-manrope mb-8 border-b border-white/10 pb-4">Traction Signals</h3>
            <ul className="space-y-6">
              {[
                { l: 'Demand Capture', v: 'Strong', sub: '2.4k+ active households in Bangalore' },
                { l: 'Supply Activation', v: 'Confirmed', sub: '18 Malpe boats onboarded with LOIs' },
                { l: 'Cold Chain Trust', v: 'Validated', sub: '100% data visibility from catch to drop' }
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <CheckCircle2 className="text-[#00e5ff] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-lg">{item.l}</p>
                    <p className="text-[#00e5ff] font-mono text-sm my-1">{item.v}</p>
                    <p className="text-white/50 text-sm">{item.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
         </div>

         <div className="bg-[#000a18]/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full mx-auto flex items-center justify-center border border-white/10 mb-6">
               <FileText size={32} className="text-[#00e5ff]" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Export Ready Documentation</h3>
            <p className="text-white/60 mb-8 max-w-sm mx-auto">Export credibility built on top of transparent sourcing data and strict temperature controls.</p>
            <button className="bg-gradient-to-r from-[#00e5ff] to-[#00b3cc] text-[#00142A] px-8 py-4 rounded-2xl font-bold text-lg w-full max-w-sm mx-auto flex justify-center items-center gap-2 hover:shadow-[0_0_40px_rgba(0,229,255,0.4)] transition-all">
              <Download size={20} />
              Export Pitch Tear-sheet
            </button>
         </div>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(dir, 'pages', 'ProofEngine.tsx'), proofTsx);

// 7. FisherStudio.tsx
const fisherTsx = `import React, { useState } from 'react';
import { Anchor, Plus, CheckCircle2, Ship, Award } from 'lucide-react';

export const FisherStudio = () => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-12 px-8 pt-8 text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-manrope drop-shadow-xl">Fisher Studio</h2>
          <p className="text-white/60 font-light text-xl">Empowering Malpe fishing families with digital onboarding and institutional proof.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#000a18]/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10">
          <h3 className="text-2xl font-bold font-manrope mb-8">Onboard New Boat</h3>
          <form className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Fisher Name</label>
                <input className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-[#00e5ff]/50 focus:bg-black/40 outline-none" placeholder="e.g. Ramesh K" />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-2">Boat Registration ID</label>
                <input className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-[#00e5ff]/50 focus:bg-black/40 outline-none" placeholder="MAL-88" />
             </div>
             <div className="pt-4">
                <button type="button" className="w-full bg-gradient-to-r from-[#00e5ff] to-[#00b3cc] text-[#00142A] py-5 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all">
                  Register Asset
                </button>
             </div>
          </form>
        </div>

        <div className="space-y-6">
           <h3 className="text-2xl font-bold font-manrope mb-6">Recently Onboarded</h3>
           {[
             { name: 'MAL-74', fisher: 'Suresh B.', species: 'Seer Fish', uplift: '+14%' },
             { name: 'MAL-31', fisher: 'Manoj P.', species: 'Silver Pomfret', uplift: '+22%' }
           ].map((boat, i) => (
             <div key={i} className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5">
                    <Ship className="text-[#00e5ff]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">{boat.name}</h4>
                    <p className="text-white/50 text-sm">Owner: {boat.fisher} • Focus: {boat.species}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-[#00e5ff] tracking-widest mb-1">Income Uplift</p>
                  <p className="text-2xl font-black font-mono">{boat.uplift}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(dir, 'pages', 'FisherStudio.tsx'), fisherTsx);

console.log('Restructured application successfully.');
