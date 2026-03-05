# Payloader

A static, client-side web security research platform with curated payload libraries for 20 attack categories, a constraint-based XSS generator, an attack payload generator with WAF transforms, a global search, an encoder/decoder, favorites, and a deliberately vulnerable multi-context XSS lab.

## Project Layout

```text
.
├── index.html              # Home (single-viewport splash)
├── modules.html            # Attack module hub (20 categories)
├── module.html             # Generic payload browser (loads any JSON module)
├── payloads.html           # XSS payload browser + automated test runner
├── generator.html          # XSS payload generator (context/WAF/restrictions)
├── attack-gen.html         # Attack payload generator (20 modules, WAF transforms)
├── lab.html                # Deliberately vulnerable lab (4 XSS contexts)
├── search.html             # Global search across all 20 modules
├── encoder.html            # Encoder / Decoder (URL, Base64, HTML, Unicode, Hex, JWT)
├── favorites.html          # Saved/starred payloads (localStorage)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline caching)
├── css/
│   └── styles.css          # Shared cyberpunk neon theme
├── js/
│   ├── app.js              # Home page logic
│   ├── payloads.js         # XSS filtering, rendering, test runner, export
│   ├── module.js           # Generic module browser (search, filter, copy, favorites, export)
│   ├── generator.js        # Context matching, restrictions, WAF transforms, lab verification
│   ├── attack-gen.js       # Attack generator (20 modules, WAF bypass transforms)
│   ├── search.js           # Global search across all modules
│   ├── favorites.js        # Favorites manager (localStorage)
│   └── lab.js              # Injection sinks + XSS execution detection
├── data/
│   ├── payloads.json       # XSS payloads (123 entries, 10 event categories)
│   ├── sqli.json           # SQL Injection (42 payloads)
│   ├── cmdi.json           # Command Injection (30 payloads)
│   ├── ssti.json           # Server-Side Template Injection (37 payloads)
│   ├── traversal.json      # Path Traversal (30 payloads)
│   ├── xxe.json            # XXE Injection (22 payloads)
│   ├── ssrf.json           # SSRF (28 payloads)
│   ├── redirect.json       # Open Redirect (22 payloads)
│   ├── revshells.json      # Reverse Shells (32 payloads)
│   ├── php.json            # PHP Attacks (26 payloads)
│   ├── jwt.json            # JWT Attacks (20 payloads)
│   ├── csrf.json           # CSRF PoC Templates (18 payloads)
│   ├── proto.json          # Prototype Pollution (20 payloads)
│   ├── deserial.json       # Deserialization (18 payloads)
│   ├── smuggling.json      # HTTP Request Smuggling (16 payloads)
│   ├── crlf.json           # CRLF Injection (16 payloads)
│   ├── idor.json           # IDOR (14 payloads)
│   ├── nosql.json          # NoSQL Injection (25 payloads)
│   ├── graphql.json        # GraphQL Attacks (22 payloads)
│   └── oauth.json          # OAuth Attacks (20 payloads)
└── assets/
    └── README.txt          # Logo placeholder note
```

## Modules

| Module | Payloads | Coverage |
|---|---|---|
| XSS | 123 | 10 event categories, auto-exec + interaction |
| SQL Injection | 42 | auth bypass, error-based, blind, UNION, stacked, OOB |
| Command Injection | 30 | Linux/Windows delimiters, substitution, blind OOB |
| SSTI | 37 | Jinja2, Twig, Freemarker, Velocity, Smarty, ERB, Mako |
| Path Traversal | 30 | basic, encoded, double-encoded, null-byte, Windows |
| XXE | 22 | LFI, SSRF, blind OOB, parameter entities, SVG/upload |
| SSRF | 28 | AWS/GCP/Azure metadata, localhost bypass, protocols |
| Open Redirect | 22 | basic, whitelist bypass, CRLF-based injection |
| Reverse Shells | 32 | Bash, Python, PHP, Perl, Ruby, PowerShell, Netcat, Socat |
| PHP Attacks | 26 | webshells, type juggling, LFI wrappers, unserialize |
| JWT Attacks | 20 | alg:none, RS->HS confusion, kid injection, JWK/jku |
| CSRF | 18 | GET/POST/JSON/fetch PoC, CORS misconfiguration |
| Prototype Pollution | 20 | __proto__, constructor, Node.js RCE gadgets |
| Deserialization | 18 | PHP, Java ysoserial, Python pickle, Node.js |
| HTTP Smuggling | 16 | CL.TE, TE.CL, TE.TE, H2 downgrade |
| CRLF Injection | 16 | header injection, response splitting, cache poisoning |
| IDOR | 14 | horizontal/vertical, GUID bypass, mass assignment |
| NoSQL Injection | 25 | MongoDB operators, CouchDB, Redis RCE, blind, OOB |
| GraphQL Attacks | 22 | introspection, injection, DoS, SSRF, auth bypass |
| OAuth Attacks | 20 | redirect_uri, state CSRF, PKCE bypass, token theft |

## Features

### XSS Payload Browser (payloads.html)
- 123 payloads from the PortSwigger XSS cheat sheet
- Filter by category, execution type, test status, and feature flags
- Automated test runner: runs auto-exec payloads in a sandboxed iframe, detects via postMessage
- Export filtered list to .txt

### Generic Module Browser (module.html)
- Loads any data/*.json module via `?src=` URL parameter
- Dynamic sidebar: category and platform filters built from JSON data
- Search, filter, copy, ⭐ favorite, export

### XSS Payload Generator (generator.html)
- Context-based filtering: HTML, JavaScript string, HTML attribute, DOM XSS
- WAF transform presets: Cloudflare, AWS WAF, Akamai, ModSecurity, F5
- Character/length restriction filters
- Live lab verification: every generated payload tested in hidden iframe before return

### Attack Generator (attack-gen.html)
- 20 attack modules with category/platform filters
- WAF/bypass transform presets: URL encode, double URL, case randomize, comment insert, null byte, hex
- Shuffle + pick N payloads from filtered pool
- Export results to .txt

### Global Search (search.html)
- Searches all 20 modules simultaneously
- Results grouped by module with highlighted matches
- Copy individual results
- URL param support: `?q=sleep` to deep-link searches

### Encoder / Decoder (encoder.html)
- URL encode/decode
- Double URL encode/decode
- Base64 encode/decode
- HTML entity encode/decode
- Unicode escape (`\uXXXX`)
- Hex encode (`\xXX`)
- ROT13
- JWT decode (no verification)

### Favorites (favorites.html)
- Star any payload in any module with the ⭐ button
- Persisted in browser localStorage (survives page refresh)
- Filter by module, search, export to .txt, clear all

### Vulnerable Lab (lab.html)
- Reflected XSS (innerHTML sink)
- DOM XSS (location.hash sink)
- Attribute context injection
- JavaScript string context with eval
- Defense Mode toggle showing mitigated vs vulnerable behavior

## Running Locally

```bash
cd Payloader
npx serve .
# or
python -m http.server 8080
```

Open: http://localhost:8080/

The service worker enables offline use after first load.

## Notes

- No backend, no build step, no external runtime dependencies
- Test runner results are session-memory only
- For reverse shell payloads: replace LHOST/LPORT with your listener details
- Favorites are stored in `localStorage['payloader-favorites']`

## Ethics & Safety

For authorized security testing, CTF competitions, bug bounty research, and security education only.
Never test systems without explicit written permission.
