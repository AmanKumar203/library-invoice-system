/* ═══════════════════════════════════════════
   STORAGE & PERSISTENCE MANAGER
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'msl-invoices';
const SETTINGS_KEY = 'msl-settings';
const DRAFT_KEY = 'msl-draft';

/**
 * Self-healing cleanup to strip oversized base64 images from legacy records
 * and ensure localStorage remains well under the browser's 5MB quota.
 */
function cleanStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        let all = JSON.parse(raw);
        let cleaned = false;
        all = all.map(inv => {
            if (inv.photo && typeof inv.photo === 'string' && inv.photo.length > 30000) {
                inv.photo = null;
                cleaned = true;
            }
            return inv;
        });
        if (cleaned) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
    } catch (e) {
        console.warn('Storage cleanup warning:', e);
    }
}

/**
 * Retrieves all stored invoice objects.
 */
function getInvoices() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Saves or updates an invoice with quota protection.
 */
function saveInvoice(inv) {
    let all = getInvoices();
    const idx = all.findIndex(i => i.id === inv.id);
    if (idx >= 0) {
        all[idx] = inv;
    } else {
        all.unshift(inv);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
        if (err.name === 'QuotaExceededError' || err.code === 22) {
            console.warn('LocalStorage quota exceeded. Pruning older photos to free up space.');
            all = all.map((item, i) => {
                if (i > 3) item.photo = null;
                return item;
            });
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
            } catch (err2) {
                // If still full, prune all photos except the current one
                all = all.map((item, i) => {
                    if (i > 0) item.photo = null;
                    return item;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
            }
        } else {
            throw err;
        }
    }
}

/**
 * Deletes an invoice by its ID.
 */
function deleteInvoice(id) {
    const all = getInvoices().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Retrieves library profile settings.
 */
function getLibrarySettings() {
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        return s ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(s)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
        return Object.assign({}, DEFAULT_SETTINGS);
    }
}

/**
 * Saves library profile settings.
 */
function saveLibrarySettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Resets library settings to defaults.
 */
function resetLibrarySettings() {
    localStorage.removeItem(SETTINGS_KEY);
}

/**
 * Form draft persistence.
 */
function saveDraft(draft) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) { }
}

function getDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}
