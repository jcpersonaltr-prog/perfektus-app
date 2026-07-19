import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatPrice } from "../lib/config";

export default function AdminHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = today.slice(0, 8) + "01";

      const [{ count: pendingPays }, { count: activeClients }, { count: sessionsToday }, { data: monthPays }] =
        await Promise.all([
          supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("access_status", "active"),
          supabase.from("workout_plans").select("id", { count: "exact", head: true }).eq("scheduled_date", today),
          supabase.from("payments").select("amount_cents").eq("status", "confirmed").gte("confirmed_at", monthStart),
        ]);

      const revenue = (monthPays ?? []).reduce((s, p) => s + p.amount_cents, 0);
      setStats({ pendingPays, activeClients, sessionsToday, revenue });
    };
    load();
  }, []);

  if (!stats) return <p className="muted-text">A carregar...</p>;

  const cards = [
    ["Sessões Hoje", stats.sessionsToday ?? 0],
    ["Pagamentos Pendentes", stats.pendingPays ?? 0],
    ["Clientes Ativos", stats.activeClients ?? 0],
    ["Receita do Mês", formatPrice(stats.revenue)],
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {cards.map(([label, val]) => (
        <div key={label} className="card" style={{ margin: 0 }}>
          <div className="card-body" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ fontSize: 9 }}>{label}</div>
            <div className="title-serif" style={{ fontSize: 24 }}>{val}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
