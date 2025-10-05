// Theme Management System
(function() {
  'use strict';

  const THEME_KEY = 'appTheme';
  const PERF_KEY = 'perfMode';
  
  // Get saved theme or detect system preference
  function getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    
    // Detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // default
  }

  // Apply theme to document
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
    
    // Update theme toggle button if it exists
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const icon = toggle.querySelector('.theme-icon');
      const text = toggle.querySelector('.theme-text');
      if (theme === 'light') {
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Light';
      } else {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Dark';
      }
    }
  }

  // Initialize theme on page load
  const currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  // Setup theme toggle when DOM is ready
  function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    toggle.addEventListener('click', function() {
      const current = localStorage.getItem(THEME_KEY) || 'dark';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
      // Only auto-switch if user hasn't manually set a preference
      const saved = localStorage.getItem(THEME_KEY);
      if (!saved) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }

  // Export for use in other scripts
  window.ThemeManager = {
    getTheme: () => localStorage.getItem(THEME_KEY) || 'dark',
    setTheme: applyTheme,
    toggle: () => {
      const current = localStorage.getItem(THEME_KEY) || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }
})();

// Keyboard Shortcuts System
(function() {
  'use strict';

  const shortcuts = {
    'KeyK': { ctrl: true, action: 'search', description: 'Quick search' },
    'Digit1': { ctrl: true, action: 'nav1', description: 'Go to Escalation' },
    'Digit2': { ctrl: true, action: 'nav2', description: 'Go to Advanced Hub' },
    'Digit3': { ctrl: true, action: 'nav3', description: 'Go to Quick Links' },
    'KeyP': { ctrl: true, action: 'perf', description: 'Toggle Performance' },
    'KeyT': { ctrl: true, action: 'theme', description: 'Toggle Theme' },
    'Escape': { ctrl: false, action: 'escape', description: 'Clear/Cancel' }
  };

  function handleShortcut(action) {
    switch(action) {
      case 'search':
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
          searchBox.focus();
          searchBox.select();
        }
        break;
      case 'nav1':
        window.location.href = 'Escaltion.html';
        break;
      case 'nav2':
        window.location.href = 'AdvancedWorkspaceHub.html';
        break;
      case 'nav3':
        window.location.href = 'QuickLinks.html';
        break;
      case 'perf':
        const perfToggle = document.getElementById('perfToggle');
        if (perfToggle) perfToggle.click();
        break;
      case 'theme':
        if (window.ThemeManager) window.ThemeManager.toggle();
        break;
      case 'escape':
        // Clear focused input or close modals
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          document.activeElement.value = '';
        }
        // Hide any visible forms
        document.querySelectorAll('.hidden').forEach(el => el.classList.add('hidden'));
        break;
    }
  }

  document.addEventListener('keydown', function(e) {
    const shortcut = shortcuts[e.code];
    if (!shortcut) return;

    // Check if ctrl/cmd is required
    if (shortcut.ctrl && !(e.ctrlKey || e.metaKey)) return;
    
    // Don't interfere with typing in inputs (except Escape)
    if (e.code !== 'Escape' && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
      return;
    }

    e.preventDefault();
    handleShortcut(shortcut.action);
  });

  // Show keyboard shortcuts helper (Shift+?)
  document.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.code === 'Slash') {
      showShortcutsHelp();
    }
  });

  function showShortcutsHelp() {
    // Create a simple help overlay
    const existing = document.getElementById('shortcutsHelp');
    if (existing) {
      existing.remove();
      return;
    }

    const help = document.createElement('div');
    help.id = 'shortcutsHelp';
    help.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-secondary);
      border: 2px solid var(--border-primary);
      border-radius: 12px;
      padding: 24px;
      z-index: 10000;
      box-shadow: 0 8px 32px var(--shadow);
      max-width: 400px;
    `;
    
    let html = '<h3 style="margin: 0 0 16px 0; color: var(--accent-cyan);">⌨️ Keyboard Shortcuts</h3>';
    html += '<div style="display: grid; gap: 8px;">';
    
    Object.entries(shortcuts).forEach(([key, data]) => {
      const keyName = data.ctrl ? `Ctrl+${key.replace('Key', '').replace('Digit', '')}` : key.replace('Key', '');
      html += `<div style="display: flex; justify-content: space-between; gap: 16px;">
        <kbd style="background: var(--nav-bg); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${keyName}</kbd>
        <span style="color: var(--text-secondary); font-size: 14px;">${data.description}</span>
      </div>`;
    });
    
    html += '</div>';
    html += '<div style="margin-top: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">Press Shift+? to toggle this help</div>';
    help.innerHTML = html;
    
    document.body.appendChild(help);
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeHelp(e) {
        if (!help.contains(e.target)) {
          help.remove();
          document.removeEventListener('click', closeHelp);
        }
      });
    }, 100);
  }

  // Export
  window.KeyboardShortcuts = {
    showHelp: showShortcutsHelp
  };
})();

// PWA Service Worker Registration
(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('✅ ServiceWorker registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, show notification
                if (window.ToastManager) {
                  window.ToastManager.info('New version available! Refresh to update.', 8000);
                }
              }
            });
          });
        })
        .catch(function(err) {
          console.log('❌ ServiceWorker registration failed:', err);
        });
    });
  }

  // Install prompt handling
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    console.log('💡 App can be installed');
    
    // Show subtle notification after 5 seconds
    setTimeout(() => {
      if (window.ToastManager && deferredPrompt) {
        const installToast = document.createElement('div');
        installToast.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>Install Workspace Suite as an app?</span>
            <button id="installBtn" style="background: var(--accent-cyan); color: #111; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">Install</button>
          </div>
        `;
        
        if (window.ToastManager) {
          window.ToastManager.info('📱 Install Workspace Suite for quick access!', 10000);
        }
        
        // Add install button click handler
        setTimeout(() => {
          const installBtn = document.getElementById('installBtn');
          if (installBtn) {
            installBtn.addEventListener('click', async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                deferredPrompt = null;
              }
            });
          }
        }, 100);
      }
    }, 5000);
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA was installed');
    deferredPrompt = null;
    if (window.ToastManager) {
      window.ToastManager.success('App installed successfully! 🎉');
    }
  });
})();
