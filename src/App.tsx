/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, TopNav } from './components/Navigation';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Logistics } from './pages/Logistics';
import { ProofEngine } from './pages/ProofEngine';
import { FisherStudio } from './pages/FisherStudio';
import { motion, AnimatePresence } from 'motion/react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [latestOrderId, setLatestOrderId] = useState<string | null>(() => localStorage.getItem('latest_order_id'));

  const navigate = (tab: string) => setActiveTab(tab);

  const handleOrderReserved = (orderId: string) => {
    setLatestOrderId(orderId);
    localStorage.setItem('latest_order_id', orderId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={navigate} onOrderReserved={handleOrderReserved} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'logistics':
        return <Logistics onNavigate={navigate} orderId={latestOrderId} />;
      case 'proof':
      case 'investors':
        return <ProofEngine />;
      case 'fisher':
      case 'loi':
        return <FisherStudio />;
      default:
        return <Home />;
    }
  };

  const isAdminPage = ['dashboard', 'demand', 'fisher', 'loi', 'proof', 'investors', 'settings'].includes(activeTab);

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary/20 selection:text-secondary relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 rounded-full bg-secondary/15 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>

      {isAdminPage ? (
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 ml-64 min-h-screen">
            <TopNav activeTab={activeTab} onNavigate={navigate} />
            <div className="p-8 lg:p-12 max-w-screen-2xl mx-auto">
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
          <TopNav activeTab={activeTab} onNavigate={navigate} />
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {activeTab === 'home' && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-6">
                    <button onClick={() => setActiveTab('home')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'home' ? 'text-secondary-container' : 'text-white/60'}`}>Home</button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button onClick={() => setActiveTab('logistics')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'logistics' ? 'text-secondary-container' : 'text-white/60'}`}>Logistics</button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button onClick={() => setActiveTab('dashboard')} className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Admin OS</button>
                  </div>
                )}
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

