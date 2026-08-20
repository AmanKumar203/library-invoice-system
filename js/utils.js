/* ═══════════════════════════════════════════
   UTILITIES & HELPERS
   ═══════════════════════════════════════════ */

/**
 * Compresses an image file using an HTML5 Canvas to produce tiny (~5KB-10KB) base64 thumbnails.
 * Prevents LocalStorage QuotaExceededError when storing student photos.
 */
function compressImage(file, maxWidth = 200, quality = 0.72) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export as lightweight JPEG thumbnail
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Generates a unique sequential/random invoice identifier.
 */
function generateInvoiceNo() {
    const year = new Date().getFullYear();
    const all = getInvoices();
    const count = all.length + 1;
    return `MSL-${year}-${String(count).padStart(4, '0')}`;
}

/**
 * Formats YYYY-MM-DD to DD Mon YYYY.
 */
function formatDate(d) {
    if (!d) return '-';
    try {
        const [y, m, day] = d.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[parseInt(m) - 1]} ${y}`;
    } catch (e) {
        return d;
    }
}

/**
 * Currency formatter with Indian comma styling.
 */
function formatCurrency(val) {
    return '₹' + Math.round(val || 0).toLocaleString('en-IN');
}

/**
 * Canvas-free lightweight DOM confetti animation.
 */
function burstConfetti() {
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = '-10px';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = (Math.random() * 8 + 5) + 'px';
        p.style.height = (Math.random() * 8 + 5) + 'px';
        p.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
        p.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}
