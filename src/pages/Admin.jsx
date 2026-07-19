import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { formatPrice } from "../lib/config";

export default function Admin() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isTrainer, setIsTrainer] = useState(null);
  const [tab, setTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [busy, setBusy] = useState(null);

  const loadData = async () => {
    const { data: pays } = await supabase
      .from("payments")
      .select("*, clients(full_name), subscriptions(plan_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPayments(pays ?? []);

    const { data: cls } = await supabase
      .from("clients")
      .select("*")
      .order("full_name");
    setClients(cls ?? []);
  };

  useEffect(() => {
    if (!session) return;
    const check = async () => {
      const { data } = await supabase
        .from("trainers")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();
      setIsTrainer(!!data);
      if (data) loadData();
    };
    check();
  }, [session]);

  const confirmPayment = async (p) => {
    setBusy(p.id);
    await supabase.from("payments").update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: session.user.id,
    }).eq("id", p.id);

    const starts = new Date();
    const ends = new Date();
    ends.setMonth(ends.getMonth() + 1);
    await supabase.from("subscriptions").update({
      status: "active",
      starts_at: starts.toISOString().slice(0, 10),
      ends_at: ends.toISOString().slice(0, 10),
    }).eq("id", p.subscription_id);

    await supabase.from("clients").update({ access_status: "active" }).eq("id", p.client_id);

    setBusy(null);
    loadData();
  };

  const rejectPayment = async (p) => {
    setBusy(p.id);
    await supabase.from("payments").update({ status: "rejected" }).eq("id", p.id);
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", p.subscription_id);
    setBusy(null);
    loadData();
  };

  if (isTrainer === null) return <div className="screen center">A verificar acesso...</div>;

  if (!isTrainer)
    return (
      <div className="screen center" style={{ padding: 32, textAlign: "center" }}>
        <div>
          <span className="stamp stamp-amber">Acesso Restrito</span>
          <p className="muted-text" style={{ marginTop: 16 }}>Esta área é reservada ao treinador.</p>
          <button className="btn-primary" style={{ marginTop: 24, maxWidth: 280 }} onClick={() => navigate("/")}>
            Voltar
          </button>
        </div>
      </div>
    );

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <div className="brand">Método Perfektus</div>
          <div className="brand-sub">Painel de Comando</div>
        </div>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      <div className="content">
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[["payments", `Pagamentos (${payments.length})`], ["clients", "Clientes"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: tab === key ? 700 : 400,
                background: tab === key ? "var(--amber)" : "transparent",
                color: tab === key ? "var(--bg)" : "var(--muted)",
                border: `1px solid ${tab === key ? "var(--amber)" : "var(--line)"}`,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "payments" && (
          <>
            {payments.length === 0 && (
              <p className="muted-text">Sem pagamentos pendentes. Tudo em dia. ✓</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="card">
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="title-serif" style={{ color: "var(--amber)", fontSize: 16 }}>
                      {p.reference_code}
                    </span>
                    <span style={{ fontWeight: 700 }}>{formatPrice(p.amount_cents)}</span>
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{p.clients?.full_name ?? "—"}</div>
                  <div className="muted-text" style={{ fontSize: 12, marginBottom: 14 }}>
                    {p.subscriptions?.plan_name} · {p.method === "mbway" ? "MB WAY" : "Transferência"} ·{" "}
                    {new Date(p.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: 10, fontSize: 11 }}
                      disabled={busy === p.id}
                      onClick={() => confirmPayment(p)}
                    >
                      {busy === p.id ? "..." : "Confirmar"}
                    </button>
                    <button
                      style={{ flex: 1, padding: 10, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", cursor: "pointer" }}
                      disabled={busy === p.id}
                      onClick={() => rejectPayment(p)}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "clients" && (
          <>
            {clients.map((c) => (
              <div key={c.id} className="card" style={{ margin: "0 0 10px" }}>
                <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
                  <span style={{ fontSize: 14 }}>{c.full_name}</span>
                  <span
                    className="stamp"
                    style={{
                      borderColor: c.access_status === "active" ? "#8A9A5B" : c.access_status === "pending" ? "var(--alert)" : "var(--muted)",
                      color: c.access_status === "active" ? "#8A9A5B" : c.access_status === "pending" ? "var(--alert)" : "var(--muted)",
                    }}
                  >
                    {c.access_status === "active" ? "Ativo" : c.access_status === "pending" ? "Pendente" : c.access_status}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
