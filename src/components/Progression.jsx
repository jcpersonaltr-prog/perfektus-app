import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Gráfico de barras SVG minimalista, estética Field Manual
function Bars({ data, color = "var(--amber)", label }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 300, h = 90, gap = 4;
  const bw = Math.max(6, (w - gap * data.length) / data.length);
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} style={{ width: "100%" }}>
        {data.map((d, i) => {
          const bh = (d.value / max) * h;
          return (
            <g key={i}>
              <rect x={i * (bw + gap)} y={h - bh} width={bw} height={bh} fill={color} opacity={0.85} />
              <text x={i * (bw + gap) + bw / 2} y={h + 12} fontSize="7" fill="#6B6B63" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Progression({ clientId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      // Sessões concluídas com os seus logs
      const { data: plans } = await supabase
        .from("workout_plans")
        .select("id, session_label, scheduled_date")
        .eq("client_id", clientId)
        .eq("status", "completed")
        .order("scheduled_date", { ascending: true })
        .limit(12);

      if (!plans?.length) { setSessions([]); setLoading(false); return; }

      const { data: pex } = await supabase
        .from("plan_exercises")
        .select("id, workout_plan_id")
        .in("workout_plan_id", plans.map((p) => p.id));

      const pexByPlan = {};
      (pex ?? []).forEach((x) => { pexByPlan[x.id] = x.workout_plan_id; });

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("plan_exercise_id, actual_reps, actual_load_kg, rpe")
        .in("plan_exercise_id", (pex ?? []).map((x) => x.id));

      const agg = {};
      plans.forEach((p) => { agg[p.id] = { label: p.session_label, volume: 0, rpes: [] }; });
      (logs ?? []).forEach((l) => {
        const planId = pexByPlan[l.plan_exercise_id];
        if (!planId || !agg[planId]) return;
        agg[planId].volume += (l.actual_reps ?? 0) * (l.actual_load_kg ?? 0);
        if (l.rpe) agg[planId].rpes.push(l.rpe);
      });

      setSessions(plans.map((p) => ({
        label: p.session_label?.replace("Sessão ", "") ?? "?",
        volume: Math.round(agg[p.id].volume),
        rpe: agg[p.id].rpes.length
          ? +(agg[p.id].rpes.reduce((a, b) => a + b, 0) / agg[p.id].rpes.length).toFixed(1)
          : 0,
      })));
      setLoading(false);
    };
    load();
  }, [clientId]);

  if (loading) return <p className="muted-text" style={{ fontSize: 12 }}>A carregar progressão...</p>;
  if (!sessions.length) return <p className="muted-text" style={{ fontSize: 12 }}>Ainda sem sessões concluídas.</p>;

  return (
    <div className="card">
      <div className="card-body">
        <Bars label="Volume total por sessão (reps × kg)" data={sessions.map((s) => ({ label: s.label, value: s.volume }))} />
        <Bars label="RPE médio por sessão" color="#D4537E" data={sessions.map((s) => ({ label: s.label, value: s.rpe }))} />
      </div>
    </div>
  );
}
