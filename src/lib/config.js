// ============================================================
// CONFIGURAÇÃO — edita aqui os teus dados reais
// ============================================================

export const PAYMENT_CONFIG = {
  mbwayNumber: "934803502",        // ← o teu número MB Way
  iban: "PT50 0023 0000 45840178618 94", // ← o teu IBAN
  ibanName: "João Carvalho",           // nome do titular
};

export const PLANS = [
  { name: "8 Sessões / Mês",  sessions: 8,  priceCents: 9000 },
  { name: "12 Sessões / Mês", sessions: 12, priceCents: 12000 },
  { name: "20 Sessões / Mês", sessions: 20, priceCents: 18000 },
];

export const formatPrice = (cents) =>
  (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

