/* XSSVault — Payloads Page + Automated Test Runner */

class XSSVault {
  constructor() {
    this.allPayloads      = [];
    this.filtered         = [];
    this.view             = 'cards'; // 'cards' | 'list'
    this.testResults      = {};      // id -> 'verified' | 'failed'
    this.testRunning      = false;

    this.filters = {
      search: '',
      category: 'all',
      exec: 'all',
      status: 'all',
      features: []
    };

    this.init();
  }

  async init() {
    await this.loadPayloads();
    this.buildCategoryCounts();
    this.setupEvents();

    // Pre-select category from ?cat= URL param (from home page links)
    const rawCat = new URLSearchParams(location.search).get('cat') || '';
    const urlCat = rawCat.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 60);
    if (urlCat) {
      const radios = document.querySelectorAll('input[name="cat"]');
      radios.forEach(r => { if (r.value === urlCat) { r.checked = true; this.filters.category = urlCat; } });
    }

    this.applyFilters();
  }

  async loadPayloads() {
    try {
      const r    = await fetch('data/payloads.json?v=' + Date.now(), { cache: 'no-cache' });
      const data = await r.json();
      this.allPayloads = data.payloads || [];
    } catch (e) {
      console.error('Failed to load payloads:', e);
      this.allPayloads = [];
    }
    this.updateStats();
  }

  buildCategoryCounts() {
    const counts = {};
    this.allPayloads.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    counts['all'] = this.allPayloads.length;
    document.querySelectorAll('.count[data-cat]').forEach(el => {
      const cat = el.dataset.cat;
      el.textContent = counts[cat] ? `(${counts[cat]})` : '';
    });
  }

  /* ──────────────────────────────────────────────────────────────
     FILTERING
  ────────────────────────────────────────────────────────────── */
  applyFilters() {
    const f = this.filters;

    this.filtered = this.allPayloads.filter(p => {
      // Search
      if (f.search) {
        const q = f.search.toLowerCase();
        const haystack = (p.code + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Category
      if (f.category !== 'all' && p.category !== f.category) return false;

      // Execution type
      if (f.exec === 'auto'        && !p.auto_exec) return false;
      if (f.exec === 'interaction' &&  p.auto_exec) return false;

      // Test status
      const status = this.testResults[p.id];
      if (f.status === 'verified' && status !== 'verified') return false;
      if (f.status === 'failed'   && status !== 'failed')   return false;
      if (f.status === 'pending'  && status != null)        return false;

      // Feature flags
      if (f.features.includes('no-parens') && (p.code.includes('(') || p.code.includes(')'))) return false;
      if (f.features.includes('short')     && p.code.length >= 40) return false;
      if (f.features.includes('cookie')    && !p.code.toLowerCase().includes('cookie')) return false;
      if (f.features.includes('exfil')     && !(p.tags || []).includes('exfiltration')) return false;

      return true;
    });

    this.render();
    this.updateStats();
  }

  updateStats() {
    const total    = this.allPayloads.length;
    const verified = Object.values(this.testResults).filter(v => v === 'verified').length;
    const showing  = this.filtered.length;

    const el = id => document.getElementById(id);
    if (el('stat-total'))    el('stat-total').textContent    = total;
    if (el('stat-showing'))  el('stat-showing').textContent  = showing;
    if (el('stat-verified')) el('stat-verified').textContent = verified;
    if (el('count-label'))   el('count-label').textContent   = showing;
  }

  /* ──────────────────────────────────────────────────────────────
     RENDERING
  ────────────────────────────────────────────────────────────── */
  render() {
    const container = document.getElementById('payloads-container');
    if (!container) return;

    if (this.filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No payloads match your filters</h3>
          <p>Try broadening your search or resetting filters.</p>
        </div>`;
      return;
    }

    if (this.view === 'cards') {
      container.innerHTML = `<div class="payloads-grid">${this.filtered.map((p, i) => this.renderCard(p, i)).join('')}</div>`;
    } else {
      container.innerHTML = `<div class="payloads-list">${this.filtered.map((p, i) => this.renderRow(p, i)).join('')}</div>`;
    }

    this.attachCardEvents();
  }

  getStatusInfo(id) {
    const s = this.testResults[id];
    if (s === 'verified') return { cls: 'verified', badge: '<span class="verified-badge">✅ Verified</span>', cardCls: 'verified' };
    if (s === 'failed')   return { cls: 'failed',   badge: '<span class="failed-badge">❌ Failed</span>',    cardCls: 'failed' };
    return { cls: '', badge: '<span class="pending-badge">⬜ Untested</span>', cardCls: '' };
  }

  renderCard(p, i) {
    const { cardCls, badge } = this.getStatusInfo(p.id);
    const catCls = 'cat-' + p.category.replace(/[^a-z-]/g, '');
    const execLabel = p.auto_exec ? '⚡ Auto' : '👆 Interaction';
    const chars  = p.code.length;
    const codeEsc = this.esc(p.code);

    return `
    <div class="payload-card ${cardCls}" data-index="${i}">
      <div class="payload-card-head">
        <span class="payload-cat ${catCls}">${this.esc(p.category)}</span>
        <div class="payload-actions">
          <button class="action-btn" data-act="test" data-index="${i}" title="Test in Lab">🧪</button>
          <button class="action-btn" data-act="copy" data-index="${i}" title="Copy">📋</button>
          <button class="action-btn" data-act="open" data-index="${i}" title="Open in Lab">🔗</button>
        </div>
      </div>
      <div class="payload-code-wrap"><code>${codeEsc}</code></div>
      <div class="payload-card-foot">
        <div class="payload-desc">${this.esc(p.description)}</div>
        <div class="payload-meta">
          <span class="meta-pill">${chars}c</span>
          <span class="meta-pill">${execLabel}</span>
          ${badge}
        </div>
      </div>
    </div>`;
  }

  renderRow(p, i) {
    const { cardCls, badge } = this.getStatusInfo(p.id);
    const catCls = 'cat-' + p.category.replace(/[^a-z-]/g, '');
    return `
    <div class="payload-list-row ${cardCls}" data-index="${i}">
      <span class="payload-cat ${catCls}" style="font-size:0.68rem;">${this.esc(p.category)}</span>
      <code>${this.esc(p.code)}</code>
      <span class="payload-list-chars">${p.code.length}c</span>
      <div class="payload-actions">
        <button class="action-btn" data-act="test" data-index="${i}" title="Test">🧪</button>
        <button class="action-btn" data-act="copy" data-index="${i}" title="Copy">📋</button>
      </div>
    </div>`;
  }

  attachCardEvents() {
    document.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', e => {
        const act   = btn.dataset.act;
        const idx   = parseInt(btn.dataset.index);
        const payload = this.filtered[idx];
        if (!payload) return;

        if (act === 'copy') this.copyPayload(payload.code, btn);
        if (act === 'open') this.openInLab(payload.code);
        if (act === 'test') this.testSingle(payload, btn);
      });
    });
  }

  copyPayload(code, btn) {
    navigator.clipboard?.writeText(code).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
    }).catch(() => this.fallbackCopy(code));
  }

  fallbackCopy(text) {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text, style: 'position:fixed;left:-9999px'
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  /* ──────────────────────────────────────────────────────────────
     SINGLE PAYLOAD TEST (inline, quick)
  ────────────────────────────────────────────────────────────── */
  /* Pass payload to lab without putting it in the visible URL */
  openInLab(code) {
    try {
      const key = '_lab_' + Date.now();
      localStorage.setItem(key, code);
      window.open(`lab.html?pk=${key}`, '_blank', 'noopener,noreferrer');
    } catch(e) {
      // Fallback if localStorage unavailable
      window.open('lab.html', '_blank', 'noopener,noreferrer');
    }
  }

  testSingle(payload, btn) {
    if (!payload.auto_exec) {
      this.openInLab(payload.code);
      return;
    }
    btn.textContent = '⌛';
    this.runPayloadTest(payload).then(fired => {
      this.testResults[payload.id] = fired ? 'verified' : 'failed';
      btn.textContent = fired ? '✅' : '❌';
      setTimeout(() => {
        btn.textContent = '🧪';
        this.applyFilters();
      }, 1500);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     AUTOMATED TEST RUNNER
  ────────────────────────────────────────────────────────────── */
  async runAllTests() {
    const autoPayloads = this.allPayloads.filter(p => p.auto_exec);
    const total = autoPayloads.length;
    let passed = 0, failed = 0;

    const statusEl   = document.getElementById('tr-status-text');
    const progressEl = document.getElementById('tr-progress');
    const resultsEl  = document.getElementById('tr-results');
    const summaryEl  = document.getElementById('tr-summary');
    const spinner    = document.getElementById('tr-spinner');
    const startBtn   = document.getElementById('tr-start-btn');

    spinner.style.display = 'block';
    startBtn.disabled = true;
    startBtn.textContent = 'Running...';
    resultsEl.innerHTML = '';

    for (let i = 0; i < autoPayloads.length; i++) {
      if (!this.testRunning) break;

      const p = autoPayloads[i];
      statusEl.textContent = `Testing ${i + 1}/${total}: ${p.code.substring(0, 60)}${p.code.length > 60 ? '…' : ''}`;
      progressEl.style.width = ((i / total) * 100) + '%';

      const fired = await this.runPayloadTest(p);
      this.testResults[p.id] = fired ? 'verified' : 'failed';

      if (fired) passed++; else failed++;

      const row = document.createElement('div');
      row.className = 'tr-result-row';
      row.innerHTML = `
        <div class="tr-result-status">${fired ? '✅' : '❌'}</div>
        <div class="tr-result-code">${this.esc(p.code)}</div>
        <div class="tr-result-cat">${this.esc(p.category)}</div>`;
      resultsEl.insertBefore(row, resultsEl.firstChild);
    }

    progressEl.style.width = '100%';
    spinner.style.display = 'none';
    startBtn.disabled = false;
    startBtn.textContent = 'Run Again';
    this.testRunning = false;

    statusEl.textContent = `Testing complete.`;
    summaryEl.innerHTML = `<strong>${passed}</strong> verified &nbsp; <strong>${failed}</strong> failed &nbsp; of ${total} auto-exec payloads`;
    document.getElementById('tr-export-btn').style.display = 'inline-flex';

    this.applyFilters(); // refresh verified badges
  }

  /* Runs a single payload in the hidden iframe, returns true if XSS fires */
  runPayloadTest(payload) {
    return new Promise(resolve => {
      const iframe = document.getElementById('test-iframe');
      let resolved = false;
      const TIMEOUT = 1200;

      const handler = e => {
        if (e.data && e.data.type === 'xss_fired' && String(e.data.payloadId) === String(payload.id)) {
          clearTimeout(timer);
          window.removeEventListener('message', handler);
          resolved = true;
          resolve(true);
        }
      };
      window.addEventListener('message', handler);

      const timer = setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('message', handler);
          resolve(false);
        }
      }, TIMEOUT);

      // Navigate iframe to lab in test mode
      iframe.src = `lab.html?testMode=1&payloadId=${payload.id}&q=${encodeURIComponent(payload.code)}&ctx=reflected`;
    });
  }

  /* ──────────────────────────────────────────────────────────────
     EVENT SETUP
  ────────────────────────────────────────────────────────────── */
  setupEvents() {
    // Search
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    searchInput?.addEventListener('input', e => {
      this.filters.search = e.target.value.trim();
      searchClear.style.display = this.filters.search ? 'block' : 'none';
      this.applyFilters();
    });
    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      this.filters.search = '';
      searchClear.style.display = 'none';
      this.applyFilters();
    });

    // Category radios
    document.querySelectorAll('input[name="cat"]').forEach(r => {
      r.addEventListener('change', () => { this.filters.category = r.value; this.applyFilters(); });
    });

    // Exec radios
    document.querySelectorAll('input[name="exec"]').forEach(r => {
      r.addEventListener('change', () => { this.filters.exec = r.value; this.applyFilters(); });
    });

    // Status radios
    document.querySelectorAll('input[name="status"]').forEach(r => {
      r.addEventListener('change', () => { this.filters.status = r.value; this.applyFilters(); });
    });

    // Feature checkboxes
    document.querySelectorAll('input[name="feat"]').forEach(cb => {
      cb.addEventListener('change', () => {
        this.filters.features = Array.from(document.querySelectorAll('input[name="feat"]:checked')).map(c => c.value);
        this.applyFilters();
      });
    });

    // View toggle
    document.getElementById('view-cards')?.addEventListener('click', () => {
      this.view = 'cards';
      document.getElementById('view-cards').classList.add('active');
      document.getElementById('view-list').classList.remove('active');
      this.render();
    });
    document.getElementById('view-list')?.addEventListener('click', () => {
      this.view = 'list';
      document.getElementById('view-list').classList.add('active');
      document.getElementById('view-cards').classList.remove('active');
      this.render();
    });

    // Reset filters
    document.getElementById('reset-filters')?.addEventListener('click', () => {
      this.filters = { search: '', category: 'all', exec: 'all', status: 'all', features: [] };
      document.querySelectorAll('input[name="cat"]')[0].checked = true;
      document.querySelectorAll('input[name="exec"]')[0].checked = true;
      document.querySelectorAll('input[name="status"]')[0].checked = true;
      document.querySelectorAll('input[name="feat"]').forEach(cb => cb.checked = false);
      document.getElementById('search-input').value = '';
      document.getElementById('search-clear').style.display = 'none';
      this.applyFilters();
    });

    // Export .txt
    document.getElementById('export-txt')?.addEventListener('click', () => {
      const lines = this.filtered.map(p => p.code).join('\n');
      const blob  = new Blob([lines], { type: 'text/plain' });
      const url   = URL.createObjectURL(blob);
      const a     = Object.assign(document.createElement('a'), {
        href: url, download: `xssvault-payloads-${Date.now()}.txt`, style: 'display:none'
      });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    });

    // Test runner
    document.getElementById('runTestsBtn')?.addEventListener('click', () => {
      document.getElementById('test-overlay').classList.add('active');
    });
    document.getElementById('tr-close-btn')?.addEventListener('click', () => {
      this.testRunning = false;
      document.getElementById('test-overlay').classList.remove('active');
    });
    document.getElementById('tr-start-btn')?.addEventListener('click', () => {
      if (this.testRunning) return;
      this.testRunning = true;
      document.getElementById('tr-results').innerHTML = '';
      document.getElementById('tr-summary').textContent = '';
      document.getElementById('tr-export-btn').style.display = 'none';
      this.runAllTests();
    });
    document.getElementById('tr-export-btn')?.addEventListener('click', () => {
      const lines = this.allPayloads
        .filter(p => this.testResults[p.id] === 'verified')
        .map(p => p.code).join('\n');
      const blob = new Blob([lines], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `xssvault-verified-${Date.now()}.txt`, style: 'display:none'
      });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    });

    // Close overlay on outside click
    document.getElementById('test-overlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('test-overlay')) {
        this.testRunning = false;
        document.getElementById('test-overlay').classList.remove('active');
      }
    });
  }

  esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vault = new XSSVault();

  // Pre-select category from URL ?cat= param
  const rawCat2 = new URLSearchParams(location.search).get('cat') || '';
  const urlCat2 = rawCat2.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 60);
  if (urlCat2) {
    document.querySelectorAll('input[name="cat"]').forEach(r => { if (r.value === urlCat2) r.checked = true; });
  }
});
