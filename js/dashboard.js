/* ═══════════════════════════════════════════
   DASHBOARD & ANALYTICS CONTROLLER
   ═══════════════════════════════════════════ */

/**
 * Renders stats, charts, and history table with live filtering.
 */
function renderHistory() {
    const all = getInvoices();
    const q = (document.getElementById('historySearch')?.value || '').toLowerCase();
    const fStatus = document.getElementById('historyFilter')?.value || 'all';
    const fPlan = document.getElementById('historyPlanFilter')?.value || 'all';

    // 1. Stats calculation
    const totalStudents = all.length;
    let totalRevenue = 0;
    let totalDue = 0;
    const activeMembers = all.length;

    all.forEach(i => {
        const amt = i.amountPaid !== undefined ? i.amountPaid : i.total;
        totalRevenue += (amt || 0);
        if (i.paymentStatus === 'partial') {
            totalDue += Math.max(0, (i.total || 0) - (i.amountPaid || 0));
        }
    });

    const statTotal = document.getElementById('statTotal');
    const statRevenue = document.getElementById('statRevenue');
    const statActive = document.getElementById('statActive');
    const statDue = document.getElementById('statDue');

    if (statTotal) statTotal.textContent = totalStudents;
    if (statRevenue) statRevenue.textContent = formatCurrency(totalRevenue);
    if (statActive) statActive.textContent = activeMembers;
    if (statDue) statDue.textContent = formatCurrency(totalDue);

    // 2. Render charts
    renderRevenueChart(all);
    renderPlanChart(all);

    // 3. Filter invoices
    const filtered = all.filter(i => {
        const matchQ = (i.studentName || '').toLowerCase().includes(q) ||
            (i.id || '').toLowerCase().includes(q) ||
            (i.mobile || '').includes(q) ||
            (i.seat || '').toLowerCase().includes(q);
        const matchStatus = fStatus === 'all' || (i.paymentStatus || 'full') === fStatus;
        const matchPlan = fPlan === 'all' || i.plan === fPlan;
        return matchQ && matchStatus && matchPlan;
    });

    const container = document.getElementById('historyTableContainer');
    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon" aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                </div>
                <p>${all.length === 0 ? 'No invoices created yet' : 'No invoices match your search filters'}</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="history-table-wrapper">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Invoice No</th>
                        <th>Student</th>
                        <th>Mobile</th>
                        <th>Seat</th>
                        <th>Plan</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(i => {
                        const statusClass = i.paymentStatus === 'partial' ? 'status-partial' : 'status-paid';
                        const statusText = i.paymentStatus === 'partial' ? `Due: ${formatCurrency(Math.max(0, (i.total || 0) - (i.amountPaid || 0)))}` : 'Paid';
                        return `
                            <tr>
                                <td><strong>${i.id}</strong></td>
                                <td class="student-name">${i.studentName}</td>
                                <td>${i.mobile}</td>
                                <td>${i.seat || '-'}</td>
                                <td><span class="plan-badge">${i.planLabel || i.plan}</span></td>
                                <td class="amount-cell">${formatCurrency(i.total)}</td>
                                <td class="${statusClass}">${statusText}</td>
                                <td class="actions-cell">
                                    <button class="icon-btn" title="Download PDF" onclick="downloadSavedPDF('${i.id}')">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </button>
                                    <button class="icon-btn" title="Share PDF on WhatsApp" onclick="shareSavedInvoice('${i.id}')" style="color:#25D366;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                    </button>
                                    <button class="icon-btn" title="Load into Editor" onclick="loadInvoice('${i.id}')">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button class="icon-btn delete" title="Delete Invoice" onclick="handleDeleteInvoice('${i.id}')">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

/**
 * Downloads a stored invoice PDF.
 */
function downloadSavedPDF(id) {
    const inv = getInvoices().find(i => i.id === id);
    if (!inv) return;
    const pdfObj = buildInvoicePDFDoc(inv);
    pdfObj.doc.save(inv.id + '.pdf');
    playSuccess();
    showToast(`Invoice ${inv.id} downloaded.`, 'success');
}

/**
 * Shares a stored invoice on WhatsApp.
 */
function shareSavedInvoice(id) {
    const inv = getInvoices().find(i => i.id === id);
    if (!inv) return;
    sharePDFToWhatsApp(inv);
}

/**
 * Loads an invoice into the active editor form.
 */
function loadInvoice(id) {
    const inv = getInvoices().find(i => i.id === id);
    if (!inv) return;

    nameInput.value = inv.studentName || '';
    document.getElementById('fatherName').value = inv.fatherName || '';
    document.getElementById('mobile').value = inv.mobile || '';
    document.getElementById('seat').value = inv.seat || '';
    planSelect.value = inv.plan || 'monthly';
    planSelect.dispatchEvent(new Event('change'));
    joiningInput.value = inv.joining || '';
    expiryInput.value = inv.expiry || '';
    amountInput.value = inv.amount || '';
    document.getElementById('paymentMode').value = inv.mode || 'Cash';
    document.getElementById('remarks').value = inv.remarks || '';

    if (inv.discount) {
        discountTypeSelect.value = 'flat';
        discountValueGroup.style.display = 'block';
        discountValueInput.value = inv.discount;
    } else {
        discountTypeSelect.value = 'none';
        discountValueGroup.style.display = 'none';
    }

    if (inv.gst) {
        if (!gstEnabled) gstToggle.click();
    } else {
        if (gstEnabled) gstToggle.click();
    }

    if (inv.photo) {
        studentPhoto = inv.photo;
        photoPreview.src = studentPhoto;
        photoPreview.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    } else {
        studentPhoto = null;
        photoPreview.style.display = 'none';
        photoPlaceholder.style.display = '';
    }

    invoiceNo = inv.id;
    document.getElementById('invoiceNumber').textContent = 'Invoice: ' + invoiceNo;
    paymentStatus = inv.paymentStatus || 'full';

    if (paymentStatus === 'partial') {
        document.getElementById('amountPaid').value = inv.amountPaid || 0;
        document.getElementById('statusPartial').click();
    } else {
        document.getElementById('statusFull').click();
    }

    recalcTotal();
    updatePreview();
    switchTab('invoice');
    showToast('Invoice loaded into editor.', 'info');
}

/**
 * Deletes an invoice with confirmation.
 */
function handleDeleteInvoice(id) {
    if (!confirm(`Delete invoice ${id}? This action cannot be undone.`)) return;
    deleteInvoice(id);
    renderHistory();
    playClick();
    showToast('Invoice deleted.', 'info');
}

/**
 * Revenue Bar Chart.
 */
function renderRevenueChart(all) {
    const chart = document.getElementById('revenueChart');
    if (!chart) return;
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        months[key] = 0;
    }
    all.forEach(inv => {
        const d = new Date(inv.date || Date.now());
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        if (key in months) months[key] += (inv.amountPaid || inv.total || 0);
    });
    const max = Math.max(...Object.values(months), 1);
    chart.innerHTML = Object.entries(months).map(([label, val]) => {
        const h = Math.max(4, (val / max) * 120);
        return `<div class="bar-col"><div class="bar-value">₹${val > 999 ? (val / 1000).toFixed(1) + 'k' : val}</div><div class="bar" style="height:${h}px"></div><div class="bar-label">${label}</div></div>`;
    }).join('');
}

/**
 * Membership Plan Donut Chart.
 */
function renderPlanChart(all) {
    const container = document.getElementById('planChart');
    if (!container) return;
    const counts = {};
    all.forEach(inv => { counts[inv.planLabel || inv.plan] = (counts[inv.planLabel || inv.plan] || 0) + 1; });
    const total = all.length || 1;
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    const entries = Object.entries(counts).slice(0, 5);

    if (entries.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px 0;">No data yet</div>';
        return;
    }

    let gradient = '';
    let cumulative = 0;
    entries.forEach(([, count], i) => {
        const pct = (count / total) * 100;
        gradient += `${colors[i % 5]} ${cumulative}% ${cumulative + pct}%,`;
        cumulative += pct;
    });
    gradient = gradient.slice(0, -1);

    container.innerHTML = `
        <div class="donut-chart" style="background:conic-gradient(${gradient});">
            <div class="donut-center">${total}</div>
        </div>
        <div class="donut-legend">
            ${entries.map(([label, count], i) => `<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${colors[i % 5]}"></div>${label} (${count})</div>`).join('')}
        </div>`;
}

/**
 * CSV Exporter.
 */
function exportToCSV() {
    const all = getInvoices();
    if (all.length === 0) {
        showToast('No invoices to export.', 'warn');
        return;
    }
    const headers = ['Invoice', 'Student', 'Father', 'Mobile', 'Seat', 'Plan', 'Joining', 'Expiry', 'Amount', 'GST', 'Total', 'Paid', 'Balance', 'Mode', 'Status', 'Date'];
    const rows = all.map(i => [
        i.id, i.studentName, i.fatherName, i.mobile, i.seat, i.planLabel || i.plan,
        i.joining, i.expiry, i.amount, i.gstAmount || 0, i.total, i.amountPaid || i.total,
        Math.max(0, (i.total || 0) - (i.amountPaid || i.total || 0)), i.mode, i.paymentStatus, i.date
    ]);
    const csv = headers.join(',') + '\n' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MSL_Invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
    playSuccess();
    showToast('CSV exported successfully.', 'success');
}
