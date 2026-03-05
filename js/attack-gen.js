/* Payloader — Attack Generator */

const MODULES = {
  sqli: {
    name: 'SQL Injection', icon: '🗄️', src: 'data/sqli.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All Types'],['auth-bypass','Auth Bypass'],['error-based','Error-Based'],
        ['boolean-blind','Boolean Blind'],['time-blind','Time-Based Blind'],
        ['union-based','UNION-Based'],['stacked','Stacked Queries'],
        ['filter-bypass','Filter Bypass'],['oob','Out-of-Band']
      ]},
      { key: 'platform', label: 'Database', opts: [
        ['all','Any DB'],['mysql','MySQL'],['mssql','MSSQL'],
        ['postgresql','PostgreSQL'],['oracle','Oracle'],['sqlite','SQLite']
      ]}
    ]
  },
  cmdi: {
    name: 'Command Injection', icon: '💻', src: 'data/cmdi.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All Types'],['basic','Basic'],['chaining','Chaining'],
        ['substitution','Substitution'],['blind','Blind OOB'],
        ['filter-bypass','Filter Bypass'],['windows','Windows']
      ]},
      { key: 'platform', label: 'Target OS', opts: [
        ['all','Any OS'],['linux','Linux'],['windows','Windows']
      ]}
    ]
  },
  ssti: {
    name: 'SSTI', icon: '🧱', src: 'data/ssti.json',
    filters: [
      { key: 'category', label: 'Engine / Goal', opts: [
        ['all','All'],['probe','Probe / Detection'],['jinja2','Jinja2'],
        ['twig','Twig'],['freemarker','Freemarker'],['velocity','Velocity'],
        ['smarty','Smarty'],['erb','Ruby ERB'],['mako','Mako'],['pebble','Pebble']
      ]}
    ]
  },
  traversal: {
    name: 'Path Traversal', icon: '📁', src: 'data/traversal.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['basic','Basic'],['windows','Windows'],
        ['encoded','URL Encoded'],['double-encoded','Double Encoded'],
        ['null-byte','Null Byte'],['filter-bypass','Filter Bypass']
      ]},
      { key: 'platform', label: 'Target OS', opts: [
        ['all','Any'],['linux','Linux'],['windows','Windows']
      ]}
    ]
  },
  revshells: {
    name: 'Reverse Shells', icon: '🐚', src: 'data/revshells.json',
    filters: [
      { key: 'category', label: 'Language / Tool', opts: [
        ['all','All'],['bash','Bash'],['python','Python'],['php','PHP'],
        ['perl','Perl'],['ruby','Ruby'],['powershell','PowerShell'],
        ['netcat','Netcat'],['socat','Socat'],['java','Java'],['other','Other']
      ]},
      { key: 'platform', label: 'Target OS', opts: [
        ['all','Any'],['linux','Linux'],['windows','Windows']
      ]}
    ]
  },
  xxe: {
    name: 'XXE', icon: '🗃️', src: 'data/xxe.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['basic','Basic LFI'],['ssrf','SSRF via XXE'],
        ['blind-oob','Blind OOB'],['parameter-entity','Parameter Entity'],
        ['content-type','Content-Type'],['filter-bypass','Filter Bypass']
      ]}
    ]
  },
  ssrf: {
    name: 'SSRF', icon: '🌐', src: 'data/ssrf.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['cloud-metadata','Cloud Metadata'],['localhost-bypass','Localhost Bypass'],
        ['protocol-tricks','Protocol Tricks'],['blind','Blind SSRF'],['internal-network','Internal Network']
      ]}
    ]
  },
  redirect: {
    name: 'Open Redirect', icon: '↪️', src: 'data/redirect.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['basic','Basic'],['bypass','Bypass'],
        ['whitelist-bypass','Whitelist Bypass'],['url-tricks','URL Tricks'],['header-injection','Header Injection']
      ]}
    ]
  },
  php: {
    name: 'PHP Attacks', icon: '🐘', src: 'data/php.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All'],['webshell','Webshell'],['type-juggling','Type Juggling'],
        ['lfi','LFI Wrappers'],['rfi','RFI'],['unserialize','Unserialize'],['rce-functions','RCE Functions']
      ]}
    ]
  },
  jwt: {
    name: 'JWT Attacks', icon: '🔑', src: 'data/jwt.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['alg-none','alg:none'],['alg-confusion','Alg Confusion'],
        ['weak-secret','Weak Secret'],['kid-injection','kid Injection'],
        ['header-injection','Header Injection'],['claim-tampering','Claim Tampering']
      ]}
    ]
  },
  csrf: {
    name: 'CSRF', icon: '🎭', src: 'data/csrf.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['get-based','GET-Based'],['post-form','POST Form'],
        ['json','JSON Body'],['multipart','Multipart'],
        ['account-takeover','Account Takeover'],['exfiltration','Exfiltration']
      ]}
    ]
  },
  proto: {
    name: 'Prototype Pollution', icon: '⚙️', src: 'data/proto.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['query-pollution','Query String'],['json-pollution','JSON Body'],
        ['client-side','Client-Side'],['rce-gadgets','RCE Gadgets'],['nodejs-gadgets','Node.js Gadgets']
      ]}
    ]
  },
  crlf: {
    name: 'CRLF Injection', icon: '📬', src: 'data/crlf.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['header-injection','Header Injection'],['response-splitting','Response Splitting'],
        ['cache-poisoning','Cache Poisoning'],['log-injection','Log Injection'],['bypass','Bypass']
      ]}
    ]
  },
  idor: {
    name: 'IDOR', icon: '🔓', src: 'data/idor.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['horizontal','Horizontal'],['vertical','Vertical'],
        ['guid-bypass','GUID Bypass'],['mass-assignment','Mass Assignment'],['bypass','Bypass']
      ]}
    ]
  },
  deserial: {
    name: 'Deserialization', icon: '📦', src: 'data/deserial.json',
    filters: [
      { key: 'category', label: 'Language / Platform', opts: [
        ['all','All'],['php','PHP'],['java','Java'],['python','Python'],
        ['nodejs','Node.js'],['ruby','Ruby'],['detection','Detection']
      ]}
    ]
  },
  smuggling: {
    name: 'HTTP Smuggling', icon: '🚦', src: 'data/smuggling.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['cl-te','CL.TE'],['te-cl','TE.CL'],
        ['te-te','TE.TE'],['h2-downgrade','H2 Downgrade'],['detection','Detection']
      ]}
    ]
  },
  nosql: {
    name: 'NoSQL Injection', icon: '🍃', src: 'data/nosql.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['authentication-bypass','Auth Bypass'],['blind','Blind'],
        ['http-parameter','HTTP Parameter'],['oob','OOB Exfil'],['redis','Redis'],['couchdb','CouchDB'],['detection','Detection']
      ]},
      { key: 'platform', label: 'Database', opts: [
        ['all','Any'],['mongodb','MongoDB'],['redis','Redis'],['couchdb','CouchDB']
      ]}
    ]
  },
  graphql: {
    name: 'GraphQL Attacks', icon: '◉', src: 'data/graphql.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All'],['introspection','Introspection'],['authorization-bypass','Auth Bypass'],
        ['injection','Injection'],['enumeration','Enumeration'],['dos','DoS'],['ssrf','SSRF'],['detection','Detection']
      ]}
    ]
  },
  oauth: {
    name: 'OAuth Attacks', icon: '🔐', src: 'data/oauth.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All'],['redirect-uri','Redirect URI'],['state-bypass','State Bypass'],
        ['authorization-bypass','Auth Bypass'],['token-theft','Token Theft'],
        ['pkce-bypass','PKCE Bypass'],['token-forgery','Token Forgery']
      ]}
    ]
  },
  racecond: {
    name: 'Race Conditions', icon: '⚡', src: 'data/racecond.json',
    filters: [
      { key: 'category', label: 'Technique', opts: [
        ['all','All'],['limit-overrun','Limit Overrun'],['toctou','TOCTOU'],
        ['multi-endpoint','Multi-Endpoint'],['technique','Technique / PoC'],['detection','Detection']
      ]}
    ]
  },
  websocket: {
    name: 'WebSocket Attacks', icon: '🔌', src: 'data/websocket.json',
    filters: [
      { key: 'category', label: 'Attack Type', opts: [
        ['all','All'],['hijacking','Hijacking (CSWSH)'],['injection','Injection'],
        ['xss','XSS via WS'],['ssrf','SSRF'],['origin-bypass','Origin Bypass'],
        ['manipulation','Manipulation'],['detection','Detection']
      ]}
    ]
  }
};

/* WAF / Bypass transforms */
const WAF_TRANSFORMS = {
  none:       { name: 'None (raw)',          fn: p => p },
  url:        { name: 'URL Encode',          fn: p => encodeURIComponent(p) },
  double_url: { name: 'Double URL Encode',   fn: p => encodeURIComponent(encodeURIComponent(p)) },
  case:       { name: 'Case Randomize',      fn: p => [...p].map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('') },
  comment:    { name: 'SQL Comment Insert',  fn: p => p.replace(/\b(SELECT|FROM|WHERE|AND|OR|UNION|INSERT|UPDATE|DELETE|DROP|TABLE|INTO)\b/gi, m => m.split('').join('/**/')) },
  space_comment: { name: 'Space → /**/',     fn: p => p.replace(/ /g, '/**/') },
  null_byte:  { name: 'Null Byte Inject',    fn: p => p.replace(/ /g, '\x00') },
  hex_encode: { name: 'Hex (\\xNN)',         fn: p => [...p].map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('') },
};

class AttackGen {
  constructor() {
    this.modKey  = 'sqli';
    this.pool    = [];
    this.results = [];
    this.cache   = {};
    this.filters = {};
    this.init();
  }

  init() {
    this.buildModuleSelect();
    this.buildWafSelect();
    this.selectModule('sqli');
    document.getElementById('gen-btn').addEventListener('click', () => this.generate());
    document.getElementById('ag-export').addEventListener('click', () => this.exportTxt());
  }

  buildWafSelect() {
    const sel = document.getElementById('waf-select');
    if (!sel) return;
    sel.innerHTML = Object.entries(WAF_TRANSFORMS).map(([k, t]) =>
      `<option value="${k}">${t.name}</option>`
    ).join('');
  }

  buildModuleSelect() {
    const sel = document.getElementById('mod-select');
    sel.innerHTML = Object.entries(MODULES).map(([k, m]) =>
      `<option value="${k}">${m.icon} ${m.name}</option>`
    ).join('');
    sel.addEventListener('change', () => this.selectModule(sel.value));
  }

  selectModule(key) {
    this.modKey  = key;
    this.pool    = [];
    this.filters = {};
    this.results = [];
    this.renderOutput([]);

    const mod = MODULES[key];
    document.getElementById('mod-name').textContent = mod.icon + ' ' + mod.name;
    this.buildFilterPanel(mod);
    this.loadData();
  }

  buildFilterPanel(mod) {
    const panel = document.getElementById('filter-panel');
    panel.innerHTML = mod.filters.map(f => `
      <div class="gen-field">
        <label class="gen-label">${this.esc(f.label)}</label>
        <select class="gen-select ag-filter" data-key="${f.key}">
          ${f.opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>`).join('');

    panel.querySelectorAll('.ag-filter').forEach(sel => {
      this.filters[sel.dataset.key] = sel.value;
      sel.addEventListener('change', () => {
        this.filters[sel.dataset.key] = sel.value;
      });
    });
  }

  async loadData() {
    const mod = MODULES[this.modKey];
    document.getElementById('pool-stat').textContent = 'Loading...';

    if (this.cache[this.modKey]) {
      this.pool = this.cache[this.modKey];
      this.updateStat();
      return;
    }

    try {
      const r = await fetch(mod.src + '?v=' + Date.now(), { cache: 'no-cache' });
      const d = await r.json();
      this.pool = d.payloads || [];
      this.cache[this.modKey] = this.pool;
      this.updateStat();
    } catch (e) {
      console.error('Failed to load', mod.src, e);
      this.pool = [];
      document.getElementById('pool-stat').textContent = 'Failed to load data';
    }
  }

  updateStat() {
    const el = document.getElementById('pool-stat');
    if (el) el.textContent = this.pool.length + ' payloads available';
  }

  generate() {
    const filtered = this.pool.filter(p => {
      for (const [k, v] of Object.entries(this.filters)) {
        if (v === 'all') continue;
        if (k === 'category' && p.category !== v) return false;
        if (k === 'platform' && !(p.platform || []).includes(v)) return false;
      }
      return true;
    });

    const count    = parseInt(document.getElementById('count-select').value) || 5;
    const wafKey   = document.getElementById('waf-select')?.value || 'none';
    const wafFn    = WAF_TRANSFORMS[wafKey]?.fn || (p => p);
    const shuffled = filtered.slice().sort(() => Math.random() - 0.5);
    this.results   = shuffled.slice(0, count).map(p => ({ ...p, code: wafFn(p.code) }));

    if (this.results.length === 0) {
      document.getElementById('ag-output').innerHTML = `
        <div class="gen-placeholder">
          <div class="gen-placeholder-icon">🔍</div>
          No payloads match the selected filters. Try broadening your selection.
        </div>`;
      return;
    }

    this.renderOutput(this.results);
  }

  renderOutput(payloads) {
    const out = document.getElementById('ag-output');
    if (!payloads.length) {
      out.innerHTML = `<div class="gen-placeholder"><div class="gen-placeholder-icon">⚡</div>Select a module and click Generate.</div>`;
      return;
    }

    out.innerHTML = payloads.map((p, i) => {
      const colorIdx = i % 8;
      const platforms = (p.platform || []).map(pl => `<span class="meta-pill">${this.esc(pl)}</span>`).join('');
      return `
      <div class="gen-result-card">
        <div class="gen-result-head">
          <div class="gen-result-label">
            <span class="payload-cat cat-mod-${colorIdx}" style="font-size:0.7rem;">${this.esc(p.category)}</span>
            <span class="meta-pill" style="margin-left:6px;">${p.code.length}c</span>
            ${platforms}
          </div>
          <div class="gen-result-actions">
            <button class="gen-copy-btn ag-copy" data-idx="${i}" title="Copy payload">📋 Copy</button>
          </div>
        </div>
        <div class="gen-result-code">${this.esc(p.code)}</div>
        <div class="gen-result-foot" style="font-size:0.78rem;color:var(--text2);">
          ${this.esc(p.description)}
        </div>
      </div>`;
    }).join('');

    out.querySelectorAll('.ag-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = this.results[parseInt(btn.dataset.idx)];
        if (!p) return;
        navigator.clipboard?.writeText(p.code).then(() => {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
        }).catch(() => this.fallbackCopy(p.code));
      });
    });
  }

  exportTxt() {
    if (!this.results.length) return;
    const lines = this.results.map(p => p.code).join('\n');
    const blob  = new Blob([lines], { type: 'text/plain' });
    const url   = URL.createObjectURL(blob);
    const mod   = MODULES[this.modKey];
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `payloader-${mod.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`,
      style: 'display:none'
    });
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

document.addEventListener('DOMContentLoaded', () => { window.attackGen = new AttackGen(); });
