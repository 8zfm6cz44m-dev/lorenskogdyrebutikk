// ============================================================
// Offentlig avbestillingsside — nås via lenken i bekreftelses-e-posten
// (?token=...). Krever ingen innlogging. Kaller den delte Edge
// Function "cancel-booking" (samme funksjon som Fjellhamar Bistro
// bruker, se supabase/functions/cancel-booking/), med
// table="bookings" for denne siden.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const infoEl = document.getElementById('cb-info');
  const confirmBtn = document.getElementById('cb-confirm');
  const resultEl = document.getElementById('cb-result');

  const token = new URLSearchParams(location.search).get('token');

  if (!token) {
    infoEl.textContent = 'Fant ingen avbestillingskode i lenken. Sjekk at du brukte hele lenken fra e-posten, eller ring oss på 972 62 060.';
    return;
  }
  if (!window.supabaseClient) {
    infoEl.textContent = 'Noe gikk galt ved lasting av siden. Ring oss på 972 62 060 for å avbestille.';
    return;
  }

  infoEl.textContent = 'Trykk under for å bekrefte at du vil avbestille timen.';
  confirmBtn.hidden = false;

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    resultEl.classList.remove('is-ok', 'is-error');
    resultEl.textContent = 'Avbestiller …';

    try {
      const { data, error } = await window.supabaseClient.functions.invoke('cancel-booking', {
        body: { table: 'bookings', token },
      });

      if (error || !data) {
        resultEl.textContent = 'Kunne ikke avbestille akkurat nå. Ring oss gjerne på 972 62 060.';
        resultEl.classList.add('is-error');
        confirmBtn.disabled = false;
        return;
      }

      if (data.ok) {
        infoEl.textContent = '';
        confirmBtn.hidden = true;
        resultEl.textContent = 'Timen er avbestilt. Vi håper å se dere en annen gang!';
        resultEl.classList.add('is-ok');
      } else if (data.reason === 'not_cancellable') {
        infoEl.textContent = '';
        confirmBtn.hidden = true;
        resultEl.textContent = 'Denne timen er allerede avbestilt eller avsluttet, og kan ikke endres her. Ring oss på 972 62 060 ved spørsmål.';
      } else {
        resultEl.textContent = 'Fant ikke bestillingen. Ring oss gjerne på 972 62 060.';
        resultEl.classList.add('is-error');
        confirmBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      resultEl.textContent = 'Kunne ikke avbestille akkurat nå. Ring oss gjerne på 972 62 060.';
      resultEl.classList.add('is-error');
      confirmBtn.disabled = false;
    }
  });
});
