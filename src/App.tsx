/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sidebar, TopNav } from './components/Navigation';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Logistics } from './pages/Logistics';
import { ProofEngine } from './pages/ProofEngine';
import { FisherStudio } from './pages/FisherStudio';
import { DemandCapture } from './pages/DemandCapture';
import { Settings } from './pages/Settings';
import { motion, AnimatePresence } from 'motion/react';

type Persona = 'consumer' | 'admin';

const TAB_TO_PATH: Record<string, string> = {
  home: '/home',
  logistics: '/logistics',
  dashboard: '/dashboard',
  demand: '/demand',
  fisher: '/fisher',
  loi: '/loi',
  proof: '/investors',
  investors: '/investors',
  settings: '/settings',
};

const PATH_TO_TAB: Record<string, string> = {
  '/': 'home',
  '/home': 'home',
  '/logistics': 'logistics',
  '/dashboard': 'dashboard',
  '/demand': 'demand',
  '/fisher': 'fisher',
  '/loi': 'loi',
  '/investors': 'investors',
  '/settings': 'settings',
};

const TABS_BY_PERSONA: Record<Persona, string[]> = {
  consumer: ['home', 'logistics'],
  admin: ['dashboard', 'demand', 'fisher', 'loi', 'proof', 'investors', 'settings', 'logistics'],
};

const App = () => {
  const [persona, setPersona] = useState<Persona>(() => (localStorage.getItem('persona') as Persona) || 'consumer');
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromPath = PATH_TO_TAB[window.location.pathname];
    if (tabFromPath) return tabFromPath;
    const savedPersona = (localStorage.getItem('persona') as Persona) || 'consumer';
    return savedPersona === 'admin' ? 'dashboard' : 'home';
  });
  const [latestOrderId, setLatestOrderId] = useState<string | null>(() => localStorage.getItem('latest_order_id'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applyHistory = (tab: string, mode: 'push' | 'replace' = 'push') => {
    const path = TAB_TO_PATH[tab] ?? '/home';
    if (window.location.pathname === path) return;
    if (mode === 'replace') {
      window.history.replaceState({ tab }, '', path);
    } else {
      window.history.pushState({ tab }, '', path);
    }
  };

  useEffect(() => {
    if (!TABS_BY_PERSONA[persona].includes(activeTab)) {
      const fallback = persona === 'admin' ? 'dashboard' : 'home';
      setActiveTab(fallback);
      applyHistory(fallback, 'replace');
    }
  }, [persona, activeTab]);

  useEffect(() => {
    const onPopState = () => {
      const fromPath = PATH_TO_TAB[window.location.pathname] ?? 'home';
      if (TABS_BY_PERSONA[persona].includes(fromPath)) {
        setActiveTab(fromPath);
      } else {
        const fallback = persona === 'admin' ? 'dashboard' : 'home';
        setActiveTab(fallback);
        applyHistory(fallback, 'replace');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [persona]);

  const navigate = (tab: string) => {
    if (TABS_BY_PERSONA[persona].includes(tab)) {
      setActiveTab(tab);
      applyHistory(tab, 'push');
    }
  };

  const switchPersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    localStorage.setItem('persona', nextPersona);
    const nextTab = nextPersona === 'consumer' ? 'home' : 'dashboard';
    setActiveTab(nextTab);
    applyHistory(nextTab, 'replace');
  };

  const handleOrderReserved = (orderId: string) => {
    setLatestOrderId(orderId);
    localStorage.setItem('latest_order_id', orderId);
  };

  const renderContent = () => {
    if (!TABS_BY_PERSONA[persona].includes(activeTab)) {
      return (
        <div className="premium-card p-8 max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-black text-primary">Access Restricted</h3>
          <p className="text-on-surface-variant mt-3">This screen is hidden for your current persona.</p>
          <button onClick={() => switchPersona(persona === 'consumer' ? 'admin' : 'consumer')} className="mt-6 px-5 py-2 rounded-xl bg-primary text-white font-bold">
            Switch to {persona === 'consumer' ? 'Admin' : 'Buyer'}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return <Home onNavigate={navigate} onOrderReserved={handleOrderReserved} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'demand':
        return <DemandCapture />;

      case 'logistics':
        return <Logistics onNavigate={navigate} orderId={latestOrderId} />;
      case 'proof':
      case 'investors':
        return <ProofEngine />;
      case 'settings':
        return <Settings />;
      case 'fisher':
      case 'loi':
        return <FisherStudio initialTab={activeTab === 'loi' ? 'loi' : 'onboarding'} />;
      default:
        return persona === 'consumer' ? <Home onNavigate={navigate} onOrderReserved={handleOrderReserved} /> : <Dashboard onNavigate={navigate} />;
    }
  };

  const isAdminPage = persona === 'admin';

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary/20 selection:text-secondary relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 rounded-full bg-secondary/15 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>

      {isAdminPage ? (
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:ml-64 min-h-screen relative">
            <TopNav 
              activeTab={activeTab} 
              onNavigate={navigate} 
              persona={persona} 
              onPersonaChange={switchPersona} 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className="p-4 md:p-8 lg:p-12 max-w-screen-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      ) : (
        <div className="flex flex-col">
          <TopNav activeTab={activeTab} onNavigate={navigate} persona={persona} onPersonaChange={switchPersona} />
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {latestOrderId && (
                  <div className="fixed top-24 right-6 z-40 premium-card px-4 py-2 text-xs font-bold text-primary hidden md:block">
                    Active tracking: {latestOrderId.slice(0, 8)}...
                  </div>
                )}
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

