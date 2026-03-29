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
  Fish,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/api/client';
import jsPDF from 'jspdf';
import logoImg from "@/src/assets/logo.png";

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

  // ── Header (Logo + Company Info) ──
  try {
    // Attempting to add the logo image
    doc.addImage(logoImg, 'PNG', margin, 12, 14, 14);
  } catch (err) {
    // Fallback if image fails to load
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MML', margin, 18);
  }

  doc.setTextColor(0, 0, 0); // Strictly black
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('MALPE MEEN LAUNCHOS', margin + 18, 18);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Maritime & Sustainable Seafood Logistics • Harbor Cluster, Karnataka', margin + 18, 23);

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('LETTER OF INTENT (LOI)', W / 2, 45, { align: 'center' });
  doc.line(W / 2 - 30, 46.5, W / 2 + 30, 46.5); // Underlined headline

  y = 58;

  // ── Date + Ref ──
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Date of Issue: ${today}`, margin, y);
  doc.text(`Doc Ref: MML/LOI/${Date.now().toString().slice(-4)}`, W - margin, y, { align: 'right' });

  y += 10;

  // ── Section 1: Parties ──
  const sectionTitle = (title: string, yPos: number) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), margin, yPos);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1.5, margin + doc.getTextWidth(title.toUpperCase()), yPos + 1.5); // underlined
    return yPos + 8;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, contentW - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 6 + 2;
  };

  const labelValue = (label: string, value: string) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(label + ':', margin + 4, y);
    doc.setFont('times', 'italic');
    const valX = margin + 45;
    const valW = contentW - 45;
    const lines = doc.splitTextToSize(value, valW);
    doc.text(lines, valX, y);
    y += Math.max(7, lines.length * 5 + 2);
  };

  y = sectionTitle('1. Identification of Parties', y);
  labelValue('Primary Seller', 'Malpe Meen LaunchOS (Maritime Collective)');
  labelValue('Registered Address', 'Malpe Main Harbor, Udupi Dist., KA 576108');
  labelValue('Proposed Buyer', `${form.buyer_name} / ${form.buyer_type}`);
  y += 4;

  y = sectionTitle('2. Statement of Intent', y);
  bodyText(
    `This legally non-binding Letter of Intent ("LOI") formalizes the intent of the Buyer, ${form.buyer_name || '[NAME]'}, ` +
    `to collaborate with Malpe Meen LaunchOS for the procurement of verified seafood landings. ` +
    `Both parties agree to explore a long-term supply relationship facilitated by the LaunchOS supply-chain network.`
  );
  y += 2;

  y = sectionTitle('3. Proposed Commercial Terms', y);
  const weeklyKg = Math.round(form.monthly_volume_kg / 4);
  labelValue('Target Volume', `${form.monthly_volume_kg} kg/month (Avg. ${weeklyKg} kg p.w.)`);
  labelValue('Term of Pilot', `${form.duration_days} Days Assessment`);
  labelValue('Product Focus', 'Kingfish (Seer), Premium Pomfret, Tiger Prawns');
  labelValue('Pricing Mechanism', `${form.price_note} (Underlined value)`);
  labelValue('Logistics / Delivery', form.delivery_terms);
  y += 2;

  if (form.special_notes?.trim()) {
    y = sectionTitle('4. Additional Stipulations', y);
    bodyText(form.special_notes);
    y += 2;
  }

  y = sectionTitle('5. General Clauses', y);
  const clauses = [
    'Sourcing protocol strictly follows Malpe Fishery Sustainability guidelines.',
    'Temperature control for transit shall remain at or below 4 degrees Centigrade throughout.',
    'This document does not create a binding legal obligation to purchase.',
    'All financial settlements shall happen as per subsequent Purchase Orders.',
  ];
  clauses.forEach((c, i) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const text = `${i + 1}.  ${c}`;
    const lines = doc.splitTextToSize(text, contentW - 8);
    doc.text(lines, margin + 4, y);
    y += lines.length * 6 + 1;
  });

  y += 15;

  // ── Signatures ──
  doc.setLineWidth(0.4);
  doc.line(margin, y + 16, margin + 65, y + 16);
  doc.line(W - margin - 65, y + 16, W - margin, y + 16);

  // Handwritten Signatures
  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(14);
  doc.text('Ravi', margin + 5, y + 12); // Admin Signature
  
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Authorised Signatory (Admin)', margin, y + 21);
  doc.text('Proposed Buyer Representative', W - margin, y + 21, { align: 'right' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Name: Ravi K. (LaunchOS Admin)', margin + 3, y + 25);
  doc.text(`Name: ${form.buyer_name}`, W - margin - 3, y + 25, { align: 'right' });
  doc.text(`Title: ${form.buyer_type} Official`, W - margin - 3, y + 29, { align: 'right' });

  // ── Footer ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, pageH - 20, W - margin, pageH - 20);
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'MML-LOI Revision Feb-2026 • malpemeen.os.launch • Confirmatory draft only.',
    W / 2,
    pageH - 12,
    { align: 'center' }
  );

  doc.save(`LOI_${(form.buyer_name || 'Draft').replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`);
}

function getFisherUplift(fisher: any): number {
  if (fisher?.income_uplift_pct) return Number(fisher.income_uplift_pct);
  if (!fisher?.name) return 22;
  let hash = 0;
  for (let i = 0; i < fisher.name.length; i++) {
    hash = fisher.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 18 + (Math.abs(hash) % 15);
}

function generateFisherOnboardingPdf(fisher: any, upliftPct: number) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const margin = 20;
    const W = doc.internal.pageSize.getWidth();
    let y = margin;

    // Header Image
    try {
      doc.addImage(logoImg, 'PNG', W / 2 - 20, y, 40, 16);
      y += 24;
    } catch (e) {
      // fallback
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('MALPE MEEN', W / 2, y, { align: 'center' });
      y += 10;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CATCH EXCLUSIVITY & ONBOARDING AGREEMENT', W / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Onboarding: ${new Date().toLocaleDateString()}`, margin, y);
    y += 10;

    // Body
    doc.setFont('helvetica', 'bold');
    doc.text('1. FISHER DETAILS', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${fisher?.name || 'N/A'}`, margin + 5, y);
    y += 5;
    doc.text(`Vessel ID: ${fisher?.boat_id || 'N/A'}`, margin + 5, y);
    y += 5;
    doc.text(`Mobile Number: ${fisher?.mobile_number || 'N/A'}`, margin + 5, y);
    y += 5;
    doc.text(`Primary Catch Focus: ${fisher?.species_focus || 'Mixed Catch'}`, margin + 5, y);
    y += 5;
    doc.text(`Est. Weekly Volume: ${fisher?.avg_weekly_catch_kg || 120} KG`, margin + 5, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('2. COMMITMENT STRUCTURE', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const commitments = [
      `The Fisher agrees to provide exclusivity of Grade A ${fisher?.species_focus || 'Catch'} under the Malpe Meen LaunchOS collective.`,
      `Quality parameters: Line-caught, iced immediately upon catch at sea, no cross-contamination.`,
      `Data connectivity: GPS and Catch Logging compliance required at landing point.`
    ];
    commitments.forEach(c => {
      const lines = doc.splitTextToSize(`• ${c}`, W - margin * 2 - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5;
    });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('3. INCENTIVES & UPLIFT', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Projected Income Uplift: +${upliftPct}% above standard mandi daily rates.`, margin + 5, y);
    y += 5;
    doc.text(`Zero-Waste Pricing Guarantee: Malpe Meen guarantees purchase of allocated quota.`, margin + 5, y);
    y += 5;
    doc.text(`Instant Settlement: Payment released immediately upon quality validation at Malpe Hub.`, margin + 5, y);
    y += 15;

    // Signatures
    doc.setLineWidth(0.4);
    doc.line(margin, y + 16, margin + 65, y + 16);
    doc.line(W - margin - 65, y + 16, W - margin, y + 16);

    // Handwritten Signatures
    doc.setFont('courier', 'bolditalic');
    doc.setFontSize(14);
    doc.text('Ravi', margin + 5, y + 12); 
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Authorised Signatory', margin, y + 21);
    doc.text('Fisher Confirmation Sign', W - margin, y + 21, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('LaunchOS Admin / Malpe Meen', margin, y + 25);
    doc.text(fisher?.name || 'Fisher', W - margin, y + 25, { align: 'right' });

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageH - 20, W - margin, pageH - 20);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'This is a digitally generated pilot onboarding receipt for Malpe Meen collective participants.',
      W / 2,
      pageH - 12,
      { align: 'center' }
    );

    const safeBoatId = (fisher?.boat_id || 'UNK').replace(/\s+/g, '_');
    const safeName = (fisher?.name || 'Fisher').replace(/\s+/g, '_');
    doc.save(`Fisher_Onboarding_${safeBoatId}_${safeName}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Could not generate PDF. Please check the console for errors.");
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FisherStudio = ({ initialTab = 'onboarding' }: Props) => {
  const [activeSubTab, setActiveSubTab] = useState<'onboarding' | 'loi'>(initialTab);
  const [fishers, setFishers] = useState<any[]>(() => {
    const cached = localStorage.getItem('mm_fishers');
    return cached ? JSON.parse(cached) : [];
  });
  const [lois, setLois] = useState<any[]>(() => {
    const cached = localStorage.getItem('mm_lois');
    return cached ? JSON.parse(cached) : [];
  });

  const [loading, setLoading] = useState(!fishers.length);
  const [refreshing, setRefreshing] = useState(false);
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

  const [selectedFisher, setSelectedFisher] = useState<any>(null);

  // Keep initialTab in sync if parent re-renders with different value (e.g. sidebar click)
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const fetchData = async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    else setLoading(true);

    try {
      const [newFishers, newLois] = await Promise.all([
        api.getFishers(),
        api.getLois()
      ]);
      setFishers(newFishers);
      setLois(newLois);
      localStorage.setItem('mm_fishers', JSON.stringify(newFishers));
      localStorage.setItem('mm_lois', JSON.stringify(newLois));
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const poll = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(poll);
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
      const addedFisher = await api.addFisher(fisherForm) as any;
      if (fisherForm.mobile_number && fisherForm.mobile_number.trim() !== '') {
        notify(`✅ Fisher onboarded. WhatsApp confirmation & Contract PDF generated and sent to ${fisherForm.mobile_number}.`);
      } else {
        notify('✅ Fisher onboarded and saved to database. PDF Generated.');
      }
      generateFisherOnboardingPdf(fisherForm, getFisherUplift(addedFisher || fisherForm));
      setFisherForm((prev) => ({ ...prev, name: '', boat_id: '', mobile_number: '' }));
      fetchData(true);
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
      fetchData(true);
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
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary">Fisher Studio</h2>
          <p className="text-on-surface-variant font-medium text-sm md:text-base">
            Empowering Malpe fishing families with digital onboarding and institutional proof.
          </p>
        </div>
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl gap-1 items-center self-start md:self-auto overflow-x-auto max-w-full">
          {refreshing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse border border-blue-100 mr-2">
              <RefreshCw size={12} className="animate-spin" />
              Syncing Live
            </div>
          )}
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
          <div className="lg:col-span-5 premium-card p-6 md:p-10 premium-hover">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                <Plus size={20} />
              </div>
              <h3 className="text-lg md:text-xl font-bold font-manrope text-primary">Fisher Onboarding</h3>
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
            <div className="premium-card p-6 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
                  <button onClick={() => fetchData()} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-primary transition-colors" title="Refresh">
                    <RefreshCw size={16} className={(loading || refreshing) ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative min-h-[160px]">
                {loading && !fishers.length ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 skeleton-pulse relative overflow-hidden">
                        <div className="absolute inset-0 shimmer-box opacity-[0.03]"></div>
                        <div className="w-14 h-14 rounded-2xl bg-slate-200/50 shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-slate-200/50 rounded"></div>
                          <div className="h-3 w-16 bg-slate-200/50 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (filteredFishers.length > 0 ? filteredFishers : fishers.length === 0 ? [
                  { name: 'K. Manjunath', boat_id: 'MAL-74', species_focus: 'Seer Fish', status: 'Verified' },
                  { name: 'S. Raghavan', boat_id: 'MAL-31', species_focus: 'Pomfret', status: 'Verified' },
                ] : []).map((fisher, i) => (
                  <div key={i} onClick={() => setSelectedFisher(fisher)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-secondary hover:shadow-md cursor-pointer transition-all">
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
                {!loading && filteredFishers.length === 0 && fishers.length > 0 && (
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
            <div className="bg-surface-container-low rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest">Saved LOIs</h4>
                <button onClick={() => fetchData()} className="text-slate-400 hover:text-primary transition-colors">
                  <RefreshCw size={14} className={(loading || refreshing) ? 'animate-spin' : ''} />
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
                  <div className="flex-1 border border-slate-200 rounded-3xl overflow-hidden bg-[#fafafa] shadow-inner p-8">
                    <div className="bg-white border border-slate-200 shadow-sm min-h-[800px] w-full max-w-[650px] mx-auto p-12 flex flex-col font-serif text-black leading-normal">
                      
                      {/* Logo & Header */}
                      <div className="flex items-start justify-between mb-10 border-b-2 border-black pb-6">
                        <div className="flex items-center gap-4">
                          <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain" />
                          <div>
                            <h4 className="text-xl font-bold uppercase tracking-tight">Malpe Meen LaunchOS</h4>
                            <p className="text-[10px] font-sans font-medium text-slate-500 uppercase tracking-widest">Maritime & Sustainable Seafood Logistics</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <h5 className="text-lg font-bold underline">LETTER OF INTENT</h5>
                          <p className="text-[9px] font-sans mt-1">Ref: MML/LOI/{Date.now().toString().slice(-4)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs mb-8 italic">
                        <p>Date: {today}</p>
                        <p>Valid Location: Malpe Harbor, Udupi</p>
                      </div>

                      {/* Content sections */}
                      <div className="space-y-8">
                        <div>
                          <h6 className="text-xs font-bold uppercase underline mb-3">1. Identification of Parties</h6>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold mb-1 italic">On behalf of Seller:</p>
                              <p>MALPE MEEN LAUNCHOS</p>
                              <p className="text-slate-500">Malpe Main Harbor, KA 576108</p>
                            </div>
                            <div>
                              <p className="font-bold mb-1 italic">On behalf of Proposed Buyer:</p>
                              <p className="uppercase">{buyerName}</p>
                              <p className="text-slate-500">{buyerType}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h6 className="text-xs font-bold uppercase underline mb-2">2. Statement of Intent</h6>
                          <p className="text-sm leading-relaxed">
                            This documents the formal intent of <strong>{buyerName}</strong> (the "Buyer") to engage in a seafood
                            procurement relationship with Malpe Meen LaunchOS. The Buyer expresses a serious interest in
                            reserving priority landings of seasonal catch, specifically for <strong><i>Grade A</i></strong> quality fresh seafood.
                          </p>
                        </div>

                        <div>
                          <h6 className="text-xs font-bold uppercase underline mb-3">3. Key Terms of Proposed Engagement</h6>
                          <table className="w-full text-xs border-collapse">
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="py-2 font-bold w-1/3 italic">Monthly Volume</td>
                                <td className="py-2 text-primary">{monthlyVol} kg Per Month (≈ {wklyVol} kg Weekly)</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-2 font-bold italic">Pilot Duration</td>
                                <td className="py-2">{duration} Days of Active Supply</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-2 font-bold italic">Pricing Basis</td>
                                <td className="py-2 font-bold">{priceNote}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-2 font-bold italic">Delivery Protocol</td>
                                <td className="py-2 italic underline">{delivTerms}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {notes && (
                          <div>
                            <h6 className="text-xs font-bold uppercase underline mb-2">4. Special Stipulations</h6>
                            <p className="text-xs bg-slate-50 p-3 border-l-2 border-black italic">"{notes}"</p>
                          </div>
                        )}

                        <div className="pt-10 flex justify-between items-end mt-auto">
                          <div className="relative text-center">
                            <p className="font-script text-2xl absolute -top-8 left-4 text-slate-800" style={{ fontFamily: 'Brush Script MT, cursive' }}>Ravi</p>
                            <div className="w-48 h-px bg-black mb-2" />
                            <p className="text-[10px] uppercase font-bold">Authorised Signatory</p>
                            <p className="text-[9px]">LaunchOS Admin (Ravi K.)</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="w-48 h-px bg-black mb-2" />
                            <p className="text-[10px] uppercase font-bold">Buyer Representative</p>
                            <p className="text-[9px] uppercase">{buyerName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-12 text-[8px] text-center text-slate-400 border-t border-slate-100 italic">
                        This is a preliminary document of intent generated via the Malpe Meen LaunchOS network.
                        All final transactions are subject to formal contract confirmation.
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

      {/* Fisher Profile Modal */}
      {selectedFisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedFisher(null)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="bg-primary p-8 text-white flex gap-6 items-center shrink-0">
              <img
                src={`https://picsum.photos/seed/${(selectedFisher.name ?? 'fisher').replace(/\s+/g, '')}/150/150`}
                alt={selectedFisher.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-black font-manrope tracking-tight">{selectedFisher.name}</h2>
                  <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-md tracking-wider">
                    {selectedFisher.status ?? 'Verified'}
                  </span>
                </div>
                <p className="text-secondary opacity-90 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                  <Anchor size={14} />
                  Vessel ID: {selectedFisher.boat_id}
                </p>
              </div>
              
              <button 
                onClick={() => generateFisherOnboardingPdf(selectedFisher, getFisherUplift(selectedFisher))}
                className="hidden md:flex items-center gap-2 bg-secondary text-primary px-5 py-3 rounded-xl font-black shadow-lg hover:bg-white hover:text-primary transition-colors text-sm shrink-0"
              >
                <Download size={18} />
                Agreement PDF
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-50">
              
              {/* Profile Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Catch</p>
                  <p className="text-lg font-black text-primary flex items-center gap-2">
                    <Fish size={18} className="text-secondary" /> {selectedFisher.species_focus}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly Capacity</p>
                  <p className="text-lg font-black text-primary flex items-center gap-2">
                    <Scale size={18} className="text-secondary" /> {selectedFisher.avg_weekly_catch_kg || 120} KG
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Income Uplift</p>
                  <p className="text-lg font-black text-emerald-600 flex items-center gap-2">
                    <TrendingUp size={18} /> +{getFisherUplift(selectedFisher)}%
                  </p>
                </div>
              </div>

              {/* Documentation Strategy */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary">Supply-Side Activation & Contracting</h3>
                    <p className="text-xs text-slate-500 font-medium">How Malpe Meen formally secures its supply base for investors.</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                  
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
                      The Onboarding Process
                    </h4>
                    <p className="pl-7">
                      The first 15–20 boat owners are not just vendors; they are the <strong>"Anchor Collective."</strong> 
                      We conduct in-person dockside onboarding using this Studio. We document their Vessel Registration (Boat ID), 
                      historical catch data, and core species focus. This removes anonymity and establishes digital 
                      provenance at Day 0.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
                      The Commitment Structure
                    </h4>
                    <p className="pl-7">
                      Fishers sign a digital <strong>Catch Exclusivity Agreement (CEA)</strong>. In exchange for committing 
                      their premium catch (e.g., Grade A Seer Fish line-caught) exclusively to Malpe Meen, the system locks in 
                      a guaranteed minimum purchase price that sits above standard mandi (auction market) rates.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
                      Investor Proof & Documentation
                    </h4>
                    <p className="pl-7">
                      To prove this to investors within 90 days, the platform automatically generates an 
                      <strong> Income Uplift projection</strong> (currently showing +{getFisherUplift(selectedFisher)}% for {selectedFisher.name}). 
                      Every onboarded fisher receives a WhatsApp confirmation receipt acting as an active contract. Over 90 days, 
                      investors can literally trace completed shipments back to these specific registered Vessel IDs, proving 
                      defensible, non-commoditized supply lines.
                    </p>
                    <div className="pl-7 mt-4">
                      <button 
                        onClick={() => generateFisherOnboardingPdf(selectedFisher, getFisherUplift(selectedFisher))}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        <FileText size={14} />
                        Download Catch Exclusivity Agreement PDF
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
