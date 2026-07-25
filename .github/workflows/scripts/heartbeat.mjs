// heartbeat.mjs
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Faltam as variáveis SUPABASE_URL ou SUPABASE_ANON_KEY.");
  process.exit(1);
}

const TABLE = process.env.HEARTBEAT_TABLE || "exercises";

async function ping() {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=id&limit=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const status = res.status;
  console.log(`Ping a ${TABLE} -> status ${status}`);

  if (status >= 500) {
    console.error("⚠️ Erro do lado do servidor Supabase.");
    process.exit(1);
  }

  console.log("✅ Heartbeat enviado com sucesso.");
}

ping().catch((err) => {
  console.error("❌ Erro ao executar heartbeat:", err);
  process.exit(1);
});
