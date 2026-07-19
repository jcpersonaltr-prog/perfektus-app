import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function Workout() {
  const { planId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [rpe, setRpe] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!session || !planId) return;
    const loadData = async () => {
      const { data: planData } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("id", planId)
        .single();

      const { data: exData } = await supabase
        .from("plan_exercises")
        .select("*, exercises(name_en, main_muscle, equipment, youtube_id)")
        .eq("workout_plan_id", planId)
        .order("order_index");

      setPlan(planData);
      setExercises(exData ?? []);
      setLoading(false);

      // marca como em curso
      if (planData?.status === "scheduled") {
        await supabase
          .from("workout_plans")
          .update({ status: "in_progress" })
          .eq("id", planId);
      }
    };
    loadData();
  }, [session, planId]);

  const current = exercises[currentIdx];

  const logSet = async () => {
    if (!current) return;
    setSaving(true);
    await supabase.from("exercise_logs").insert({
      plan_exercise_id: current.id,
      client_id: session.user.id,
      set_number: currentSet,
      actual_reps: reps ? parseInt(reps, 10) : null,
      actual_load_kg: load ? parseFloat(load) : null,
      rpe: rpe ? parseInt(rpe, 10) : null,
    });
    setSaving(false);
    setReps("");
    setLoad("");
    setRpe("");

    const totalSets = current.target_sets ?? 3;
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
    } else if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentSet(1);
    } else {
      await supabase
        .from("workout_plans")
        .update({ status: "completed" })
        .eq("id", planId);
      setDone(true);
    }
  };

  if (loading) return <div className="screen center">A carregar sessão...</div>;

  if (done)
    return (
      <div className="screen center" style={{ padding: 32, textAlign: "center" }}>
        <div>
          <span className="stamp stamp-amber" style={{ fontSize: 14, padding: "6px 14px" }}>
            Sessão Concluída
          </span>
          <h2 className="title-serif" style={{ fontSize: 28, marginTop: 24 }}>
            Bom trabalho.
          </h2>
          <p className="muted-text" style={{ marginTop: 8 }}>
            Todos os registos foram guardados no teu ficheiro.
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 32, maxWidth: 280 }}
            onClick={() => navigate("/")}
          >
            Voltar ao Dossier
          </button>
        </div>
      </div>
    );

  if (!current)
    return (
      <div className="screen center" style={{ padding: 32, textAlign: "center" }}>
        <div>
          <p className="muted-text">Esta sessão ainda não tem exercícios atribuídos.</p>
          <button className="btn-primary" style={{ marginTop: 24, maxWidth: 280 }} onClick={() => navigate("/")}>
            Voltar
          </button>
        </div>
      </div>
    );

  const ex = current.exercises;

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <div className="brand">Método Perfektus</div>
          <div className="brand-sub">
            {plan?.session_label} — {String(currentIdx + 1).padStart(2, "0")} /{" "}
            {String(exercises.length).padStart(2, "0")}
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}
        >
          Sair
        </button>
      </div>

      <div className="content">
        <h2 className="title-serif" style={{ fontSize: 26, marginBottom: 4 }}>
          {ex?.name_en}
        </h2>
        <div className="eyebrow" style={{ marginBottom: 20 }}>
          {ex?.main_muscle} · {ex?.equipment}
        </div>

        {ex?.youtube_id && (
          <a
            className="card"
            style={{ display: "block", padding: 16, textAlign: "center", textDecoration: "none" }}
            href={`https://www.youtube.com/watch?v=${ex.youtube_id}`}
            target="_blank"
            rel="noreferrer"
          >
            <span style={{ color: "var(--amber)", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              ▶ Ver demonstração
            </span>
          </a>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "20px 0" }}>
          {[
            ["Série", `${currentSet} / ${current.target_sets ?? "—"}`],
            ["Objetivo", current.target_reps ?? "—"],
            ["Descanso", current.rest_seconds ? `${current.rest_seconds}s` : "—"],
          ].map(([label, val]) => (
            <div key={label} className="card" style={{ margin: 0, padding: 14, textAlign: "center" }}>
              <div className="eyebrow" style={{ fontSize: 9 }}>{label}</div>
              <div className="title-serif" style={{ fontSize: 18 }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>Registar Série {currentSet}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          <div>
            <label className="field-label">Reps</label>
            <input className="field-input" type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Carga (kg)</label>
            <input className="field-input" type="number" inputMode="decimal" step="0.5" value={load} onChange={(e) => setLoad(e.target.value)} />
          </div>
          <div>
            <label className="field-label">RPE 1-10</label>
            <input className="field-input" type="number" inputMode="numeric" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" onClick={logSet} disabled={saving}>
          {saving ? "A guardar..." : "Concluir Série"}
        </button>

        <div className="eyebrow" style={{ margin: "28px 0 10px" }}>Sequência</div>
        {exercises.map((pe, i) => (
          <div
            key={pe.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 14px",
              border: `1px solid ${i === currentIdx ? "var(--amber)" : "var(--line)"}`,
              opacity: i < currentIdx ? 0.4 : 1,
              marginBottom: 8,
              background: i === currentIdx ? "rgba(239,159,39,0.05)" : "transparent",
            }}
          >
            <span style={{ fontSize: 14 }}>
              {String(i + 1).padStart(2, "0")}. {pe.exercises?.name_en}
            </span>
            {i < currentIdx && <span style={{ color: "var(--muted)", fontSize: 12 }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
