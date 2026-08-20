/* ═══════════════════════════════════════════
   UI CONTROLLERS: TOASTS, THEMES, TABS, MODALS
   ═══════════════════════════════════════════ */

/**
 * Toast notifications without emojis (clean SVG icons).
 */
function showToast(msg, type = 'success') {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    t.innerHTML = `<span aria-hidden="true">${icons[type] || icons.success}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => {
        t.classList.add('out');
        t.addEventListener('animationend', () => t.remove());
    }, 3000);
}

/**
 * Theme Management (Dark / Light mode persistence).
 */
function initTheme() {
    const saved = localStorage.getItem('msl-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('msl-theme', next);
    playClick();
}

/**
 * Sound Effects Toggle.
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.classList.toggle('muted', !soundEnabled);
        btn.title = soundEnabled ? 'Sound effects enabled' : 'Sound effects muted';
    }
    if (soundEnabled) playClick();
}

/**
 * Navigation Tab Switcher (Invoice vs Dashboard).
 */
function switchTab(pageId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page === pageId));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.dataset.page === pageId));
    document.documentElement.setAttribute('data-page', pageId);
    playClick();
    if (pageId === 'history' && typeof renderHistory === 'function') {
        renderHistory();
    }
}

/**
 * Settings Modal Controls & Library Profile Sync.
 */
function openSettingsModal() {
    applyLibrarySettings();
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('active');
    playClick();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
    playClick();
}

function applyLibrarySettings() {
    const cfg = getLibrarySettings();
    // Update brand text in header
    const h1 = document.querySelector('.brand-text h1');
    const p = document.querySelector('.brand-text p');
    if (h1 && cfg.name) h1.textContent = cfg.name;
    if (p && cfg.tagline) p.textContent = cfg.tagline;

    // Fill settings modal inputs if present
    const elName = document.getElementById('cfgLibraryName');
    const elTag = document.getElementById('cfgTagline');
    const elPhone = document.getElementById('cfgPhone');
    const elEmail = document.getElementById('cfgEmail');
    const elAddr = document.getElementById('cfgAddress');
    const elPlan = document.getElementById('cfgDefaultPlan');
    const elMode = document.getElementById('cfgDefaultMode');
    const elPrefix = document.getElementById('cfgSeatPrefix');

    if (elName) elName.value = cfg.name || '';
    if (elTag) elTag.value = cfg.tagline || '';
    if (elPhone) elPhone.value = cfg.phone || '';
    if (elEmail) elEmail.value = cfg.email || '';
    if (elAddr) elAddr.value = cfg.address || '';
    if (elPlan) elPlan.value = cfg.defaultPlan || 'monthly';
    if (elMode) elMode.value = cfg.defaultMode || 'Cash';
    if (elPrefix) elPrefix.value = cfg.seatPrefix || 'A-';
}
