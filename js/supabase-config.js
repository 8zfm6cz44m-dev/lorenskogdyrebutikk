// ============================================================
// Supabase-oppsett — fylles inn når Martin har opprettet prosjektet.
// URL og "anon public key" er trygge å ha i frontend-koden: de gir
// KUN tilgang til det Row Level Security-reglene i supabase-schema.sql
// tillater (send booking, lese priser). Alt annet krever admin-innlogging.
// ============================================================

const SUPABASE_URL = 'https://jldfqgnbfihxspdehejb.supabase.co';  // prosjektets base-URL (ikke /rest/v1/)
const SUPABASE_ANON_KEY = 'sb_publishable_50ImucENmufxD9uwiaDMrA_rcaRHFWv'; // publishable key — trygg i frontend

// Enkel felles klient som resten av skriptene bruker.
// (Lastes via CDN i <head>: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
// NB: må settes på window eksplisitt — en topnivå "let"/"const" i et vanlig
// script blir IKKE en window-egenskap slik "var" ville gjort.
window.supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL.startsWith('http') && !SUPABASE_ANON_KEY.startsWith('REPLACE_')) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
