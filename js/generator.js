/* XSSVault — Payload Generator */

class Generator {
  constructor() {
    this.db      = [];
    this.history = JSON.parse(localStorage.getItem('xssvault-gen-history') || '[]');
    this.current = [];
    this.testCache = new Map(); // key: labCtx|code => boolean
    this.generating = false;
    this.init();
  }

  async init() {
    await this.loadDB();
    this.setupEvents();
    this.renderHistory();
  }

  async loadDB() {
    try {
      const r    = await fetch('data/payloads.json?v=' + Date.now(), { cache: 'no-cache' });
      const data = await r.json();
      this.db = data.payloads || [];
    } catch (e) {
      console.error('Failed to load payload DB:', e);
      this.db = [];
    }
  }

  /* ──────────────────────────────────────────────────────────────
     GENERATION
  ────────────────────────────────────────────────────────────── */
  async generate() {
    if (this.generating) return;
    this.generating = true;

    const genBtn = document.getElementById('gen-btn');
    const refreshBtn = document.getElementById('gen-refresh');
    if (genBtn) { genBtn.disabled = true; genBtn.textContent = 'Verifying...'; }
    if (refreshBtn) refreshBtn.disabled = true;

    const ctx    = document.getElementById('ctx-select')?.value   || 'html';
    const waf    = document.getElementById('waf-select')?.value   || 'none';
    const count  = parseInt(document.getElementById('count-select')?.value || '5');

    const restrictions = {
      noAngles : document.getElementById('r-angles')?.checked || false,
      noQuotes : document.getElementById('r-quotes')?.checked || false,
      noParens : document.getElementById('r-parens')?.checked || false,
      noSlash  : document.getElementById('r-slash')?.checked  || false,
      noSemi   : document.getElementById('r-semi')?.checked   || false,
      lenLimit : document.getElementById('r-length')?.checked || false,
      maxLen   : parseInt(document.getElementById('max-length')?.value || '80')
    };

    const feasibility = this.validateFeasibility(ctx, restrictions);
    if (!feasibility.ok) {
      this.renderNoResults(feasibility.msg);
      this.resetGenerateButtons();
      return;
    }

    // Filter candidates by context + auto-exec only (generator promises working payloads)
    let pool = this.db.filter(p => this.matchesContext(p, ctx) && p.auto_exec);

    // Apply WAF transformation first (mutates code string)
    pool = pool.map(p => ({ ...p, code: this.applyWAF(p.code, waf), _sourceId: p.id }));

    // Filter by restrictions
    pool = pool.filter(p => this.passesRestrictions(p.code, restrictions));
    pool = this.uniqueByCode(pool);

    if (pool.length === 0) {
      this.renderNoResults('No candidates matched these constraints. Try relaxing one restriction.');
      this.resetGenerateButtons();
      return;
    }

    this.renderNoResults(`Verifying ${Math.min(pool.length, 80)} candidates against the lab...`);
    const verification = await this.selectVerifiedPayloads(pool, ctx, count);
    const selected = verification.selected;
    this.current = selected;

    if (!selected.length) {
      this.renderNoResults('Candidates were found, but none executed in this lab context with current restrictions.');
      this.resetGenerateButtons();
      return;
    }

    this.renderOutput(selected, waf, ctx, restrictions, verification.testedCount);
    this.addToHistory(selected);
    this.resetGenerateButtons();
  }

  matchesContext(payload, ctx) {
    const tags = (payload.tags || []).map(t => String(t).toLowerCase());
    const contexts = (payload.context || []).map(c => String(c).toLowerCase());

    const byContext = contexts.includes(ctx);
    if (byContext) return true;

    if (ctx === 'javascript') return tags.some(t => t.includes('js-context') || t.includes('javascript'));
    if (ctx === 'attribute')  return tags.some(t => t.includes('attribute') || t.includes('autofocus'));
    if (ctx === 'dom')        return tags.some(t => t.includes('dom') || t.includes('hash'));
    if (ctx === 'url')        return tags.some(t => t.includes('url') || t.includes('javascript-protocol') || t.includes('data-uri'));
    if (ctx === 'css')        return tags.some(t => t.includes('css') || t.includes('style'));
    return false;
  }

  passesRestrictions(code, r) {
    if (r.noAngles && (code.includes('<') || code.includes('>')))        return false;
    if (r.noQuotes && (code.includes('"') || code.includes("'")))        return false;
    if (r.noParens && (code.includes('(') || code.includes(')')))        return false;
    if (r.noSlash  && code.includes('/'))                                 return false;
    if (r.noSemi   && code.includes(';'))                                 return false;
    if (r.lenLimit && code.length > r.maxLen)                            return false;
    return true;
  }

  validateFeasibility(ctx, r) {
    const labCtx = this.toLabContext(ctx);
    if (!labCtx) {
      return {
        ok: false,
        msg: 'This context is not currently executable in the lab auto-validator. Use HTML, JavaScript, Attribute, or DOM.'
      };
    }
    if (ctx === 'javascript' && r.noQuotes) {
      return {
        ok: false,
        msg: 'In this JS-string lab sink, quote characters are required to break out. Disable "No quotes".'
      };
    }
    if (ctx === 'attribute' && r.noQuotes) {
      return {
        ok: false,
        msg: 'In this attribute lab sink, quote breakout is required. Disable "No quotes".'
      };
    }
    return { ok: true, msg: '' };
  }

  toLabContext(ctx) {
    const map = { html: 'reflected', javascript: 'js', attribute: 'attr', dom: 'dom' };
    return map[ctx] || null;
  }

  uniqueByCode(arr) {
    const seen = new Set();
    return arr.filter(p => {
      if (seen.has(p.code)) return false;
      seen.add(p.code);
      return true;
    });
  }

  async selectVerifiedPayloads(pool, ctx, count) {
    const labCtx = this.toLabContext(ctx);
    if (!labCtx) return { selected: [], testedCount: 0 };

    const candidates = this.shuffle(pool).slice(0, 80);
    const selected = [];
    let testedCount = 0;

    for (let i = 0; i < candidates.length && selected.length < count; i++) {
      const p = candidates[i];
      const key = `${labCtx}|${p.code}`;
      let works;

      if (this.testCache.has(key)) {
        works = this.testCache.get(key);
      } else {
        testedCount++;
        works = await this.runLabVerification(p.code, labCtx, `${Date.now()}-${i}`);
        this.testCache.set(key, works);
      }

      if (works) selected.push(p);
    }

    return { selected, testedCount };
  }

  runLabVerification(code, ctx, payloadId) {
    return new Promise(resolve => {
      const iframe = document.getElementById('gen-test-iframe');
      if (!iframe) return resolve(false);

      let done = false;
      const timeoutMs = 1400;

      const finish = ok => {
        if (done) return;
        done = true;
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        resolve(ok);
      };

      const onMessage = e => {
        if (!e || !e.data) return;
        if (e.data.type === 'xss_fired' && String(e.data.payloadId) === String(payloadId)) {
          finish(true);
        }
      };

      const timer = setTimeout(() => finish(false), timeoutMs);
      window.addEventListener('message', onMessage);
      iframe.src = `lab.html?testMode=1&ctx=${encodeURIComponent(ctx)}&payloadId=${encodeURIComponent(payloadId)}&q=${encodeURIComponent(code)}`;
    });
  }

  applyWAF(code, waf) {
    if (waf === 'none') return code;

    const transforms = {
      cloudflare: {
        'javascript': 'java\u00ADscript',   // soft hyphen
        '<script': '<\u0073cript',
        'onerror': 'oN\u0065rror'
      },
      aws: {
        '<script>': '<%00script>',
        'alert(': 'ale\u0072t(',
        'onerror': 'onerror\x20'
      },
      akamai: {
        'script': 'SCRIPT',
        'onerror': 'oN\u0065rror',
        'src=': 'src\x20='
      },
      modsecurity: {
        'alert(': 'confirm(',
        '<script': '<\u0073cript',
        'onerror': 'on\u0065rror'
      },
      f5: {
        'alert(': 'alert\u200B(',
        '<script': '<\u0073cript',
        'javascript:': 'java\u00ADscript:'
      }
    };

    const rules = transforms[waf];
    if (!rules) return code;

    let out = code;
    for (const [from, to] of Object.entries(rules)) {
      out = out.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
    }
    return out;
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  calcEffectiveness(waf, r) {
    let score = 92;
    const wafPenalty = { none: 0, cloudflare: -10, aws: -8, akamai: -12, modsecurity: -14, f5: -9 };
    score += wafPenalty[waf] || 0;
    if (r.noAngles) score -= 14;
    if (r.noQuotes) score -= 9;
    if (r.noParens) score -= 8;
    if (r.noSlash)  score -= 5;
    if (r.noSemi)   score -= 3;
    if (r.lenLimit) score -= 8;
    return Math.max(25, Math.min(98, score));
  }

  /* ──────────────────────────────────────────────────────────────
     RENDERING
  ────────────────────────────────────────────────────────────── */
  renderOutput(payloads, waf, ctx, r, testedCount) {
    const wafLabels = {
      none: 'No WAF', cloudflare: 'Cloudflare', aws: 'AWS WAF',
      akamai: 'Akamai', modsecurity: 'ModSecurity', f5: 'F5 ASM'
    };
    const eff = this.calcEffectiveness(waf, r);
    const effCls = eff >= 70 ? 'eff-high' : eff >= 50 ? 'eff-medium' : 'eff-low';

    const html = payloads.map((p, i) => `
      <div class="gen-result-card">
        <div class="gen-result-head">
          <span class="gen-result-label">${this.esc(p.category)} — ${this.esc(p.description || 'XSS payload')}</span>
          <div class="gen-result-actions">
            <button class="gen-copy-btn" data-gi="${i}" title="Copy">📋 Copy</button>
            <a class="gen-copy-btn" href="lab.html?q=${encodeURIComponent(p.code)}" target="_blank" title="Test in Lab">🧪 Test</a>
          </div>
        </div>
        <div class="gen-result-code">${this.esc(p.code)}</div>
        <div class="gen-result-foot">
          <div class="effectiveness-bar" title="Estimated effectiveness: ${eff}%">
            <div class="effectiveness-fill ${effCls}" style="width:${eff}%"></div>
          </div>
          <div class="eff-label">${eff}% effective</div>
          <span class="meta-pill" style="margin-left:8px;">${this.esc(wafLabels[waf] || waf)}</span>
          <span class="meta-pill">${p.code.length}c</span>
          <span class="meta-pill">lab-verified</span>
        </div>
      </div>`).join('');

    document.getElementById('gen-output').innerHTML = `
      <div style="font-size:0.75rem;color:var(--green);margin-bottom:10px;">Generated from verified payloads${testedCount ? ` (${testedCount} candidates tested)` : ''}.</div>
      ${html}
    `;
    this.attachCopyEvents();
  }

  renderNoResults(msg) {
    document.getElementById('gen-output').innerHTML = `
      <div class="gen-placeholder">
        <div class="gen-placeholder-icon">⚠️</div>
        ${this.esc(msg)}
      </div>`;
  }

  resetGenerateButtons() {
    this.generating = false;
    const genBtn = document.getElementById('gen-btn');
    const refreshBtn = document.getElementById('gen-refresh');
    if (genBtn) { genBtn.disabled = false; genBtn.textContent = '⚡ Generate Payloads'; }
    if (refreshBtn) refreshBtn.disabled = false;
  }

  attachCopyEvents() {
    document.querySelectorAll('.gen-copy-btn[data-gi]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx     = parseInt(btn.dataset.gi);
        const payload = this.current[idx];
        if (!payload) return;
        navigator.clipboard?.writeText(payload.code).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     HISTORY
  ────────────────────────────────────────────────────────────── */
  addToHistory(payloads) {
    payloads.forEach(p => {
      this.history.unshift({ code: p.code, cat: p.category, ts: Date.now() });
    });
    this.history = this.history.slice(0, 20);
    localStorage.setItem('xssvault-gen-history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    const el = document.getElementById('gen-history-list');
    if (!el) return;
    if (this.history.length === 0) {
      el.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);text-align:center;padding:20px;">No history yet</div>';
      return;
    }
    el.innerHTML = this.history.map((h, i) => `
      <div class="history-item">
        <code>${this.esc(h.code)}</code>
        <span class="h-meta">${this.esc(h.cat)}</span>
        <button class="history-copy" data-hi="${i}" title="Copy">📋</button>
      </div>`).join('');

    el.querySelectorAll('.history-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = this.history[parseInt(btn.dataset.hi)];
        if (h) navigator.clipboard?.writeText(h.code).then(() => {
          btn.textContent = '✓'; setTimeout(() => { btn.textContent = '📋'; }, 1200);
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     EVENTS
  ────────────────────────────────────────────────────────────── */
  setupEvents() {
    document.getElementById('gen-btn')?.addEventListener('click', () => this.generate());
    document.getElementById('gen-refresh')?.addEventListener('click', () => this.generate());

    document.getElementById('r-length')?.addEventListener('change', e => {
      document.getElementById('length-group').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('gen-export')?.addEventListener('click', () => {
      if (!this.current.length) { alert('Generate payloads first.'); return; }
      const text = this.current.map(p => p.code).join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `xssvault-generated-${Date.now()}.txt`, style: 'display:none'
      });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    });
  }

  esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
  }
}

document.addEventListener('DOMContentLoaded', () => { window.gen = new Generator(); });
