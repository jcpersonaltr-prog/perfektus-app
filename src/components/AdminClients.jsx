import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { signupClient } from "../lib/signupClient";
import Progression from "./Progression";

const inputStyle = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  color: "var(--paper)",
  fontSize: 14,
  padding: "10px 12px",
  marginBottom: 12,
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [mode, setMode] = useState("list"); // list | new | detail
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", notes: "", restrictions: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("full_name");
    setClients(data ?? []);
  };

  useEffect(() => { loadClients(); }, []);

  // ---------- CRIAR CLIENTE ----------
  const createClient_ = async () => {
    setMsg("");
    if (!form.name || !form.email || form.password.length < 8) {
      setMsg("Preenche nome, email e password (mín. 8 caracteres).");
      return;
    }
    setBusy(true);

    // 1. Conta de autenticação (cliente secundário — não afeta a tua sessão)
    const { data: signup, error: signErr } = await signupClient.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signErr || !signup?.user?.id) {
      setBusy(false);
      setMsg(`Erro ao criar conta: ${signErr?.message ?? "sem id"}`);
      return;
    }

    const uid = signup.user.id;

    // 2. Ficha do cliente
    const { error: cliErr } = await supabase.from("clients").insert({
      id: uid,
      full_name: form.name,
      access_status: "pending",
    });

    if (cliErr) {
      setBusy(false);
      setMsg(`Conta criada, mas erro na ficha: ${cliErr.message}`);
      return;
    }

    // 3. Ficha clínica (se preenchida)
    if (form.notes || form.restrictions) {
      await supabase.from("clinical_profiles").insert({
        client_id: uid,
        notes: form.notes || null,
        active_restrictions: form.restrictions
          ? form.restrictions.split(",").map((r) => r.trim()).filter(Boolean)
          : null,
      });
    }

    setBusy(false);
    setForm({ name: "", email: "", password: "", notes: "", restrictions: "" });
    setMode("list");
    loadClients();
  };

  // ---------- DETALHE ----------
  const openDetail = async (c) => {
    setSelected(c);
    setMode("detail");
    const [{ data: clinical }, { data: plans }, { data: sub }] = await Promise.all([
      supabase.from("clinical_profiles").select("*").eq("client_id", c.id).maybeSingle(),
      supabase.from("workout_plans").select("*").eq("client_id", c.id).order("scheduled_date", { ascending: false }).limit(10),
      supabase.from("subscriptions").select("*").eq("client_id", c.id).eq("status", "active").maybeSingle(),
    ]);
    setDetail({ clinical, plans: plans ?? [], sub });
  };

  const toggleAccess = async () => {
    const next = selected.access_status === "active" ? "suspended" : "active";
    await supabase.from("clients").update({ access_status: next }).eq("id", selected.id);
    setSelected({ ...selected, access_status: next });
    loadClients();
  };

  // ---------- RENDER ----------
  if (mode === "new")
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Novo Cliente</div>
        <input style={inputStyle} placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input style={inputStyle} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input style={inputStyle} placeholder="Password inicial (mín. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Notas clínicas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <input style={inputStyle} placeholder="Restrições, separadas por vírgula (ex: no_impact, no_hip_flexion_90)" value={form.restrictions} onChange={(e) => setForm({ ...form, restrictions: e.target.value })} />
        {msg && <p style={{ color: "var(--alert)", fontSize: 13 }}>{msg}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={createClient_}>
            {busy ? "A criar..." : "Criar Cliente"}
          </button>
          <button style={{ flex: 1, background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", cursor: "pointer", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.15em" }} onClick={() => setMode("list")}>
            Cancelar
          </button>
        </div>
        <p className="muted-text" style={{ fontSize: 11, marginTop: 12 }}>
          Entrega o email + password ao cliente. Ele fica "Pendente" até ativares o acesso ou até confirmar o pagamento da subscrição.
        </p>
      </div>
    );

  if (mode === "detail" && selected)
    return (
      <div>
        <button style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", marginBottom: 12, padding: 0 }} onClick={() => { setMode("list"); setDetail(null); }}>
          ← Voltar à lista
        </button>
        <h3 className="title-serif" style={{ fontSize: 20, marginBottom: 4 }}>{selected.full_name}</h3>
        <span className="stamp stamp-amber">{selected.access_status}</span>

        <div style={{ marginTop: 16 }}>
          <button className="btn-primary" style={{ padding: 10, fontSize: 11 }} onClick={toggleAccess}>
            {selected.access_status === "active" ? "Suspender Acesso" : "Ativar Acesso"}
          </button>
        </div>

        {detail?.sub && (
          <div className="card"><div className="card-body" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ fontSize: 9 }}>Subscrição Ativa</div>
            <div style={{ fontSize: 14 }}>{detail.sub.plan_name} · até {detail.sub.ends_at}</div>
          </div></div>
        )}

        {detail?.clinical && (
          <div className="card"><div className="card-body" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ fontSize: 9 }}>Ficha Clínica</div>
            {detail.clinical.notes && <p className="muted-text" style={{ fontSize: 13, margin: "6px 0" }}>{detail.clinical.notes}</p>}
            {detail.clinical.active_restrictions?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {detail.clinical.active_restrictions.map((r) => (
                  <span key={r} style={{ fontSize: 10, color: "var(--alert)", border: "1px solid var(--alert)", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{r}</span>
                ))}
              </div>
            )}
          </div></div>
        )}

        <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Progressão</div>
        <Progression clientId={selected.id} />

        <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Últimas Sessões</div>
        {(detail?.plans ?? []).length === 0 && <p className="muted-text" style={{ fontSize: 13 }}>Sem sessões.</p>}
        {(detail?.plans ?? []).map((p) => (
          <div key={p.id} className="card" style={{ margin: "0 0 8px" }}>
            <div className="card-body" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{p.session_label} — {p.block_title}</span>
              <span className="muted-text" style={{ fontSize: 11 }}>{p.scheduled_date} · {p.status}</span>
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div>
      <button className="btn-primary" style={{ marginBottom: 16, padding: 12, fontSize: 12 }} onClick={() => setMode("new")}>
        + Novo Cliente
      </button>
      {clients.map((c) => (
        <button key={c.id} className="card" style={{ width: "100%", margin: "0 0 8px", cursor: "pointer", textAlign: "left", padding: 0, background: "var(--surface)", border: "1px solid var(--line)" }} onClick={() => openDetail(c)}>
          <div className="card-body" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--paper)" }}>{c.full_name}</span>
            <span className="stamp" style={{
              borderColor: c.access_status === "active" ? "#8A9A5B" : "var(--alert)",
              color: c.access_status === "active" ? "#8A9A5B" : "var(--alert)",
            }}>
              {c.access_status === "active" ? "Ativo" : c.access_status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
