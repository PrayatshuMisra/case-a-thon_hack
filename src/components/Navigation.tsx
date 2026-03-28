import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Anchor, 
  FileText, 
  ShieldCheck, 
  Settings, 
  Plus, 
  HelpCircle,
  Bell,
  Ship,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'demand', label: 'Demand Capture', icon: BarChart3 },
    { id: 'fisher', label: 'Fisher Studio', icon: Anchor },
    { id: 'loi', label: 'LOI Generator', icon: FileText },
    { id: 'proof', label: 'Proof View', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col p-6 space-y-8 z-40 border-r border-outline-variant/10">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
          <Ship size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary font-manrope leading-tight">LaunchOS</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Maritime Authority</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 transition-all duration-300 rounded-xl font-semibold text-sm",
              activeTab === item.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-200">
        <button onClick={() => setActiveTab('home')} className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2">
          <Plus size={16} />
          <span>New Seafood Drop</span>
        </button>
        <button onClick={() => window.open('https://github.com', '_blank', 'noopener,noreferrer')} className="w-full flex items-center space-x-3 px-4 py-3 mt-4 text-slate-500 hover:bg-slate-100 transition-all duration-300 rounded-xl font-semibold text-sm">
          <HelpCircle size={20} />
          <span>Help Support</span>
        </button>
      </div>
    </aside>
  );
};

export const TopNav = ({ activeTab, onNavigate }: { activeTab: string; onNavigate?: (tab: string) => void }) => {
  const goTo = (tab: string) => {
    onNavigate?.(tab);
  };

  const isInvestorsActive = activeTab === 'proof' || activeTab === 'investors';

  return (
    <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-[0_10px_40px_-10px_rgba(0,30,64,0.06)] border-b border-outline-variant/10">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-black tracking-tighter text-primary uppercase font-manrope">
          Malpe Meen
        </div>
        <div className="hidden md:flex items-center space-x-8 font-manrope tracking-tight font-bold">
          <button onClick={() => goTo('home')} className={cn("transition-colors", activeTab === 'home' ? "text-primary border-b-2 border-primary pb-1" : "text-slate-500 hover:text-primary")}>Studio</button>
          <button onClick={() => goTo('logistics')} className={cn("transition-colors", activeTab === 'logistics' ? "text-primary border-b-2 border-primary pb-1" : "text-slate-500 hover:text-primary")}>Logistics</button>
          <button onClick={() => goTo('dashboard')} className={cn("transition-colors", activeTab === 'dashboard' ? "text-primary border-b-2 border-primary pb-1" : "text-slate-500 hover:text-primary")}>Pilots</button>
          <button onClick={() => goTo('investors')} className={cn("transition-colors", isInvestorsActive ? "text-primary border-b-2 border-primary pb-1" : "text-slate-500 hover:text-primary")}>Investors</button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => goTo('dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
            <Bell size={20} className="text-primary" />
          </button>
          <button onClick={() => goTo('logistics')} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
            <Ship size={20} className="text-primary" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
            <img 
              src="https://picsum.photos/seed/user/100/100" 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
