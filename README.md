# Lørenskog Dyrebutikk & Hundesalong – nettside

Enkelsidig nettside for Lørenskog Dyrebutikk (Fjellhamar og Vestparken) og Lørenskog Hundesalong.
Bygget som ren HTML/CSS/JS – ingen rammeverk, ingen backend, fungerer direkte fra `index.html`.

## Struktur

```
index.html        Alt innhold, én side med ankerlenker
css/style.css      Mørkt tema bygget rundt den eksisterende loggen
js/main.js         Mobilmeny, årstall i footer, "åpent/stengt nå"-status
assets/logo.png    Logo hentet fra nåværende side (se "Bildekvalitet" under)
```

## Kjøre lokalt

Åpne `index.html` direkte i en nettleser, eller kjør en enkel lokal server:

```
python3 -m http.server 8000
```

og gå til `http://localhost:8000`.

## Innhold som bør dobbeltsjekkes

Følgende er hentet direkte fra den gamle siden (skjermbilder/tekst) og bør bekreftes før lansering:

- **Åpningstider, Hundesalong**: Den gamle siden oppga kun «vanlige åpningstider hele sommeren: 09:00–17:00» uten å spesifisere ukedager. Jeg har antatt mandag–lørdag 09:00–17:00, stengt søndag – bekreft eller korriger i `index.html` (søk etter `hours-salong`).
- **Telefonnummer, Vestparken-butikken**: Fant ikke et eget nummer for Vestparken-avdelingen, så samme nummer som Fjellhamar (403 96 511) er brukt for begge. Gi beskjed om det finnes et eget nummer.
- **E-postadresse**: Ingen offentlig e-post ble funnet på gamle siden, så det er ikke lagt inn noen på nye siden. Si fra om dere vil vise en.

## Bildekvalitet

Loggen (`assets/logo.png`) er hentet fra den gamle sidens maks tilgjengelige oppløsning (ca. 600×480 px) og er derfor noe myk på retina-skjermer. Har dere originalfilen (SVG/AI/PDF eller høyoppløst PNG), send den så bytter jeg ut filen – layouten trenger ikke endres.

Alle andre bilder på siden er midlertidige plassholdere (mørke rutemønstre med ikon og tekst «Bilde kommer»). Send ekte bilder av butikk, ansatte, dyr og produkter så legges de inn.

## Neste fase: nettbutikk

Denne siden dekker markedsføringsdelen. Nettbutikken (fase 2, planlagt på Shopify) bygges og kobles på separat – ta kontakt når dere er klare for det steget.

## Timebestilling, admin-side og prisoppdatering

Nettsiden bruker [Supabase](https://supabase.com) (gratis nivå) som en liten "backend" for tre ting:

1. **Timebestilling** på `hundesalong.html` – erstatter Google-skjemaet, lagres i tabellen `bookings`.
2. **`admin.html`** – en side som IKKE er lenket fra noe sted på nettsiden og er blokkert for søkemotorer (`robots.txt` + `noindex`), men som krever innlogging. Her ser dere bookinger og kan oppdatere status.
3. **Priser** – prisene på Hundesalong-siden (dropin + stelltabell) hentes fra tabellen `prices` og kan redigeres fra admin-siden, enten rad for rad eller ved å laste opp en Excel-fil.

### Oppsett (gjøres én gang)

1. Opprett et gratis prosjekt på [supabase.com](https://supabase.com).
2. Åpne **SQL Editor** i Supabase og kjør hele innholdet i `supabase-schema.sql` (ligger i denne mappen) – det oppretter tabellene og fyller inn dagens priser.
3. Gå til **Project Settings → API** og hent **Project URL** og **anon public key**.
4. Lim disse inn i `js/supabase-config.js` (`SUPABASE_URL` og `SUPABASE_ANON_KEY`).
5. Gå til **Authentication → Users** i Supabase og opprett en admin-bruker (e-post + passord) – dette er innloggingen til `admin.html`.

Helt til dette er gjort viser nettsiden statiske priser og en beskjed om at nettbestilling ikke er aktivert ennå – resten av siden fungerer som normalt.

**Del aldri lenken til `admin.html` offentlig** – den er ikke lenket noe sted, men er kun beskyttet av innlogging, ikke av at adressen er hemmelig.
