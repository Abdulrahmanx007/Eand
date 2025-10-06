// Keep HTML lean: wire events and light behaviors here
document.addEventListener('DOMContentLoaded', () => {
  // Performance mode toggle (persisted)
  (function setupPerformanceToggle(){
    try {
      const key = 'perfMode';
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const saved = localStorage.getItem(key);
      // default to low if unset or user prefers reduced motion
      let mode = saved === 'high' ? 'high' : (saved === 'low' ? 'low' : (prefersReduced ? 'low' : 'low'));
      function apply(modeVal){
        const low = modeVal === 'low';
        document.documentElement.classList.toggle('low-performance', low);
        document.body.classList.toggle('low-performance', low);
        const banner = document.getElementById('lowBanner');
        if (banner) banner.style.display = low ? 'block' : 'none';
        const btn = document.getElementById('perfToggle');
        if (btn) btn.textContent = 'Hero Mode ' + (low ? 'OFF' : 'ON');
        // Update Hub nav to pass low=1 when in low mode
        const hubLink = document.getElementById('navHub');
        if (hubLink && hubLink instanceof HTMLAnchorElement) {
          const base = 'AdvancedWorkspaceHub.html';
          hubLink.href = low ? base + '?low=1' : base;
        }
      }
      apply(mode);
      const btn = document.getElementById('perfToggle');
      if (btn) {
        btn.addEventListener('click', () => {
          mode = (mode === 'low') ? 'high' : 'low';
          localStorage.setItem(key, mode);
          apply(mode);
        });
      }
      // Banner "Disable" button listener
      const disableLowBtn = document.getElementById('disableLow');
      if (disableLowBtn) {
        disableLowBtn.addEventListener('click', () => {
          mode = 'high';
          localStorage.setItem(key, mode);
          apply(mode);
        });
      }
    } catch(_){}
  })();

  // RAM usage monitor (estimates based on performance mode)
  (function setupRAMMonitor(){
    const ramEl = document.getElementById('ramMonitor');
    if (!ramEl) return;
    let baseRAM = 180; // Base RAM in MB
    function updateRAM(){
      try {
        const isLow = document.body.classList.contains('low-performance');
        // Low mode: lighter (fewer animations, backdrop filters, etc.)
        const estimated = isLow ? baseRAM + 50 : baseRAM + 220;
        ramEl.textContent = `RAM: ~${estimated}MB`;
        ramEl.style.color = isLow ? '#00d4ff' : '#ffd54d';
      } catch(_){}
    }
    updateRAM();
    // Update every 3 seconds and when performance mode changes
    setInterval(updateRAM, 3000);
    const observer = new MutationObserver(updateRAM);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  })();

  // Start Day launcher (staggered opens; Alt+Click for Lite mode)
  function openStaggered(urls, stepMs) {
    urls.forEach((u, i) => setTimeout(() => {
      try { window.open(u, '_blank', 'noopener'); } catch (_) { window.open(u, '_blank'); }
    }, i * stepMs));
  }
  function Internet(e) {
    const standard = [
      'http://cim.etisalat.corp.ae',
      'https://contactcentre.etisalat.corp.ae/Main/cc_apps/MBN_AD/',
      'https://okm.etisalat.corp.ae:8227/infocentermobile/index?page=content&id=PR864',
      'https://webmail.etisalat.corp.ae/owa',
      'https://webmail.etisalat.corp.ae/owa/#path=/tasks',
      'https://simulator-devicecare.etisalat.corp.ae:7777/DCSS/default.aspx'
    ];
    // Lite set: only essentials to reduce memory spike
    const lite = [
      'http://cim.etisalat.corp.ae',
      'https://webmail.etisalat.corp.ae/owa'
    ];
    const urls = (e && e.altKey) ? lite : standard;
    const step = (e && e.altKey) ? 350 : 250; // slightly slower stagger on lite for older PCs
    openStaggered(urls, step);
  }

  const allBtn = document.getElementById('All');
  if (allBtn) {
    allBtn.addEventListener('click', Internet);
    allBtn.setAttribute('title', 'Start Day (Alt+Click for Lite)');
  }

  // UAE clock (Asia/Dubai) with greeting
  const clockEl = document.getElementById('clock');
  const greetEl = document.getElementById('greeting');
  let last = '';
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function getDubaiTime() {
    try {
      // Use Intl to get UAE time reliably
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai', hour12: true,
        hour: 'numeric', minute: '2-digit', second: '2-digit'
      });
      const parts = fmt.formatToParts(new Date());
      let h = 0, m = '00', s = '00', dayPeriod = 'AM';
      for (const p of parts) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        else if (p.type === 'minute') m = p.value;
        else if (p.type === 'second') s = p.value;
        else if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
      }
      // Also compute 24h hour for greeting via separate formatter
      const h24 = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour12: false, hour: '2-digit' }).format(new Date()), 10);
      return { h, m, s, ampm: dayPeriod, h24 };
    } catch (e) {
      // Fallback to local time if Intl/timeZone unsupported
      const d = new Date();
      let h = d.getHours();
      const m = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      return { h: h12, m, s, ampm, h24: h };
    }
  }
  function greetingForHour(h24) {
    if (h24 >= 5 && h24 < 12) return 'Good morning';
    if (h24 >= 12 && h24 < 17) return 'Good afternoon';
    if (h24 >= 17 && h24 < 21) return 'Good evening';
    return 'Good night';
  }
  function tick() {
    const t = getDubaiTime();
    const text = `${t.h}:${t.m}:${t.s} ${t.ampm}`;
    if (clockEl && text !== last) {
      clockEl.textContent = text;
      last = text;
    }
    if (greetEl) {
      greetEl.textContent = greetingForHour(t.h24) + ' (UAE Time)';
    }
  }
  tick();
  setInterval(tick, 1000);

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.matches('input.style3[data-open]')) {
      const url = t.getAttribute('data-open');
      if (url) {
        try { window.open(url, '_blank', 'noopener'); } catch (_) { window.open(url, '_blank'); }
      }
    }
  });

  // Preview rendering control (keep off to avoid on-page display)
  const SHOW_PREVIEW = false;
  const previewEl = document.getElementById('preview');
  function renderPreview(html) {
    if (SHOW_PREVIEW && previewEl) previewEl.innerHTML = html;
  }

  // Wire reset buttons (including header reset)
  function doReset() { location.reload(); }
  document.getElementById('reset')?.addEventListener('click', doReset);
  document.querySelectorAll('.reset-btn').forEach(b => b.addEventListener('click', doReset));

  // Selection change for problem
  const problemSel = document.getElementById('problem');
  function change() {
    const val = problemSel && problemSel instanceof HTMLSelectElement ? problemSel.value : '';
    const hide = (id) => document.getElementById(id)?.classList.add('hidden');
    const show = (id) => document.getElementById(id)?.classList.remove('hidden');
  ['d-d','workorder','visitdelay','techcomplaints','itdepartment','saleslead','reconnection','Or','Reminder','Vi','Sa','Re','dupaid','copyd','copyw','copyv','copyt','copyi','copys','copyr','copyu'].forEach(hide);
    if (val === 'delayindelivery') show('d-d');
    else if (val === 'workorder') { show('workorder'); show('Or'); show('Reminder'); }
    else if (val === 'visitdelay') { show('visitdelay'); show('Vi'); show('Reminder'); }
  else if (val === 'techcomplaints') { show('techcomplaints'); show('Reminder'); }
  else if (val === 'itdepartment') { show('itdepartment'); show('Reminder'); }
    else if (val === 'saleslead') { show('saleslead'); show('Sa'); show('Reminder'); }
    else if (val === 'reconnection') { show('reconnection'); show('Re'); show('Reminder'); }
    else if (val === 'dupaid') show('dupaid');
  }
  problemSel?.addEventListener('change', change);

  // Enhanced Toast Notification System
  const ToastManager = (function() {
    let toastContainer = null;
    let toastCounter = 0;

    function init() {
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
      }
    }

    function show(message, type = 'success', duration = 3000) {
      init();

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };

      const icon = icons[type] || icons.info;
      
      toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
      `;

      toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-primary);
        border-left: 4px solid ${type === 'success' ? 'var(--accent-cyan)' : type === 'error' ? 'var(--accent-red)' : type === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-purple)'};
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px var(--shadow);
        animation: slideIn 0.3s ease;
        min-width: 250px;
      `;

      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        margin-left: auto;
      `;

      closeBtn.addEventListener('click', () => remove(toast));

      toastContainer.appendChild(toast);

      // Auto-remove after duration
      const timer = setTimeout(() => remove(toast), duration);

      // Pause on hover
      toast.addEventListener('mouseenter', () => clearTimeout(timer));
      toast.addEventListener('mouseleave', () => {
        setTimeout(() => remove(toast), 1000);
      });

      toastCounter++;
      if (toastCounter > 5) {
        // Remove oldest toast if too many
        const oldest = toastContainer.firstChild;
        if (oldest) remove(oldest);
      }
    }

    function remove(toast) {
      if (!toast || !toast.parentNode) return;
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          toastCounter--;
        }
      }, 300);
    }

    return {
      success: (msg, duration) => show(msg, 'success', duration),
      error: (msg, duration) => show(msg, 'error', duration),
      warning: (msg, duration) => show(msg, 'warning', duration),
      info: (msg, duration) => show(msg, 'info', duration)
    };
  })();

  // Add CSS animations
  if (!document.getElementById('toastAnimations')) {
    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .toast-message {
        flex: 1;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // Legacy showToast function for backward compatibility
  function showToast(message, type = 'success') {
    ToastManager[type](message);
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text || '';
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { window.prompt('Press Ctrl+C to copy, then Enter:', text); }
  }
  function safeCopy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => ToastManager.success('Copied to clipboard')).catch(() => { legacyCopy(text); ToastManager.success('Copied'); });
    } else { legacyCopy(text); ToastManager.success('Copied'); }
  }
  function copyHTMLViaSelection(html, textFallback) {
    try {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.style.position = 'fixed';
      div.style.left = '-9999px';
      div.innerHTML = html;
      document.body.appendChild(div);
      const range = document.createRange();
      range.selectNodeContents(div);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(div);
      showToast('Copied');
    } catch (e) {
      legacyCopy(textFallback || '');
    }
  }
  function safeCopyHTML(html, textFallback) {
    if (navigator.clipboard && window.isSecureContext && 'ClipboardItem' in window) {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([textFallback || ''], { type: 'text/plain' })
        });
        navigator.clipboard.write([item]).then(() => showToast('Copied')).catch(() => copyHTMLViaSelection(html, textFallback));
      } catch (e) {
        copyHTMLViaSelection(html, textFallback);
      }
    } else {
      copyHTMLViaSelection(html, textFallback);
    }
  }
  function markActive(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 600);
  }

  // Submit show/hide helpers
  function showOnlyCopy(sectionId, copyId) {
    const hide = (id) => document.getElementById(id)?.classList.add('hidden');
    const show = (id) => document.getElementById(id)?.classList.remove('hidden');
  ['choose','d-d','workorder','visitdelay','saleslead','reconnection','dupaid','itdepartment','copyd','copyw','copyv','copyt','copyi','copys','copyr','copyu'].forEach(hide);
    show(copyId);
    document.getElementById('reset')?.classList.remove('hidden');
  }

  // Wire submit buttons
  document.getElementById('bla')?.addEventListener('click', () => showOnlyCopy('d-d','copyd'));
  document.getElementById('submitW')?.addEventListener('click', () => showOnlyCopy('workorder','copyw'));
  document.getElementById('submitV')?.addEventListener('click', () => showOnlyCopy('visitdelay','copyv'));
  document.getElementById('submitS')?.addEventListener('click', () => showOnlyCopy('saleslead','copys'));
  document.getElementById('submitR')?.addEventListener('click', () => showOnlyCopy('reconnection','copyr'));
  document.getElementById('submitU')?.addEventListener('click', () => showOnlyCopy('dupaid','copyu'));
  document.getElementById('submitT')?.addEventListener('click', () => showOnlyCopy('techcomplaints','copyt'));
  document.getElementById('submitI')?.addEventListener('click', () => showOnlyCopy('itdepartment','copyi'));

  // Press Enter to submit in the active form section
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'TEXTAREA') return; // don't submit from textareas
    const sections = [
      { id: 'd-d', btn: 'bla' },
      { id: 'workorder', btn: 'submitW' },
      { id: 'visitdelay', btn: 'submitV' },
      { id: 'techcomplaints', btn: 'submitT' },
  { id: 'itdepartment', btn: 'submitI' },
      { id: 'saleslead', btn: 'submitS' },
      { id: 'reconnection', btn: 'submitR' },
      { id: 'dupaid', btn: 'submitU' },
    ];
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el && !el.classList.contains('hidden')) {
        document.getElementById(s.btn)?.click();
        e.preventDefault();
        break;
      }
    }
  });

  // Wire copy buttons: Delivery
  document.getElementById('copDt')?.addEventListener('click', () => { markActive('copDt'); safeCopy('CSE-CentralControl@eand.com'); });
  document.getElementById('copDc')?.addEventListener('click', () => { markActive('copDc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copDs')?.addEventListener('click', () => {
    markActive('copDs');
    const sid = (document.getElementById('inputShipment') || {}).value || '';
    safeCopy('Follow UP // Shipment ID ' + sid);
  });
  document.getElementById('copDb')?.addEventListener('click', () => {
    markActive('copDb');
    const cust = (document.getElementById('customernumberdelivary') || {}).value || '';
    const sid = (document.getElementById('inputShipment') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer reports a delay in delivery. Kindly assist with the below details.</td>
        </tr>
        <tr>
          <td class="bar-edge">Shipment ID:</td>
          <td class="cell">${sid}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${cust}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer reports a delay in delivery. Kindly assist with the below details.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Shipment ID:</td>
          <td style="border:1px solid black;">${sid}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${cust}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer reports a delay in delivery. Kindly assist with the below details.\nShipment ID: ${sid}\nContact Number: ${cust}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Work order copy
  document.getElementById('copWt')?.addEventListener('click', () => { markActive('copWt'); safeCopy('CSE-CentralControl@eand.com'); });
  document.getElementById('copWc')?.addEventListener('click', () => { markActive('copWc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copWs')?.addEventListener('click', () => {
    markActive('copWs');
    const wo = (document.getElementById('wo') || {}).value || '';
    safeCopy('Follow UP // Work ID ' + wo);
  });
  document.getElementById('copWb')?.addEventListener('click', () => {
    markActive('copWb');
    const acc = (document.getElementById('work') || {}).value || '';
    const phone = (document.getElementById('workord') || {}).value || '';
    const wo = (document.getElementById('wo') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">The Customer has been experiencing issues with their home connection. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td class="bar-edge">Work ID:</td>
          <td class="cell">${wo}</td>
        </tr>
        <tr>
          <td class="bar-edge">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${phone}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">The Customer has been experiencing issues with their home connection. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Work ID:</td>
          <td style="border:1px solid black;">${wo}</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${phone}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: The Customer has been experiencing issues with their home connection. I kindly ask your assistance for the case below.\nWork ID: ${wo}\nAccount Number: ${acc}\nContact Number: ${phone}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Visit delay copy
  document.getElementById('copVt')?.addEventListener('click', () => { markActive('copVt'); safeCopy('USERS-APPOINTMENTCENTER@eand.com'); });
  document.getElementById('copVc')?.addEventListener('click', () => { markActive('copVc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copVs')?.addEventListener('click', () => {
    markActive('copVs');
    const sub = (document.getElementById('vi') || {}).value || '';
    const acc = (document.getElementById('visitd') || {}).value || '';
    safeCopy(`Follow UP // Subrequest ${sub} // ${acc}`);
  });
  document.getElementById('copVb')?.addEventListener('click', () => {
    markActive('copVb');
    const sub = (document.getElementById('vi') || {}).value || '';
    const req = (document.getElementById('visi') || {}).value || '';
    const acc = (document.getElementById('visitd') || {}).value || '';
    const phone = (document.getElementById('visitdel') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">customer keep calling us to follow up. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td class="bar-edge">Sub-request:</td>
          <td class="cell">${sub}</td>
        </tr>
        <tr>
          <td class="bar-edge">Request:</td>
          <td class="cell">${req}</td>
        </tr>
        <tr>
          <td class="bar-edge">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${phone}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">customer keep calling us to follow up. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Sub-request:</td>
          <td style="border:1px solid black;">${sub}</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Request:</td>
          <td style="border:1px solid black;">${req}</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${phone}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: customer keep calling us to follow up. I kindly ask your assistance for the case below.\nSub-request: ${sub}\nRequest: ${req}\nAccount Number: ${acc}\nContact Number: ${phone}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Tech complaints copy
  document.getElementById('copTt')?.addEventListener('click', () => { markActive('copTt'); safeCopy('EGSSR-ED-BlendedManagement@eand.com;EGSSR-ED-BlendedCAI@eand.com'); });
  document.getElementById('copTc')?.addEventListener('click', () => { markActive('copTc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copTs')?.addEventListener('click', () => {
    markActive('copTs');
    const cid = (document.getElementById('tcomp') || {}).value || '';
    const acc = (document.getElementById('tacc') || {}).value || '';
    safeCopy(`Follow UP // Complaint ${cid} // ${acc}`);
  });
  document.getElementById('copTb')?.addEventListener('click', () => {
    markActive('copTb');
    const cust = (document.getElementById('tcust') || {}).value || '';
    const acc = (document.getElementById('tacc') || {}).value || '';
    const cid = (document.getElementById('tcomp') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
        <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer reports a technical complaint that requires follow up and resolution. Kindly assist.</td>
        </tr>
        <tr>
          <td class="bar-edge">Complaint ID:</td>
          <td class="cell">${cid}</td>
        </tr>
        <tr>
          <td class="bar-edge">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${cust}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
    renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
        <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer reports a technical complaint that requires follow up and resolution. Kindly assist.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Complaint ID:</td>
          <td style="border:1px solid black;">${cid}</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${cust}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
    const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer reports a technical complaint that requires follow up and resolution. Kindly assist.\nComplaint ID: ${cid}\nAccount Number: ${acc}\nContact Number: ${cust}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // IT Department copy
  document.getElementById('copIt')?.addEventListener('click', () => { markActive('copIt'); safeCopy('IT_AO_BASupport@eand.com'); });
  document.getElementById('copIc')?.addEventListener('click', () => { markActive('copIc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copIs')?.addEventListener('click', () => {
    markActive('copIs');
    const ticket = (document.getElementById('itticket') || {}).value || '';
    const acc = (document.getElementById('itacc') || {}).value || '';
    safeCopy(`Follow UP // Ticket ${ticket} // ${acc}`);
  });
  document.getElementById('copIb')?.addEventListener('click', () => {
    markActive('copIb');
    const cust = (document.getElementById('itcust') || {}).value || '';
    const acc = (document.getElementById('itacc') || {}).value || '';
    const ticket = (document.getElementById('itticket') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
        <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer is facing an IT-related issue/ticket requiring support. Kindly assist.</td>
        </tr>
        <tr>
          <td class="bar-edge">Ticket ID:</td>
          <td class="cell">${ticket}</td>
        </tr>
        <tr>
          <td class="bar-edge">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${cust}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
    renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
        <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer is facing an IT-related issue/ticket requiring support. Kindly assist.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Ticket ID:</td>
          <td style="border:1px solid black;">${ticket}</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${cust}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
    const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer is facing an IT-related issue/ticket requiring support. Kindly assist.\nTicket ID: ${ticket}\nAccount Number: ${acc}\nContact Number: ${cust}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Sales lead copy
  document.getElementById('copSt')?.addEventListener('click', () => { markActive('copSt'); safeCopy('TelesalesleadsOfficers@eand.com;OutboundOfficers@eand.com'); });
  document.getElementById('copSc')?.addEventListener('click', () => { markActive('copSc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copSs')?.addEventListener('click', () => {
    markActive('copSs');
    const lead = (document.getElementById('salesl') || {}).value || '';
    safeCopy('Follow UP // Lead ID ' + lead);
  });
  document.getElementById('copSb')?.addEventListener('click', () => {
    markActive('copSb');
    const lead = (document.getElementById('salesl') || {}).value || '';
    const phone = (document.getElementById('saleslea') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer keep calling us that no one contacted him regarding his request. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td class="bar-edge">Lead ID:</td>
          <td class="cell">${lead}</td>
        </tr>
        <tr>
          <td class="bar">Contact Number:</td>
          <td class="cell">${phone}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer keep calling us that no one contacted him regarding his request. I kindly ask your assistance for the case below.</td>
        </tr>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Lead ID:</td>
          <td style="border:1px solid black;">${lead}</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Contact Number:</td>
          <td style="border:1px solid black;">${phone}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer keep calling us that no one contacted him regarding his request. I kindly ask your assistance for the case below.\nLead ID: ${lead}\nContact Number: ${phone}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Reconnection copy
  document.getElementById('copyRt')?.addEventListener('click', () => { markActive('copyRt'); safeCopy('crmnpcollections@eand.com'); });
  document.getElementById('copyRc')?.addEventListener('click', () => { markActive('copyRc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copyRs')?.addEventListener('click', () => {
    markActive('copyRs');
    const acc = (document.getElementById('reconnecti') || {}).value || '';
    safeCopy('Reconnection // ' + acc);
  });
  document.getElementById('copyRb')?.addEventListener('click', () => {
    markActive('copyRb');
    const acc = (document.getElementById('reconnecti') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer requests reconnection. Kindly assist.</td>
        </tr>
        <tr>
          <td class="bar">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer requests reconnection. Kindly assist.</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer requests reconnection. Kindly assist.\nAccount Number: ${acc}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // DU paid copy
  document.getElementById('copyUt')?.addEventListener('click', () => { markActive('copyUt'); safeCopy('crmnpcollections@eand.com'); });
  document.getElementById('copyUc')?.addEventListener('click', () => { markActive('copyUc'); safeCopy('UniversalEGSAgents@eand.com;UniversalEGSTeamLeaders@eand.com'); });
  document.getElementById('copyUs')?.addEventListener('click', () => {
    markActive('copyUs');
    const acc = (document.getElementById('dupa') || {}).value || '';
    safeCopy('Reconnection // ' + acc);
  });
  document.getElementById('copyUb')?.addEventListener('click', () => {
    markActive('copyUb');
    const acc = (document.getElementById('dupa') || {}).value || '';
    const html = `
      <table class="mail">
        <caption class="cap1">Dear Team,</caption>
  <caption class="cap2">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td class="bar-edge">Case Description:</td>
          <td class="cell">Customer paid his amount dues in DU operator and kindly ask to reconnect his line.</td>
        </tr>
        <tr>
          <td class="bar">Account Number:</td>
          <td class="cell">${acc}</td>
        </tr>
        <tr>
          <td class="regards">Best Regards</td>
          <td class="regards"></td>
        </tr>
      </table>`;
  renderPreview(html);
    const inlineHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <caption style="margin-bottom: 30px; text-align: left;">Dear Team,</caption>
  <caption style="margin-bottom: 20px; text-align: left;">I hope this message finds you well. I would appreciate your prompt assistance with the case below.</caption>
        <tr>
          <td style="border-width:1px;border-style:solid;border-color:black black white white;background-color: darkred;color: white;">Case Description:</td>
          <td style="border:1px solid black;">Customer paid his amount dues in DU operator and kindly ask to reconnect his line.</td>
        </tr>
        <tr>
          <td style="background-color: darkred;color: white;">Account Number:</td>
          <td style="border:1px solid black;">${acc}</td>
        </tr>
        <tr>
          <td style="margin-top:30px;text-align:left;">Best Regards</td>
          <td></td>
        </tr>
      </table>`;
  const text = `Dear Team,\nI hope this message finds you well. I would appreciate your prompt assistance with the case below.\nCase Description: Customer paid his amount dues in DU operator and kindly ask to reconnect his line.\nAccount Number: ${acc}\nBest Regards`;
    safeCopyHTML(inlineHtml, text);
  });

  // Form Auto-save System
  (function setupFormAutoSave() {
    const AUTOSAVE_KEY = 'formAutoSave_';
    const SAVE_DELAY = 500; // ms
    let saveTimers = {};

    // Get all input fields
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
    
    // Restore saved values
    inputs.forEach(input => {
      if (!input.id) return;
      const key = AUTOSAVE_KEY + input.id;
      const saved = localStorage.getItem(key);
      if (saved) {
        input.value = saved;
      }
    });

    // Save on input with debounce
    inputs.forEach(input => {
      if (!input.id) return;
      
      input.addEventListener('input', function() {
        const key = AUTOSAVE_KEY + this.id;
        
        // Clear existing timer
        if (saveTimers[this.id]) {
          clearTimeout(saveTimers[this.id]);
        }
        
        // Save after delay
        saveTimers[this.id] = setTimeout(() => {
          localStorage.setItem(key, this.value);
        }, SAVE_DELAY);
      });
    });

    // Clear saved data on successful submission
    document.querySelectorAll('button[id^="submit"]').forEach(btn => {
      btn.addEventListener('click', function() {
        // Wait a bit to ensure form was processed
        setTimeout(() => {
          inputs.forEach(input => {
            if (input.id) {
              localStorage.removeItem(AUTOSAVE_KEY + input.id);
            }
          });
        }, 1000);
      });
    });

    // Clear on reset buttons
    document.querySelectorAll('.reset-btn, #reset').forEach(btn => {
      btn.addEventListener('click', function() {
        inputs.forEach(input => {
          if (input.id) {
            localStorage.removeItem(AUTOSAVE_KEY + input.id);
          }
        });
      });
    });
  })();
});
