/* ═══════════════════════════════════════════
   MAIN APPLICATION BOOTLOADER & EVENT BINDINGS
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Element Binding
    planSelect = document.getElementById('plan');
    customPlanRow = document.getElementById('customPlanRow');
    customPlanName = document.getElementById('customPlanName');
    customPlanMonths = document.getElementById('customPlanMonths');
    joiningInput = document.getElementById('joining');
    expiryInput = document.getElementById('expiry');
    amountInput = document.getElementById('amount');
    discountTypeSelect = document.getElementById('discountType');
    discountValueInput = document.getElementById('discountValue');
    discountValueGroup = document.getElementById('discountValueGroup');
    totalDisplay = document.getElementById('totalDisplay');
    gstToggle = document.getElementById('gstToggle');
    gstBreakdown = document.getElementById('gstBreakdown');
    gstSubtotal = document.getElementById('gstSubtotal');
    gstCgst = document.getElementById('gstCgst');
    gstSgst = document.getElementById('gstSgst');
    photoInput = document.getElementById('photoInput');
    photoPreview = document.getElementById('photoPreview');
    photoPlaceholder = document.getElementById('photoPlaceholder');
    photoArea = document.getElementById('photoArea');
    nameInput = document.getElementById('studentName');
    nameAutocomplete = document.getElementById('nameAutocomplete');

    // 2. Dates & Defaults
    const today = new Date().toISOString().split('T')[0];
    joiningInput.value = today;
    expiryInput.value = calculateExpiry(today, 1);
    invoiceNo = generateInvoiceNo();
    document.getElementById('invoiceNumber').textContent = 'Invoice: ' + invoiceNo;
    document.getElementById('currentDate').textContent = 'Date: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // 3. Theme & Sound
    initTheme();
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);

    // 4. Tab Navigation
    document.getElementById('navInvoice').addEventListener('click', () => switchTab('invoice'));
    document.getElementById('navHistory').addEventListener('click', () => switchTab('history'));

    // 5. Settings Modal
    document.getElementById('btnSettings').addEventListener('click', openSettingsModal);
    document.getElementById('btnCloseSettings').addEventListener('click', closeSettingsModal);
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('click', e => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    document.getElementById('settingsForm').addEventListener('submit', e => {
        e.preventDefault();
        const s = {
            name: document.getElementById('cfgLibraryName').value.trim() || DEFAULT_SETTINGS.name,
            tagline: document.getElementById('cfgTagline').value.trim() || DEFAULT_SETTINGS.tagline,
            phone: document.getElementById('cfgPhone').value.trim(),
            email: document.getElementById('cfgEmail').value.trim(),
            address: document.getElementById('cfgAddress').value.trim(),
            defaultPlan: document.getElementById('cfgDefaultPlan').value,
            defaultMode: document.getElementById('cfgDefaultMode').value,
            seatPrefix: document.getElementById('cfgSeatPrefix').value.trim() || 'A-',
            autoDraft: true
        };
        saveLibrarySettings(s);
        closeSettingsModal();
        applyLibrarySettings();
        updatePreview();
        playSuccess();
        showToast('Library settings saved.', 'success');
    });

    document.getElementById('btnResetSettings').addEventListener('click', () => {
        if (!confirm('Reset settings to default?')) return;
        resetLibrarySettings();
        applyLibrarySettings();
        showToast('Settings reset to default.', 'info');
    });

    // 6. Plan change listener
    planSelect.addEventListener('change', () => {
        const val = planSelect.value;
        if (val === 'custom') {
            customPlanRow.style.display = 'grid';
            expiryInput.value = calculateExpiry(joiningInput.value, customPlanMonths.value || 1);
        } else {
            customPlanRow.style.display = 'none';
            const p = PLANS[val];
            if (p) {
                expiryInput.value = calculateExpiry(joiningInput.value, p.months);
                if (p.defaultPrice > 0 && !amountInput.value) {
                    amountInput.value = p.defaultPrice;
                }
            }
        }
        recalcTotal();
    });

    customPlanMonths.addEventListener('input', () => {
        expiryInput.value = calculateExpiry(joiningInput.value, customPlanMonths.value || 1);
        updatePreview();
    });

    customPlanName.addEventListener('input', updatePreview);

    joiningInput.addEventListener('change', () => {
        const months = planSelect.value === 'custom' ? (customPlanMonths.value || 1) : (PLANS[planSelect.value]?.months || 1);
        expiryInput.value = calculateExpiry(joiningInput.value, months);
        updatePreview();
    });

    // 7. Photo Upload & Compression
    photoArea.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            studentPhoto = await compressImage(file, 200, 0.72);
            photoPreview.src = studentPhoto;
            photoPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            updatePreview();
            saveFormDraft();
            playClick();
        } catch (err) {
            console.error('Image compression failed:', err);
            showToast('Unable to process photo. Please try a different image.', 'error');
        }
    });

    // 8. Calculations & Toggles
    amountInput.addEventListener('input', recalcTotal);
    discountTypeSelect.addEventListener('change', () => {
        discountValueGroup.style.display = discountTypeSelect.value === 'none' ? 'none' : 'block';
        recalcTotal();
    });
    discountValueInput.addEventListener('input', recalcTotal);

    gstToggle.addEventListener('click', () => {
        gstEnabled = !gstEnabled;
        gstToggle.classList.toggle('on', gstEnabled);
        recalcTotal();
        playClick();
    });

    // Status chips
    document.getElementById('statusFull').addEventListener('click', () => {
        paymentStatus = 'full';
        document.getElementById('statusFull').className = 'status-chip active-full';
        document.getElementById('statusPartial').className = 'status-chip';
        document.getElementById('partialPayRow').style.display = 'none';
        recalcTotal();
        playClick();
    });

    document.getElementById('statusPartial').addEventListener('click', () => {
        paymentStatus = 'partial';
        document.getElementById('statusPartial').className = 'status-chip active-partial';
        document.getElementById('statusFull').className = 'status-chip';
        document.getElementById('partialPayRow').style.display = 'grid';
        recalcTotal();
        playClick();
    });

    document.getElementById('amountPaid').addEventListener('input', recalcTotal);
    document.getElementById('paymentMode').addEventListener('change', updatePreview);
    document.getElementById('remarks').addEventListener('input', updatePreview);

    // 9. Autocomplete for student names
    nameInput.addEventListener('input', () => {
        const q = nameInput.value.trim().toLowerCase();
        if (q.length < 1) {
            nameAutocomplete.classList.remove('visible');
            updatePreview();
            return;
        }
        const matches = getInvoices().filter(i => (i.studentName || '').toLowerCase().includes(q));
        if (matches.length === 0) {
            nameAutocomplete.classList.remove('visible');
        } else {
            nameAutocomplete.innerHTML = matches.slice(0, 5).map(m => `
                <div class="autocomplete-item" data-id="${m.id}">
                    <strong>${m.studentName}</strong>
                    <small>${m.mobile} &bull; ${m.planLabel || m.plan} &bull; Seat: ${m.seat || '-'}</small>
                </div>
            `).join('');
            nameAutocomplete.classList.add('visible');
        }
        updatePreview();
    });

    nameAutocomplete.addEventListener('click', e => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        const inv = getInvoices().find(i => i.id === item.dataset.id);
        if (inv) {
            nameInput.value = inv.studentName;
            document.getElementById('fatherName').value = inv.fatherName || '';
            document.getElementById('mobile').value = inv.mobile || '';
            document.getElementById('seat').value = inv.seat || '';
            if (inv.photo) {
                studentPhoto = inv.photo;
                photoPreview.src = studentPhoto;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
            }
            updatePreview();
        }
        nameAutocomplete.classList.remove('visible');
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#studentName') && !e.target.closest('#nameAutocomplete')) {
            nameAutocomplete.classList.remove('visible');
        }
    });

    // 10. Form submission (PDF Download)
    document.getElementById('invoiceForm').addEventListener('submit', async e => {
        e.preventDefault();
        if (!validateAll()) return;

        const btn = document.getElementById('btnGenerate');
        btn.classList.add('loading');
        btn.disabled = true;
        await new Promise(r => setTimeout(r, 400));

        try {
            const pdfObj = buildInvoicePDFDoc();
            pdfObj.doc.save(pdfObj.invoiceNo + '.pdf');

            saveInvoice(pdfObj.data);
            burstConfetti();
            playSuccess();
            showToast('Invoice PDF downloaded successfully.', 'success');
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.', 'error');
            playError();
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });

    // 11. WhatsApp Share & 1-Click Quick Fill & New Invoice
    document.getElementById('btnWhatsapp').addEventListener('click', () => sharePDFToWhatsApp());
    document.getElementById('btnQuickFill').addEventListener('click', quickFillSample);
    document.getElementById('btnNewInvoice').addEventListener('click', () => {
        if (!confirm('Start a new invoice? Current form data will be cleared.')) return;
        document.getElementById('invoiceForm').reset();
        invoiceNo = generateInvoiceNo();
        document.getElementById('invoiceNumber').textContent = 'Invoice: ' + invoiceNo;
        studentPhoto = null;
        photoPreview.style.display = 'none';
        photoPlaceholder.style.display = '';
        paymentStatus = 'full';
        document.getElementById('statusFull').className = 'status-chip active-full';
        document.getElementById('statusPartial').className = 'status-chip';
        document.getElementById('partialPayRow').style.display = 'none';
        gstEnabled = false;
        gstToggle.classList.remove('on');
        document.getElementById('gstBreakdown').style.display = 'none';
        document.getElementById('customPlanRow').style.display = 'none';
        document.getElementById('discountValueGroup').style.display = 'none';
        document.getElementById('totalDisplay').textContent = '₹0';
        document.getElementById('joining').valueAsDate = new Date();
        clearDraft();
        updatePreview();
        playClick();
        showToast('New invoice started.', 'success');
    });

    // Auto-save form draft on typing
    document.getElementById('invoiceForm').addEventListener('input', saveFormDraft);
    document.getElementById('invoiceForm').addEventListener('change', saveFormDraft);

    // 12. Dashboard Filters & Export
    document.getElementById('historySearch')?.addEventListener('input', renderHistory);
    document.getElementById('historyFilter')?.addEventListener('change', renderHistory);
    document.getElementById('historyPlanFilter')?.addEventListener('change', renderHistory);
    document.getElementById('btnExport')?.addEventListener('click', exportToCSV);

    // 13. Keyboard Shortcuts
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('invoiceForm').requestSubmit();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            document.getElementById('btnNewInvoice').click();
        }
    });

    // 14. Initial App Boot
    cleanStorage();
    applyLibrarySettings();
    restoreFormDraft();
    recalcTotal();
    updatePreview();
});
