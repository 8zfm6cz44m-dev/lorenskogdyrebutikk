-- ============================================================
-- Lørenskog Dyrebutikk & Hundesalong — Supabase schema
-- Kjør denne i Supabase → SQL Editor (kjør alt på én gang)
-- ============================================================

-- ---------- BOOKINGS (timebestillinger fra Hundesalong-siden) ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  dog_name text not null,
  breed text not null,
  service text not null,
  preferred_date date,
  preferred_time text,
  message text,
  status text not null default 'ny' check (status in ('ny', 'bekreftet', 'avvist', 'fullført')),
  photo_ok boolean not null default true
);

alter table public.bookings enable row level security;

-- Hvem som helst (også ikke-innloggede besøkende) kan LEGGE INN en booking …
create policy "Alle kan sende inn booking"
  on public.bookings for insert
  to anon
  with check (true);

-- … men KUN innloggede admin-brukere kan LESE/ENDRE/SLETTE bookinger.
create policy "Kun innlogget admin kan lese bookinger"
  on public.bookings for select
  to authenticated
  using (true);

create policy "Kun innlogget admin kan oppdatere bookinger"
  on public.bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Kun innlogget admin kan slette bookinger"
  on public.bookings for delete
  to authenticated
  using (true);


-- ---------- PRICES (priser vist på nettsiden, redigerbare fra admin) ----------
create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('dropin', 'stell')),
  name text not null,
  description text,
  price_liten numeric,
  price_mellomstor numeric,
  price_stor numeric,
  price_flat numeric,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (section, name)
);

alter table public.prices enable row level security;

-- Alle (også besøkende på nettsiden) kan LESE priser …
create policy "Alle kan lese priser"
  on public.prices for select
  to anon, authenticated
  using (true);

-- … men KUN innlogget admin kan legge til/endre/slette priser.
create policy "Kun innlogget admin kan legge til priser"
  on public.prices for insert
  to authenticated
  with check (true);

create policy "Kun innlogget admin kan oppdatere priser"
  on public.prices for update
  to authenticated
  using (true)
  with check (true);

create policy "Kun innlogget admin kan slette priser"
  on public.prices for delete
  to authenticated
  using (true);

-- Auto-oppdater "updated_at" ved endring
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prices_updated_at on public.prices;
create trigger trg_prices_updated_at
  before update on public.prices
  for each row execute function public.set_updated_at();


-- ---------- STARTPRISER (dagens priser fra nettsiden, som utgangspunkt) ----------
insert into public.prices (section, name, description, price_flat, sort_order) values
  ('dropin', 'Kloklipp', 'Rask og skånsom klipping av klørne, utført av erfarne hender.', 150, 1),
  ('dropin', 'Poterens', 'Rens og stell av puter og hår mellom tærne – godt for hygiene og komfort.', 150, 2)
on conflict (section, name) do nothing;

insert into public.prices (section, name, description, price_liten, price_mellomstor, price_stor, sort_order) values
  ('stell', 'Kun vask', 'Skånsom vask med hundeshampo tilpasset pels og hudtype, grundig skyll og tørk', 600, 800, 1000, 1),
  ('stell', 'Vask + børst', 'Inkluderer vask, føn og grundig børsting for å fjerne løs pels og underull', 800, 1000, 1200, 2),
  ('stell', 'Full pakke', 'Komplett behandling: vask, føn, børsting, klipp, samt stell av poter, ører og hygieneområder', 1400, 1500, 1700, 4)
on conflict (section, name) do nothing;

insert into public.prices (section, name, description, price_flat, sort_order) values
  ('stell', 'Rasetyper med omfattende underull', null, 2000, 3)
on conflict (section, name) do nothing;
