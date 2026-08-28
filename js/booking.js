// ============================================================
// Timebestilling — sender skjemaet til Supabase i stedet for
// Google Forms. Fungerer selvstendig av prisvisningen (prices.js).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

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
      service: fd.get('service')?.toString().trim(),
      preferred_date: fd.get('preferred_date') || null,
      preferred_time: fd.get('preferred_time')?.toString().trim() || null,
      message: fd.get('message')?.toString().trim() || null,
      photo_ok: fd.get('photo_ok') === 'on',
    };

    if (!payload.name || !payload.phone || !payload.service) {
      setStatus('Fyll ut navn, telefon og ønsket behandling.', 'is-error');
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
