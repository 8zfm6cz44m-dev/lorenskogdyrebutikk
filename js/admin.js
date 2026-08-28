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
  const STATUS_OPTIONS = ['ny', 'bekreftet', 'avvist', 'fullført'];

  async function loadBookings() {
    const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    bookingsTbody.innerHTML = '';
    bookingsEmpty.hidden = data.length > 0;
    data.forEach(b => {
      const tr = document.createElement('tr');

      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      STATUS_OPTIONS.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === b.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', async () => {
        await sb.from('bookings').update({ status: statusSelect.value }).eq('id', b.id);
      });

      const cells = [
        new Date(b.created_at).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' }),
        b.name, b.phone, b.service,
        b.preferred_date || '–',
        b.preferred_time || '–',
        b.message || '–',
        b.photo_ok ? 'Ja' : 'Nei',
      ];
      cells.forEach(text => {
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

  // ---------- Priser ----------
  const pricesTbody = document.getElementById('prices-tbody');
  let currentPrices = [];

  async function loadPrices() {
    const { data, error } = await sb.from('prices').select('*').order('section').order('sort_order');
    if (error) { console.error(error); return; }
    currentPrices = data;
    pricesTbody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.section}</td>
        <td>${row.name}</td>
        <td><input type="text" data-field="description" value="${(row.description || '').replace(/"/g, '&quot;')}"></td>
        <td><input type="number" step="1" data-field="price_liten" value="${row.price_liten ?? ''}"></td>
        <td><input type="number" step="1" data-field="price_mellomstor" value="${row.price_mellomstor ?? ''}"></td>
        <td><input type="number" step="1" data-field="price_stor" value="${row.price_stor ?? ''}"></td>
        <td><input type="number" step="1" data-field="price_flat" value="${row.price_flat ?? ''}"></td>
        <td><button class="btn btn-outline btn-small row-save-btn">Lagre</button></td>
      `;
      tr.querySelector('.row-save-btn').addEventListener('click', async () => {
        const toNum = v => (v === '' ? null : Number(v));
        const update = {
          description: tr.querySelector('[data-field="description"]').value || null,
          price_liten: toNum(tr.querySelector('[data-field="price_liten"]').value),
          price_mellomstor: toNum(tr.querySelector('[data-field="price_mellomstor"]').value),
          price_stor: toNum(tr.querySelector('[data-field="price_stor"]').value),
          price_flat: toNum(tr.querySelector('[data-field="price_flat"]').value),
        };
        await sb.from('prices').update(update).eq('id', row.id);
      });
      pricesTbody.appendChild(tr);
    });
  }

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
