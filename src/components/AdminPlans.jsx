import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const inputStyle = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  color: "var(--paper)",
  fontSize: 14,
  padding: "10px 12px",
  marginBottom: 10,
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminPlans() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [restrictions, setRestrictions] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [library, setLibrary] = useState([]);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ label: "", title: "", date: new Date().toISOString().slice(0, 10), minutes: 45 });
  const [items, setItems] = useState([]); // {exercise, sets, reps, rest}
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    supabase.from("clients").select("id, full_name").eq("access_status", "active").order("full_name")
      .then(({ data }) => setClients(data ?? []));
    supabase.from("exercises").select("*").order("name_en")
      .then(({ data }) => setLibrary(data ?? []));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    // Restrições do cliente
    supabase.from("clinical_profiles").select("active_restrictions").eq("client_id", clientId).maybeSingle()
      .then(({ data }) => setRestrictions(data?.active_restrictions ?? []));
    // Exercícios das últimas 3 sessões (anti-repetição)
    supabase.from("workout_plans").select("id").eq("client_id", clientId)
      .order("scheduled_date", { ascending: false }).limit(3)
      .then(async ({ data: plans }) => {
        if (!plans?.length) { setRecentExercises([]); return; }
        const { data: pex } = await supabase
          .from("plan_exercises")
          .select("exercises(name_en)")
          .in("workout_plan_id", plans.map((p) => p.id));
        setRecentExercises([...new Set((pex ?? []).map((x) => x.exercises?.name_en).filter(Boolean))]);
      });
  }, [clientId]);

  const filtered = library.filter((e) =>
    e.name_en.toLowerCase().includes(search.toLowerCase()) ||
    (e.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (ex) => {
    if (items.some((i) => i.exercise.id === ex.id)) return;
    setItems([...items, { exercise: ex, sets: 3, reps: "10", rest: 60 }]);
  };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!clientId || !meta.label || items.length === 0) {
      alert("Escolhe cliente, dá um nome à sessão e adiciona exercícios.");
      return;
    }
    setSaving(true);
    const { data: plan, error } = await supabase.from("workout_plans").insert({
      client_id: clientId,
      session_label: meta.label,
      block_title: meta.title || meta.label,
      scheduled_date: meta.date,
      estimated_minutes: parseInt(meta.minutes, 10) || null,
      status: "scheduled",
    }).select().single();

    if (error) { setSaving(false); alert(error.message); return; }

    await supabase.from("plan_exercises").insert(
      items.map((it, i) => ({
        workout_plan_id: plan.id,
        exercise_id: it.exercise.id,
        order_index: i + 1,
        target_sets: parseInt(it.sets, 10) || null,
        target_reps: String(it.reps),
        rest_seconds: parseInt(it.rest, 10) || null,
      }))
    );

    setSaving(false);
    setItems([]);
    setMeta({ ...meta, label: "", title: "" });
    setOkMsg(`Sessão publicada — o cliente já a vê na app.`);
    setTimeout(() => setOkMsg(""), 4000);
  };

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Cliente</div>
      <select style={inputStyle} value={clientId} onChange={(e) => setClientId(e.target.value)}>
        <option value="">— escolher cliente ativo —</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
      </select>

      {restrictions.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {restrictions.map((r) => (
            <span key={r} style={{ fontSize: 10, color: "var(--alert)", border: "1px solid var(--alert)", padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{r}</span>
          ))}
        </div>
      )}

      {recentExercises.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>Usados nas últimas 3 sessões (evitar)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recentExercises.map((n) => (
              <span key={n} style={{ fontSize: 10, color: "var(--muted)", border: "1px solid var(--line)", padding: "2px 6px" }}>{n}</span>
            ))}
          </div>
        </div>
      )}

      <div className="eyebrow" style={{ margin: "8px 0" }}>Sessão</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input style={inputStyle} placeholder="Etiqueta (ex: Sessão H)" value={meta.label} onChange={(e) => setMeta({ ...meta, label: e.target.value })} />
        <input style={inputStyle} placeholder="Título do bloco" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        <input style={inputStyle} type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
        <input style={inputStyle} type="number" placeholder="Minutos" value={meta.minutes} onChange={(e) => setMeta({ ...meta, minutes: e.target.value })} />
      </div>

      <div className="eyebrow" style={{ margin: "8px 0" }}>Exercícios da sessão ({items.length})</div>
      {items.map((it, i) => {
        const repeated = recentExercises.includes(it.exercise.name_en);
        return (
          <div key={it.exercise.id} className="card" style={{ margin: "0 0 8px", borderColor: repeated ? "var(--alert)" : "var(--line)" }}>
            <div className="card-body" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>
                  {String(i + 1).padStart(2, "0")}. {it.exercise.name_en}
                  {repeated && <span style={{ color: "var(--alert)", fontSize: 10, marginLeft: 8 }}>REPETIDO</span>}
                </span>
                <button style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }} onClick={() => removeItem(i)}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input style={{ ...inputStyle, marginBottom: 0 }} type="number" value={it.sets} onChange={(e) => updateItem(i, "sets", e.target.value)} title="Séries" />
                <input style={{ ...inputStyle, marginBottom: 0 }} value={it.reps} onChange={(e) => updateItem(i, "reps", e.target.value)} title="Reps (ex: 10 ou 30s)" />
                <input style={{ ...inputStyle, marginBottom: 0 }} type="number" value={it.rest} onChange={(e) => updateItem(i, "rest", e.target.value)} title="Descanso (s)" />
              </div>
            </div>
          </div>
        );
      })}

      <button className="btn-primary" style={{ marginBottom: 20 }} disabled={saving} onClick={publish}>
        {saving ? "A publicar..." : "Publicar Sessão"}
      </button>
      {okMsg && <p style={{ color: "#8A9A5B", fontSize: 13, marginTop: -12, marginBottom: 16 }}>{okMsg}</p>}

      <div className="eyebrow" style={{ marginBottom: 8 }}>Biblioteca ({library.length})</div>
      <input style={inputStyle} placeholder="Pesquisar exercício ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {filtered.map((ex) => {
          const added = items.some((i) => i.exercise.id === ex.id);
          const repeated = recentExercises.includes(ex.name_en);
          return (
            <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid var(--line)", marginBottom: 6, opacity: added ? 0.4 : 1 }}>
              <div>
                <div style={{ fontSize: 13 }}>
                  {ex.name_en}
                  {repeated && <span style={{ color: "var(--alert)", fontSize: 9, marginLeft: 6 }}>RECENTE</span>}
                </div>
                <div className="muted-text" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {ex.category} · {ex.main_muscle} · {ex.equipment}
                </div>
              </div>
              {!added && (
                <button style={{ color: "var(--amber)", border: "1px solid var(--amber)", background: "none", width: 26, height: 26, cursor: "pointer" }} onClick={() => addItem(ex)}>+</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
