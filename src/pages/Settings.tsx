import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Bell, 
  Smartphone, 
  Database, 
  Lock, 
  Cloud,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [config, setConfig] = useState({
    coldChainMinTemp: 2.0,
    coldChainMaxTemp: 4.5,
    mlConfidenceThreshold: 0.85,
    autoReserveThreshold: 0.7,
    whatsAppGatewayStatus: 'online',
    smsGatewayStatus: 'online',
    fisherVerificationRequired: true,
    loiApprovalWorkflow: 'auto',
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('✅ Configuration synchronized across cluster.');
      setTimeout(() => setMessage(''), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Platform Configuration</h2>
          <p className="text-on-surface-variant font-medium">Manage operational thresholds, ML calibration, and infrastructure status.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-bold text-primary tracking-tight">Cold Chain Control</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Temperature (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={config.coldChainMinTemp}
                onChange={(e) => setConfig({...config, coldChainMinTemp: parseFloat(e.target.value)})}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-5 text-sm font-semibold focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Alert Threshold (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={config.coldChainMaxTemp}
                onChange={(e) => setConfig({...config, coldChainMaxTemp: parseFloat(e.target.value)})}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-5 text-sm font-semibold focus:ring-2 focus:ring-secondary/30"
              />
              <p className="text-[10px] text-slate-400 ml-1">Breach triggers high-priority logistics alert.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-primary tracking-tight">ML Decision Calibration</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confidence Threshold</label>
              <input 
                type="range" 
                min="0.5" 
                max="0.99" 
                step="0.01"
                value={config.mlConfidenceThreshold}
                onChange={(e) => setConfig({...config, mlConfidenceThreshold: parseFloat(e.target.value)})}
                className="w-full accent-secondary"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Aggressive (0.50)</span>
                <span className="text-secondary">{Math.round(config.mlConfidenceThreshold * 100)}%</span>
                <span>Conservative (0.99)</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <h3 className="text-lg font-bold text-primary tracking-tight">Gateway Infrastructure</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
              <div>
                <p className="text-[11px] font-bold text-primary">WhatsApp Cloud API</p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">Business Messaging Hub</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Online
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
              <div>
                <p className="text-[11px] font-bold text-primary">SMS Gateway Proxy</p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">Fisher Outreach Service</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Online
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Database size={20} />
            </div>
            <h3 className="text-lg font-bold text-primary tracking-tight">Platform Compliance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-primary">Strict Verification</p>
                <p className="text-[10px] text-slate-400">Require full IDs for fisher onboarding.</p>
              </div>
              <button 
                onClick={() => setConfig({...config, fisherVerificationRequired: !config.fisherVerificationRequired})}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  config.fisherVerificationRequired ? "bg-secondary" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                  config.fisherVerificationRequired ? "right-1" : "left-1"
                )}></div>
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="footer-gradient bg-primary p-8 rounded-[2rem] text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Cloud className="text-secondary-container" size={24} />
            </div>
            <div>
              <p className="text-secondary-container font-black text-xs uppercase tracking-widest">Cluster Distribution</p>
              <h4 className="text-xl font-black italic">Active Node: launch-bnrg-01</h4>
            </div>
          </div>
          <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
            Protocol: Diligence-Verified
          </div>
        </div>
      </footer>
    </div>
  );
};
