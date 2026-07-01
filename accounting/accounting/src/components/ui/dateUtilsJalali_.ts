// dateUtilsJalali.js
// ابزارهای عمومی تبدیل تاریخ و ارقام برای جلالی

type JalaliDate = { jy: number; jm: number; jd: number };
type GregorianDate = { gy: number; gm: number; gd: number };

// --- ارقام فارسی/انگلیسی
export function toPersianDigits(input: string | number): string {
    const s = String(input);
    const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/[0-9]/g, d => map[Number(d)]);
}
export function toEnglishDigits(input: string): string {
    const map: Record<string, string> = {
        "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9"
    };
    return input.replace(/[۰-۹]/g, c => map[c] ?? c);
}

// --- ابزارهای کمکی
function div(a: number, b: number): number { return Math.floor(a / b); }

// --- تبدیل میلادی به جلالی
export function g2j(gy: number, gm: number, gd: number): JalaliDate {
    const g_d_m = [0, 31, (isLeapGregorian(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gy2 = gy - 1600, gm2 = gm - 1, gd2 = gd - 1;
    let g_day_no = 365 * gy2 + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400);
    for (let i = 0; i < gm2; ++i) g_day_no += g_d_m[i + 1];
    g_day_no += gd2;
    let j_day_no = g_day_no - 79;
    const j_np = div(j_day_no, 12053);
    j_day_no = j_day_no % 12053;
    let jy = 979 + 33 * j_np + 4 * div(j_day_no, 1461);
    j_day_no %= 1461;
    if (j_day_no >= 366) {
        jy += div(j_day_no - 366, 365);
        j_day_no = (j_day_no - 366) % 365;
    }
    const jm = j_day_no < 186 ? 1 + div(j_day_no, 31) : 7 + div(j_day_no - 186, 30);
    const jd = j_day_no < 186 ? 1 + (j_day_no % 31) : 1 + ((j_day_no - 186) % 30);
    return { jy, jm, jd };
}

// --- تبدیل جلالی به میلادی
export function j2g(jy: number, jm: number, jd: number): GregorianDate {
    jy -= 979; jm -= 1; jd -= 1;
    let j_day_no = 365 * jy + div(jy, 33) * 8 + div((jy % 33) + 3, 4);
    for (let i = 0; i < jm; ++i) j_day_no += (i < 6 ? 31 : 30);
    j_day_no += jd;
    let g_day_no = j_day_no + 79;
    let gy = 1600 + 400 * div(g_day_no, 146097);
    g_day_no %= 146097;
    let leap = true;
    if (g_day_no >= 36525) {
        g_day_no -= 1;
        gy += 100 * div(g_day_no, 36524);
        g_day_no %= 36524;
        if (g_day_no >= 365) g_day_no += 1;
        else leap = false;
    }
    gy += 4 * div(g_day_no, 1461);
    g_day_no %= 1461;
    if (g_day_no >= 366) {
        leap = false;
        gy += div(g_day_no - 366, 365);
        g_day_no = (g_day_no - 366) % 365;
    }
    const g_dm = [31, (isLeapGregorian(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (; gm < 12 && g_day_no >= g_dm[gm]; gm++) g_day_no -= g_dm[gm];
    const gd = g_day_no + 1;
    return { gy, gm: gm + 1, gd };
}

function isLeapGregorian(y: number): boolean {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

// --- ساخت رشته جلالی YYYY/MM/DD
export function formatJalali(jy: number, jm: number, jd: number, persianDigits = true): string {
    const mm = jm.toString().padStart(2, "0");
    const dd = jd.toString().padStart(2, "0");
    const s = `${jy}/${mm}/${dd}`;
    return persianDigits ? toPersianDigits(s) : s;
}

// --- پارس رشته جلالی YYYY/MM/DD (با ارقام فارسی/انگلیسی) به عدد
export function parseJalali(input: string): JalaliDate | null {
    const e = toEnglishDigits(input).replace(/\s+/g, "");
    const m = e.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (!m) return null;
    const jy = Number(m[1]), jm = Number(m[2]), jd = Number(m[3]);
    if (jm < 1 || jm > 12) return null;
    const maxDay = jm <= 6 ? 31 : jm <= 11 ? 30 : 29; // ساده‌سازی: اسفند 29
    if (jd < 1 || jd > maxDay) return null;
    return { jy, jm, jd };
}

// --- تبدیل ISO (YYYY-MM-DD) به جلالی
export function isoToJalali(iso: string): string {
    if (!iso) return "";
    const [gy, gm, gd] = iso.split("-").map(Number);
    if (!gy || !gm || !gd) return "";
    const { jy, jm, jd } = g2j(gy, gm, gd);
    return formatJalali(jy, jm, jd, true);
}

// --- تبدیل جلالی به ISO (YYYY-MM-DD)
export function jalaliToIso(jalaliStr: string): string {
    const j = parseJalali(jalaliStr);
    if (!j) return "";
    const { gy, gm, gd } = j2g(j.jy, j.jm, j.jd);
    const m = String(gm).padStart(2, "0");
    const d = String(gd).padStart(2, "0");
    return `${gy}-${m}-${d}`;
}
