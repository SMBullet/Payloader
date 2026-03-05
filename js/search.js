/* Payloader — Global Search */

const SEARCH_SOURCES = [
  { key: 'xss',       name: 'XSS',                 icon: '⚡', src: 'data/payloads.json',  href: 'payloads.html' },
  { key: 'sqli',      name: 'SQL Injection',        icon: '🗄️', src: 'data/sqli.json',      href: 'module.html?src=data/sqli.json&name=SQL+Injection' },
  { key: 'cmdi',      name: 'Command Injection',    icon: '💻', src: 'data/cmdi.json',      href: 'module.html?src=data/cmdi.json&name=Command+Injection' },
  { key: 'ssti',      name: 'SSTI',                 icon: '🧱', src: 'data/ssti.json',      href: 'module.html?src=data/ssti.json&name=SSTI' },
  { key: 'traversal', name: 'Path Traversal',       icon: '📁', src: 'data/traversal.json', href: 'module.html?src=data/traversal.json&name=Path+Traversal' },
  { key: 'xxe',       name: 'XXE',                  icon: '🗃️', src: 'data/xxe.json',       href: 'module.html?src=data/xxe.json&name=XXE' },
  { key: 'ssrf',      name: 'SSRF',                 icon: '🌐', src: 'data/ssrf.json',      href: 'module.html?src=data/ssrf.json&name=SSRF' },
  { key: 'redirect',  name: 'Open Redirect',        icon: '↪️', src: 'data/redirect.json',  href: 'module.html?src=data/redirect.json&name=Open+Redirect' },
  { key: 'revshells', name: 'Reverse Shells',       icon: '🐚', src: 'data/revshells.json', href: 'module.html?src=data/revshells.json&name=Reverse+Shells' },
  { key: 'php',       name: 'PHP Attacks',          icon: '🐘', src: 'data/php.json',       href: 'module.html?src=data/php.json&name=PHP+Attacks' },
  { key: 'jwt',       name: 'JWT Attacks',          icon: '🔑', src: 'data/jwt.json',       href: 'module.html?src=data/jwt.json&name=JWT+Attacks' },
  { key: 'csrf',      name: 'CSRF',                 icon: '🎭', src: 'data/csrf.json',       href: 'module.html?src=data/csrf.json&name=CSRF' },
  { key: 'proto',     name: 'Prototype Pollution',  icon: '⚙️', src: 'data/proto.json',     href: 'module.html?src=data/proto.json&name=Prototype+Pollution' },
  { key: 'deserial',  name: 'Deserialization',      icon: '📦', src: 'data/deserial.json',  href: 'module.html?src=data/deserial.json&name=Deserialization' },
  { key: 'smuggling', name: 'HTTP Smuggling',       icon: '🚦', src: 'data/smuggling.json', href: 'module.html?src=data/smuggling.json&name=HTTP+Smuggling' },
  { key: 'crlf',      name: 'CRLF Injection',       icon: '📬', src: 'data/crlf.json',      href: 'module.html?src=data/crlf.json&name=CRLF+Injection' },
  { key: 'idor',      name: 'IDOR',                 icon: '🔓', src: 'data/idor.json',      href: 'module.html?src=data/idor.json&name=IDOR' },
  { key: 'nosql',     name: 'NoSQL Injection',      icon: '🍃', src: 'data/nosql.json',     href: 'module.html?src=data/nosql.json&name=NoSQL+Injection' },
  { key: 'graphql',   name: 'GraphQL Attacks',      icon: '◉',  src: 'data/graphql.json',   href: 'module.html?src=data/graphql.json&name=GraphQL+Attacks' },
  { key: 'oauth',     name: 'OAuth Attacks',        icon: '🔐', src: 'data/oauth.json',     href: 'module.html?src=data/oauth.json&name=OAuth+Attacks' },
  { key: 'racecond',  name: 'Race Conditions',      icon: '⚡', src: 'data/racecond.json',  href: 'module.html?src=data/racecond.json&name=Race+Condition+Attacks' },
  { key: 'websocket', name: 'WebSocket Attacks',    icon: '🔌', src: 'data/websocket.json', href: 'module.html?src=data/websocket.json&name=WebSocket+Attacks' },
];

class GlobalSearch {
  constructor() {
    this.allItems  = [];   // [{source, payload}]
    this.loaded    = false;
    this.debounce  = null;
    this.init();
  }

  async init() {
    this.setupEvents();
    this.showStatus('Loading payload databases...');
    await this.loadAll();
    this.showStatus(`${this.allItems.length} payloads indexed across ${SEARCH_SOURCES.length} modules`);

    // Auto-run if URL has ?q=
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
      const input = document.getElementById('gs-input');
      if (input) { input.value = q; this.run(q); }
    }
  }

  async loadAll() {
    const results = await Promise.allSettled(
      SEARCH_SOURCES.map(s => fetch(s.src + '?v=1', { cache: 'force-cache' }).then(r => r.json()))
    );
    this.allItems = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        (r.value.payloads || []).forEach(p => {
          this.allItems.push({ source: SEARCH_SOURCES[i], payload: p });
        });
      }
    });
    this.loaded = true;
  }

  setupEvents() {
    const input = document.getElementById('gs-input');
    const clear = document.getElementById('gs-clear');

    input?.addEventListener('input', e => {
      const q = e.target.value.trim();
      if (clear) clear.style.display = q ? 'block' : 'none';
      clearTimeout(this.debounce);
      this.debounce = setTimeout(() => this.run(q), 180);
    });

    clear?.addEventListener('click', () => {
      if (input) input.value = '';
      if (clear) clear.style.display = 'none';
      document.getElementById('gs-results').innerHTML = '';
      this.showStatus(`${this.allItems.length} payloads indexed across ${SEARCH_SOURCES.length} modules`);
    });

    // Focus search on page load
    input?.focus();
  }

  run(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      document.getElementById('gs-results').innerHTML = '';
      this.showStatus(`${this.allItems.length} payloads indexed — type to search`);
      return;
    }

    const matches = this.allItems.filter(item => {
      const hay = [
        item.payload.code,
        item.payload.description || '',
        item.payload.category || '',
        ...(item.payload.tags || [])
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

    this.showStatus(`${matches.length} results for "${query}"`);
    this.render(matches, q);
  }

  render(matches, query) {
    const container = document.getElementById('gs-results');

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try different keywords or check your spelling.</p>
        </div>`;
      return;
    }

    // Group by source module
    const groups = {};
    matches.forEach(item => {
      const k = item.source.key;
      if (!groups[k]) groups[k] = { source: item.source, items: [] };
      groups[k].items.push(item);
    });

    container.innerHTML = Object.values(groups).map(g => `
      <div class="gs-group">
        <div class="gs-group-header">
          <a href="${g.source.href}" class="gs-module-link">
            <span>${g.source.icon}</span>
            <span>${this.esc(g.source.name)}</span>
            <span class="gs-group-count">${g.items.length}</span>
          </a>
        </div>
        <div class="gs-group-items">
          ${g.items.slice(0, 30).map(item => this.renderItem(item, query)).join('')}
          ${g.items.length > 30 ? `<div class="gs-more"><a href="${g.source.href}">+ ${g.items.length - 30} more in ${g.source.name} →</a></div>` : ''}
        </div>
      </div>`).join('');

    container.querySelectorAll('.gs-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        navigator.clipboard?.writeText(code).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
        }).catch(() => this.fallbackCopy(code));
      });
    });
  }

  renderItem(item, query) {
    const p = item.payload;
    const highlighted = this.highlight(this.esc(p.code), query);
    return `
    <div class="gs-item">
      <div class="gs-item-code">${highlighted}</div>
      <div class="gs-item-foot">
        <span class="gs-item-desc">${this.esc(p.description || '')}</span>
        <button class="gen-copy-btn gs-copy" data-code="${this.esc(p.code)}" title="Copy">📋</button>
      </div>
    </div>`;
  }

  highlight(escaped, query) {
    if (!query) return escaped;
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
  }

  showStatus(msg) {
    const el = document.getElementById('gs-status');
    if (el) el.textContent = msg;
  }

  fallbackCopy(text) {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text, style: 'position:fixed;left:-9999px'
    });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }

  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }
}

document.addEventListener('DOMContentLoaded', () => { window.globalSearch = new GlobalSearch(); });
