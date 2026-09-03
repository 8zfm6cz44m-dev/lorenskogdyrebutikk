// ============================================================
// Supabase Edge Function: send-confirmation
//
// Sender en bekreftelses-e-post med avbestillingslenke når en
// administrator setter en bestilling til status "bekreftet".
// DELT mellom Fjellhamar Bistro (tabell "restaurant_bookings") og
// Lørenskog Dyrebutikk/Hundesalong (tabell "bookings") — samme
// Supabase-prosjekt, samme funksjon. Ligger i begge repoene som
// referanse, men trenger kun å være deployet ÉN gang i prosjektet.
//
// Kalles fra admin.js slik:
//   await sb.functions.invoke('send-confirmation', {
//     body: { table: 'restaurant_bookings', id: booking.id, cancelBaseUrl: '<opprinnelse>/avbestill.html' }
//   });
//
// Krever disse hemmelighetene (Supabase → Project Settings →
// Edge Functions → Secrets):
//   RESEND_API_KEY   – API-nøkkel fra resend.com (Martin oppretter selv)
// SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY settes automatisk av
// Supabase i alle Edge Functions — ikke noe å legge inn manuelt.
//
// VIKTIG om avsenderadresse: så lenge INGEN egen domene er verifisert
// i Resend, kan e-post KUN sendes til kontoeierens egen e-postadresse
// (Resends test-domene resend.dev tillater ikke vilkårlige mottakere).
// Fram til et domene er på plass, sett TEST_RECIPIENT_OVERRIDE til din
// egen e-postadresse nedenfor for å teste funksjonen — se instruksjonene
// Claude ga i chatten for detaljer.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_TABLES = new Set(['restaurant_bookings', 'bookings']);

// Sett til din egen e-postadresse for å teste FØR et domene er verifisert
// i Resend (ellers svarer Resend med feil for alle andre mottakere enn
// kontoeierens egen adresse). Sett til null/'' når et ekte domene er på
// plass, så sendes det til gjestens/kundens faktiske adresse igjen.
const TEST_RECIPIENT_OVERRIDE = '';

const SITE_CONFIG: Record<string, {
  fromName: string;
  fromEmail: string;
  subject: (b: any) => string;
  html: (b: any, cancelUrl: string) => string;
}> = {
  restaurant_bookings: {
    fromName: 'Fjellhamar Bistro',
    // TODO: bytt til en adresse på eget verifisert domene, f.eks.
    // 'bestilling@fjellhamarbistro.no', når domenet er satt opp i Resend.
    fromEmail: 'onboarding@resend.dev',
    subject: () => 'Bordet ditt hos Fjellhamar Bistro er bekreftet',
    html: (b, cancelUrl) => `
      <div style="font-family: Arial, sans-serif; color: #222; max-width: 480px;">
        <p>Hei ${escapeHtml(b.name)},</p>
        <p>Bordet ditt hos <strong>Fjellhamar Bistro</strong> er bekreftet:</p>
        <ul>
          <li><strong>Dato:</strong> ${escapeHtml(b.booking_date)}</li>
          <li><strong>Tid:</strong> ${escapeHtml(b.booking_time)}</li>
          <li><strong>Antall gjester:</strong> ${escapeHtml(String(b.guests))}</li>
        </ul>
        <p>Må du avbestille? <a href="${cancelUrl}">Klikk her for å avbestille bordet</a>.</p>
        <p>Vi gleder oss til å se deg!<br>Fjellhamar Bistro</p>
      </div>
    `,
  },
  bookings: {
    fromName: 'Lørenskog Dyrebutikk',
    // TODO: bytt til en adresse på eget verifisert domene, f.eks.
    // 'booking@lorenskogdyrebutikk.no', når domenet er satt opp i Resend.
    fromEmail: 'onboarding@resend.dev',
    subject: () => 'Timen din hos Lørenskog Dyrebutikk er bekreftet',
    html: (b, cancelUrl) => `
      <div style="font-family: Arial, sans-serif; color: #222; max-width: 480px;">
        <p>Hei ${escapeHtml(b.name)},</p>
        <p>Timen for <strong>${escapeHtml(b.dog_name || 'hunden din')}</strong> hos <strong>Lørenskog Dyrebutikk</strong> er bekreftet:</p>
        <ul>
          <li><strong>Behandling:</strong> ${escapeHtml(b.service)}</li>
          <li><strong>Tidspunkt:</strong> ${escapeHtml(b.confirmed_time || b.preferred_time || 'avtales')}</li>
        </ul>
        <p>Må dere avbestille? <a href="${cancelUrl}">Klikk her for å avbestille timen</a>.</p>
        <p>Vi gleder oss til å se dere!<br>Lørenskog Dyrebutikk</p>
      </div>
    `,
  },
};

function escapeHtml(str: unknown) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405);

  try {
    const { table, id, cancelBaseUrl } = await req.json();
    if (!ALLOWED_TABLES.has(table) || !id || !cancelBaseUrl) {
      return json({ ok: false, reason: 'invalid_request' }, 400);
    }

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: booking, error } = await sb.from(table).select('*').eq('id', id).single();
    if (error || !booking) return json({ ok: false, reason: 'not_found' }, 404);
    if (!booking.email) return json({ ok: false, reason: 'no_email' }, 200);

    const cfg = SITE_CONFIG[table];
    const cancelUrl = `${cancelBaseUrl}?token=${booking.cancel_token}`;
    const recipient = TEST_RECIPIENT_OVERRIDE || booking.email;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${cfg.fromName} <${cfg.fromEmail}>`,
        to: recipient,
        subject: cfg.subject(booking),
        html: cfg.html(booking, cancelUrl),
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      console.error('Resend error', resendRes.status, detail);
      return json({ ok: false, reason: 'send_failed', status: resendRes.status, detail }, 502);
    }

    await sb.from(table).update({ confirmation_sent_at: new Date().toISOString() }).eq('id', id);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, reason: 'server_error' }, 500);
  }
});
