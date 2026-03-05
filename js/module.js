/* Payloader — Generic Module Browser */

class ModuleBrowser {
  constructor() {
    this.allPayloads = [];
    this.filtered    = [];
    this.view        = 'cards';
    this.filters     = { search: '', category: 'all', platform: 'all' };
    this.catColorMap = {}; // category -> 0-7
    this.moduleKey   = '';
    this.moduleName  = '';
    this.moduleIcon  = '';
    this.init();
  }

  async init() {
    const params = new URLSearchParams(location.search);
    this.src  = params.get('src')  || '';
    this.name = params.get('name') || 'Module';
    // Derive module key from src path (e.g. data/sqli.json → sqli)
    this.moduleKey  = (this.src.split('/').pop() || '').replace('.json','');
    this.moduleName = this.name;

    document.title = `Payloader — ${this.name}`;
    const titleEl = document.getElementById('module-title');
    if (titleEl) titleEl.textContent = this.name;

    await this.loadData();
    this.buildSidebar();
    this.setupEvents();

    const urlCat = params.get('cat');
    if (urlCat) {
      this.filters.category = urlCat;
      const radio = document.querySelector(`input[name="mod-cat"][value="${urlCat}"]`);
      if (radio) radio.checked = true;
    }

    this.applyFilters();

    // Notify info modal
    window.dispatchEvent(new CustomEvent('moduleLoaded', { detail: { moduleKey: this.moduleKey } }));
  }

  async loadData() {
    if (!this.src) { this.showError('No module source specified (?src=data/sqli.json)'); return; }
    try {
      const r    = await fetch(this.src + '?v=' + Date.now(), { cache: 'no-cache' });
      const data = await r.json();
      this.allPayloads = data.payloads || [];
      this.meta = data.meta || {};
      this.moduleIcon = this.meta.icon || '';

      const descEl = document.getElementById('module-desc');
      if (descEl && this.meta.description) descEl.textContent = this.meta.description;

      this.updateStats();
    } catch (e) {
      console.error('Failed to load module:', e);
      this.showError('Failed to load module data from: ' + this.src);
    }
  }

  /* ── Sidebar ─────────────────────────────────────────────── */
  buildSidebar() {
    // Category counts
    const catCounts = {};
    const platforms = new Set();
    this.allPayloads.forEach(p => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      (p.platform || []).forEach(pl => platforms.add(pl));
    });

    // Assign colors to categories
    const cats = Object.keys(catCounts);
    cats.forEach((c, i) => { this.catColorMap[c] = i % 8; });

    // Build category radios
    const catGroup = document.getElementById('mod-cat-group');
    if (catGroup) {
      const total = this.allPayloads.length;
      catGroup.innerHTML = `
        <label class="filter-opt">
          <input type="radio" name="mod-cat" value="all" checked> All <span style="color:var(--text3);font-size:0.75rem;">(${total})</span>
        </label>` +
        cats.map(c => `
        <label class="filter-opt">
          <input type="radio" name="mod-cat" value="${this.esc(c)}">
          <span class="payload-cat cat-mod-${this.catColorMap[c]}" style="font-size:0.7rem;">${this.esc(c)}</span>
          <span style="color:var(--text3);font-size:0.75rem;">(${catCounts[c]})</span>
        </label>`).join('');
    }

    // Build platform radios
    const platGroup = document.getElementById('mod-plat-group');
    if (platGroup && platforms.size > 0) {
      platGroup.innerHTML = `<label class="filter-opt"><input type="radio" name="mod-plat" value="all" checked> All</label>` +
        [...platforms].sort().map(p => `
        <label class="filter-opt"><input type="radio" name="mod-plat" value="${this.esc(p)}"> ${this.esc(p)}</label>`).join('');
    } else if (platGroup) {
      platGroup.closest('.sidebar-section')?.remove();
    }
  }

  /* ── Filtering ───────────────────────────────────────────── */
  applyFilters() {
    const f = this.filters;
    this.filtered = this.allPayloads.filter(p => {
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay = (p.code + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.category !== 'all' && p.category !== f.category) return false;
      if (f.platform !== 'all' && !(p.platform || []).includes(f.platform)) return false;
      return true;
    });
    this.render();
    this.updateStats();
  }

  updateStats() {
    const showing = document.getElementById('stat-showing');
    const total   = document.getElementById('stat-total');
    const countLabel = document.getElementById('count-label');
    if (showing)    showing.textContent    = this.filtered.length;
    if (total)      total.textContent      = this.allPayloads.length;
    if (countLabel) countLabel.textContent = this.filtered.length;
  }

  /* ── Rendering ───────────────────────────────────────────── */
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

    this.attachCopyEvents();
  }

  renderCard(p, i) {
    const colorIdx = this.catColorMap[p.category] ?? (p.category.charCodeAt(0) % 8);
    const catCls   = `cat-mod-${colorIdx}`;
    const platforms = (p.platform || []).map(pl => `<span class="meta-pill">${this.esc(pl)}</span>`).join('');

    return `
    <div class="payload-card" data-index="${i}">
      <div class="payload-card-head">
        <span class="payload-cat ${catCls}">${this.esc(p.category)}</span>
        <div class="payload-actions">
          <button class="action-btn mod-copy" data-index="${i}" title="Copy">📋</button>
        </div>
      </div>
      <div class="payload-code-wrap"><code>${this.esc(p.code)}</code></div>
      <div class="payload-card-foot">
        <div class="payload-desc">${this.esc(p.description)}</div>
        <div class="payload-meta">
          <span class="meta-pill">${p.code.length}c</span>
          ${platforms}
        </div>
      </div>
    </div>`;
  }

  renderRow(p, i) {
    const colorIdx = this.catColorMap[p.category] ?? (p.category.charCodeAt(0) % 8);
    const catCls   = `cat-mod-${colorIdx}`;
    return `
    <div class="payload-list-row" data-index="${i}">
      <span class="payload-cat ${catCls}" style="font-size:0.68rem;">${this.esc(p.category)}</span>
      <code>${this.esc(p.code)}</code>
      <span class="payload-list-chars">${p.code.length}c</span>
      <div class="payload-actions">
        <button class="action-btn mod-copy" data-index="${i}" title="Copy">📋</button>
      </div>
    </div>`;
  }

  attachCopyEvents() {
    document.querySelectorAll('.mod-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = this.filtered[parseInt(btn.dataset.index)];
        if (!p) return;
        navigator.clipboard?.writeText(p.code).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
        }).catch(() => this.fallbackCopy(p.code));
      });
    });

  }

  fallbackCopy(text) {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text, style: 'position:fixed;left:-9999px'
    });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }

  /* ── Events ──────────────────────────────────────────────── */
  setupEvents() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    searchInput?.addEventListener('input', e => {
      this.filters.search = e.target.value.trim();
      if (searchClear) searchClear.style.display = this.filters.search ? 'block' : 'none';
      this.applyFilters();
    });
    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.filters.search = '';
      if (searchClear) searchClear.style.display = 'none';
      this.applyFilters();
    });

    document.addEventListener('change', e => {
      if (e.target.name === 'mod-cat') {
        this.filters.category = e.target.value;
        this.applyFilters();
      }
      if (e.target.name === 'mod-plat') {
        this.filters.platform = e.target.value;
        this.applyFilters();
      }
    });

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

    document.getElementById('reset-filters')?.addEventListener('click', () => {
      this.filters = { search: '', category: 'all', platform: 'all' };
      const firstCat = document.querySelector('input[name="mod-cat"]');
      if (firstCat) firstCat.checked = true;
      const firstPlat = document.querySelector('input[name="mod-plat"]');
      if (firstPlat) firstPlat.checked = true;
      const si = document.getElementById('search-input');
      if (si) si.value = '';
      const sc = document.getElementById('search-clear');
      if (sc) sc.style.display = 'none';
      this.applyFilters();
    });

    document.getElementById('export-txt')?.addEventListener('click', () => {
      const lines = this.filtered.map(p => p.code).join('\n');
      const blob  = new Blob([lines], { type: 'text/plain' });
      const url   = URL.createObjectURL(blob);
      const a     = Object.assign(document.createElement('a'), {
        href: url, download: `payloader-${this.name.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}.txt`, style: 'display:none'
      });
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
    });
  }

  showError(msg) {
    const container = document.getElementById('payloads-container');
    if (container) container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Error</h3>
        <p>${this.esc(msg)}</p>
      </div>`;
  }

  esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
  }
}

document.addEventListener('DOMContentLoaded', () => { window.moduleBrowser = new ModuleBrowser(); });
