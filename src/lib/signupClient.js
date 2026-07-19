import { createClient } from "@supabase/supabase-js";

// Cliente SECUNDÁRIO usado apenas para criar contas de clientes a partir
// do painel admin. Tem persistSession:false para NÃO substituir a sessão
// do treinador que está autenticado no cliente principal.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const signupClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "perfektus-signup",
    persistSession: false,
    autoRefreshToken: false,
  },
});
