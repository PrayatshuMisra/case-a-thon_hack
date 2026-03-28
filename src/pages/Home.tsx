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
      setMessage(
        `🎉 Order reserved successfully! Tracking ID: ${result.order_id.slice(0, 8)}`,
      );
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

              <h1 className="text-6xl md:text-8xl font-manrope font-extrabold tracking-tighter text-primary leading-[1.1] flex items-center gap-4 md:gap-6">
                <img src={logo} alt="Malpe Meen" className="w-26 md:w-48 drop-shadow-md" />
                <div>
                  Malpe Meen <br />
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
        <section className="container mx-auto px-6 -mt-32 relative z-20">
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
        <section className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-manrope font-extrabold text-primary mb-4 tracking-tight">
                Today's Flash Drop
              </h2>
              <p className="text-slate-500 text-lg">
                Real-time availability from the morning landings. Limited
                quantities prioritized for subscriber apartments.
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Timer className="text-red-500 animate-pulse" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-red-500 tracking-wider">
                  Window Closing In
                </p>
                <p className="text-2xl font-black text-red-600 font-mono tracking-tight">
                  02:45:12
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((item, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl hover:ring-2 hover:ring-secondary/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${item.img}/600/400`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-80"></div>

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                      Flash Drop
                    </span>
                    {item.stock < 5 && (
                      <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                        <TrendingUp size={12} />
                        Only {item.stock} left
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <Ship size={14} className="text-secondary" />
                      <span className="text-xs font-medium">
                        Boat: {item.boat}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-manrope font-bold text-primary mb-1">
                        {item.name}
                      </h3>
                      <p className="text-slate-500 text-sm italic">
                        {item.sci}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm line-through text-slate-400 font-medium">
                        {item.old}
                      </span>
                      <p className="text-2xl font-black text-primary">
                        {item.price}
                        <span className="text-sm font-normal text-slate-500">
                          /kg
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Award size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          AI Freshness
                        </p>
                        <p className="text-lg font-black text-primary leading-none">
                          {item.score}/100
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Grade A+
                    </span>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => reserveProduct(item.name)}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary hover:text-primary transition-all duration-300 shadow-md"
                    >
                      Reserve Now
                      <ArrowRight size={18} />
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

        <section className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-white/60">
            <div className="flex-1 p-10 lg:p-16 bg-white/30">
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
