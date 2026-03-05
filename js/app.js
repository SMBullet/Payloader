/* Payloader — Home page app.js */

document.addEventListener('DOMContentLoaded', async () => {
  // Update stat count from actual JSON
  try {
    const r = await fetch('data/payloads.json?v=' + Date.now(), { cache: 'no-cache' });
    const d = await r.json();
    const count = (d.payloads || []).length;
    const el = document.getElementById('stat-payloads');
    if (el) el.textContent = count;
  } catch (e) {}

  // Handle ?cat= URL param to pre-filter on payloads page
  // (nothing needed on index, this is for navigation links)
});
