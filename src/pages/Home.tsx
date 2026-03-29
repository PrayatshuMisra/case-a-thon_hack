import React, { useEffect, useMemo, useState } from "react";
import {
  Timer,
  Verified,
  Waves,
  Home as HomeIcon,
  Package,
  Truck,
  Sun,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Ship,
  Award,
  Anchor,
  User,
  Phone,
  Building2,
  Fish,
  Scale,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api, type LiveDropProduct } from "@/src/api/client";
import homeBg from "@/src/assets/home-bg.avif";
import logo from "@/src/assets/logo.png";

export const Home = ({
  onNavigate,
  onOrderReserved,
}: {
  onNavigate?: (tab: string) => void;
  onOrderReserved?: (orderId: string) => void;
}) => {
  const [liveProducts, setLiveProducts] = useState<LiveDropProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("Seer Fish");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    apartment_name: "",
    locality: "Whitefield",
    product_name: "Seer Fish",
    quantity_kg: 1,
  });

  // Countdown timer state (initialized to 02:45:12, which is 9912 seconds)
  const [timeLeft, setTimeLeft] = useState(9912);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    api
      .getLiveDrop()
      .then((data) => {
        setLiveProducts(data.products);
        if (data.products.length > 0) {
          setSelectedProduct(data.products[0].product_name);
          setForm((prev) => ({
            ...prev,
            product_name: data.products[0].product_name,
          }));
        }
      })
      .catch(() => {
        setMessage(
          "Live drop service unavailable. You can still reserve manually.",
        );
      });
  }, []);

  const cards = useMemo(() => {
    if (liveProducts.length > 0) {
      return liveProducts.map((item) => ({
        name: item.product_name,
        sci: "Premium Catch",
        price: `₹${Math.round(item.current_price)}`,
        old: `₹${Math.round(item.base_price)}`,
        score: Math.round(item.freshness_score),
        boat: item.source_boat,
        img: item.product_name.toLowerCase().replace(/\s+/g, ""),
        stock: Math.floor(Math.random() * 10) + 2, // Mock stock for urgency
      }));
    }
    return [
      {
        name: "Seer Fish",
        sci: "Scomberomorus guttatus",
        price: "₹949",
        old: "₹1,200",
        score: 94,
        boat: "MAL-74",
        img: "seer",
        stock: 4,
      },
      {
        name: "Silver Pomfret",
        sci: "Pampus argenteus",
        price: "₹1,199",
        old: "₹1,450",
        score: 96,
        boat: "MAL-31",
        img: "pomfret",
        stock: 2,
      },
      {
        name: "Tiger Prawns",
        sci: "Penaeus monodon",
        price: "₹649",
        old: "₹850",
        score: 92,
        boat: "MAL-88",
        img: "prawns",
        stock: 8,
      },
    ];
  }, [liveProducts]);

  const reserveProduct = (productName: string) => {
    setSelectedProduct(productName);
    setForm((prev) => ({ ...prev, product_name: productName }));
    document
      .getElementById("reserve-form")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmitReserve = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await api.reserveOrder(form);
      onOrderReserved?.(result.order_id);
      
      // Dispatch confirmation SMS
      try {
        await api.sendSms({
          phone: form.phone,
          message: `Your Malpe Meen order for ${form.product_name} is confirmed! Tracking ID: ${result.order_id.slice(0, 8)}`
        });
      } catch (err) {
        console.error("Failed to send order confirmation SMS", err);
      }

      setMessage(
        `🎉 Order reserved successfully! Tracking ID: ${result.order_id.slice(0, 8)}`,
      );
      
      // Fire and forget SMS
      api.sendSms({
        phone: form.phone,
        message: `Hi ${form.customer_name}, your catch of ${form.quantity_kg}kg ${form.product_name} is secured! Tracking ID: ${result.order_id.slice(0, 8)}. We will update you on the shipment.`
      }).catch(console.error);

      setTimeout(() => onNavigate?.("logistics"), 1500);
    } catch (error) {
      setMessage("Reservation failed. Please verify details and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative pb-24">
      {/* Fixed Full Page Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={homeBg}
          alt="Malpe Coast"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-white/65"></div>
      </div>

      <div className="relative z-10 space-y-32">
        {/* Hero Section - Removed Blue Background & Updated Text Colors */}
        <header className="relative min-h-[85vh] flex items-center overflow-hidden pb-16 pt-20">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl space-y-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-md text-primary font-bold text-sm shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Fresh from Malpe. At your apartment by sunrise.
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-8xl font-manrope font-extrabold tracking-tighter text-primary leading-[1.1] flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <img src={logo} alt="Malpe Meen" className="w-24 sm:w-32 md:w-48 drop-shadow-md" />
                <div>
                  Malpe Meen <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-500">
                    LaunchOS
                  </span>
                </div>
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 max-w-2xl font-light leading-relaxed">
                Premium, traceable seafood sourced directly from Malpe fishing
                families and delivered with{" "}
                <span className="font-semibold text-primary">
                  AI-driven freshness intelligence
                </span>
                .
              </p>

              <div className="flex flex-wrap gap-5 pt-4">
                <button
                  onClick={() => reserveProduct(selectedProduct)}
                  className="px-8 py-4 bg-secondary text-white rounded-2xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(var(--secondary-rgb),0.8)] hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(var(--secondary-rgb),1)] transition-all duration-300 flex items-center gap-2"
                >
                  Reserve Today's Catch
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => onNavigate?.("logistics")}
                  className="px-8 py-4 bg-white/60 text-primary backdrop-blur-md rounded-2xl font-bold text-lg border border-primary/10 hover:bg-white/90 transition-all duration-300"
                >
                  Track Active Fleet
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Floating Stats Section */}
        <section className="container mx-auto px-6 -mt-16 md:-mt-32 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Live Drops",
                value: liveProducts.length || 3,
                sub: "Active seafood varieties today",
                icon: Fish,
              },
              {
                label: "Freshness Promise",
                value: "> 90",
                sub: "AI-scored premium threshold",
                icon: ShieldCheck,
              },
              {
                label: "Traceability",
                value: "100%",
                sub: "Boat-to-door provenance",
                icon: MapPin,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary/10 transition-all">
                  <stat.icon
                    size={24}
                    className="text-primary group-hover:text-secondary transition-colors"
                  />
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">
                  {stat.label}
                </p>
                <p className="text-4xl font-black text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Catch Section */}
        <section className="container mx-auto px-6 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Drops</span>
                </div>
                <div className="h-px w-12 bg-slate-200"></div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Malpe Harbor Hub</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-manrope font-extrabold text-primary mb-6 tracking-tight leading-none">
                Today's <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-600">Flash Drop</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Real-time availability from the morning landings. Limited quantities prioritized for subscriber apartments with <span className="text-primary font-bold decoration-secondary/30 decoration-4 underline-offset-4 underline">AI-verified freshness</span>.
              </p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white border border-red-100 px-8 py-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <Timer className="animate-pulse" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em] mb-1">
                    Booking Window
                  </p>
                  <p className="text-3xl font-black text-red-600 font-mono tracking-tighter tabular-nums drop-shadow-sm">
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Fleet Marquee */}
          <div className="relative mb-16 py-4 border-y border-slate-100 bg-slate-50/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
            
            <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
              {[...Array(2)].map((_, idx) => (
                <div key={idx} className="flex gap-12 items-center">
                  <div className="flex items-center gap-2 text-primary/60 font-bold text-sm">
                    <Ship size={16} className="text-secondary" />
                    <span>BOAT MAL-74 JUST LANDED 450KG SEER FISH</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  <div className="flex items-center gap-2 text-primary/60 font-bold text-sm">
                    <Truck size={16} className="text-secondary" />
                    <span>TEMP CONTROLLED TRUCK DEPARTING FOR WHITEFIELD</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <Verified size={16} />
                    <span>NEW GRADE A+ POMFRET DROP JUST IDENTIFIED</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  <div className="flex items-center gap-2 text-primary/60 font-bold text-sm">
                    <Anchor size={16} className="text-secondary" />
                    <span>BOAT MAL-31 DOCKING IN 15 MINS</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {cards.map((item, i) => (
              <div
                key={i}
                className="group relative bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col premium-hover"
              >
                <div className="relative h-72 overflow-hidden shimmer-effect">
                  <img
                    src={`https://picsum.photos/seed/${item.img}/800/600`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>

                  <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl animate-flash border border-white">
                      <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                      Flash Drop
                    </div>
                    {item.stock < 5 && (
                      <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl animate-flash">
                        <TrendingUp size={14} />
                        Only {item.stock} left
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2.5 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-lg group-hover:bg-white/30 transition-colors">
                      <Ship size={16} className="text-secondary" />
                      <span className="text-xs font-black tracking-wider uppercase">
                        Vessel: {item.boat}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 md:p-8 lg:p-10 flex flex-col flex-grow relative">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 md:mb-8">
                    <div className="min-w-0">
                      <h3 className="text-2xl md:text-3xl font-manrope font-black text-primary mb-1 tracking-tight truncate sm:whitespace-normal">
                        {item.name}
                      </h3>
                      <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                        {item.sci}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-xs md:text-sm line-through text-slate-300 font-bold decoration-red-500/20">
                        {item.old}
                      </span>
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <p className="text-2xl md:text-3xl font-black text-primary tracking-tighter">
                          {item.price}
                        </p>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                          /kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50/50 border border-slate-100 rounded-3xl mb-8 md:mb-10 group-hover:bg-primary/5 transition-colors gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
                        <Award size={20} className="text-emerald-500 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5 leading-none">
                          Fresh Score
                        </p>
                        <p className="text-lg md:text-xl font-black text-primary leading-none tracking-tight mt-1">
                          {item.score}<span className="text-slate-300 text-xs md:text-sm">/100</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                        Grade A+
                      </span>
                      <p className="text-[8px] md:text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Verified AI Audit</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => reserveProduct(item.name)}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-secondary hover:text-primary transition-all duration-500 shadow-2xl hover:scale-[1.02] active:scale-95"
                    >
                      Reserve This Catch
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Journey Section */}
        <section className="py-32 relative overflow-hidden rounded-[3rem] mx-6 bg-white/40 backdrop-blur-md border border-white/60 shadow-xl">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-manrope font-extrabold text-primary mb-6 tracking-tight">
                The Cold-Chain Journey
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
                From the deep waters of the Arabian Sea to your kitchen in
                Bangalore, tracked with surgical precision.
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Connecting Line */}
              <div className="absolute top-8 left-10 right-10 h-1 bg-gradient-to-r from-slate-200 via-secondary to-slate-200 hidden md:block rounded-full"></div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {[
                  {
                    label: "Caught at Sea",
                    sub: "Satellite precision",
                    icon: Waves,
                  },
                  { label: "Landed", sub: "Quality graded", icon: Anchor },
                  { label: "Packed", sub: "Tracked at 2°C", icon: Package },
                  { label: "Transit", sub: "Thermal monitored", icon: Truck },
                  {
                    label: "Delivered",
                    sub: "Sunrise arrival",
                    icon: HomeIcon,
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="relative z-10 text-center flex flex-col items-center group"
                  >
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-md border-4 transition-all duration-500 group-hover:scale-110",
                        i === 4
                          ? "bg-secondary border-secondary text-white shadow-secondary/40"
                          : "bg-white border-slate-200 text-slate-400 group-hover:border-secondary group-hover:text-secondary group-hover:shadow-secondary/20",
                      )}
                    >
                      <step.icon size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-primary">
                      {step.label}
                    </h4>
                    <p className="text-slate-500 text-sm max-w-[120px] font-medium">
                      {step.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-6xl mx-auto bg-white/40 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-white/60">
            <div className="flex-1 p-6 md:p-10 lg:p-16 bg-white/30">
              <div className="mb-10">
                <h2 className="text-4xl font-manrope font-extrabold text-primary mb-4 tracking-tight drop-shadow-sm">
                  Secure Your Catch
                </h2>

                <p className="text-slate-800 text-lg font-medium drop-shadow-sm">
                  Enter details to lock in your priority morning drop.{" "}
                  <span className="font-extrabold text-primary">
                    No payment until fulfillment.
                  </span>
                </p>
              </div>

              <form
                id="reserve-form"
                onSubmit={onSubmitReserve}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <input
                      value={form.customer_name}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          customer_name: e.target.value,
                        }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold placeholder:text-slate-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold placeholder:text-slate-500"
                      placeholder="+91 98XXX XXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Apartment / Villa Name
                  </label>

                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <input
                      value={form.apartment_name}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          apartment_name: e.target.value,
                        }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold placeholder:text-slate-500"
                      placeholder="Sobha Windsor"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Bangalore Locality
                  </label>

                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <select
                      value={form.locality}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, locality: e.target.value }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold appearance-none"
                    >
                      <option>Whitefield</option>

                      <option>Indiranagar</option>

                      <option>HSR Layout</option>

                      <option>Koramangala</option>

                      <option>Bellandur</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Select Catch
                  </label>

                  <div className="relative">
                    <Fish
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <select
                      value={form.product_name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, product_name: e.target.value }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold appearance-none"
                    >
                      {(liveProducts.length > 0
                        ? liveProducts
                        : (cards as any)
                      ).map((item: any) => (
                        <option key={item.name ?? item.product_name}>
                          {item.name ?? item.product_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 ml-1 drop-shadow-sm">
                    Quantity (kg)
                  </label>

                  <div className="relative">
                    <Scale
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={20}
                    />

                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={form.quantity_kg}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          quantity_kg: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/50 shadow-inner rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none text-primary font-bold"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-primary/90 backdrop-blur-md border border-white/20 text-white rounded-xl font-black text-xl shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] hover:bg-primary hover:shadow-[0_0_60px_-15px_rgba(var(--primary-rgb),0.8)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        Securing Order...
                      </>
                    ) : (
                      <>
                        Reserve My Catch
                        <CheckCircle2 size={24} className="text-secondary" />
                      </>
                    )}
                  </button>

                  {message && (
                    <div
                      className={cn(
                        "mt-4 p-4 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md",
                        message.includes("failed")
                          ? "bg-red-50/80 text-red-700 border border-red-200"
                          : "bg-green-50/80 text-green-800 border border-green-200",
                      )}
                    >
                      {message}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="w-full lg:w-[45%] bg-primary p-12 lg:p-16 relative flex flex-col justify-end overflow-hidden text-white">
              <img
                src="https://picsum.photos/seed/seafood-chef/800/1200"
                alt="Premium Seafood"
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>

              <div className="relative z-10 space-y-10">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-[2rem] shadow-2xl relative">
                  <div className="absolute -top-6 -left-2 text-6xl text-secondary opacity-50 font-serif">
                    "
                  </div>

                  <p className="text-xl italic font-light leading-relaxed text-blue-50 relative z-10">
                    The transparency is unmatched. Knowing exactly which boat
                    caught my Seer fish makes the Sunday curry taste even
                    better. Quality you can literally track.
                  </p>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xl">
                      AV
                    </div>

                    <div>
                      <p className="font-bold text-lg">Aditya Verma</p>

                      <p className="text-blue-200 text-sm font-medium">
                        Sobha Dream Acres Resident
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-4xl font-black text-secondary">2.4k+</p>

                    <p className="text-xs uppercase font-bold tracking-widest text-blue-200 mt-1">
                      Active Homes
                    </p>
                  </div>

                  <div>
                    <p className="text-4xl font-black text-secondary">
                      4.9<span className="text-2xl text-blue-200">/5</span>
                    </p>

                    <p className="text-xs uppercase font-bold tracking-widest text-blue-200 mt-1">
                      Trust Score
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
