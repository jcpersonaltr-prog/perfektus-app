import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import DailyCheckin from "../components/DailyCheckin";
import Progression from "../components/Progression";

export default function Dashboard() {
  const { session } = useAuth();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      const uid = session.user.id;

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", uid)
        .single();

      const { data: planData } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("client_id", uid)
        .eq("status", "scheduled")
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      setClient(clientData);
      setPlan(planData);
      setLoading(false);
    };

    load();
  }, [session]);

  if (loading) return <div className="screen center">A carregar ficha...</div>;

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <div className="brand">Método Perfektus</div>
          <div className="brand-sub">Ficha {client?.id?.slice(0, 6) ?? "—"}</div>
        </div>
        <div className="avatar">{client?.full_name?.[0] ?? "?"}</div>
      </div>

      <div className="content">
        <span className="stamp stamp-amber">
          {client?.access_status === "active" ? "Ativo" : "Pendente"}
        </span>

        {client?.access_status !== "active" && (
          <div className="card" style={{ borderColor: "var(--alert)" }}>
            <div className="card-body">
              <p className="muted-text" style={{ marginBottom: 12 }}>
                O teu acesso ainda não está ativo.
              </p>
              <Link to="/pagamento" className="btn-primary" style={{ display: "block", textAlign: "center" }}>
                Ativar Subscrição
              </Link>
            </div>
          </div>
        )}

        <h2 className="title-serif" style={{ fontSize: 24, marginTop: 12 }}>
          Bom dia, {client?.full_name?.split(" ")[0] ?? "atleta"}.
        </h2>

        {plan ? (
          <div className="card torn">
            <div className="card-body">
              <div className="eyebrow">Próxima Sessão</div>
              <div className="title-serif" style={{ fontSize: 20 }}>
                {plan.block_title ?? plan.session_label}
              </div>
              <Link to={`/treino/${plan.id}`} className="btn-primary" style={{ display: "block", marginTop: 16, textAlign: "center" }}>
                Iniciar Treino
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <p className="muted-text">
                Sem sessão agendada. O teu treinador ainda não publicou o próximo plano.
              </p>
            </div>
          </div>
        )}

        <DailyCheckin />

        <div className="eyebrow" style={{ margin: "20px 0 8px" }}>A Tua Progressão</div>
        <Progression clientId={session?.user?.id} />
      </div>
    </div>
  );
}
