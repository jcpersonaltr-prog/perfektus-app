import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { PAYMENT_CONFIG, PLANS, formatPrice } from "../lib/config";

const genRef = () => {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `PFK-${n}`;
};

export default function Payment() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [payment, setPayment] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [method, setMethod] = useState("mbway");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("client_id", session.user.id)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setSub(subData);
        const { data: payData } = await supabase
          .from("payments")
          .select("*")
          .eq("subscription_id", subData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setPayment(payData);
      }
      setLoading(false);
    };
    load();
  }, [session]);

  const submitPayment = async () => {
    setSaving(true);
    const plan = PLANS[selectedPlan];
    const ref = genRef();

    const { data: newSub, error: subErr } = await supabase
      .from("subscriptions")
      .insert({
        client_id: session.user.id,
        plan_name: plan.name,
        sessions_included: plan.sessions,
        price_cents: plan.priceCents,
        status: "pending",
      })
      .select()
      .single();

    if (subErr) {
      setSaving(false);
      alert("Erro ao criar subscrição. Tenta novamente.");
      return;
    }

    const { data: newPay } = await supabase
      .from("payments")
      .insert({
        subscription_id: newSub.id,
        client_id: session.user.id,
        reference_code: ref,
        method,
        amount_cents: plan.priceCents,
        status: "pending",
      })
      .select()
      .single();

    setSub(newSub);
    setPayment(newPay);
    setSaving(false);
  };

  if (loading) return <div className="screen center">A carregar...</div>;

  // Estado: já tem pagamento pendente ou subscrição ativa
  if (sub && payment) {
    const isActive = sub.status === "active";
    return (
      <div className="screen">
        <div className="topbar">
          <div>
            <div className="brand">Método Perfektus</div>
            <div className="brand-sub">Subscrição</div>
          </div>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
            Voltar
          </button>
        </div>
        <div className="content">
          <span className="stamp stamp-amber">{isActive ? "Ativo" : "Pendente"}</span>
          <h2 className="title-serif" style={{ fontSize: 24, marginTop: 12, marginBottom: 4 }}>
            {sub.plan_name}
          </h2>
          <p className="muted-text" style={{ marginBottom: 20 }}>
            {isActive
              ? "A tua subscrição está ativa. Bom treino."
              : "Pagamento em validação. O acesso é ativado assim que for confirmado."}
          </p>

          {!isActive && (
            <>
              <div className="card">
                <div className="card-body">
                  <div className="eyebrow">Referência do Pagamento</div>
                  <div className="title-serif" style={{ fontSize: 28, color: "var(--amber)" }}>
                    {payment.reference_code}
                  </div>
                  <p className="muted-text" style={{ marginTop: 12, fontSize: 13 }}>
                    {payment.method === "mbway" ? (
                      <>
                        Envia <strong style={{ color: "var(--paper)" }}>{formatPrice(payment.amount_cents)}</strong> por MB WAY para{" "}
                        <strong style={{ color: "var(--paper)" }}>{PAYMENT_CONFIG.mbwayNumber}</strong> com esta referência na descrição.
                      </>
                    ) : (
                      <>
                        Transfere <strong style={{ color: "var(--paper)" }}>{formatPrice(payment.amount_cents)}</strong> para o IBAN{" "}
                        <strong style={{ color: "var(--paper)" }}>{PAYMENT_CONFIG.iban}</strong> ({PAYMENT_CONFIG.ibanName}), usando a referência no descritivo.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <p className="muted-text" style={{ fontSize: 12 }}>
                Depois de pagares, podes enviar o comprovativo por WhatsApp para acelerar a validação.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Estado: escolher plano e método
  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <div className="brand">Método Perfektus</div>
          <div className="brand-sub">Ativar Acesso</div>
        </div>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
          Voltar
        </button>
      </div>

      <div className="content">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Escolhe o teu pack</div>
        {PLANS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setSelectedPlan(i)}
            className="card"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              margin: "0 0 10px",
              cursor: "pointer",
              borderColor: i === selectedPlan ? "var(--amber)" : "var(--line)",
              background: i === selectedPlan ? "rgba(239,159,39,0.05)" : "var(--surface)",
            }}
          >
            <span className="title-serif" style={{ fontSize: 16 }}>{p.name}</span>
            <span style={{ color: "var(--amber)", fontWeight: 700 }}>{formatPrice(p.priceCents)}</span>
          </button>
        ))}

        <div className="eyebrow" style={{ margin: "20px 0 10px" }}>Método de pagamento</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[["mbway", "MB WAY"], ["transfer", "Transferência"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMethod(key)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: method === key ? 700 : 400,
                background: method === key ? "var(--amber)" : "transparent",
                color: method === key ? "var(--bg)" : "var(--muted)",
                border: `1px solid ${method === key ? "var(--amber)" : "var(--line)"}`,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={submitPayment} disabled={saving}>
          {saving ? "A gerar referência..." : "Gerar Referência de Pagamento"}
        </button>
        <p className="muted-text" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
          O acesso fica pendente até validação manual do pagamento.
        </p>
      </div>
    </div>
  );
}
