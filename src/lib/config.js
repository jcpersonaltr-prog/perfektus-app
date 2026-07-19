// ============================================================
// CONFIGURAÇÃO — edita aqui os teus dados reais
// ============================================================

export const PAYMENT_CONFIG = {
  mbwayNumber: "91 XXX XX XX",        // ← o teu número MB Way
  iban: "PT50 XXXX XXXX XXXX XXXX XXXX X", // ← o teu IBAN
  ibanName: "João Carvalho",           // nome do titular
};

export const PLANS = [
  { name: "8 Sessões / Mês",  sessions: 8,  priceCents: 9000 },
  { name: "12 Sessões / Mês", sessions: 12, priceCents: 12000 },
  { name: "20 Sessões / Mês", sessions: 20, priceCents: 18000 },
];

export const formatPrice = (cents) =>
  (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
