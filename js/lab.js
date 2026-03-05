/* XSSVault Lab — Injection engine + banner handler */

/* ============================================================
   BANNER — shown whenever XSS fires (alert/confirm/prompt)
   ============================================================ */
function showBanner(msg, ctx) {
  var banner = document.getElementById('xss-banner');
  var msgEl  = document.getElementById('xss-banner-msg');
  if (!banner) return;
  msgEl.textContent = msg ? ' — payload said: "' + String(msg) + '"' : '';
  banner.style.display = 'block';
  banner.classList.add('xss-pop');
  setTimeout(function() { banner.classList.remove('xss-pop'); }, 400);
}

// Make showBanner globally available (called by the head override)
window.showBanner = showBanner;

/* ============================================================
   DEFENSE MODE STATE
   ============================================================ */
var DEFENSE_STORAGE_KEY = 'xssvault-defense-mode';
var defenseEnabled = false;

function setDefenseMode(enabled) {
  defenseEnabled = !!enabled;
  try { localStorage.setItem(DEFENSE_STORAGE_KEY, defenseEnabled ? '1' : '0'); } catch (e) {}
  var state = document.getElementById('defense-state');
  if (state) state.textContent = defenseEnabled ? 'ON (Defended)' : 'OFF (Vulnerable)';
}

function isDefenseMode() {
  return defenseEnabled;
}

/* ============================================================
   INJECT HELPER
   Uses createContextualFragment so <script> tags actually run.
   Fires auto-focus / auto-events on inserted elements after injection.
   ============================================================ */
function injectPayload(container, payloadStr) {
  container.innerHTML = '';

  try {
    // createContextualFragment executes <script> tags on insertion
    var range    = document.createRange();
    range.selectNode(container);
    var fragment = range.createContextualFragment(payloadStr);
    container.appendChild(fragment);
  } catch (e) {
    // Fallback: direct innerHTML (won't execute <script> but handles most)
    container.innerHTML = payloadStr;
  }

  // Simulate interactions for event-handler payloads
  simulateEvents(container);
}

function simulateEvents(container) {
  var els = container.querySelectorAll('*');
  els.forEach(function(el) {
    // Click-based
    if (el.onclick || el.getAttribute('onclick')) {
      try { el.click(); } catch (e) {}
    }
    // Hover-based
    if (el.onmouseover || el.getAttribute('onmouseover')) {
      try { el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } catch (e) {}
    }
    if (el.onmouseenter || el.getAttribute('onmouseenter')) {
      try { el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); } catch (e) {}
    }
    // Focus-based (autofocus elements already auto-focus, but ensure for others)
    if ((el.onfocus || el.getAttribute('onfocus')) && !el.hasAttribute('autofocus')) {
      try { el.focus(); } catch (e) {}
    }
    // Blur-based
    if (el.onblur || el.getAttribute('onblur')) {
      try { el.focus(); setTimeout(function() { try { el.blur(); } catch(e) {} }, 10); } catch(e) {}
    }
    // Pointer events
    if (el.onpointerover || el.getAttribute('onpointerover')) {
      try { el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); } catch(e) {}
    }
    // Context menu
    if (el.oncontextmenu || el.getAttribute('oncontextmenu')) {
      try { el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })); } catch(e) {}
    }
    // Double click
    if (el.ondblclick || el.getAttribute('ondblclick')) {
      try { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); } catch(e) {}
    }
    // Key events
    if (el.onkeydown || el.getAttribute('onkeydown')) {
      try {
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      } catch(e) {}
    }
  });
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(location.search);
  var testMode = params.get('testMode');

  // Defense mode toggle (disabled during automated test mode)
  var defenseToggle = document.getElementById('defense-toggle');
  if (defenseToggle) {
    var stored = false;
    try { stored = localStorage.getItem(DEFENSE_STORAGE_KEY) === '1'; } catch (e) {}
    setDefenseMode(stored && testMode !== '1');
    defenseToggle.checked = isDefenseMode();
    defenseToggle.disabled = testMode === '1';
    defenseToggle.addEventListener('change', function() {
      setDefenseMode(defenseToggle.checked && testMode !== '1');
      defenseToggle.checked = isDefenseMode();
    });
  }

  var tabs     = document.querySelectorAll('.lab-tab');
  var contexts = document.querySelectorAll('.lab-ctx');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      contexts.forEach(function(c) { c.style.display = 'none'; });
      tab.classList.add('active');
      var target = document.getElementById(tab.dataset.target);
      if (target) target.style.display = 'block';
    });
  });

  /* ============================================================
     REFLECTED XSS CONTEXT
     Input → innerHTML (createContextualFragment)
     ============================================================ */
  var reflectedInput  = document.getElementById('reflected-input');
  var reflectedOutput = document.getElementById('reflected-output');
  var reflectedRaw    = document.getElementById('reflected-raw');
  var reflectedFire   = document.getElementById('reflected-fire');

  function fireReflected() {
    var payload = reflectedInput.value;
    if (!payload) return;
    reflectedRaw.textContent = payload;
    if (isDefenseMode()) {
      reflectedOutput.textContent = payload;
    } else {
      injectPayload(reflectedOutput, payload);
    }
  }
  reflectedFire.addEventListener('click', fireReflected);
  reflectedInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fireReflected();
  });

  /* ============================================================
     DOM XSS CONTEXT
     location.hash → innerHTML
     ============================================================ */
  var domInput   = document.getElementById('dom-input');
  var domOutput  = document.getElementById('dom-output');
  var domFire    = document.getElementById('dom-fire');
  var hashLabel  = document.getElementById('current-hash');

  function fireDom() {
    var payload = domInput.value;
    if (!payload) return;
    // Set hash — this is how DOM XSS would happen in the wild
    location.hash = encodeURIComponent(payload);
    hashLabel.textContent = '#' + encodeURIComponent(payload);
    // Simulate the vulnerable DOM sink
    if (isDefenseMode()) {
      domOutput.textContent = decodeURIComponent(location.hash.slice(1));
    } else {
      /* ⚠️ VULNERABLE SINK: no sanitization */
      injectPayload(domOutput, decodeURIComponent(location.hash.slice(1)));
    }
  }
  domFire.addEventListener('click', fireDom);
  domInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fireDom();
  });

  // Also handle hash in URL on page load (for automated testing)
  function handleUrlHash() {
    if (location.hash && location.hash.length > 1) {
      var payload = decodeURIComponent(location.hash.slice(1));
      if (hashLabel) hashLabel.textContent = location.hash;
      if (isDefenseMode()) {
        domOutput.textContent = payload;
      } else {
        /* ⚠️ VULNERABLE SINK */
        injectPayload(domOutput, payload);
      }
    }
  }
  window.addEventListener('hashchange', handleUrlHash);
  handleUrlHash();

  /* ============================================================
     ATTRIBUTE XSS CONTEXT
     Input injected into attribute value
     ============================================================ */
  var attrInput  = document.getElementById('attr-input');
  var attrOutput = document.getElementById('attr-output');
  var attrRaw    = document.getElementById('attr-raw');
  var attrFire   = document.getElementById('attr-fire');

  function fireAttr() {
    var payload = attrInput.value;
    if (!payload) return;
    if (isDefenseMode()) {
      attrOutput.innerHTML = '';
      var safeDiv = document.createElement('div');
      safeDiv.className = 'injected-attr-el';
      safeDiv.textContent = 'Hover / interact with me';
      safeDiv.setAttribute('title', payload);
      attrOutput.appendChild(safeDiv);
      attrRaw.textContent = '[defended] setAttribute("title", userInput)';
    } else {
      /* ⚠️ VULNERABLE: payload goes directly into attribute, unsanitized */
      var constructed = '<div title="' + payload + '" class="injected-attr-el">Hover / interact with me</div>';
      attrRaw.textContent = constructed;
      injectPayload(attrOutput, constructed);
    }
  }
  attrFire.addEventListener('click', fireAttr);
  attrInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fireAttr();
  });

  /* ============================================================
     JS CONTEXT XSS
     Input embedded in a JS string, then eval'd
     ============================================================ */
  var jsInput  = document.getElementById('js-input');
  var jsOutput = document.getElementById('js-output');
  var jsRaw    = document.getElementById('js-raw');
  var jsFire   = document.getElementById('js-fire');

  function fireJs() {
    var payload = jsInput.value;
    if (!payload) return;
    if (isDefenseMode()) {
      var defended = 'const username = userInput; // no eval';
      jsRaw.textContent = defended;
      jsOutput.textContent = 'Stored safely as data: ' + payload;
    } else {
      /* ⚠️ VULNERABLE: embedding user input directly into JS string */
      var constructed = "var username = '" + payload + "';";
      jsRaw.textContent = constructed;
      jsOutput.textContent = 'Evaluating: ' + constructed;
      try {
        eval(constructed); // ← intentional eval of unsanitized input
        jsOutput.textContent = 'Executed: ' + constructed;
      } catch (e) {
        jsOutput.textContent = 'Error: ' + e.message;
      }
    }
  }
  jsFire.addEventListener('click', fireJs);
  jsInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') fireJs();
  });

  /* ============================================================
     INTERACTION ZONE
     ============================================================ */
  var interactionInput  = document.getElementById('interaction-input');
  var interactionOutput = document.getElementById('interaction-output');
  var interactionFire   = document.getElementById('interaction-fire');

  interactionFire.addEventListener('click', function() {
    var payload = interactionInput.value;
    if (!payload) return;
    if (isDefenseMode()) {
      interactionOutput.textContent = payload;
    } else {
      injectPayload(interactionOutput, payload);
    }
  });
  interactionInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var payload = interactionInput.value;
      if (!payload) return;
      if (isDefenseMode()) {
        interactionOutput.textContent = payload;
      } else {
        injectPayload(interactionOutput, payload);
      }
    }
  });

  /* ============================================================
     AUTOMATED TEST MODE
     When loaded inside iframe with ?testMode=1&q=PAYLOAD&ctx=reflected
     ============================================================ */
  var q   = params.get('q');
  var ctx = params.get('ctx') || 'reflected';

  if (testMode === '1' && q) {
    var decoded = decodeURIComponent(q);
    if (ctx === 'reflected') {
      injectPayload(
        document.getElementById('reflected-output') || document.body,
        decoded
      );
    } else if (ctx === 'dom') {
      injectPayload(
        document.getElementById('dom-output') || document.body,
        decoded
      );
    } else if (ctx === 'attr') {
      var constructed = '<div title="' + decoded + '" class="injected-attr-el">test</div>';
      injectPayload(document.getElementById('attr-output') || document.body, constructed);
    } else if (ctx === 'js') {
      try { eval("var _u = '" + decoded + "';"); } catch(e) {}
    }
  }

  // Also handle direct ?q= parameter for sharing specific tests
  if (!testMode && q) {
    if (reflectedInput) reflectedInput.value = decodeURIComponent(q);
  }
});
