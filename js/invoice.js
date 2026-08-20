/* ═══════════════════════════════════════════
   INVOICE FORM, CALCULATIONS & PREVIEW SYNC
   ═══════════════════════════════════════════ */

let invoiceNo = '';
let studentPhoto = null;
let gstEnabled = false;
let paymentStatus = 'full';

// Form Element References
let planSelect, customPlanRow, customPlanName, customPlanMonths;
let joiningInput, expiryInput, amountInput, discountTypeSelect, discountValueInput, discountValueGroup;
let totalDisplay, gstToggle, gstBreakdown, gstSubtotal, gstCgst, gstSgst;
let photoInput, photoPreview, photoPlaceholder, photoArea;
let nameInput, nameAutocomplete;

/**
 * Calculates expiry date based on joining date and months duration.
 */
function calculateExpiry(joiningStr, months) {
    if (!joiningStr) return '';
    const d = new Date(joiningStr);
    d.setMonth(d.getMonth() + parseInt(months));
    return d.toISOString().split('T')[0];
}

/**
 * Total calculation engine factoring in Base Fee, Discounts, and 18% GST.
 */
function getTotal() {
    const base = parseFloat(amountInput.value) || 0;
    let discount = 0;
    const discType = discountTypeSelect.value;
    const discVal = parseFloat(discountValueInput.value) || 0;

    if (discType === 'percentage' && discVal > 0) {
        discount = (base * Math.min(discVal, 100)) / 100;
    } else if (discType === 'flat' && discVal > 0) {
        discount = Math.min(discVal, base);
    }

    const subtotal = Math.max(0, base - discount);
    const gstRate = gstEnabled ? 0.18 : 0;
    const gst = subtotal * gstRate;
    const total = subtotal + gst;

    return { base, discount, subtotal, gst, cgst: gst / 2, sgst: gst / 2, total };
}

function recalcTotal() {
    const t = getTotal();
    totalDisplay.textContent = formatCurrency(t.total);

    if (gstEnabled && t.subtotal > 0) {
        gstBreakdown.style.display = 'block';
        gstSubtotal.textContent = formatCurrency(t.subtotal);
        gstCgst.textContent = formatCurrency(t.cgst);
        gstSgst.textContent = formatCurrency(t.sgst);
    } else {
        gstBreakdown.style.display = 'none';
    }

    // Update partial payment balance
    if (paymentStatus === 'partial') {
        const paid = parseFloat(document.getElementById('amountPaid').value) || 0;
        const due = Math.max(0, Math.round(t.total) - paid);
        document.getElementById('balanceDue').textContent = formatCurrency(due);
    }

    updatePreview();
}

/**
 * Synchronizes the live invoice preview card.
 */
function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    const name = nameInput.value.trim();
    const father = document.getElementById('fatherName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const seat = document.getElementById('seat').value.trim();
    const planKey = planSelect.value;
    const planLabel = planKey === 'custom' ? (customPlanName.value || 'Custom') : (PLANS[planKey] ? PLANS[planKey].label : planKey);
    const joining = joiningInput.value;
    const expiry = expiryInput.value;
    const mode = document.getElementById('paymentMode').value;
    const remarks = document.getElementById('remarks').value.trim();
    const t = getTotal();

    const cfg = getLibrarySettings();
    const libName = cfg.name || 'Modern Study Library';
    const libTagline = cfg.tagline || 'Study • Focus • Success';

    if (!name && !father && !mobile && !seat && t.base === 0) {
        previewContainer.innerHTML = `
            <div class="preview-empty">
                <div class="preview-empty-icon" aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                </div>
                <p>Fill out the form to generate a live invoice preview</p>
            </div>`;
        return;
    }

    const amtPaid = paymentStatus === 'partial' ? (parseFloat(document.getElementById('amountPaid').value) || 0) : Math.round(t.total);
    const balance = Math.max(0, Math.round(t.total) - amtPaid);

    previewContainer.innerHTML = `
        <div class="preview-invoice">
            <div class="preview-watermark">${paymentStatus === 'partial' ? 'DUE' : 'PAID'}</div>
            <div class="preview-header">
                <h2>${libName}</h2>
                <p>${libTagline}</p>
            </div>
            <div class="preview-meta">
                <span>Invoice: <strong>${invoiceNo}</strong></span>
                <span>Date: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
            </div>

            ${studentPhoto ? `<img src="${studentPhoto}" class="preview-photo" alt="Student photo">` : ''}

            <div class="preview-section">
                <h4>Student Details</h4>
                <div class="preview-row"><span class="label">Name:</span><span class="value">${name || '-'}</span></div>
                <div class="preview-row"><span class="label">Father's Name:</span><span class="value">${father || '-'}</span></div>
                <div class="preview-row"><span class="label">Mobile:</span><span class="value">${mobile || '-'}</span></div>
                <div class="preview-row"><span class="label">Seat No:</span><span class="value">${seat || '-'}</span></div>
            </div>

            <div class="preview-section">
                <h4>Membership</h4>
                <div class="preview-row"><span class="label">Plan:</span><span class="value">${planLabel}</span></div>
                <div class="preview-row"><span class="label">Joining:</span><span class="value">${formatDate(joining)}</span></div>
                <div class="preview-row"><span class="label">Expiry:</span><span class="value">${formatDate(expiry)}</span></div>
            </div>

            <div class="preview-section">
                <h4>Payment</h4>
                <div class="preview-row"><span class="label">Plan Fee:</span><span class="value">${formatCurrency(t.base)}</span></div>
                ${t.discount > 0 ? `<div class="preview-row"><span class="label">Discount:</span><span class="value" style="color:var(--error);">- ${formatCurrency(t.discount)}</span></div>` : ''}
                ${gstEnabled ? `<div class="preview-row"><span class="label">GST (18%):</span><span class="value">${formatCurrency(t.gst)}</span></div>` : ''}
                <div class="preview-row"><span class="label">Mode:</span><span class="value">${mode}</span></div>
                ${paymentStatus === 'partial' ? `
                    <div class="preview-row"><span class="label">Paid:</span><span class="value" style="color:var(--success);">${formatCurrency(amtPaid)}</span></div>
                    <div class="preview-row"><span class="label">Balance:</span><span class="value" style="color:var(--error);">${formatCurrency(balance)}</span></div>
                ` : ''}
                ${remarks ? `<div class="preview-row"><span class="label">Remarks:</span><span class="value" style="font-style:italic;">${remarks}</span></div>` : ''}
            </div>

            <div class="preview-total">
                <div class="amount-label">Total Payable</div>
                <div class="amount">${formatCurrency(t.total)}</div>
            </div>
            <div class="preview-footer">Thank you for choosing ${libName}</div>
        </div>`;
}

/**
 * Validation routines.
 */
function validateField(id, condition) {
    const el = document.getElementById(id);
    if (!el) return true;
    const group = el.closest('.form-group');
    if (!condition) {
        el.classList.add('invalid');
        el.classList.remove('valid');
        if (group) group.classList.add('has-error');
        return false;
    }
    el.classList.remove('invalid');
    el.classList.add('valid');
    if (group) group.classList.remove('has-error');
    return true;
}

function validateAll() {
    let ok = true;
    if (!validateField('studentName', nameInput.value.trim().length > 0)) ok = false;
    if (!validateField('fatherName', document.getElementById('fatherName').value.trim().length > 0)) ok = false;
    if (!validateField('mobile', /^\d{10}$/.test(document.getElementById('mobile').value.replace(/\s/g, '')))) ok = false;
    if (!validateField('seat', document.getElementById('seat').value.trim().length > 0)) ok = false;
    if (!validateField('amount', amountInput.value && Number(amountInput.value) > 0)) ok = false;
    if (!ok) playError();
    return ok;
}

/**
 * ⚡ 1-Click Quick Fill Sample Generator.
 */
let sampleIndex = 0;
function quickFillSample() {
    const sample = SAMPLE_STUDENTS[sampleIndex % SAMPLE_STUDENTS.length];
    sampleIndex++;

    nameInput.value = sample.name;
    document.getElementById('fatherName').value = sample.father;
    document.getElementById('mobile').value = sample.mobile;
    document.getElementById('seat').value = sample.seat;
    planSelect.value = sample.plan;
    planSelect.dispatchEvent(new Event('change'));
    amountInput.value = sample.amount;
    document.getElementById('paymentMode').value = sample.mode;
    document.getElementById('remarks').value = sample.remarks;

    recalcTotal();
    updatePreview();
    saveFormDraft();
    playSuccess();
    showToast(`Quick Filled: ${sample.name}`, 'info');
}

/**
 * Auto-Save & Restore Form Draft.
 */
function saveFormDraft() {
    saveDraft({
        studentName: nameInput.value,
        fatherName: document.getElementById('fatherName').value,
        mobile: document.getElementById('mobile').value,
        seat: document.getElementById('seat').value,
        plan: planSelect.value,
        customPlanName: customPlanName.value,
        customPlanMonths: customPlanMonths.value,
        joining: joiningInput.value,
        amount: amountInput.value,
        discountType: discountTypeSelect.value,
        discountValue: discountValueInput.value,
        paymentMode: document.getElementById('paymentMode').value,
        remarks: document.getElementById('remarks').value,
        gstEnabled: gstEnabled,
        paymentStatus: paymentStatus,
        amountPaid: document.getElementById('amountPaid').value
    });
}

function restoreFormDraft() {
    const d = getDraft();
    if (!d) return;
    if (d.studentName) nameInput.value = d.studentName;
    if (d.fatherName) document.getElementById('fatherName').value = d.fatherName;
    if (d.mobile) document.getElementById('mobile').value = d.mobile;
    if (d.seat) document.getElementById('seat').value = d.seat;
    if (d.plan) {
        planSelect.value = d.plan;
        planSelect.dispatchEvent(new Event('change'));
    }
    if (d.customPlanName) customPlanName.value = d.customPlanName;
    if (d.customPlanMonths) customPlanMonths.value = d.customPlanMonths;
    if (d.joining) joiningInput.value = d.joining;
    if (d.amount) amountInput.value = d.amount;
    if (d.discountType) discountTypeSelect.value = d.discountType;
    if (d.discountValue) discountValueInput.value = d.discountValue;
    if (d.paymentMode) document.getElementById('paymentMode').value = d.paymentMode;
    if (d.remarks) document.getElementById('remarks').value = d.remarks;
    if (d.gstEnabled !== undefined && d.gstEnabled !== gstEnabled) {
        document.getElementById('gstToggle').click();
    }
    if (d.paymentStatus === 'partial') {
        document.getElementById('statusPartial').click();
        if (d.amountPaid) document.getElementById('amountPaid').value = d.amountPaid;
    }
}

/**
 * Direct WhatsApp Sharing (Always opens WhatsApp Web directly, zero OS popups).
 */
async function sharePDFToWhatsApp(customData = null) {
    if (!customData && !validateAll()) return;

    try {
        const pdfObj = buildInvoicePDFDoc(customData);
        const data = pdfObj.data;
        const mobile = (data.mobile || '').replace(/\s/g, '');

        if (!customData) {
            saveInvoice(data);
        }

        // 1. Automatically download PDF directly to Chrome
        pdfObj.doc.save(`${data.id}.pdf`);

        // 2. Prepare professional WhatsApp message with invoice summary
        const msg = `*MODERN STUDY LIBRARY*\n_Invoice: ${data.id}_\n\n*Student:* ${data.studentName}\n*Plan:* ${data.planLabel}\n*Joining:* ${formatDate(data.joining)}\n*Expiry:* ${formatDate(data.expiry)}\n*Total:* Rs.${data.total.toLocaleString('en-IN')}\n*Mode:* ${data.mode}\n\n_Your Invoice PDF has been generated and downloaded. Please find the attached document._`;

        // Direct WhatsApp Web URL (Always opens directly in Chrome tab, never triggers OS dialogs)
        const waUrl = `https://web.whatsapp.com/send?phone=91${mobile}&text=${encodeURIComponent(msg)}`;

        // Open WhatsApp Web immediately
        window.open(waUrl, '_blank');

        // Simultaneously save PDF to local backend
        const pdfBase64 = pdfObj.doc.output('datauristring');
        fetch('/api/send-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: mobile,
                invoiceNo: data.id,
                studentName: data.studentName,
                planLabel: data.planLabel,
                joining: formatDate(data.joining),
                expiry: formatDate(data.expiry),
                total: data.total.toLocaleString('en-IN'),
                mode: data.mode,
                pdfBase64: pdfBase64
            })
        }).catch(e => console.log('Backend notification error:', e));

        playSuccess();
        showToast('PDF downloaded! Opening WhatsApp Web...', 'success');
    } catch (err) {
        console.error(err);
        showToast('Unable to share PDF. Please try downloading it.', 'error');
        playError();
    }
}
