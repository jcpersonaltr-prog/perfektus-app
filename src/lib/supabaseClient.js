import { createClient } from "@supabase/supabase-js";

// Estas duas variáveis vêm do teu ficheiro .env (nunca commitar o .env real).
// Vais encontrá-las em: Supabase Dashboard → Project Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Faltam as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Confere o teu ficheiro .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
