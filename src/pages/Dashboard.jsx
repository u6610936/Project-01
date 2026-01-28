import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { load } from "../utils/storage";

const TX_KEY = "transactions";

// palette
const COLORS = ["#4F8CFF", "#32E6FF", "#FF4FD8", "#A855F7", "#22C55E", "#F59E0B", "#FF4D6D"];

function formatMoney(n) {
  return `฿${Number(n || 0).toLocaleString()}`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function getLatestDateISO(transactions) {
  if (!transactions.length) return "";
  const dates = transactions.map((t) => t.date).filter(Boolean).sort();
  return dates[dates.length - 1] || "";
}

export default function Dashboard() {
  const [period, setPeriod] = useState("daily"); 
  const [transactions, setTransactions] = useState(() => load(TX_KEY, []));

  function refresh() {
    setTransactions(load(TX_KEY, []));
  }

  useEffect(() => {
    function onFocus() {
      refresh();
    }
    function onStorage(e) {
      if (e.key === TX_KEY) refresh();
    }
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };

  }, []);

  const totalAllTime = useMemo(() => {
    return transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
  }, [transactions]);

  const txCount = transactions.length;

  const salesByProduct = useMemo(() => {
    const map = new Map(); 
    for (const t of transactions) {
      const name = t.itemName || "Unknown";
      const prev = map.get(name) || { itemName: name, qty: 0, sales: 0 };
      prev.qty += Number(t.quantity || 0);
      prev.sales += Number(t.total || 0);
      map.set(name, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales);
  }, [transactions]);

  const summary = useMemo(() => {
    if (!transactions.length) return { label: "No data yet", sales: 0 };

    const lastDate = getLatestDateISO(transactions);
    if (!lastDate) return { label: "No valid date", sales: 0 };

    if (period === "daily") {
      const sales = transactions
        .filter((t) => t.date === lastDate)
        .reduce((s, t) => s + Number(t.total || 0), 0);
      return { label: `Daily (${lastDate})`, sales };
    }

    if (period === "monthly") {
      const mk = monthKey(lastDate);
      const sales = transactions
        .filter((t) => monthKey(t.date) === mk)
        .reduce((s, t) => s + Number(t.total || 0), 0);
      return { label: `Monthly (${mk})`, sales };
    }

    
    const end = new Date(lastDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const sales = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      })
      .reduce((s, t) => s + Number(t.total || 0), 0);

    const sISO = start.toISOString().slice(0, 10);
    const eISO = end.toISOString().slice(0, 10);
    return { label: `Weekly (${sISO} → ${eISO})`, sales };
  }, [transactions, period]);

  const lineData = useMemo(() => {
    if (!transactions.length) return [];

    if (period === "monthly") {
      const map = new Map(); 
      for (const t of transactions) {
        if (!t.date) continue;
        const k = monthKey(t.date);
        map.set(k, (map.get(k) || 0) + Number(t.total || 0));
      }
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ key: k, sales: v }));
    }

    const map = new Map(); 
    for (const t of transactions) {
      if (!t.date) continue;
      map.set(t.date, (map.get(t.date) || 0) + Number(t.total || 0));
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ key: k, sales: v }));

    if (period === "weekly") return arr.slice(-7);
    return arr.slice(-14); 
  }, [transactions, period]);

  const pieData = useMemo(() => {
    const map = new Map(); 
    for (const t of transactions) {
      const c = t.category || "Unknown";
      map.set(c, (map.get(c) || 0) + Number(t.total || 0));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const barData = useMemo(() => {
    return salesByProduct.slice(0, 5).map((x) => ({ name: x.itemName, sales: x.sales }));
  }, [salesByProduct]);

  const lastDate = useMemo(() => getLatestDateISO(transactions), [transactions]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview from your saved transactions {lastDate ? `(latest: ${lastDate})` : ""}
          </p>
        </div>

        <div className="segmented" role="tablist" aria-label="Period">
          <button
            type="button"
            className={`seg-btn ${period === "daily" ? "active" : ""}`}
            onClick={() => setPeriod("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            className={`seg-btn ${period === "weekly" ? "active" : ""}`}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`seg-btn ${period === "monthly" ? "active" : ""}`}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total Sales (All Time)</h3>
          </div>
          <div className="big-number">{formatMoney(totalAllTime)}</div>
          <div className="muted">Sum of all transactions</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{summary.label}</h3>
          </div>
          <div className="big-number">{formatMoney(summary.sales)}</div>
          <div className="muted">Auto calculated from the latest date</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transactions</h3>
          </div>
          <div className="big-number">{txCount.toLocaleString()}</div>
          <div className="muted">Records saved in localStorage</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Trend</h3>
            <span className="muted">{period === "monthly" ? "By month" : "Recent days"}</span>
          </div>

          {lineData.length === 0 ? (
            <p className="muted">No data yet. Add sales in Sales Journal first.</p>
          ) : (
            <div className="chart sm">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />

                  <XAxis
                    dataKey="key"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.4)" }}
                  />

                  <YAxis
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.4)" }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#ffffff",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#32E6FF"
                    strokeWidth={3}
                    dot={{ fill: "#ffffff", stroke: "#32E6FF", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales by Category</h3>
            <span className="muted">Share of revenue</span>
          </div>

          {pieData.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="chart">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top 5 Products</h3>
            <span className="muted">Ranked by sales</span>
          </div>

          {barData.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="chart sm">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.4)" }}
                  />

                  <YAxis
                    tick={{ fill: "#ffffff", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.4)" }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#ffffff",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#32E6FF"        // ⭐ สีฟ้า
                    radius={[10, 10, 0, 0]}
                  /> 
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales by Product</h3>
            <span className="muted">Quantity + total</span>
          </div>

          {salesByProduct.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Total Qty</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByProduct.map((x) => (
                    <tr key={x.itemName}>
                      <td>{x.itemName}</td>
                      <td>{x.qty}</td>
                      <td>{formatMoney(x.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}