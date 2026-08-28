// ============================================================
// Admin-side: innlogging (Supabase Auth), bookinger og priser.
// Denne siden er IKKE lenket fra noe sted på det offentlige nettstedet
// og har <meta name="robots" content="noindex, nofollow">, men den er
// likevel bare beskyttet av innlogging — del aldri lenken offentlig.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  const logoutBtn = document.getElementById('logout-btn');
  const configWarning = document.getElementById('config-warning');

  if (!window.supabaseClient) {
    configWarning.hidden = false;
    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    return;
  }
  const sb = window.supabaseClient;

  // ---------- Auth ----------
  function showLoggedIn() {
    loginView.hidden = true;
    adminView.hidden = false;
    logoutBtn.hidden = false;
    loadBookings();
    loadPrices();
  }
  function showLoggedOut() {
    loginView.hidden = false;
    adminView.hidden = true;
    logoutBtn.hidden = true;
  }

  sb.auth.getSession().then(({ data }) => {
    if (data.session) showLoggedIn(); else showLoggedOut();
  });

  sb.auth.onAuthStateChange((_event, session) => {
    if (session) showLoggedIn(); else showLoggedOut();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginStatus.textContent = 'Logger inn …';
    loginStatus.className = 'form-status';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      loginStatus.textContent = 'Feil e-post eller passord.';
      loginStatus.className = 'form-status is-error';
      return;
    }
    loginStatus.textContent = '';
  });

  logoutBtn.addEventListener('click', () => sb.auth.signOut());

  // ---------- Tabs ----------
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById('panel-bookings').hidden = tab.dataset.tab !== 'bookings';
      document.getElementById('panel-prices').hidden = tab.dataset.tab !== 'prices';
    });
  });

  // ---------- Bookinger ----------
  const bookingsTbody = document.getElementById('bookings-tbody');
  const bookingsEmpty = document.getElementById('bookings-empty');
  const bookingsArchivedNote = document.getElementById('bookings-archived-note');
  const showArchivedCheckbox = document.getElementById('show-archived');
  const STATUS_OPTIONS = ['ny', 'bekreftet', 'avvist', 'fullført'];
  const ARCHIVED_STATUSES = ['fullført', 'avvist'];

  async function loadBookings() {
    const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    const showArchived = showArchivedCheckbox.checked;
    const archivedCount = data.filter(b => ARCHIVED_STATUSES.includes(b.status)).length;
    const visible = showArchived ? data : data.filter(b => !ARCHIVED_STATUSES.includes(b.status));

    bookingsTbody.innerHTML = '';
    bookingsEmpty.hidden = data.length > 0;
    bookingsArchivedNote.hidden = showArchived || archivedCount === 0;
    bookingsArchivedNote.textContent = `${archivedCount} fullført${archivedCount === 1 ? '' : 'e'}/avviste booking${archivedCount === 1 ? '' : 'er'} er arkivert og skjult — kryss av "Vis arkiv" for å se dem.`;

    visible.forEach(b => {
      const tr = document.createElement('tr');
      tr.dataset.status = b.status;

      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      statusSelect.dataset.status = b.status;
      STATUS_OPTIONS.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === b.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', async () => {
        const newStatus = statusSelect.value;
        // Oppdater farge på rad + felt med det samme, uten å vente på nettverket
        tr.dataset.status = newStatus;
        statusSelect.dataset.status = newStatus;
        await sb.from('bookings').update({ status: newStatus }).eq('id', b.id);
        // Fullført og avvist skal arkiveres (skjules) med mindre "Vis arkiv" er krysset av
        if (ARCHIVED_STATUSES.includes(newStatus) && !showArchivedCheckbox.checked) {
          loadBookings();
        }
      });

      const cellsBefore = [
        new Date(b.created_at).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' }),
        b.name, b.phone, b.dog_name || '–', b.breed || '–', b.service,
        b.preferred_date || '–',
        b.preferred_time || '–',
      ];
      cellsBefore.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });

      // Bekreftet tid — salongen skriver manuelt inn tiden de faktisk avtaler
      // med kunden (kan avvike fra "Ønsket tid"). Lagres når feltet forlates.
      const confirmedTd = document.createElement('td');
      const confirmedInput = document.createElement('input');
      confirmedInput.type = 'text';
      confirmedInput.placeholder = 'f.eks. 14:30';
      confirmedInput.value = b.confirmed_time || '';
      confirmedInput.addEventListener('blur', async () => {
        const value = confirmedInput.value.trim();
        await sb.from('bookings').update({ confirmed_time: value || null }).eq('id', b.id);
      });
      confirmedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmedInput.blur(); }
      });
      confirmedTd.appendChild(confirmedInput);
      tr.appendChild(confirmedTd);

      const cellsAfter = [
        b.message || '–',
        b.photo_ok ? 'Ja' : 'Nei',
      ];
      cellsAfter.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      const statusTd = document.createElement('td');
      statusTd.appendChild(statusSelect);
      tr.appendChild(statusTd);

      bookingsTbody.appendChild(tr);
    });
  }
  document.getElementById('refresh-bookings').addEventListener('click', loadBookings);
  showArchivedCheckbox.addEventListener('change', loadBookings);

  // ---------- Priser ----------
  const pricesTbody = document.getElementById('prices-tbody');
  let currentPrices = [];

  async function loadPrices() {
    const { data, error } = await sb.from('prices').select('*').order('section').order('sort_order');
    if (error) { console.error(error); return; }
    currentPrices = data;
    pricesTbody.innerHTML = '';
    data.forEach(row => pricesTbody.appendChild(buildPriceRow(row)));
  }

  function buildPriceRow(row) {
    // row === null → ny, ikke lagret rad (manuelt tillagt). Ellers en eksisterende rad fra Supabase.
    const isNew = row === null;
    const tr = document.createElement('tr');

    const sectionCell = isNew
      ? `<select data-field="section"><option value="dropin">dropin</option><option value="stell">stell</option></select>`
      : row.section;
    const nameCell = isNew
      ? `<input type="text" data-field="name" placeholder="Navn på tjeneste/produkt">`
      : row.name;

    tr.innerHTML = `
      <td>${sectionCell}</td>
      <td>${nameCell}</td>
      <td><input type="text" data-field="description" value="${((row && row.description) || '').replace(/"/g, '&quot;')}"></td>
      <td><input type="number" step="1" data-field="price_liten" value="${row?.price_liten ?? ''}"></td>
      <td><input type="number" step="1" data-field="price_mellomstor" value="${row?.price_mellomstor ?? ''}"></td>
      <td><input type="number" step="1" data-field="price_stor" value="${row?.price_stor ?? ''}"></td>
      <td><input type="number" step="1" data-field="price_flat" value="${row?.price_flat ?? ''}"></td>
      <td><button class="btn btn-outline btn-small row-save-btn">${isNew ? 'Legg til' : 'Lagre'}</button></td>
    `;

    tr.querySelector('.row-save-btn').addEventListener('click', async () => {
      const toNum = v => (v === '' ? null : Number(v));
      const get = field => tr.querySelector(`[data-field="${field}"]`).value;
      const update = {
        description: get('description') || null,
        price_liten: toNum(get('price_liten')),
        price_mellomstor: toNum(get('price_mellomstor')),
        price_stor: toNum(get('price_stor')),
        price_flat: toNum(get('price_flat')),
      };

      if (isNew) {
        const section = get('section').trim();
        const name = get('name').trim();
        if (!name) { alert('Fyll inn et navn på raden før du legger til.'); return; }
        const { error } = await sb.from('prices').insert({ ...update, section, name, sort_order: 99 });
        if (error) { alert('Kunne ikke legge til: ' + error.message); return; }
        loadPrices();
      } else {
        await sb.from('prices').update(update).eq('id', row.id);
      }
    });

    return tr;
  }

  document.getElementById('add-price-row').addEventListener('click', () => {
    pricesTbody.appendChild(buildPriceRow(null));
  });

  // ---------- Excel: last ned mal / eksport ----------
  document.getElementById('download-template').addEventListener('click', () => {
    if (!window.XLSX) return;
    const rows = currentPrices.map(r => ({
      section: r.section, name: r.name, description: r.description || '',
      price_liten: r.price_liten ?? '', price_mellomstor: r.price_mellomstor ?? '',
      price_stor: r.price_stor ?? '', price_flat: r.price_flat ?? '', sort_order: r.sort_order,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Priser');
    XLSX.writeFile(wb, 'lorenskog-priser.xlsx');
  });

  // ---------- Excel: importer ----------
  const importStatus = document.getElementById('import-status');
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    importStatus.textContent = 'Leser fil …';
    importStatus.className = 'form-status';

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const clean = rows.filter(r => r.section && r.name).map(r => ({
      section: String(r.section).trim(),
      name: String(r.name).trim(),
      description: r.description ? String(r.description).trim() : null,
      price_liten: r.price_liten === '' || r.price_liten == null ? null : Number(r.price_liten),
      price_mellomstor: r.price_mellomstor === '' || r.price_mellomstor == null ? null : Number(r.price_mellomstor),
      price_stor: r.price_stor === '' || r.price_stor == null ? null : Number(r.price_stor),
      price_flat: r.price_flat === '' || r.price_flat == null ? null : Number(r.price_flat),
      sort_order: r.sort_order == null || r.sort_order === '' ? 0 : Number(r.sort_order),
    }));

    if (clean.length === 0) {
      importStatus.textContent = 'Fant ingen gyldige rader i filen (mangler section/name?).';
      importStatus.className = 'form-status is-error';
      e.target.value = '';
      return;
    }

    const { error } = await sb.from('prices').upsert(clean, { onConflict: 'section,name' });
    if (error) {
      console.error(error);
      importStatus.textContent = 'Import feilet: ' + error.message;
      importStatus.className = 'form-status is-error';
    } else {
      importStatus.textContent = `Importerte ${clean.length} rader.`;
      importStatus.className = 'form-status is-ok';
      loadPrices();
    }
    e.target.value = '';
  });
});
