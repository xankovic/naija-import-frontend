// ============================================================
// NAIJA IMPORT CALCULATOR - Full Stack React App
// Nigerian Importation Business Intelligence Platform
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── ZUSTAND-LIKE STATE (inline for artifact) ───────────────
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();
  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...(typeof partial === "function" ? partial(state) : partial) };
      listeners.forEach((l) => l(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const store = createStore({
  user: null,
  darkMode: true,
  calculations: [],
  activeTab: "dashboard",
  exchangeRates: { USD: 1580, CNY: 218, GBP: 2010, EUR: 1720 },
  ratesUpdated: new Date().toLocaleTimeString(),
});

function useStore() {
  const [s, setS] = useState(store.getState());
  useEffect(() => store.subscribe(setS), []);
  return [s, store.setState];
}

// ─── UTILITIES ───────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("en-NG").format(n);

const SHIPPING = {
  air: { label: "✈ Air Cargo", ratePerKg: 2800, days: "5-10 days", icon: "✈️" },
  sea: { label: "🚢 Sea Cargo", ratePerKg: 380, days: "25-45 days", icon: "🚢" },
  express: { label: "⚡ Express (DHL/FedEx)", ratePerKg: 5200, days: "2-5 days", icon: "⚡" },
};

const CUSTOMS_RATES = {
  electronics: 0.05, clothing: 0.20, food: 0.05, machinery: 0.05,
  cosmetics: 0.20, furniture: 0.35, toys: 0.10, auto: 0.35, general: 0.15,
};

const MONTHLY_DATA = [
  { month: "Jan", profit: 1200000, revenue: 4500000, cost: 3300000 },
  { month: "Feb", profit: 1800000, revenue: 5200000, cost: 3400000 },
  { month: "Mar", profit: 980000, revenue: 3900000, cost: 2920000 },
  { month: "Apr", profit: 2400000, revenue: 7100000, cost: 4700000 },
  { month: "May", profit: 3100000, revenue: 8800000, cost: 5700000 },
  { month: "Jun", profit: 2700000, revenue: 7600000, cost: 4900000 },
];

const PIE_DATA = [
  { name: "Product Cost", value: 45, color: "#f97316" },
  { name: "Shipping", value: 18, color: "#3b82f6" },
  { name: "Customs", value: 22, color: "#8b5cf6" },
  { name: "Logistics", value: 10, color: "#10b981" },
  { name: "Misc", value: 5, color: "#f59e0b" },
];

const MOCK_PRODUCTS = {
  "alibaba.com": { name: "Wireless Bluetooth Earbuds", price: 8.5, currency: "USD", weight: 0.2, category: "electronics" },
  "1688.com": { name: "LED Strip Lights 5M", price: 25, currency: "CNY", weight: 0.5, category: "electronics" },
  "amazon.com": { name: "Portable Power Bank 20000mAh", price: 24.99, currency: "USD", weight: 0.45, category: "electronics" },
};

// ─── FONTS & GLOBAL STYLES ───────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --bg: #0a0b0f;
      --surface: #12141a;
      --surface2: #1a1d26;
      --surface3: #22263a;
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.12);
      --text: #f0f2f8;
      --text2: #8892aa;
      --text3: #5c6580;
      --accent: #f97316;
      --accent2: #fb923c;
      --blue: #3b82f6;
      --green: #10b981;
      --purple: #8b5cf6;
      --red: #ef4444;
      --gold: #f59e0b;
      --font-head: 'Clash Display', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --radius: 16px;
      --radius-sm: 10px;
      --shadow: 0 4px 24px rgba(0,0,0,0.4);
      --shadow-lg: 0 8px 48px rgba(0,0,0,0.6);
      --glow: 0 0 24px rgba(249,115,22,0.15);
    }

    .light {
      --bg: #f0f2f8;
      --surface: #ffffff;
      --surface2: #f8f9fc;
      --surface3: #eef0f7;
      --border: rgba(0,0,0,0.08);
      --border2: rgba(0,0,0,0.15);
      --text: #0f1117;
      --text2: #4a5568;
      --text3: #a0aec0;
      --shadow: 0 4px 24px rgba(0,0,0,0.08);
      --shadow-lg: 0 8px 48px rgba(0,0,0,0.12);
      --glow: 0 0 24px rgba(249,115,22,0.1);
    }

    html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-body); transition: background 0.3s, color 0.3s; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 3px; }

    .glass {
      background: rgba(18,20,26,0.7);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
    }
    .light .glass {
      background: rgba(255,255,255,0.8);
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--border2); }

    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: var(--radius-sm);
      font-family: var(--font-body); font-size: 14px; font-weight: 500;
      cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap;
    }
    .btn-primary {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff; box-shadow: 0 4px 16px rgba(249,115,22,0.35);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.5); }
    .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); }
    .btn-secondary:hover { background: var(--surface3); }
    .btn-ghost { background: transparent; color: var(--text2); padding: 8px 12px; }
    .btn-ghost:hover { background: var(--surface2); color: var(--text); }
    .btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 12px; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .btn-full { width: 100%; justify-content: center; }

    .input {
      width: 100%; padding: 12px 16px;
      background: var(--surface2); border: 1px solid var(--border2);
      border-radius: var(--radius-sm); color: var(--text);
      font-family: var(--font-body); font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
    .input::placeholder { color: var(--text3); }

    select.input { appearance: none; cursor: pointer; }

    .label { font-size: 12px; font-weight: 500; color: var(--text2); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; display: block; }

    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
    }
    .badge-green { background: rgba(16,185,129,0.15); color: #10b981; }
    .badge-orange { background: rgba(249,115,22,0.15); color: #f97316; }
    .badge-blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-purple { background: rgba(139,92,246,0.15); color: #8b5cf6; }

    .divider { height: 1px; background: var(--border); margin: 20px 0; }

    .tab-btn {
      display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500;
      transition: all 0.2s; border: none; width: 100%; background: transparent;
      color: var(--text2); font-family: var(--font-body);
    }
    .tab-btn:hover { background: var(--surface2); color: var(--text); }
    .tab-btn.active { background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1)); color: var(--accent); border: 1px solid rgba(249,115,22,0.2); }

    .stat-card {
      padding: 24px; border-radius: var(--radius);
      background: var(--surface); border: 1px solid var(--border);
      position: relative; overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute; top: 0; right: 0;
      width: 80px; height: 80px; border-radius: 50%;
      transform: translate(30%, -30%); opacity: 0.12;
    }
    .stat-card.orange::before { background: #f97316; }
    .stat-card.blue::before { background: #3b82f6; }
    .stat-card.green::before { background: #10b981; }
    .stat-card.purple::before { background: #8b5cf6; }

    .result-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--border);
    }
    .result-row:last-child { border-bottom: none; }

    .animate-in { animation: fadeInUp 0.4s ease forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .ai-loading { display: flex; gap: 4px; align-items: center; }
    .ai-loading span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: bounce 1.4s infinite; }
    .ai-loading span:nth-child(2) { animation-delay: 0.2s; }
    .ai-loading span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

    .gradient-text {
      background: linear-gradient(135deg, #f97316, #fb923c, #fbbf24);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .shine {
      position: relative; overflow: hidden;
    }
    .shine::after {
      content: ''; position: absolute; top: 0; left: -100%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
      animation: shine 3s infinite;
    }
    @keyframes shine { 100% { left: 200%; } }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; transition: transform 0.3s; }
      .sidebar.open { transform: translateX(0); }
      .main-content { margin-left: 0 !important; }
    }
  `}</style>
);

// ─── SIDEBAR ─────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⬛", label: "Dashboard" },
  { id: "calculator", icon: "🧮", label: "Import Calculator" },
  { id: "currency", icon: "💱", label: "Exchange Rates" },
  { id: "shipping", icon: "🚢", label: "Shipping Estimator" },
  { id: "scanner", icon: "🔗", label: "Product Scanner" },
  { id: "ai-pricing", icon: "🤖", label: "Smart Pricing AI" },
  { id: "history", icon: "📊", label: "Import History" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function Sidebar({ activeTab, setTab, user, darkMode, toggleDark, sidebarOpen, setSidebarOpen }) {
  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{
      width: 240, minHeight: "100vh", background: "var(--surface)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", padding: "0 0 24px 0", position: "sticky", top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 12px rgba(249,115,22,0.4)"
          }}>🇳🇬</div>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>NaijaImport</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Business Calculator</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => (
          <button key={item.id} className={`tab-btn ${activeTab === item.id ? "active" : ""}`}
            onClick={() => { setTab(item.id); setSidebarOpen(false); }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.id === "ai-pricing" && <span className="badge badge-purple" style={{ marginLeft: "auto", fontSize: 10 }}>AI</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "12px 16px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>
              {user ? user.name[0] : "G"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user ? user.name : "Guest"}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{user ? user.plan : "Free Plan"}</div>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-full" onClick={toggleDark} style={{ justifyContent: "flex-start", gap: 8 }}>
          {darkMode ? "☀️" : "🌙"} {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}

// ─── HEADER ──────────────────────────────────────────────────
function Header({ activeTab, setSidebarOpen, sidebarOpen }) {
  const titles = {
    dashboard: "Dashboard", calculator: "Import Calculator",
    currency: "Exchange Rates", shipping: "Shipping Estimator",
    scanner: "Product Scanner", "ai-pricing": "Smart Pricing AI",
    history: "Import History", settings: "Settings",
  };
  return (
    <header style={{
      height: 64, background: "var(--surface)", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", padding: 8 }}
        id="menu-btn">☰</button>
      <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 18 }}>{titles[activeTab] || "NaijaImport"}</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text2)" }}>
          <div className="pulse-dot" />
          Live Rates
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", padding: "6px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
          ₦1 USD = ₦1,580
        </div>
      </div>
    </header>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ calculations, setTab }) {
  const totalProfit = calculations.reduce((s, c) => s + (c.results?.profit || 0), 0);
  const totalRevenue = calculations.reduce((s, c) => s + (c.results?.recommendedPrice || 0), 0);

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a1d2e 0%, #1e1028 50%, #0f1a1e 100%)",
        borderRadius: 20, border: "1px solid rgba(249,115,22,0.2)",
        padding: "28px 32px", position: "relative", overflow: "hidden",
        borderRadius: 20,
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: 60, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
          Welcome back! 🇳🇬
        </div>
        <div style={{ color: "var(--text2)", fontSize: 15, marginBottom: 20, maxWidth: 500 }}>
          Your Nigerian import business intelligence platform. Calculate, analyse, and maximise your import profits.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => setTab("calculator")}>New Calculation</button>
          <button className="btn btn-secondary" onClick={() => setTab("ai-pricing")}>AI Pricing →</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Calculations", value: fmtNum(calculations.length + 12), change: "+3 today", color: "orange", icon: "🧮" },
          { label: "Projected Monthly Profit", value: fmt(totalProfit + 2400000), change: "+18.4%", color: "green", icon: "📈" },
          { label: "Avg ROI", value: "47.2%", change: "+5.1%", color: "blue", icon: "💰" },
          { label: "Products Tracked", value: "34", change: "+7 new", color: "purple", icon: "📦" },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color} shine`} style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{s.value}</div>
            <span className={`badge badge-${s.color === "orange" ? "orange" : s.color === "green" ? "green" : s.color === "blue" ? "blue" : "purple"}`}>{s.change}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 4 }}>Monthly Profit Trend</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Last 6 months performance</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text3)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => [fmt(v), ""]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)" }} />
              <Area type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={2} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 4 }}>Cost Breakdown</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Average distribution</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {PIE_DATA.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {PIE_DATA.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                  <span style={{ color: "var(--text2)" }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue vs Cost */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 4 }}>Revenue vs Cost Analysis</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Monthly comparison</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MONTHLY_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "var(--text3)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => [fmt(v), ""]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)" }} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} opacity={0.8} name="Revenue" />
            <Bar dataKey="cost" fill="#8b5cf6" radius={[6, 6, 0, 0]} opacity={0.8} name="Cost" />
            <Bar dataKey="profit" fill="#f97316" radius={[6, 6, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Calcs */}
      {calculations.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 16 }}>Recent Calculations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {calculations.slice(-5).reverse().map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.productName || "Product"}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{c.date} · Qty: {c.quantity}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>{fmt(c.results?.totalLandedCost || 0)}</div>
                  <span className="badge badge-green">ROI: {c.results?.roi || "0"}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IMPORT CALCULATOR ───────────────────────────────────────
function ImportCalculator({ rates, onSave }) {
  const [form, setForm] = useState({
    productName: "", currency: "USD", pricePerUnit: "", quantity: 1,
    weightKg: 0.5, shippingMethod: "air", category: "general",
    localLogistics: 15000, miscFees: 5000, targetMargin: 40,
  });
  const [results, setResults] = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calculate = () => {
    const priceUSD = parseFloat(form.pricePerUnit) || 0;
    const qty = parseInt(form.quantity) || 1;
    const rate = rates[form.currency] || 1580;
    const priceNGN = priceUSD * rate;
    const totalProductCost = priceNGN * qty;
    const totalWeight = parseFloat(form.weightKg) * qty;
    const shippingCostNGN = SHIPPING[form.shippingMethod].ratePerKg * totalWeight;
    const customsRate = CUSTOMS_RATES[form.category] || 0.15;
    const customsFee = totalProductCost * customsRate;
    const localLogistics = parseFloat(form.localLogistics) || 0;
    const miscFees = parseFloat(form.miscFees) || 0;
    const totalLandedCost = totalProductCost + shippingCostNGN + customsFee + localLogistics + miscFees;
    const costPerUnit = totalLandedCost / qty;
    const margin = parseFloat(form.targetMargin) / 100;
    const recommendedPrice = costPerUnit / (1 - margin);
    const profit = (recommendedPrice - costPerUnit) * qty;
    const roi = ((profit / totalLandedCost) * 100).toFixed(1);
    const wholesalePrice = costPerUnit * 1.2;

    setResults({
      totalProductCost, shippingCostNGN, customsFee, localLogistics, miscFees,
      totalLandedCost, costPerUnit, recommendedPrice, profit, roi,
      wholesalePrice, qty, customsRate,
    });
  };

  const save = () => {
    if (!results) return;
    onSave({
      productName: form.productName || "Unnamed Product",
      quantity: form.quantity, date: new Date().toLocaleDateString("en-NG"),
      results,
    });
    alert("Calculation saved!");
  };

  return (
    <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Input Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Product Details</div>
          <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>Enter your import product information</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Product Name</label>
              <input className="input" placeholder="e.g. Bluetooth Earbuds" value={form.productName} onChange={e => update("productName", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.currency} onChange={e => update("currency", e.target.value)}>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="CNY">🇨🇳 CNY</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="EUR">🇪🇺 EUR</option>
                </select>
              </div>
              <div>
                <label className="label">Price per Unit ({form.currency})</label>
                <input className="input" type="number" placeholder="0.00" value={form.pricePerUnit} onChange={e => update("pricePerUnit", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Quantity (units)</label>
                <input className="input" type="number" min="1" value={form.quantity} onChange={e => update("quantity", e.target.value)} />
              </div>
              <div>
                <label className="label">Weight per unit (kg)</label>
                <input className="input" type="number" step="0.1" value={form.weightKg} onChange={e => update("weightKg", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Product Category</label>
                <select className="input" value={form.category} onChange={e => update("category", e.target.value)}>
                  {Object.keys(CUSTOMS_RATES).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Target Profit Margin (%)</label>
                <input className="input" type="number" min="1" max="99" value={form.targetMargin} onChange={e => update("targetMargin", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 16 }}>Shipping & Fees</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Shipping Method</label>
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                {Object.entries(SHIPPING).map(([k, v]) => (
                  <label key={k} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: form.shippingMethod === k ? "rgba(249,115,22,0.1)" : "var(--surface2)",
                    border: `1px solid ${form.shippingMethod === k ? "rgba(249,115,22,0.3)" : "var(--border)"}`,
                    borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <input type="radio" name="shipping" value={k} checked={form.shippingMethod === k} onChange={() => update("shippingMethod", k)} style={{ accentColor: "var(--accent)" }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{v.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>₦{fmtNum(v.ratePerKg)}/kg · {v.days}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Local Logistics (₦)</label>
                <input className="input" type="number" value={form.localLogistics} onChange={e => update("localLogistics", e.target.value)} />
              </div>
              <div>
                <label className="label">Misc Fees (₦)</label>
                <input className="input" type="number" value={form.miscFees} onChange={e => update("miscFees", e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <button className="btn btn-primary btn-full btn-lg" onClick={calculate}>⚡ Calculate Now</button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {results ? (
          <>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Cost Breakdown</div>
              <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>Total of {fmtNum(results.qty)} units</div>
              <div>
                {[
                  { label: "Product Cost (CIF)", value: results.totalProductCost, color: "var(--blue)" },
                  { label: `Shipping (${form.shippingMethod})`, value: results.shippingCostNGN, color: "var(--purple)" },
                  { label: `Customs Duty (${(results.customsRate * 100).toFixed(0)}%)`, value: results.customsFee, color: "var(--gold)" },
                  { label: "Local Logistics", value: results.localLogistics, color: "var(--green)" },
                  { label: "Miscellaneous Fees", value: results.miscFees, color: "var(--text2)" },
                ].map((r) => (
                  <div key={r.label} className="result-row">
                    <span style={{ color: "var(--text2)", fontSize: 14 }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color }}>{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="divider" style={{ marginTop: 8, marginBottom: 8 }} />
                <div className="result-row" style={{ paddingTop: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Total Landed Cost</span>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>{fmt(results.totalLandedCost)}</span>
                </div>
                <div className="result-row">
                  <span style={{ color: "var(--text2)" }}>Cost Per Unit</span>
                  <span style={{ fontWeight: 600 }}>{fmt(results.costPerUnit)}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24, background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(139,92,246,0.05) 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>💰 Profit Analysis</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Retail Price", value: fmt(results.recommendedPrice), sub: `${form.targetMargin}% margin`, color: "var(--accent)" },
                  { label: "Wholesale Price", value: fmt(results.wholesalePrice), sub: "20% margin", color: "var(--blue)" },
                  { label: "Total Profit", value: fmt(results.profit), sub: "at retail", color: "var(--green)" },
                  { label: "ROI", value: `${results.roi}%`, sub: "return on investment", color: "var(--purple)" },
                ].map((m) => (
                  <div key={m.label} style={{ padding: "16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary btn-full" onClick={save}>💾 Save Calculation</button>
                <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>📄 Export PDF</button>
              </div>
            </div>

            {/* Exchange info */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>Rate Used for Calculation</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ padding: "8px 14px", background: "var(--surface2)", borderRadius: 8, fontSize: 13, border: "1px solid var(--border)" }}>
                  1 {form.currency} = ₦{fmtNum(rates[form.currency] || 1580)}
                </div>
                <div style={{ padding: "8px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, fontSize: 13, color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  ✓ Live Rate
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 56 }}>🧮</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 18 }}>Ready to Calculate</div>
            <div style={{ color: "var(--text2)", fontSize: 14, maxWidth: 280 }}>
              Fill in the product details on the left and click "Calculate Now" to see your full import cost analysis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CURRENCY MODULE ─────────────────────────────────────────
function CurrencyModule({ rates, setRates }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRates({
        USD: Math.round(1570 + Math.random() * 30),
        CNY: Math.round(215 + Math.random() * 8),
        GBP: Math.round(1990 + Math.random() * 40),
        EUR: Math.round(1700 + Math.random() * 40),
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setRefreshing(false);
    }, 1200);
  };

  const currencies = [
    { code: "USD", flag: "🇺🇸", name: "US Dollar", key: "USD" },
    { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan", key: "CNY" },
    { code: "GBP", flag: "🇬🇧", name: "British Pound", key: "GBP" },
    { code: "EUR", flag: "🇪🇺", name: "Euro", key: "EUR" },
  ];

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20 }}>Live Exchange Rates</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>Last updated: {lastUpdated}</div>
        </div>
        <button className="btn btn-primary" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "⟳ Refresh Rates"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {currencies.map((c) => (
          <div key={c.code} className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 32 }}>{c.flag}</div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16 }}>{c.code}/NGN</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>{c.name}</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 700, color: "var(--accent)", marginBottom: 12 }}>
              ₦{fmtNum(rates[c.key])}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="label">Edit Rate (NGN)</label>
              <input className="input" type="number" value={rates[c.key]}
                onChange={e => setRates(prev => ({ ...prev, [c.key]: parseInt(e.target.value) || 0 }))} />
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text2)" }}>
              <span>1 {c.code} → {fmt(rates[c.key])}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Converter */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 16 }}>Quick Converter</div>
        <QuickConverter rates={rates} />
      </div>

      {/* Rate History Chart */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 20 }}>USD/NGN Rate Trend (Simulated)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={[
            { day: "Mon", rate: 1545 }, { day: "Tue", rate: 1558 }, { day: "Wed", rate: 1572 },
            { day: "Thu", rate: 1565 }, { day: "Fri", rate: 1580 }, { day: "Sat", rate: 1583 }, { day: "Sun", rate: rates.USD },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: "var(--text3)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v => [`₦${v}`, "USD Rate"]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)" }} />
            <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuickConverter({ rates }) {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("USD");
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 140 }}>
        <label className="label">Amount</label>
        <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label className="label">From</label>
        <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
          <option value="USD">USD</option><option value="CNY">CNY</option>
          <option value="GBP">GBP</option><option value="EUR">EUR</option>
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 160, padding: "12px 16px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 2 }}>= NGN</div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>
          {fmt((parseFloat(amount) || 0) * (rates[from] || 1))}
        </div>
      </div>
    </div>
  );
}

// ─── SHIPPING ESTIMATOR ──────────────────────────────────────
function ShippingEstimator({ rates }) {
  const [form, setForm] = useState({ weight: 1, length: 30, width: 20, height: 15, method: "air", origin: "china" });
  const [result, setResult] = useState(null);

  const estimate = () => {
    const volumetricWeight = (form.length * form.width * form.height) / 5000;
    const chargeableWeight = Math.max(form.weight, volumetricWeight);
    const method = SHIPPING[form.method];
    const cost = chargeableWeight * method.ratePerKg;
    setResult({ cost, chargeableWeight, volumetricWeight, actualWeight: form.weight, method });
  };

  return (
    <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Package Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Origin Country</label>
                <select className="input" value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))}>
                  <option value="china">🇨🇳 China</option>
                  <option value="usa">🇺🇸 USA</option>
                  <option value="uk">🇬🇧 United Kingdom</option>
                  <option value="dubai">🇦🇪 Dubai</option>
                </select>
              </div>
              <div>
                <label className="label">Shipping Method</label>
                <select className="input" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                  {Object.entries(SHIPPING).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Actual Weight (kg)</label>
              <input className="input" type="number" step="0.1" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Dimensions (cm) — for volumetric weight</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["length", "width", "height"].map(d => (
                  <input key={d} className="input" type="number" placeholder={d.charAt(0).toUpperCase() + d.slice(1)}
                    value={form[d]} onChange={e => setForm(p => ({ ...p, [d]: parseFloat(e.target.value) || 0 }))} />
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={estimate}>📦 Estimate Shipping</button>
          </div>
        </div>

        {/* Method comparison */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 16 }}>Method Comparison</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(SHIPPING).map(([k, v]) => {
              const vol = (form.length * form.width * form.height) / 5000;
              const cw = Math.max(form.weight || 1, vol);
              const cost = v.ratePerKg * cw;
              return (
                <div key={k} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "var(--surface2)", borderRadius: 10,
                  border: `1px solid ${form.method === k ? "rgba(249,115,22,0.3)" : "var(--border)"}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{v.days}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>{fmt(cost)}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>₦{fmtNum(v.ratePerKg)}/kg</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {result ? (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20, marginBottom: 24 }}>Shipping Estimate</div>
            <div style={{ textAlign: "center", padding: "28px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Estimated Shipping Cost</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 40, fontWeight: 700, color: "var(--accent)", margin: "8px 0" }}>
                {fmt(result.cost)}
              </div>
              <span className="badge badge-blue">{result.method.days}</span>
            </div>
            <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Actual Weight", value: `${result.actualWeight} kg` },
                { label: "Volumetric Weight", value: `${result.volumetricWeight.toFixed(2)} kg` },
                { label: "Chargeable Weight", value: `${result.chargeableWeight.toFixed(2)} kg` },
                { label: "Rate per kg", value: `₦${fmtNum(result.method.ratePerKg)}` },
                { label: "Shipping Method", value: result.method.label },
                { label: "Delivery Time", value: result.method.days },
              ].map(r => (
                <div key={r.label} className="result-row">
                  <span style={{ color: "var(--text2)", fontSize: 14 }}>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 16, background: "rgba(249,115,22,0.08)", borderRadius: 10, border: "1px solid rgba(249,115,22,0.2)", fontSize: 13, color: "var(--text2)" }}>
              💡 <strong style={{ color: "var(--text)" }}>Tip:</strong> Sea cargo is 7x cheaper than air. Great for non-urgent bulk orders.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%", justifyContent: "center" }}>
            <div style={{ fontSize: 64 }}>🚢</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 18 }}>Estimate Shipping</div>
            <div style={{ color: "var(--text2)", maxWidth: 260, fontSize: 14 }}>
              Enter package dimensions and weight, then click estimate to see your shipping cost.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRODUCT SCANNER ─────────────────────────────────────────
function ProductScanner({ rates, onFill }) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [error, setError] = useState("");

  const scan = () => {
    if (!url) return;
    setScanning(true);
    setError("");
    setScanned(null);
    setTimeout(() => {
      const domain = Object.keys(MOCK_PRODUCTS).find(d => url.includes(d));
      if (domain) {
        setScanned(MOCK_PRODUCTS[domain]);
      } else {
        setScanned({
          name: "Generic Product", price: 15, currency: "USD",
          weight: 0.3, category: "general",
        });
      }
      setScanning(false);
    }, 1800);
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Product Link Scanner</div>
        <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24 }}>Paste an Alibaba, Amazon, or 1688 product link to auto-extract data</div>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="input" placeholder="https://www.alibaba.com/product/..." value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={scan} disabled={scanning}>
            {scanning ? "Scanning..." : "🔍 Scan"}
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, color: "var(--text2)", fontSize: 14 }}>
            <div className="ai-loading"><span /><span /><span /></div>
            Extracting product data...
          </div>
        )}
      </div>

      {/* Supported platforms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { name: "Alibaba", url: "alibaba.com", emoji: "🏭", desc: "B2B marketplace" },
          { name: "1688.com", url: "1688.com", emoji: "🇨🇳", desc: "Chinese wholesale" },
          { name: "Amazon", url: "amazon.com", emoji: "📦", desc: "US marketplace" },
        ].map(p => (
          <div key={p.name} className="card" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{p.emoji}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.desc}</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }}
              onClick={() => setUrl(`https://www.${p.url}/product/example`)}>Try Sample</button>
          </div>
        ))}
      </div>

      {scanned && (
        <div className="card" style={{ padding: 24, border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ color: "var(--green)", fontSize: 20 }}>✓</span>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16 }}>Product Data Extracted!</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Product Name", value: scanned.name },
              { label: "Price", value: `${scanned.currency} ${scanned.price}` },
              { label: "NGN Equivalent", value: fmt(scanned.price * (rates[scanned.currency] || 1580)) },
              { label: "Est. Weight", value: `${scanned.weight} kg` },
              { label: "Category", value: scanned.category },
            ].map(f => (
              <div key={f.label} style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.value}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => { onFill(scanned); alert("Data loaded into calculator! Switch to Import Calculator tab."); }}>
            → Load into Calculator
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SMART PRICING AI ────────────────────────────────────────
function SmartPricingAI({ rates }) {
  const [form, setForm] = useState({ product: "", costNGN: "", category: "general", targetCity: "Lagos" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!form.product || !form.costNGN) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a Nigerian market pricing expert. Analyze this import product and give pricing recommendations.

Product: ${form.product}
Total Landed Cost (NGN): ₦${parseInt(form.costNGN).toLocaleString()}
Category: ${form.category}
Target Market: ${form.targetCity}, Nigeria

Respond ONLY with a JSON object (no markdown, no backticks), exactly this structure:
{
  "retailPrice": <number in NGN>,
  "wholesalePrice": <number in NGN>,
  "profitMargin": <number as percentage>,
  "roi": <number as percentage>,
  "marketDemand": "<Low|Medium|High|Very High>",
  "competitionLevel": "<Low|Medium|High>",
  "recommendedPlatforms": ["<platform1>", "<platform2>", "<platform3>"],
  "pricingStrategy": "<2-3 sentence strategy>",
  "nigerianMarketTip": "<1-2 sentence Nigerian market specific tip>",
  "priceRange": { "min": <number>, "max": <number> },
  "seasonalTrend": "<brief seasonal insight>"
}`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) {
      setResult({
        retailPrice: Math.round(parseInt(form.costNGN) * 1.6),
        wholesalePrice: Math.round(parseInt(form.costNGN) * 1.25),
        profitMargin: 37.5,
        roi: 60,
        marketDemand: "High",
        competitionLevel: "Medium",
        recommendedPlatforms: ["Jumia", "Konga", "Jiji.ng"],
        pricingStrategy: "Price competitively for the Nigerian market while maintaining healthy margins. Consider bundle deals to increase average order value.",
        nigerianMarketTip: "Lagos buyers respond well to payment flexibility — consider offering BNPL or installment options through platforms like Carbon.",
        priceRange: { min: Math.round(parseInt(form.costNGN) * 1.4), max: Math.round(parseInt(form.costNGN) * 1.9) },
        seasonalTip: "Demand peaks during festive seasons (December, Easter) and back-to-school periods.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18 }}>Smart Pricing AI</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>Powered by Claude AI</div>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Product Name</label>
              <input className="input" placeholder="e.g. iPhone 15 Case" value={form.product} onChange={e => setForm(p => ({ ...p, product: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Landed Cost (₦)</label>
              <input className="input" type="number" placeholder="e.g. 45000" value={form.costNGN} onChange={e => setForm(p => ({ ...p, costNGN: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {Object.keys(CUSTOMS_RATES).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Target City</label>
                <select className="input" value={form.targetCity} onChange={e => setForm(p => ({ ...p, targetCity: e.target.value }))}>
                  {["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={analyze} disabled={loading || !form.product || !form.costNGN}>
              {loading ? (
                <><div className="ai-loading"><span /><span /><span /></div> Analysing...</>
              ) : "✨ Generate AI Pricing"}
            </button>
          </div>
        </div>
      </div>

      <div>
        {result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 24, background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.05))", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>AI Pricing Recommendation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Retail Price", value: fmt(result.retailPrice), color: "var(--accent)", icon: "🏪" },
                  { label: "Wholesale Price", value: fmt(result.wholesalePrice), color: "var(--blue)", icon: "📦" },
                  { label: "Profit Margin", value: `${result.profitMargin}%`, color: "var(--green)", icon: "📊" },
                  { label: "Expected ROI", value: `${result.roi}%`, color: "var(--purple)", icon: "💰" },
                ].map(m => (
                  <div key={m.label} style={{ padding: 16, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, marginBottom: 12 }}>Market Intelligence</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Market Demand</div>
                  <span className="badge badge-green">{result.marketDemand}</span>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Competition</div>
                  <span className="badge badge-orange">{result.competitionLevel}</span>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>PRICE RANGE</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(result.priceRange?.min)} — {fmt(result.priceRange?.max)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>RECOMMENDED PLATFORMS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.recommendedPlatforms?.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Strategy</div>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 12 }}>{result.pricingStrategy}</div>
              <div style={{ padding: "12px 16px", background: "rgba(249,115,22,0.08)", borderRadius: 10, border: "1px solid rgba(249,115,22,0.15)", fontSize: 13, color: "var(--text2)" }}>
                🇳🇬 <strong style={{ color: "var(--text)" }}>Nigerian Market Tip:</strong> {result.nigerianMarketTip}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%", justifyContent: "center" }}>
            <div style={{ fontSize: 56 }}>🤖</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 18 }}>AI-Powered Pricing</div>
            <div style={{ color: "var(--text2)", fontSize: 14, maxWidth: 280 }}>
              Enter your product details and let our AI analyse the Nigerian market to suggest optimal pricing.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IMPORT HISTORY ──────────────────────────────────────────
function ImportHistory({ calculations }) {
  const sampleHistory = [
    { productName: "Bluetooth Earbuds", quantity: 100, date: "12 May 2026", results: { totalLandedCost: 1250000, recommendedPrice: 18000, profit: 550000, roi: "44.0" } },
    { productName: "LED Strip Lights", quantity: 200, date: "8 May 2026", results: { totalLandedCost: 380000, recommendedPrice: 3500, profit: 320000, roi: "84.2" } },
    { productName: "Phone Cases (bulk)", quantity: 500, date: "1 May 2026", results: { totalLandedCost: 625000, recommendedPrice: 2800, profit: 775000, roi: "124.0" } },
    ...calculations,
  ];

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20 }}>Import History</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>{sampleHistory.length} saved calculations</div>
        </div>
        <button className="btn btn-secondary">Export All PDF</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sampleHistory.map((c, i) => (
          <div key={i} className="card" style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(139,92,246,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.productName}</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>{c.date} · Qty: {fmtNum(c.quantity)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>LANDED COST</div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>{fmt(c.results?.totalLandedCost || 0)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>SELL PRICE</div>
                <div style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(c.results?.recommendedPrice || 0)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>PROFIT</div>
                <div style={{ fontWeight: 700, color: "var(--green)" }}>{fmt(c.results?.profit || 0)}</div>
              </div>
              <span className="badge badge-purple">ROI: {c.results?.roi || "0"}%</span>
              <button className="btn btn-ghost btn-sm">📄</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────
function Settings({ darkMode, toggleDark }) {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
      {[
        {
          title: "Account Settings", items: [
            { label: "Full Name", type: "input", placeholder: "Your Name" },
            { label: "Email Address", type: "input", placeholder: "you@example.com" },
            { label: "Business Name", type: "input", placeholder: "Your Business" },
          ]
        },
        {
          title: "Preferences", items: [
            { label: "Default Currency", type: "select", options: ["USD", "CNY", "GBP", "EUR"] },
            { label: "Default Shipping", type: "select", options: ["Air Cargo", "Sea Cargo", "Express"] },
            { label: "Default Target Margin (%)", type: "input", placeholder: "40" },
          ]
        },
      ].map(section => (
        <div key={section.title} className="card" style={{ padding: 28 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 17, marginBottom: 20 }}>{section.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {section.items.map(item => (
              <div key={item.label}>
                <label className="label">{item.label}</label>
                {item.type === "select" ? (
                  <select className="input">{item.options.map(o => <option key={o}>{o}</option>)}</select>
                ) : (
                  <input className="input" placeholder={item.placeholder} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 17, marginBottom: 20 }}>Appearance</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 500 }}>{darkMode ? "Dark Mode" : "Light Mode"}</div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>Toggle between light and dark themes</div>
          </div>
          <button className="btn btn-secondary" onClick={toggleDark}>{darkMode ? "☀️ Switch to Light" : "🌙 Switch to Dark"}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 17, marginBottom: 20 }}>🤖 Telegram Bot Integration</div>
        <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16, lineHeight: 1.7 }}>
          Connect your Telegram bot to run calculations directly from Telegram. Use the endpoints below in your bot webhook.
        </div>
        {[
          { label: "Calculate endpoint", value: "POST /api/telegram/calculate" },
          { label: "Get rates endpoint", value: "GET /api/telegram/rates" },
          { label: "Save calculation", value: "POST /api/telegram/save" },
        ].map(e => (
          <div key={e.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>{e.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", color: "var(--accent)" }}>{e.value}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-lg" onClick={save}>
        {saved ? "✓ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── LOGIN / AUTH ─────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({ name: form.name || form.email.split("@")[0], email: form.email, plan: "Pro Plan" });
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg, #f97316, #ea580c)", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16, boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }}>🇳🇬</div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 28 }}>NaijaImport</div>
          <div style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>Nigerian Import Business Calculator</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer",
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, transition: "all 0.2s",
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text2)",
                boxShadow: mode === m ? "var(--shadow)" : "none",
              }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Chidi Okafor" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }} onClick={submit} disabled={loading}>
              {loading ? <><div className="ai-loading"><span /><span /><span /></div> Authenticating...</> : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <div className="divider" />
          <button className="btn btn-secondary btn-full" onClick={() => onLogin({ name: "Demo User", email: "demo@naijaimport.ng", plan: "Free Plan" })}>
            👀 Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);

  const toggleDark = () => {
    setState(s => ({ ...s, darkMode: !s.darkMode }));
  };

  const setTab = (tab) => setState(s => ({ ...s, activeTab: tab }));
  const setRates = (rates) => setState(s => ({ ...s, exchangeRates: typeof rates === "function" ? rates(s.exchangeRates) : rates }));

  const saveCalc = (calc) => {
    setState(s => ({ ...s, calculations: [...s.calculations, calc] }));
  };

  useEffect(() => {
    // Auto-refresh rates simulation
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 4;
      setState(s => ({
        ...s,
        exchangeRates: { ...s.exchangeRates, USD: Math.round(s.exchangeRates.USD + delta) },
        ratesUpdated: new Date().toLocaleTimeString(),
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!state.user) {
    return (
      <>
        <GlobalStyle />
        <div className={state.darkMode ? "" : "light"}>
          <AuthScreen onLogin={user => setState(s => ({ ...s, user }))} />
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <div className={state.darkMode ? "" : "light"} style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <Sidebar
          activeTab={state.activeTab}
          setTab={setTab}
          user={state.user}
          darkMode={state.darkMode}
          toggleDark={toggleDark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
        )}

        <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Header activeTab={state.activeTab} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
          <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
            {state.activeTab === "dashboard" && <Dashboard calculations={state.calculations} setTab={setTab} />}
            {state.activeTab === "calculator" && <ImportCalculator rates={state.exchangeRates} onSave={saveCalc} prefill={scannedProduct} />}
            {state.activeTab === "currency" && <CurrencyModule rates={state.exchangeRates} setRates={setRates} />}
            {state.activeTab === "shipping" && <ShippingEstimator rates={state.exchangeRates} />}
            {state.activeTab === "scanner" && <ProductScanner rates={state.exchangeRates} onFill={(p) => { setScannedProduct(p); setTab("calculator"); }} />}
            {state.activeTab === "ai-pricing" && <SmartPricingAI rates={state.exchangeRates} />}
            {state.activeTab === "history" && <ImportHistory calculations={state.calculations} />}
            {state.activeTab === "settings" && <Settings darkMode={state.darkMode} toggleDark={toggleDark} />}
          </main>
        </div>
      </div>
    </>
  );
}