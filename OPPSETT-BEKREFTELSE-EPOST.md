# Oppsett: automatisk bekreftelses-e-post med avbestillingslenke

Denne funksjonen er delt mellom Fjellhamar Bistro og Lørenskog Dyrebutikk
(samme Supabase-prosjekt). Koden er ferdig og pushet til begge repoene —
disse stegene er de eneste som gjenstår, og de krever alle innlogging du
selv må gjøre (Claude skal ikke og kan ikke opprette kontoer eller taste
inn passord/API-nøkler for deg).

## Hva funksjonen gjør

1. Admin setter en bestilling til status **Bekreftet** i admin-panelet
   (på Fjellhamar Bistro-siden eller Lørenskog Dyrebutikk-siden).
2. Hvis gjesten/kunden har oppgitt e-post, sendes automatisk en
   bekreftelses-e-post med en unik avbestillingslenke.
3. Klikker gjesten/kunden på lenken, avbestilles bestillingen automatisk
   — admin-panelet oppdateres med det samme, ingen manuell oppfølging
   nødvendig.
4. Admin-panelet viser om/når bekreftelsen faktisk ble sendt, rett under
   status-nedtrekksmenyen på hver rad.

## Steg 1 — Kjør SQL-migreringen (begge Supabase-tabeller)

Åpne Supabase → SQL Editor og kjør **hele** innholdet i:
- `supabase-schema-fjellhamar-bistro.sql` (for restaurantbordene)
- `supabase-schema.sql` i Lørenskog-repoet (for hundesalong-timene)

Begge er trygge å kjøre flere ganger. De legger til kolonnene
`cancel_token` og `confirmation_sent_at` (og `email` for Lørenskog, som
ikke hadde e-postfelt i skjemaet fra før — det er lagt til nå).

## Steg 2 — Opprett Resend-konto (gratis)

1. Gå til [resend.com](https://resend.com) og opprett en gratis konto
   (3000 e-poster/mnd, 100/dag — mer enn nok for dette).
2. Lag en API-nøkkel: Dashboard → API Keys → Create API Key.
3. **VIKTIG:** uten et eget verifisert domene kan Resend kun sende
   e-post til *din egen* kontoadresse — ikke til gjester/kunder. Dette
   er en begrensning fra Resend, ikke noe vi kan omgå. Så lenge dere
   ikke har kjøpt et domene ennå (se prisforslaget), kan dere teste hele
   flyten mot deres egen e-postadresse — se «Testing» nederst.
   Når et domene er kjøpt, verifiserer dere det i Resend
   (Dashboard → Domains → Add Domain, noen DNS-oppføringer hos
   domeneleverandøren) — da kan dere sende til alle.

## Steg 3 — Legg inn API-nøkkelen som en hemmelighet i Supabase

Supabase → Project Settings → Edge Functions → Secrets → legg til:
- Navn: `RESEND_API_KEY`
- Verdi: nøkkelen fra steg 2

(Dette gjøres kun én gang — hemmeligheten deles automatisk av begge
funksjonene under, siden de ligger i samme Supabase-prosjekt.)

## Steg 4 — Deploy de to Edge Functions (ingen CLI nødvendig)

Supabase støtter å lime inn kode direkte i dashbordet og trykke Deploy —
ingen installasjon nødvendig. For hver av de to funksjonene:

1. Supabase → Edge Functions → Create a new function.
2. Navn: `send-confirmation` (nøyaktig dette navnet — koden i admin.js
   forventer det).
3. Lim inn hele innholdet fra `supabase/functions/send-confirmation/index.ts`.
4. Deploy.
5. Gjenta for `cancel-booking`, med innhold fra
   `supabase/functions/cancel-booking/index.ts`.

Begge filene finnes allerede i begge repoene (identisk kode — funksjonen
er delt), så det holder å deploye dem én gang.

## Testing (før dere har eget domene)

Åpne `supabase/functions/send-confirmation/index.ts`, finn linjen:

```ts
const TEST_RECIPIENT_OVERRIDE = '';
```

og sett den til din egen e-postadresse, f.eks.:

```ts
const TEST_RECIPIENT_OVERRIDE = 'elofsson.martin@gmail.com';
```

Lim deretter inn den oppdaterte filen på nytt i Supabase-dashbordet og
deploy igjen. Da sendes ALLE bekreftelser til din egen adresse uansett
hvilken e-post gjesten/kunden faktisk oppga — perfekt for å teste flyten
før demoen, helt uten risiko for at en ekte kunde får en test-e-post.
Husk å tømme denne linjen igjen (sett til `''`) og deploye på nytt når
dere har et ekte domene og skal gå live.

## Oppsummering av hva som er bygget

- To delte Edge Functions: `send-confirmation` (sender e-post + lenke)
  og `cancel-booking` (offentlig, håndterer klikk på avbestillingslenken).
- Nye sider: `avbestill.html` på hvert nettsted (det gjesten/kunden ser
  når de klikker lenken).
- Admin-panelet sender automatisk e-post når status settes til
  «Bekreftet», og viser om det lyktes rett i tabellen.
- Lagringsfeil på statusendringer vises nå tydelig i stedet for å feile
  stille (gjaldt begge admin-paneler fra før).
- Lørenskog Dyrebutikk har fått et nytt, valgfritt e-postfelt i
  bestillingsskjemaet (fantes ikke fra før) — uten dette kan ikke
  funksjonen varsle kunden automatisk.
