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
