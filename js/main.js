// Lørenskog Dyrebutikk & Hundesalong — enkel interaktivitet, ingen backend.

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobilmeny ---
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Footer årstall ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Marker dagens rad i åpningstider-tabellene ---
  const now = new Date();
  const nowOslo = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const dayIndex = nowOslo.getDay(); // 0 = søndag ... 6 = lørdag

  document.querySelectorAll('.hours-table').forEach(table => {
    const row = table.querySelector(`tr[data-day="${dayIndex}"]`);
    if (row) row.classList.add('is-today');
  });

  // --- "Åpent nå" / "Stengt nå"-status i hero ---
  // Elementet velger selv hvilken timetabell og hvilket firmanavn det gjelder,
  // via data-hours-table og data-business, så samme skript funker på alle sider.
  const statusEl = document.getElementById('open-status');
  if (statusEl) {
    const tableId = statusEl.dataset.hoursTable || 'hours-store';
    const business = statusEl.dataset.business || 'oss';
    const row = document.querySelector(`#${tableId} tr[data-day="${dayIndex}"]`);
    if (row) {
      const hoursText = row.children[1].textContent.trim();
      if (hoursText.toLowerCase() === 'stengt') {
        statusEl.textContent = `Stengt i dag hos ${business}`;
        statusEl.classList.add('is-closed');
      } else {
        const [start, end] = hoursText.split('–').map(s => s.trim());
        const toMinutes = t => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const nowMinutes = nowOslo.getHours() * 60 + nowOslo.getMinutes();
        const isOpen = nowMinutes >= toMinutes(start) && nowMinutes < toMinutes(end);
        statusEl.textContent = isOpen
          ? `Åpent nå til ${end} hos ${business}`
          : `Stengt nå · åpner ${start} hos ${business}`;
        statusEl.classList.add(isOpen ? 'is-open' : 'is-closed');
      }
    }
  }
});
