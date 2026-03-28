import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import PillNav, { type PillNavItem } from './PillNav';
import logo from '@/src/assets/logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type Persona = 'consumer' | 'admin';

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
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white/20 backdrop-blur-xl flex flex-col p-6 space-y-8 z-40 border-r border-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Ship size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary font-manrope leading-tight">LaunchOS</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Maritime Authority</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 transition-all duration-300 rounded-xl font-semibold text-sm",
              activeTab === item.id 
                ? "bg-white/60 backdrop-blur-md text-primary shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] border border-white/50" 
                : "text-slate-600 hover:bg-white/40 hover:shadow-sm"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id ? "text-primary" : "text-slate-500")} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/40">
        <button onClick={() => setActiveTab('dashboard')} className="w-full py-3 px-4 bg-primary/90 backdrop-blur-md text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] hover:bg-primary transition-all flex items-center justify-center gap-2 border border-primary/20">
          <Plus size={16} />
          <span>New Seafood Drop</span>
        </button>
        <button onClick={() => window.open('https://github.com', '_blank', 'noopener,noreferrer')} className="w-full flex items-center space-x-3 px-4 py-3 mt-4 text-slate-600 hover:bg-white/40 transition-all duration-300 rounded-xl font-semibold text-sm">
          <HelpCircle size={20} className="text-slate-500" />
          <span>Help Support</span>
        </button>
      </div>
    </aside>
  );
};

export const TopNav = ({
  activeTab,
  onNavigate,
  persona,
  onPersonaChange,
}: {
  activeTab: string;
  onNavigate?: (tab: string) => void;
  persona: Persona;
  onPersonaChange?: (persona: Persona) => void;
}) => {
  const goTo = (tab: string) => {
    onNavigate?.(tab);
  };

  const navItems: PillNavItem[] =
    persona === 'consumer'
      ? [
          { label: 'Studio', href: '/home', tabKey: 'home' },
          { label: 'Logistics', href: '/logistics', tabKey: 'logistics' },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard', tabKey: 'dashboard' },
          { label: 'Fishers', href: '/fisher', tabKey: 'fisher' },
          { label: 'LOI', href: '/loi', tabKey: 'loi' },
          { label: 'Investors', href: '/investors', tabKey: 'investors' },
        ];

  const currentHref =
    activeTab === 'home'
      ? '/home'
      : activeTab === 'logistics'
      ? '/logistics'
      : activeTab === 'dashboard'
      ? '/dashboard'
      : activeTab === 'proof' || activeTab === 'investors'
      ? '/investors'
      : '/home';

  return (
    <nav className="bg-transparent sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-black tracking-tighter text-primary uppercase font-manrope drop-shadow-sm">
          Malpe Meen
        </div>
        <div className="hidden md:block">
          <PillNav
            logo={logo}
            logoAlt="LaunchOS Logo"
            items={navItems}
            activeHref={currentHref}
            className="custom-nav"
            ease="power2.easeOut"
            baseColor="#001E40"
            pillColor="#ffffff"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#001E40"
            theme="light"
            initialLoadAnimation={false}
            onItemClick={(item) => goTo(item.tabKey ?? 'home')}
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center rounded-full bg-white/30 backdrop-blur-md border border-white/40 p-1 gap-1 shadow-inner">
            <button
              onClick={() => onPersonaChange?.('consumer')}
              className={cn(
                'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                persona === 'consumer' 
                  ? 'bg-white/80 text-primary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]' 
                  : 'text-slate-600 hover:bg-white/40'
              )}
            >
              Buyer
            </button>
            <button
              onClick={() => onPersonaChange?.('admin')}
              className={cn(
                'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                persona === 'admin' 
                  ? 'bg-white/80 text-primary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]' 
                  : 'text-slate-600 hover:bg-white/40'
              )}
            >
              Admin
            </button>
          </div>
          <button onClick={() => goTo(persona === 'admin' ? 'dashboard' : 'home')} className="p-2.5 hover:bg-white/50 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl transition-all shadow-sm">
            <Bell size={18} className="text-primary" />
          </button>
          <button onClick={() => goTo('logistics')} className="p-2.5 hover:bg-white/50 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl transition-all shadow-sm">
            <Ship size={18} className="text-primary" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 shadow-md">
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