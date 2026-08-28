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
  // Elementet velger selv hvilken timetabell det gjelder, via data-hours-table,
  // så samme skript funker på alle sider. Vi viser ikke lenger firmanavnet i
  // selve statusteksten (det står jo allerede i overskriften over).
  const statusEl = document.getElementById('open-status');
  if (statusEl) {
    const tableId = statusEl.dataset.hoursTable || 'hours-store';
    const DAY_NAMES = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const getRow = d => document.querySelector(`#${tableId} tr[data-day="${d}"]`);
    const getHours = d => {
      const row = getRow(d);
      if (!row) return null;
      const text = row.children[1].textContent.trim();
      if (text.toLowerCase() === 'stengt') return null;
      const [start, end] = text.split('–').map(s => s.trim());
      return { start, end };
    };

    const todayHours = getHours(dayIndex);
    const nowMinutes = nowOslo.getHours() * 60 + nowOslo.getMinutes();
    const isOpenNow = todayHours
      && nowMinutes >= toMinutes(todayHours.start)
      && nowMinutes < toMinutes(todayHours.end);

    if (isOpenNow) {
      statusEl.textContent = `Åpent nå til ${todayHours.end}`;
      statusEl.classList.add('is-open');
    } else if (todayHours && nowMinutes < toMinutes(todayHours.start)) {
      // Stengt, men åpner senere i dag
      statusEl.textContent = `Stengt nå · åpner ${todayHours.start}`;
      statusEl.classList.add('is-closed');
    } else {
      // Stengt for dagen (enten en fridag som søndag, eller vi er forbi
      // dagens stengetid) — finn neste åpningsdag, maks 7 dager frem.
      let next = null;
      for (let i = 1; i <= 7; i++) {
        const d = (dayIndex + i) % 7;
        const hours = getHours(d);
        if (hours) { next = { day: DAY_NAMES[d], start: hours.start }; break; }
      }
      statusEl.textContent = next
        ? `Stengt nå · åpner ${next.start} ${next.day}`
        : 'Stengt nå';
      statusEl.classList.add('is-closed');
    }
  }
});
