/* ═══════════════════════════════════════════
   MODERN EXECUTIVE PDF GENERATOR (JSPDF)
   ═══════════════════════════════════════════ */

/**
 * Helper to generate a high-resolution base64 QR Code string.
 */
function generateQRDataURL(text) {
    try {
        if (typeof qrcode !== 'undefined') {
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            return qr.createDataURL(4, 0);
        }
    } catch (e) {
        console.warn('QR generation fallback:', e);
    }
    return null;
}

/**
 * Builds a modern, sleek, executive-grade invoice & receipt PDF.
 */
function buildInvoicePDFDoc(customData = null) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth();   // 210 mm
    const pageH = doc.internal.pageSize.getHeight();  // 297 mm

    // Extract dynamic invoice data
    const name = customData ? customData.studentName : document.getElementById('studentName').value.trim();
    const father = customData ? customData.fatherName : document.getElementById('fatherName').value.trim();
    const mobile = customData ? customData.mobile : document.getElementById('mobile').value;
    const seat = customData ? customData.seat : document.getElementById('seat').value.trim();
    const planKey = customData ? customData.plan : planSelect.value;
    let planLabel = customData ? (customData.planLabel || customData.plan) : (planKey === 'custom' ? (document.getElementById('customPlanName').value || 'Custom Plan') : (PLANS[planKey] ? PLANS[planKey].label : planKey));
    const joining = customData ? customData.joining : joiningInput.value;
    const expiry = customData ? customData.expiry : expiryInput.value;
    const mode = customData ? customData.mode : document.getElementById('paymentMode').value;
    const remarks = customData ? customData.remarks : document.getElementById('remarks').value;
    const photo = customData ? customData.photo : studentPhoto;
    const invNo = customData ? customData.id : invoiceNo;
    const status = customData ? (customData.paymentStatus || 'full') : paymentStatus;

    const t = customData ? {
        base: customData.amount,
        discount: customData.discount || 0,
        subtotal: customData.amount - (customData.discount || 0),
        gst: customData.gstAmount || 0,
        cgst: (customData.gstAmount || 0) / 2,
        sgst: (customData.gstAmount || 0) / 2,
        total: customData.total
    } : getTotal();

    const hasGST = customData ? customData.gst : gstEnabled;
    const amtPaid = customData ? (customData.amountPaid || (status === 'partial' ? 0 : customData.total)) : (status === 'partial' ? (parseFloat(document.getElementById('amountPaid').value) || 0) : Math.round(t.total));
    const balance = Math.max(0, Math.round(t.total) - amtPaid);

    const cfg = getLibrarySettings();
    const libName = cfg.name || 'MODERN STUDY LIBRARY';
    const libTagline = cfg.tagline || 'Premium Study & Co-Working Space';
    const libPhone = cfg.phone || '98765 43210';
    const libEmail = cfg.email || 'info@modernstudylib.com';
    const libAddress = cfg.address || 'Main Branch, Library Road';

    // ─────────────────────────────────────────────
    // 1. TOP HEADER (Deep Navy + Neon Violet Accent)
    // ─────────────────────────────────────────────
    // Top primary banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageW, 36, 'F');

    // Neon accent bar at very top
    doc.setFillColor(99, 102, 241); // Indigo-500
    doc.rect(0, 0, pageW, 3, 'F');

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(libName.toUpperCase(), 14, 18);

    // Subtitle & Estd
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(libTagline.toUpperCase() + '  •  24/7 OPEN', 14, 25);

    // Right Side: Tax Invoice / Receipt Badge
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(pageW - 68, 8, 54, 22, 2, 2, 'F');

    doc.setTextColor(56, 189, 248); // Sky-400
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('OFFICIAL RECEIPT', pageW - 41, 14, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(invNo, pageW - 41, 20, { align: 'center' });

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(formatDate(joining) || new Date().toLocaleDateString('en-IN'), pageW - 41, 26, { align: 'center' });

    // ─────────────────────────────────────────────
    // 2. CONTACT STRIP (Sub-header)
    // ─────────────────────────────────────────────
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(0, 36, pageW, 8.5, 'F');

    doc.setTextColor(71, 85, 105); // Slate-600
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const contactText = `Location: ${libAddress}   |   Phone: +91 ${libPhone}   |   Email: ${libEmail}`;
    doc.text(contactText, pageW / 2, 41.5, { align: 'center' });

    // ─────────────────────────────────────────────
    // 3. TWO-COLUMN INFO CARDS (Billed To + Membership)
    // ─────────────────────────────────────────────
    const cardY = 49;
    const cardH = 40;
    const cardW = 88;

    // LEFT CARD: BILLED TO (STUDENT)
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');

    // Header bar of left card
    doc.setFillColor(238, 242, 246);
    doc.roundedRect(14, cardY, cardW, 7, 2, 2, 'F');
    doc.rect(14, cardY + 4, cardW, 3, 'F');
    doc.setTextColor(99, 102, 241); // Indigo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BILLED TO (STUDENT)', 18, cardY + 5);

    let textStartX = 18;
    if (photo) {
        try {
            // Draw student photo with modern rounded appearance
            doc.addImage(photo, 'JPEG', 18, cardY + 11, 22, 22);
            doc.setDrawColor(99, 102, 241);
            doc.setLineWidth(0.5);
            doc.rect(18, cardY + 11, 22, 22, 'S');
            textStartX = 44;
        } catch (e) { }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(name || 'Student Name', textStartX, cardY + 15);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`S/o: ${father || '-'}`, textStartX, cardY + 21);
    doc.text(`Phone: +91 ${mobile || '-'}`, textStartX, cardY + 26);

    // Seat Badge (Pill)
    doc.setFillColor(224, 242, 254); // Sky-100
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(textStartX, cardY + 29, 32, 6, 1.5, 1.5, 'FD');
    doc.setTextColor(3, 105, 161); // Sky-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`SEAT: ${seat || 'A-01'}`, textStartX + 16, cardY + 33.5, { align: 'center' });

    // RIGHT CARD: MEMBERSHIP & STATUS
    const rightCardX = 108;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightCardX, cardY, cardW, cardH, 2, 2, 'FD');

    // Header bar of right card
    doc.setFillColor(238, 242, 246);
    doc.roundedRect(rightCardX, cardY, cardW, 7, 2, 2, 'F');
    doc.rect(rightCardX, cardY + 4, cardW, 3, 'F');
    doc.setTextColor(14, 165, 233); // Cyan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MEMBERSHIP DETAILS', rightCardX + 4, cardY + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(planLabel, rightCardX + 4, cardY + 15);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Joining: ${formatDate(joining)}`, rightCardX + 4, cardY + 21);
    doc.text(`Expiry: ${formatDate(expiry)}`, rightCardX + 4, cardY + 26);

    // Status Pill
    if (status === 'partial') {
        doc.setFillColor(254, 243, 199); // Amber-100
        doc.setDrawColor(252, 211, 77);
        doc.roundedRect(rightCardX + 4, cardY + 29, 44, 6, 1.5, 1.5, 'FD');
        doc.setTextColor(180, 83, 9); // Amber-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(`DUE: Rs.${balance.toLocaleString('en-IN')}`, rightCardX + 26, cardY + 33.5, { align: 'center' });
    } else {
        doc.setFillColor(220, 252, 231); // Green-100
        doc.setDrawColor(134, 239, 172);
        doc.roundedRect(rightCardX + 4, cardY + 29, 32, 6, 1.5, 1.5, 'FD');
        doc.setTextColor(21, 128, 61); // Green-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('PAID IN FULL', rightCardX + 20, cardY + 33.5, { align: 'center' });
    }

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Mode: ${mode}`, rightCardX + 54, cardY + 33.5);

    // ─────────────────────────────────────────────
    // 4. ITEMIZED BILLING TABLE (Corporate Look)
    // ─────────────────────────────────────────────
    const tblY = 94;

    // Table Header
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.roundedRect(14, tblY, 182, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DESCRIPTION / SERVICES', 18, tblY + 5.5);
    doc.text('PERIOD', 95, tblY + 5.5);
    doc.text('SEAT', 138, tblY + 5.5);
    doc.text('AMOUNT (INR)', 192, tblY + 5.5, { align: 'right' });

    // Table Row 1 (Plan)
    const row1Y = tblY + 8;
    doc.setFillColor(255, 255, 255);
    doc.rect(14, row1Y, 182, 14, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, row1Y + 14, 196, row1Y + 14);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Library Membership — ${planLabel}`, 18, row1Y + 5.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('High-speed Wi-Fi, Peaceful AC Environment, Reserved Seat Access', 18, row1Y + 10);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${formatDate(joining)} to ${formatDate(expiry)}`, 95, row1Y + 7);
    doc.text(`${seat || '-'}`, 138, row1Y + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`Rs. ${t.base.toLocaleString('en-IN')}.00`, 192, row1Y + 7, { align: 'right' });

    let currentY = row1Y + 14;

    // Optional Row 2: Remarks / Note
    if (remarks) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(14, currentY + 8, 196, currentY + 8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.text(`Notes / Special Shift: ${remarks}`, 18, currentY + 5.5);
        currentY += 8;
    }

    // ─────────────────────────────────────────────
    // 5. FINANCIAL BREAKDOWN & QR VERIFICATION BOX
    // ─────────────────────────────────────────────
    const sumY = currentY + 6;

    // LEFT: QR Code Verification Box
    const qrBoxW = 95;
    const qrBoxH = 50;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, sumY, qrBoxW, qrBoxH, 2, 2, 'FD');

    // QR Verification Text & Code
    const qrPayload = `https://modernstudylib.com/verify?id=${invNo}&student=${encodeURIComponent(name)}&seat=${seat}&total=${t.total}&status=${status}`;
    const qrImg = generateQRDataURL(qrPayload);

    if (qrImg) {
        try {
            doc.addImage(qrImg, 'PNG', 18, sumY + 5, 24, 24);
        } catch (e) { }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('OFFICIAL VERIFICATION', 46, sumY + 11);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Scan QR code to verify validity', 46, sumY + 16);
    doc.text(`Auth ID: ${invNo}`, 46, sumY + 20);
    doc.text('Status: Active & Registered', 46, sumY + 24);

    // Terms mini-list
    doc.setDrawColor(226, 232, 240);
    doc.line(18, sumY + 31, 14 + qrBoxW - 4, sumY + 31);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('1. Maintain silence in all study areas.', 18, sumY + 36);
    doc.text('2. Membership is non-refundable and non-transferable.', 18, sumY + 40);
    doc.text('3. Carry your digital invoice / ID card at all times.', 18, sumY + 44);

    // RIGHT: Financial Summary Calculation Stack
    const rightSumX = 114;
    const rightSumW = 82;
    let rY = sumY + 2;

    // Subtotal
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Base Membership Fee:', rightSumX, rY + 4);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${t.base.toLocaleString('en-IN')}.00`, 192, rY + 4, { align: 'right' });
    rY += 7;

    // Discount (if any)
    if (t.discount > 0) {
        doc.setTextColor(220, 38, 38); // Red-600
        doc.setFont('helvetica', 'normal');
        doc.text('Discount Applied:', rightSumX, rY + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(`- Rs. ${Math.round(t.discount).toLocaleString('en-IN')}.00`, 192, rY + 4, { align: 'right' });
        rY += 7;
    }

    // GST (if applicable)
    if (hasGST) {
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text('GST (18% - CGST 9% + SGST 9%):', rightSumX, rY + 4);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${Math.round(t.gst).toLocaleString('en-IN')}.00`, 192, rY + 4, { align: 'right' });
        rY += 7;
    }

    // Total Highlight Card
    rY += 2;
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.roundedRect(rightSumX, rY, rightSumW, 12, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL PAYABLE', rightSumX + 4, rY + 7.5);

    doc.setFontSize(12);
    doc.text(`Rs. ${Math.round(t.total).toLocaleString('en-IN')}.00`, 192, rY + 8, { align: 'right' });
    rY += 16;

    // Partial balance details if applicable
    if (status === 'partial') {
        doc.setTextColor(21, 128, 61); // Green-700
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('Amount Received:', rightSumX, rY + 3);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${amtPaid.toLocaleString('en-IN')}.00`, 192, rY + 3, { align: 'right' });
        rY += 6;

        doc.setTextColor(220, 38, 38); // Red-600
        doc.setFont('helvetica', 'bold');
        doc.text('Remaining Balance Due:', rightSumX, rY + 3);
        doc.text(`Rs. ${balance.toLocaleString('en-IN')}.00`, 192, rY + 3, { align: 'right' });
        rY += 6;
    }

    // ─────────────────────────────────────────────
    // 6. OFFICIAL DIGITAL SEAL & SIGNATURE BLOCK
    // ─────────────────────────────────────────────
    const signY = 222;

    // Left: Verified Badge Seal
    doc.setFillColor(240, 253, 244); // Green-50
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, signY, 70, 18, 2, 2, 'FD');

    doc.setTextColor(22, 163, 74); // Green-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('✓ DIGITALLY VERIFIED', 49, signY + 6.5, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('System Authenticated Receipt', 49, signY + 11.5, { align: 'center' });
    doc.text(new Date().toLocaleString('en-IN'), 49, signY + 15, { align: 'center' });

    // Right: Authorized Signature Area
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);
    doc.line(140, signY + 12, 196, signY + 12);
    doc.text('Authorized Signatory', 168, signY + 16, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(libName, 168, signY + 19.5, { align: 'center' });

    // ─────────────────────────────────────────────
    // 7. SLEEK MODERN FOOTER
    // ─────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 275, 196, 275);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Thank you for choosing ${libName}!  •  For inquiries: +91 ${libPhone}`, pageW / 2, 280, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated tax invoice and membership confirmation. No physical signature is required.', pageW / 2, 284, { align: 'center' });

    // Return document bundle
    const blob = doc.output('blob');
    const file = new File([blob], `${invNo}.pdf`, { type: 'application/pdf' });

    return {
        doc,
        blob,
        file,
        invoiceNo: invNo,
        data: {
            id: invNo,
            studentName: name,
            fatherName: father,
            mobile,
            seat,
            plan: planKey,
            planLabel,
            joining,
            expiry,
            amount: t.base,
            total: Math.round(t.total),
            discount: Math.round(t.discount),
            gst: hasGST,
            gstAmount: Math.round(t.gst),
            mode,
            remarks,
            paymentStatus: status,
            amountPaid: amtPaid,
            photo,
            date: customData ? customData.date : new Date().toISOString()
        }
    };
}
