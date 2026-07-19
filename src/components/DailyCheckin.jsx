import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const btn = (active) => ({
  flex: 1,
  padding: "12px 0",
  fontSize: 18,
  background: active ? "rgba(239,159,39,0.15)" : "transparent",
  border: `1px solid ${active ? "var(--amber)" : "var(--line)"}`,
  cursor: "pointer",
  color: "var(--paper)",
});

export default function DailyCheckin() {
  const { session } = useAuth();
  const [done, setDone] = useState(null); // null=loading, false=por fazer, true=feito
  const [sleep, setSleep] = useState(null);
  const [pain, setPain] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("daily_checkins")
      .select("id")
      .eq("client_id", session.user.id)
      .eq("checkin_date", today)
      .maybeSingle()
      .then(({ data }) => setDone(!!data));
  }, [session]);

  const submit = async () => {
    setSaving(true);
    await supabase.from("daily_checkins").insert({
      client_id: session.user.id,
      checkin_date: today,
      sleep_quality: sleep,
      pain_level: pain,
      energy_level: energy,
    });
    setSaving(false);
    setDone(true);
  };

  if (done === null) return null;

  if (done)
    return (
      <div className="card">
        <div className="card-body" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="muted-text" style={{ fontSize: 13 }}>Check-in de hoje registado</span>
          <span style={{ color: "#8A9A5B" }}>✓</span>
        </div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-body">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Check-in de Hoje</div>

        <div className="muted-text" style={{ fontSize: 12, marginBottom: 6 }}>Como dormiste?</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[[1, "😴"], [2, "😐"], [3, "💪"]].map(([v, e]) => (
            <button key={v} style={btn(sleep === v)} onClick={() => setSleep(v)}>{e}</button>
          ))}
        </div>

        <div className="muted-text" style={{ fontSize: 12, marginBottom: 6 }}>Dor (0 = nenhuma · 10 = máxima)</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {Array.from({ length: 11 }, (_, i) => (
            <button key={i} style={{ ...btn(pain === i), fontSize: 12, flex: "1 0 8%", padding: "8px 0" }} onClick={() => setPain(i)}>{i}</button>
          ))}
        </div>

        <div className="muted-text" style={{ fontSize: 12, marginBottom: 6 }}>Energia</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} style={{ ...btn(energy === v), fontSize: 13 }} onClick={() => setEnergy(v)}>{"⚡".repeat(1)}{v}</button>
          ))}
        </div>

        <button
          className="btn-primary"
          style={{ padding: 12, fontSize: 12 }}
          disabled={saving || sleep === null || pain === null || energy === null}
          onClick={submit}
        >
          {saving ? "A guardar..." : "Registar"}
        </button>
      </div>
    </div>
  );
}
