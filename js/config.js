/* ═══════════════════════════════════════════
   APP CONFIGURATION & SOUND SYNTHESIS
   ═══════════════════════════════════════════ */

// Membership Plan Definitions
const PLANS = {
    monthly: { months: 1, label: 'Monthly (1 Month)', defaultPrice: 800 },
    quarterly: { months: 3, label: 'Quarterly (3 Months)', defaultPrice: 2200 },
    halfyearly: { months: 6, label: 'Half Yearly (6 Months)', defaultPrice: 4000 },
    yearly: { months: 12, label: 'Yearly (12 Months)', defaultPrice: 7500 },
    custom: { months: 1, label: 'Custom Plan', defaultPrice: 0 }
};

// Default Library Profile Settings
const DEFAULT_SETTINGS = {
    name: 'Modern Study Library',
    tagline: 'Study • Focus • Success',
    phone: '98765 43210',
    email: 'info@modernstudylib.com',
    address: 'Main Branch, Library Road',
    defaultPlan: 'monthly',
    defaultMode: 'Cash',
    seatPrefix: 'A-',
    autoDraft: true
};

// Realistic Sample Students for 1-Click Quick Fill
const SAMPLE_STUDENTS = [
    { name: 'Rahul Sharma', father: 'Manoj Sharma', mobile: '9876543210', seat: 'A-12', plan: 'monthly', amount: 800, mode: 'Cash', remarks: 'Morning Shift (8AM - 2PM)' },
    { name: 'Aman Kumar', father: 'Rajesh Kumar', mobile: '9812345678', seat: 'B-05', plan: 'quarterly', amount: 2200, mode: 'UPI', remarks: 'Full Day (8AM - 8PM)' },
    { name: 'Priya Verma', father: 'Suresh Verma', mobile: '9765432109', seat: 'A-08', plan: 'halfyearly', amount: 4000, mode: 'UPI', remarks: 'Reserved Seat' },
    { name: 'Rohan Gupta', father: 'Anil Gupta', mobile: '9988776655', seat: 'C-02', plan: 'yearly', amount: 7500, mode: 'Bank Transfer', remarks: 'Annual Membership' },
    { name: 'Sneha Patel', father: 'Kishore Patel', mobile: '9823456789', seat: 'A-19', plan: 'monthly', amount: 800, mode: 'UPI', remarks: 'Evening Shift (2PM - 8PM)' }
];

// Web Audio Synthesizer (Emoji-free sound feedback)
let soundEnabled = true;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    return audioCtx;
}

function playSuccess() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25, now);
        o.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
        o.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.3);
    } catch (e) { }
}

function playError() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(300, now);
        o.frequency.linearRampToValueAtTime(150, now + 0.2);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.25);
    } catch (e) { }
}

function playClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(800, now);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.04);
    } catch (e) { }
}
