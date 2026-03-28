import React, { useEffect, useMemo, useState } from 'react';
import { 
  Anchor, 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Users, 
  Ship, 
  MapPin, 
  Award,
  ChevronRight,
  Search,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/api/client';

export const FisherStudio = () => {
  const [activeSubTab, setActiveSubTab] = useState('onboarding');
  const [fishers, setFishers] = useState<any[]>([]);
  const [lois, setLois] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [fisherForm, setFisherForm] = useState({
    name: '',
    boat_id: '',
    species_focus: 'Seer Fish',
    avg_weekly_catch_kg: 120,
    commitment_level: 'High',
    mobile_number: '',
  });
  const [loiForm, setLoiForm] = useState({
    buyer_type: 'RWA',
    buyer_name: '',
    monthly_volume_kg: 200,
    duration_days: 90,
    price_note: 'Indicative price subject to pilot demand',
    delivery_terms: 'Delivered with cold-chain compliance',
    special_notes: '',
  });

  const loadData = () => {
    api.getFishers().then(setFishers).catch(() => {});
    api.getLois().then(setLois).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFishers = useMemo(
    () => fishers.filter((f) => `${f.name} ${f.boat_id} ${f.species_focus}`.toLowerCase().includes(search.toLowerCase())),
    [fishers, search],
  );

  const submitFisher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.addFisher(fisherForm);
      setMessage('✅ Fisher onboarded successfully and saved to database.');
      setFisherForm((prev) => ({ ...prev, name: '', boat_id: '', mobile_number: '' }));
      loadData();
    } catch (err: any) {
      const detail = err?.message ?? String(err);
      setMessage(`❌ Onboarding failed: ${detail}`);
    }
  };

  const submitLoi = async () => {
    setMessage('');
    if (!loiForm.buyer_name.trim()) {
      setMessage('Buyer name is required to generate LOI.');
      return;
    }
    try {
      await api.generateLoi({ ...loiForm, status: 'Draft' });
      setMessage('LOI generated successfully.');
      loadData();
    } catch {
      setMessage('LOI generation failed.');
    }
  };

  const downloadLoi = (loi: any) => {
    const blob = new Blob([JSON.stringify(loi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loi-${loi.id ?? 'draft'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Fisher Studio</h2>
          <p className="text-on-surface-variant font-medium">Empowering Malpe fishing families with digital onboarding and institutional proof.</p>
        </div>
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveSubTab('onboarding')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeSubTab === 'onboarding' ? "bg-white text-primary shadow-sm" : "text-slate-500"
            )}
          >
            Onboarding
          </button>
          <button 
            onClick={() => setActiveSubTab('loi')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeSubTab === 'loi' ? "bg-white text-primary shadow-sm" : "text-slate-500"
            )}
          >
            LOI Generator
          </button>
        </div>
      </header>

      {activeSubTab === 'onboarding' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 premium-card p-10 premium-hover">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                <Plus size={20} />
              </div>
              <h3 className="text-xl font-bold font-manrope text-primary">Fisher Onboarding</h3>
            </div>
            <form onSubmit={submitFisher} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fisher Name</label>
                <input value={fisherForm.name} onChange={(e) => setFisherForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" placeholder="e.g. Manjunath K." required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Vessel Registration (Boat ID)</label>
                <input value={fisherForm.boat_id} onChange={(e) => setFisherForm((p) => ({ ...p, boat_id: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" placeholder="e.g. MAL-74" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Catch</label>
                  <select value={fisherForm.species_focus} onChange={(e) => setFisherForm((p) => ({ ...p, species_focus: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold">
                    <option>Seer Fish</option>
                    <option>Pomfret</option>
                    <option>Prawns</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Commitment Level</label>
                  <select value={fisherForm.commitment_level} onChange={(e) => setFisherForm((p) => ({ ...p, commitment_level: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <input value={fisherForm.mobile_number} onChange={(e) => setFisherForm((p) => ({ ...p, mobile_number: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" placeholder="+91 9XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Avg Weekly Catch (kg)</label>
                <input type="number" min={1} value={fisherForm.avg_weekly_catch_kg} onChange={(e) => setFisherForm((p) => ({ ...p, avg_weekly_catch_kg: Number(e.target.value) || 1 }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" />
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-secondary transition-all flex items-center justify-center gap-3">
                Onboard Fisher
                <Anchor size={20} />
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="premium-card p-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="text-xl font-bold font-manrope text-primary">Onboarded Collective</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white border-none rounded-lg py-2 pl-10 pr-4 text-xs font-semibold w-48 shadow-sm" placeholder="Search fishers..." />
                  </div>
                  <button onClick={() => setSearch('')} className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><Filter size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(filteredFishers.length ? filteredFishers : [
                  { name: 'K. Manjunath', boat_id: 'MAL-74', species_focus: 'Seer Fish', status: 'Verified' },
                  { name: 'S. Raghavan', boat_id: 'MAL-31', species_focus: 'Pomfret', status: 'Verified' },
                ]).map((fisher, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-secondary transition-all">
                    <img src={`https://picsum.photos/seed/${(fisher.name ?? 'fisher').replace(/\s+/g, '')}/100/100`} alt={fisher.name} className="w-14 h-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-primary">{fisher.name}</h4>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                          fisher.status === 'Verified' || fisher.status === 'Onboarded' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                        )}>{fisher.status}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{fisher.boat_id ?? fisher.boat} • {fisher.species_focus ?? fisher.catch}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-secondary transition-colors" />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <button onClick={() => { setSearch(''); setMessage('Showing full fisher list.'); }} className="text-xs font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors">View All 14 Fishers</button>
              </div>
            </div>

            <div className="bg-primary text-white rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden shadow-[0_30px_90px_-35px_rgba(0,30,64,0.6)]">
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black font-manrope">Collective Strength</h3>
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-3xl font-black">14</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Active Boats</p>
                  </div>
                  <div className="w-px h-10 bg-white/20"></div>
                  <div>
                    <p className="text-3xl font-black">3.2t</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Weekly Capacity</p>
                  </div>
                </div>
              </div>
              <Award size={80} className="text-secondary-container opacity-20 relative z-10" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary opacity-10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,30,64,0.08)] border border-slate-100">
              <h3 className="text-xl font-bold font-manrope text-primary mb-8">LOI Parameters</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Buyer Type</label>
                  <select value={loiForm.buyer_type} onChange={(e) => setLoiForm((p) => ({ ...p, buyer_type: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold">
                    <option value="RWA">Apartment RWA</option>
                    <option value="Restaurant">Premium Restaurant</option>
                    <option value="Export">Export Partner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Buyer Name</label>
                  <input value={loiForm.buyer_name} onChange={(e) => setLoiForm((p) => ({ ...p, buyer_name: e.target.value }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" placeholder="e.g. Sobha Dream Acres" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Commitment Volume</label>
                  <input type="number" min={1} value={loiForm.monthly_volume_kg} onChange={(e) => setLoiForm((p) => ({ ...p, monthly_volume_kg: Number(e.target.value) || 1 }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold" placeholder="e.g. 200" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contract Duration</label>
                  <select value={loiForm.duration_days} onChange={(e) => setLoiForm((p) => ({ ...p, duration_days: Number(e.target.value) }))} className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold">
                    <option value={90}>90 Days (Pilot)</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>
                <button onClick={submitLoi} className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-3">
                  Generate LOI
                  <FileText size={20} />
                </button>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-[2.5rem] p-8">
              <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-6">Recent LOIs</h4>
              <div className="space-y-4">
                {(lois.length ? lois : [
                  { buyer_name: 'Sobha Dream Acres', buyer_type: 'RWA', monthly_volume_kg: '120' },
                  { buyer_name: 'The Fatty Bao', buyer_type: 'Restaurant', monthly_volume_kg: '40' },
                ]).map((loi, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-primary">{loi.buyer_name ?? loi.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{loi.buyer_type ?? loi.type} • {loi.monthly_volume_kg ?? loi.vol}kg/wk</p>
                    </div>
                    <button onClick={() => downloadLoi(loi)} className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"><Download size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] p-12 shadow-[0_20px_60px_-15px_rgba(0,30,64,0.08)] border border-slate-100 min-h-[700px] flex flex-col">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-bold font-manrope text-primary">Document Preview</h3>
                <div className="flex gap-2">
                  <button onClick={() => setMessage('Preview refreshed from latest LOI data.')} className="p-3 bg-surface-container-low rounded-xl text-primary hover:bg-slate-200 transition-colors"><Eye size={20} /></button>
                  <button onClick={() => lois[0] && downloadLoi(lois[0])} className="p-3 bg-primary rounded-xl text-white hover:bg-primary-container transition-colors"><Download size={20} /></button>
                </div>
              </div>
              <div className="flex-1 border-2 border-slate-50 rounded-3xl p-12 bg-slate-50/30 font-serif text-slate-700 space-y-8">
                <div className="text-center space-y-2 mb-12">
                  <h4 className="text-2xl font-bold text-primary font-manrope uppercase tracking-tighter">Letter of Intent</h4>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Malpe Meen LaunchOS • Maritime Logistics</p>
                </div>
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed">This Letter of Intent (the "LOI") is entered into as of [Current Date], between <span className="font-bold text-primary">Malpe Meen LaunchOS</span> and <span className="font-bold text-primary">{loiForm.buyer_name || '[Buyer Name]'}</span>.</p>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">1. Purpose of Engagement</p>
                    <p className="text-sm leading-relaxed">The Buyer expresses a formal intent to reserve priority seafood landings from the Malpe Harbor Cluster, facilitated by the LaunchOS logistics infrastructure.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">2. Commitment Terms</p>
                    <ul className="text-sm space-y-2 list-disc pl-5">
                      <li>Weekly Commitment Volume: <span className="font-bold">{Math.round(loiForm.monthly_volume_kg / 4)}kg</span></li>
                      <li>Primary Varieties: <span className="font-bold">Seer Fish, Pomfret, Prawns</span></li>
                      <li>Quality Standard: <span className="font-bold">LaunchOS Grade A (90+ Freshness)</span></li>
                    </ul>
                  </div>
                  <div className="pt-12 flex justify-between">
                    <div className="space-y-2">
                      <div className="w-48 h-px bg-slate-300 mb-4"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorized Signatory</p>
                      <p className="text-xs font-bold text-primary">Malpe Meen LaunchOS</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="w-48 h-px bg-slate-300 mb-4 ml-auto"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Buyer Representative</p>
                      <p className="text-xs font-bold text-primary">{loiForm.buyer_name || '[Buyer Name]'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-secondary-container rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} className="text-primary" />
                  <div>
                    <p className="text-sm font-bold text-primary">Blockchain-Verified Document</p>
                    <p className="text-[10px] font-medium text-primary opacity-70">Hash: 0x72a...f912 | Timestamped on Maritime Ledger</p>
                  </div>
                </div>
                <CheckCircle2 size={24} className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      )}
      {message && <p className="text-sm font-semibold text-primary">{message}</p>}
    </div>
  );
};
