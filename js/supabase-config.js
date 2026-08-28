// ============================================================
// Supabase-oppsett — fylles inn når Martin har opprettet prosjektet.
// URL og "anon public key" er trygge å ha i frontend-koden: de gir
// KUN tilgang til det Row Level Security-reglene i supabase-schema.sql
// tillater (send booking, lese priser). Alt annet krever admin-innlogging.
// ============================================================

const SUPABASE_URL = 'REPLACE_WITH_SUPABASE_PROJECT_URL';       // f.eks. https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'REPLACE_WITH_SUPABASE_ANON_KEY';     // Project Settings → API → "anon public"

// Enkel felles klient som resten av skriptene bruker.
// (Lastes via CDN i <head>: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL.startsWith('http')) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
