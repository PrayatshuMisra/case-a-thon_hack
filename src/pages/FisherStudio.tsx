import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Anchor,
  Plus,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/api/client';
import jsPDF from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  initialTab?: 'onboarding' | 'loi';
}

interface LoiForm {
  buyer_type: string;
  buyer_name: string;
  monthly_volume_kg: number;
  duration_days: number;
  price_note: string;
  delivery_terms: string;
  special_notes: string;
}

// ─── PDF generator ────────────────────────────────────────────────────────────
function generateLoiPdf(form: LoiForm): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 22;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(0, 32, 74);          // deep navy
  doc.rect(0, 0, W, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MALPE MEEN LAUNCHOS', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 210, 255);
  doc.text('Maritime Seafood Logistics • Malpe Harbor Cluster, Karnataka', margin, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 200, 80);
  doc.text('LETTER OF INTENT', margin, 38);

  y = 56;

  // ── Date + Ref ──
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${today}`, margin, y);
  doc.text(`Ref: MML-LOI-${Date.now().toString().slice(-6)}`, W - margin, y, { align: 'right' });

  y += 10;

  // ── Divider ──
  doc.setDrawColor(0, 32, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Parties ──
  const sectionTitle = (title: string) => {
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(margin, y - 4, contentW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 32, 74);
    doc.text(title.toUpperCase(), margin + 4, y + 3);
    y += 13;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, contentW - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 6 + 2;
  };

  const labelValue = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label + ':', margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(value, margin + 52, y);
    y += 7;
  };

  sectionTitle('1. Parties');
  labelValue('Seller / Initiator', 'Malpe Meen LaunchOS, Malpe Harbor, Udupi District, Karnataka');
  labelValue('Buyer', `${form.buyer_name} (${form.buyer_type})`);
  y += 4;

  sectionTitle('2. Purpose');
  bodyText(
    `This Letter of Intent ("LOI") documents the formal intent of ${form.buyer_name || '[Buyer Name]'} to ` +
    `engage in a seafood procurement relationship with Malpe Meen LaunchOS. The Buyer expresses commitment ` +
    `to reserving priority seafood landings from the Malpe Harbor Cluster, facilitated through the ` +
    `LaunchOS cold-chain logistics infrastructure.`
  );
  y += 2;

  sectionTitle('3. Commitment Terms');
  const weeklyKg = Math.round(form.monthly_volume_kg / 4);
  labelValue('Monthly Volume', `${form.monthly_volume_kg} kg/month (≈ ${weeklyKg} kg/week)`);
  labelValue('Contract Duration', `${form.duration_days} days`);
  labelValue('Primary Varieties', 'Seer Fish (Kingfish), Pomfret, Tiger Prawns');
  labelValue('Quality Standard', 'LaunchOS Grade A — 90+ Freshness Score');
  labelValue('Price Basis', form.price_note);
  labelValue('Delivery Terms', form.delivery_terms);
  y += 2;

  if (form.special_notes?.trim()) {
    sectionTitle('4. Special Conditions');
    bodyText(form.special_notes);
    y += 2;
  }

  sectionTitle(`${form.special_notes?.trim() ? '5' : '4'}. Standard Clauses`);
  const clauses = [
    'Fresh catch supply sourced exclusively from registered Malpe fishing collective members.',
    'Cold-chain monitored transport: harvest-to-delivery temperature maintained ≤ 4°C.',
    'Indicative pricing subject to freshness confidence score and real-time demand.',
    'Traceability logs and source vessel records shared with every batch.',
    'This LOI is non-binding and subject to pilot sample acceptance by both parties.',
  ];
  clauses.forEach((c, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(`${i + 1}.  ${c}`, contentW - 6);
    doc.text(lines, margin + 4, y);
    y += lines.length * 5.5 + 2;
  });

  y += 6;

  // ── Signature block ──
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 32, 74);
  doc.text('Authorised Signatory', margin, y + 20);
  doc.text('Buyer Representative', W - margin, y + 20, { align: 'right' });

  // signature lines
  doc.setDrawColor(0, 32, 74);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 16, margin + 70, y + 16);
  doc.line(W - margin - 70, y + 16, W - margin, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Malpe Meen LaunchOS', margin, y + 26);
  doc.text(form.buyer_name || '[Buyer Name]', W - margin, y + 26, { align: 'right' });

  y += 38;

  // ── Footer ──
  doc.setFillColor(0, 32, 74);
  const pageH = doc.internal.pageSize.getHeight();
  doc.rect(0, pageH - 16, W, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 200, 255);
  doc.text(
    'This document is generated by Malpe Meen LaunchOS • Non-binding indicative intent • Subject to formal agreement',
    W / 2,
    pageH - 7,
    { align: 'center' }
  );

  doc.save(`LOI-${(form.buyer_name || 'Draft').replace(/\s+/g, '_')}-${Date.now()}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FisherStudio = ({ initialTab = 'onboarding' }: Props) => {
  const [activeSubTab, setActiveSubTab] = useState<'onboarding' | 'loi'>(initialTab);
  const [fishers, setFishers] = useState<any[]>([]);
  const [lois, setLois] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [previewLoi, setPreviewLoi] = useState<any | null>(null);

  const [fisherForm, setFisherForm] = useState({
    name: '',
    boat_id: '',
    species_focus: 'Seer Fish',
    avg_weekly_catch_kg: 120,
    commitment_level: 'High',
    mobile_number: '',
  });

  const [loiForm, setLoiForm] = useState<LoiForm>({
    buyer_type: 'RWA',
    buyer_name: '',
    monthly_volume_kg: 200,
    duration_days: 90,
    price_note: 'Indicative price subject to pilot demand',
    delivery_terms: 'Delivered with cold-chain compliance',
    special_notes: '',
  });

  // Keep initialTab in sync if parent re-renders with different value (e.g. sidebar click)
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

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

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const submitFisher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.addFisher(fisherForm);
      notify('✅ Fisher onboarded and saved to database.');
      setFisherForm((prev) => ({ ...prev, name: '', boat_id: '', mobile_number: '' }));
      loadData();
    } catch (err: any) {
      notify(`❌ Onboarding failed: ${err?.message ?? err}`, 'error');
    }
  };

  const submitLoi = async () => {
    setMessage('');
    if (!loiForm.buyer_name.trim()) {
      notify('Buyer name is required to generate LOI.', 'error');
      return;
    }
    try {
      const created = await api.generateLoi({ ...loiForm, status: 'Draft' }) as any;
      notify('✅ LOI generated and saved.');
      setPreviewLoi({ ...loiForm, id: created?.id });
      loadData();
    } catch (err: any) {
      notify(`❌ LOI generation failed: ${err?.message ?? err}`, 'error');
    }
  };

  const downloadCurrentLoi = () => {
    if (!loiForm.buyer_name.trim()) {
      notify('Enter buyer name before downloading.', 'error');
      return;
    }
    generateLoiPdf(loiForm);
  };

  const downloadSavedLoi = (loi: any) => {
    generateLoiPdf({
      buyer_type: loi.buyer_type ?? 'RWA',
      buyer_name: loi.buyer_name ?? loi.name ?? '',
      monthly_volume_kg: loi.monthly_volume_kg ?? 200,
      duration_days: loi.duration_days ?? 90,
      price_note: loi.price_note ?? 'Indicative',
      delivery_terms: loi.delivery_terms ?? 'Cold-chain compliant',
      special_notes: loi.special_notes ?? '',
    });
  };

  // ── Weekly kg derived from monthly ─────────────────────────────────────────
  const weeklyKg = Math.round(loiForm.monthly_volume_kg / 4);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Fisher Studio</h2>
          <p className="text-on-surface-variant font-medium">
            Empowering Malpe fishing families with digital onboarding and institutional proof.
          </p>
        </div>
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveSubTab('onboarding')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeSubTab === 'onboarding' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            )}
          >
            Onboarding
          </button>
          <button
            onClick={() => setActiveSubTab('loi')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeSubTab === 'loi' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            )}
          >
            LOI Generator
          </button>
        </div>
      </header>

      {/* ── Toast message ── */}
      {message && (
        <div className={cn(
          'flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold',
          messageType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {messageType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {message}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONBOARDING TAB */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 premium-card p-10 premium-hover">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                <Plus size={20} />
              </div>
              <h3 className="text-xl font-bold font-manrope text-primary">Fisher Onboarding</h3>
            </div>
            <form onSubmit={submitFisher} className="space-y-5">
              {[
                { label: 'Fisher Name', key: 'name', placeholder: 'e.g. Manjunath K.', required: true },
                { label: 'Vessel Registration (Boat ID)', key: 'boat_id', placeholder: 'e.g. MAL-74', required: true },
                { label: 'Mobile Number', key: 'mobile_number', placeholder: '+91 9XXXXXXXXX' },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                  <input
                    value={(fisherForm as any)[key]}
                    onChange={(e) => setFisherForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={placeholder}
                    required={required}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Catch</label>
                  <select
                    value={fisherForm.species_focus}
                    onChange={(e) => setFisherForm((p) => ({ ...p, species_focus: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option>Seer Fish</option>
                    <option>Pomfret</option>
                    <option>Prawns</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Commitment</label>
                  <select
                    value={fisherForm.commitment_level}
                    onChange={(e) => setFisherForm((p) => ({ ...p, commitment_level: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Avg Weekly Catch (kg)</label>
                <input
                  type="number"
                  min={1}
                  value={fisherForm.avg_weekly_catch_kg}
                  onChange={(e) => setFisherForm((p) => ({ ...p, avg_weekly_catch_kg: Number(e.target.value) || 1 }))}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-secondary transition-all flex items-center justify-center gap-3 mt-2">
                Onboard Fisher
                <Anchor size={20} />
              </button>
            </form>
          </div>

          {/* Fisher list */}
          <div className="lg:col-span-7 space-y-8">
            <div className="premium-card p-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="text-xl font-bold font-manrope text-primary">
                    Onboarded Collective
                    {fishers.length > 0 && <span className="ml-2 text-sm font-bold text-secondary">({fishers.length})</span>}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-white border-none rounded-lg py-2 pl-10 pr-4 text-xs font-semibold w-48 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Search fishers..."
                    />
                  </div>
                  <button onClick={() => setSearch('')} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-primary transition-colors">
                    <Filter size={16} />
                  </button>
                  <button onClick={loadData} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-primary transition-colors" title="Refresh">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(filteredFishers.length > 0 ? filteredFishers : fishers.length === 0 ? [
                  { name: 'K. Manjunath', boat_id: 'MAL-74', species_focus: 'Seer Fish', status: 'Verified' },
                  { name: 'S. Raghavan', boat_id: 'MAL-31', species_focus: 'Pomfret', status: 'Verified' },
                ] : []).map((fisher, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-secondary transition-all">
                    <img
                      src={`https://picsum.photos/seed/${(fisher.name ?? 'fisher').replace(/\s+/g, '')}/100/100`}
                      alt={fisher.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-primary truncate">{fisher.name}</h4>
                        <span className={cn(
                          'text-[8px] font-black uppercase px-2 py-0.5 rounded ml-2 shrink-0',
                          fisher.status === 'Verified' || fisher.status === 'Onboarded'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        )}>
                          {fisher.status ?? 'Onboarded'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                        {fisher.boat_id} • {fisher.species_focus}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-secondary transition-colors shrink-0" />
                  </div>
                ))}
                {filteredFishers.length === 0 && fishers.length > 0 && (
                  <p className="col-span-2 text-sm text-slate-400 text-center py-8">No fishers match your search.</p>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="bg-primary text-white rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden shadow-[0_30px_90px_-35px_rgba(0,30,64,0.6)]">
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black font-manrope">Collective Strength</h3>
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-3xl font-black">{fishers.length || 14}</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Active Boats</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div>
                    <p className="text-3xl font-black">
                      {fishers.length > 0
                        ? `${(fishers.reduce((s, f) => s + (f.avg_weekly_catch_kg ?? 0), 0) / 1000).toFixed(1)}t`
                        : '3.2t'}
                    </p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Weekly Capacity</p>
                  </div>
                </div>
              </div>
              <Award size={80} className="text-secondary-container opacity-20 relative z-10" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary opacity-10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* LOI GENERATOR TAB */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'loi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left: form + saved LOIs ── */}
          <div className="lg:col-span-4 space-y-8">
            {/* Form card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,30,64,0.08)] border border-slate-100">
              <h3 className="text-xl font-bold font-manrope text-primary mb-8">LOI Parameters</h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Buyer Type</label>
                  <select
                    value={loiForm.buyer_type}
                    onChange={(e) => setLoiForm((p) => ({ ...p, buyer_type: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="RWA">Apartment RWA</option>
                    <option value="Restaurant">Premium Restaurant</option>
                    <option value="Export">Export Partner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Buyer Name</label>
                  <input
                    value={loiForm.buyer_name}
                    onChange={(e) => setLoiForm((p) => ({ ...p, buyer_name: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g. Sobha Dream Acres"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Monthly Volume (kg) <span className="normal-case text-slate-300">≈ {weeklyKg} kg/week</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={loiForm.monthly_volume_kg}
                    onChange={(e) => setLoiForm((p) => ({ ...p, monthly_volume_kg: Number(e.target.value) || 1 }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contract Duration</label>
                  <select
                    value={loiForm.duration_days}
                    onChange={(e) => setLoiForm((p) => ({ ...p, duration_days: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={90}>90 Days (Pilot)</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Special Notes</label>
                  <textarea
                    value={loiForm.special_notes}
                    onChange={(e) => setLoiForm((p) => ({ ...p, special_notes: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
                    placeholder="Any additional conditions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={submitLoi}
                    className="py-4 bg-secondary text-white rounded-2xl font-black text-sm shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    Generate & Save
                  </button>
                  <button
                    onClick={downloadCurrentLoi}
                    className="py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg hover:bg-secondary transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Saved LOIs */}
            <div className="bg-surface-container-low rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest">Saved LOIs</h4>
                <button onClick={loadData} className="text-slate-400 hover:text-primary transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {(lois.length > 0 ? lois : [
                  { buyer_name: 'Sobha Dream Acres', buyer_type: 'RWA', monthly_volume_kg: 120 },
                  { buyer_name: 'The Fatty Bao', buyer_type: 'Restaurant', monthly_volume_kg: 40 },
                ]).map((loi, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-primary truncate">{loi.buyer_name ?? loi.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {loi.buyer_type ?? loi.type} • {loi.monthly_volume_kg ?? loi.vol} kg/mo
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => setPreviewLoi(loi)}
                        title="Preview"
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => downloadSavedLoi(loi)}
                        title="Download PDF"
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,30,64,0.08)] border border-slate-100 min-h-[700px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold font-manrope text-primary">Live Document Preview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Updates instantly as you fill the form</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewLoi(null)}
                    title="Show current form preview"
                    className="p-3 bg-surface-container-low rounded-xl text-primary hover:bg-slate-200 transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={downloadCurrentLoi}
                    title="Download as PDF"
                    className="p-3 bg-primary rounded-xl text-white hover:bg-secondary transition-colors"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* Document preview — live from form OR from a saved LOI */}
              {(() => {
                const src = previewLoi ?? loiForm;
                const buyerName = src.buyer_name || '[Buyer Name]';
                const buyerType = src.buyer_type || 'RWA';
                const monthlyVol = src.monthly_volume_kg ?? 200;
                const wklyVol = Math.round(monthlyVol / 4);
                const duration = src.duration_days ?? 90;
                const priceNote = src.price_note || 'Indicative';
                const delivTerms = src.delivery_terms || 'Cold-chain compliant';
                const notes = src.special_notes;
                const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

                return (
                  <div className="flex-1 border-2 border-slate-50 rounded-3xl overflow-hidden">
                    {/* Doc header */}
                    <div className="bg-[#00204a] text-white px-10 py-7">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300 mb-1">Malpe Meen LaunchOS • Maritime Logistics</p>
                      <h4 className="text-2xl font-black tracking-tight">Letter of Intent</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-blue-200">{today}</p>
                        <span className="text-[10px] font-bold bg-yellow-400 text-[#00204a] px-3 py-0.5 rounded-full uppercase tracking-widest">
                          {previewLoi ? 'Saved LOI' : 'Draft Preview'}
                        </span>
                      </div>
                    </div>

                    {/* Doc body */}
                    <div className="p-8 space-y-6 text-slate-700 font-serif overflow-y-auto" style={{ maxHeight: 480 }}>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="bg-slate-50 rounded-2xl p-4">
                          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400 mb-2">Seller / Initiator</p>
                          <p className="font-bold text-primary text-xs">Malpe Meen LaunchOS</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Malpe Harbor, Udupi District, Karnataka</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400 mb-2">Buyer</p>
                          <p className="font-bold text-primary text-xs">{buyerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{buyerType}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400 mb-2">Purpose</p>
                        <p className="text-xs leading-relaxed">
                          This LOI documents the formal intent of <strong>{buyerName}</strong> to engage in a seafood
                          procurement relationship with Malpe Meen LaunchOS, reserving priority landings from the Malpe
                          Harbor Cluster via the LaunchOS cold-chain logistics infrastructure.
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400 mb-3">Commitment Terms</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            ['Monthly Volume', `${monthlyVol} kg/month`],
                            ['Weekly Volume', `≈ ${wklyVol} kg/week`],
                            ['Duration', `${duration} days`],
                            ['Quality', 'Grade A — 90+ Freshness'],
                            ['Price Basis', priceNote],
                            ['Delivery', delivTerms],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-slate-50 rounded-xl p-3">
                              <p className="text-[8px] font-sans font-black uppercase tracking-widest text-slate-400">{k}</p>
                              <p className="text-xs font-bold text-primary mt-0.5">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-amber-600 mb-1">Special Notes</p>
                          <p className="text-xs leading-relaxed text-slate-700">{notes}</p>
                        </div>
                      )}

                      {/* Signature */}
                      <div className="pt-4 flex justify-between items-end border-t border-slate-100">
                        <div className="space-y-1">
                          <div className="w-40 h-px bg-slate-300" />
                          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400">Authorised Signatory</p>
                          <p className="text-xs font-bold text-primary">Malpe Meen LaunchOS</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="w-40 h-px bg-slate-300 ml-auto" />
                          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-400">Buyer Representative</p>
                          <p className="text-xs font-bold text-primary">{buyerName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Blockchain badge */}
              <div className="mt-6 p-5 bg-secondary-container rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={22} className="text-primary" />
                  <div>
                    <p className="text-sm font-bold text-primary">Blockchain-Verified Document</p>
                    <p className="text-[10px] font-medium text-primary opacity-70">Hash: 0x72a...f912 | Timestamped on Maritime Ledger</p>
                  </div>
                </div>
                <CheckCircle2 size={22} className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
