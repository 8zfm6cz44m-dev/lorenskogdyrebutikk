// ============================================================
// Supabase Edge Function: cancel-booking
//
// Offentlig endepunkt (ingen innlogging kreves) som lar en gjest/kunde
// avbestille via lenken i bekreftelses-e-posten. DELT mellom Fjellhamar
// Bistro og Lørenskog Dyrebutikk — kalles fra avbestill.html på hvert
// nettsted. Ligger i begge repoene som referanse, men trenger kun å
// være deployet ÉN gang i det delte Supabase-prosjektet.
//
// Kalles slik: POST { table: 'restaurant_bookings' | 'bookings', token }
//
// Sikkerhet: token er en tilfeldig, ugjettbar UUID (lagret på hver
// bestilling som "cancel_token") — det er nøkkelen, ikke innlogging.
// Funksjonen bruker service-rollen og går derfor utenom RLS, men
// eneste handling den kan utføre er å sette status="avbestilt" på
// RADEN som matcher den oppgitte tokenen.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_TABLES = new Set(['restaurant_bookings', 'bookings']);
const CANCELLABLE_STATUSES = new Set(['ny', 'bekreftet']);

// CORS: PÅKREVD siden funksjonen kalles fra nettleseren (avbestill.js på
// github.io-domenet, samt admin.js) — uten disse headerne blokkerer
// nettleseren svaret med en CORS-feil (synlig i konsollen, F12), selv om
// funksjonen kjører helt fint på serversiden.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405);

  try {
    const { table, token } = await req.json();
    if (!ALLOWED_TABLES.has(table) || !token) {
      return json({ ok: false, reason: 'invalid_request' }, 400);
    }

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: booking, error } = await sb.from(table).select('*').eq('cancel_token', token).single();
    if (error || !booking) return json({ ok: false, reason: 'not_found' }, 404);

    if (!CANCELLABLE_STATUSES.has(booking.status)) {
      // Allerede avbestilt / fullført / ikke møtt — ikke en feil, bare
      // ingenting mer å gjøre. Fronten viser en passende melding.
      return json({ ok: false, reason: 'not_cancellable', status: booking.status, name: booking.name }, 200);
    }

    const note = `Avbestilt av gjest/kunde via e-post-lenke ${new Date().toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })}`;
    const comment = booking.admin_comment ? `${booking.admin_comment}\n${note}` : note;
    const { error: updateError } = await sb.from(table)
      .update({ status: 'avbestilt', admin_comment: comment })
      .eq('id', booking.id);
    if (updateError) {
      console.error(updateError);
      return json({ ok: false, reason: 'server_error' }, 500);
    }

    return json({ ok: true, name: booking.name });
  } catch (err) {
    console.error(err);
    return json({ ok: false, reason: 'server_error' }, 500);
  }
});
