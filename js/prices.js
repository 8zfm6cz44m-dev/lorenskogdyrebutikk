// ============================================================
// Henter priser fra Supabase og oppdaterer prisene i HTML-en.
// Den statiske HTML-en (i index.html / hundesalong.html) er alltid
// synlig som fallback dersom Supabase ikke er konfigurert ennå,
// eller om noe skulle feile — siden fungerer uansett.
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return; // ikke konfigurert ennå — behold statiske priser

  const { data, error } = await window.supabaseClient
    .from('prices')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('Kunne ikke hente priser fra Supabase, viser statiske priser.', error);
    return;
  }

  const fmt = n => (n === null || n === undefined) ? null : `${Number(n).toLocaleString('no-NO')},-`;

  data.forEach(row => {
    if (row.section === 'dropin') {
      const card = document.querySelector(`[data-price-name="${row.name}"][data-price-section="dropin"]`);
      if (!card) return;
      const priceEl = card.querySelector('.price');
      const descEl = card.querySelector('.dropin-desc');
      if (priceEl && row.price_flat !== null) priceEl.textContent = fmt(row.price_flat);
      if (descEl && row.description) descEl.textContent = row.description;
    }

    if (row.section === 'stell') {
      const tr = document.querySelector(`tr[data-price-name="${row.name}"]`);
      if (!tr) return;
      if (row.price_flat !== null && row.price_flat !== undefined) {
        const flatCell = tr.querySelector('[data-price-cell="flat"]');
        if (flatCell) flatCell.textContent = `Fra ${fmt(row.price_flat)}`;
      } else {
        const litenCell = tr.querySelector('[data-price-cell="liten"]');
        const mellomCell = tr.querySelector('[data-price-cell="mellomstor"]');
        const storCell = tr.querySelector('[data-price-cell="stor"]');
        if (litenCell && row.price_liten !== null) litenCell.textContent = `Fra ${fmt(row.price_liten)}`;
        if (mellomCell && row.price_mellomstor !== null) mellomCell.textContent = `Fra ${fmt(row.price_mellomstor)}`;
        if (storCell && row.price_stor !== null) storCell.textContent = `Fra ${fmt(row.price_stor)}`;
      }
      const nameCell = tr.querySelector('[data-price-cell="description"]');
      if (nameCell && row.description) {
        const mutedEl = nameCell.querySelector('.muted');
        if (mutedEl) mutedEl.textContent = row.description;
      }
    }
  });
});
