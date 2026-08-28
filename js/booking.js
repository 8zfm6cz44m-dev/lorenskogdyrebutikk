// ============================================================
// Timebestilling — sender skjemaet til Supabase i stedet for
// Google Forms. Fungerer selvstendig av prisvisningen (prices.js).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // Ekte kalendervisning for "Ønsket dato" (flatpickr), i stedet for å stole på
  // at nettleseren viser en kalender for <input type="date">. Viser dato på
  // norsk (dd.mm.åååå) men lagrer i ISO-format (åååå-mm-dd) i skjemafeltet,
  // som matcher "date"-kolonnen i Supabase.
  // CDN-skriptet er "defer", så det skal i teorien alltid være klart før dette
  // kjører — men vi venter uansett litt ekstra (opptil ~1s) i tilfelle en treg
  // nettverksforbindelse eller nettleser-utvidelse forsinker lastingen.
  function initDatePicker(attemptsLeft) {
    const dateInput = document.getElementById('bf-date');
    if (!dateInput) return;
    if (!window.flatpickr) {
      if (attemptsLeft > 0) setTimeout(() => initDatePicker(attemptsLeft - 1), 100);
      return;
    }
    try {
      if (window.flatpickr.l10ns && window.flatpickr.l10ns.no) {
        window.flatpickr.localize(window.flatpickr.l10ns.no);
      }
    } catch (e) { /* fortsett uten norsk oversettelse hvis dette skulle feile */ }
    window.flatpickr(dateInput, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd.m.Y',
      minDate: 'today',
      disable: [date => date.getDay() === 0], // stengt søndag
      disableMobile: true,
    });
  }
  initDatePicker(10);

  const statusEl = document.getElementById('bf-status');
  const submitBtn = document.getElementById('bf-submit');

  const setStatus = (text, type) => {
    statusEl.textContent = text;
    statusEl.classList.remove('is-ok', 'is-error');
    if (type) statusEl.classList.add(type);
  };

  if (!window.supabaseClient) {
    setStatus('Nettbestilling er ikke aktivert ennå — ring oss gjerne i mellomtiden.', 'is-error');
    submitBtn.disabled = true;
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    setStatus('Sender bestilling …', null);

    const fd = new FormData(form);
    const payload = {
      name: fd.get('name')?.toString().trim(),
      phone: fd.get('phone')?.toString().trim(),
      breed: fd.get('breed')?.toString().trim(),
      service: fd.get('service')?.toString().trim(),
      preferred_date: fd.get('preferred_date') || null,
      preferred_time: fd.get('preferred_time')?.toString().trim() || null,
      message: fd.get('message')?.toString().trim() || null,
      photo_ok: fd.get('photo_ok') === 'on',
    };

    if (!payload.name || !payload.phone || !payload.breed || !payload.service) {
      setStatus('Fyll ut navn, telefon, rase og ønsket behandling.', 'is-error');
      submitBtn.disabled = false;
      return;
    }

    const { error } = await window.supabaseClient.from('bookings').insert(payload);

    if (error) {
      console.error(error);
      setStatus('Noe gikk galt. Prøv igjen, eller ring oss på 972 62 060.', 'is-error');
      submitBtn.disabled = false;
      return;
    }

    form.reset();
    setStatus('Takk! Vi tar kontakt for å bekrefte tidspunktet.', 'is-ok');
    submitBtn.disabled = false;
  });
});
