// ابزارهای عمومی تبدیل تاریخ میلادی ⇄ جلالی و ارقام فارسی

export function toPersianDigits(input) {
    const s = String(input);
    const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/[0-9]/g, d => map[Number(d)]);
}

export function toEnglishDigits(input) {
    const map = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
    return input.replace(/[۰-۹]/g, c => map[c] ?? c);
}

function div(a, b) { return Math.floor(a / b); }
function isLeapGregorian(y) { return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0); }

// تشخیص کبیسه جلالی
function isLeapJalali(jy) {
    const rem = jy % 33;
    return [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
}

// میلادی → جلالی
export function g2j(gy, gm, gd) {
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

// جلالی → میلادی
export function j2g(jy, jm, jd) {
    jy -= 979; jm -= 1; jd -= 1;
    let j_day_no = 365 * jy + div(jy, 33) * 8 + div((jy % 33) + 3, 4);
    for (let i = 0; i < jm; ++i) j_day_no += (i < 6 ? 31 : 30);
    j_day_no += jd;
    let g_day_no = j_day_no + 79;
    let gy = 1600 + 400 * div(g_day_no, 146097);
    g_day_no %= 146097;
    if (g_day_no >= 36525) {
        g_day_no -= 1;
        gy += 100 * div(g_day_no, 36524);
        g_day_no %= 36524;
        if (g_day_no >= 365) g_day_no += 1;
    }
    gy += 4 * div(g_day_no, 1461);
    g_day_no %= 1461;
    if (g_day_no >= 366) {
        gy += div(g_day_no - 366, 365);
        g_day_no = (g_day_no - 366) % 365;
    }
    const g_dm = [31, (isLeapGregorian(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (; gm < 12 && g_day_no >= g_dm[gm]; gm++) g_day_no -= g_dm[gm];
    const gd = g_day_no + 1;
    return { gy, gm: gm + 1, gd };
}

// فرمت YYYY/MM/DD
export function formatJalali(jy, jm, jd, persianDigits = true) {
    const mm = String(jm).padStart(2, "0");
    const dd = String(jd).padStart(2, "0");
    const s = `${jy}/${mm}/${dd}`;
    return persianDigits ? toPersianDigits(s) : s;
}

export function parseJalali(input) {
    const e = toEnglishDigits(String(input)).replace(/\s+/g, "");
    const m = e.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (!m) return null;
    const jy = Number(m[1]), jm = Number(m[2]), jd = Number(m[3]);
    if (jm < 1 || jm > 12) return null;
    const maxDay = jm <= 6 ? 31 : jm <= 11 ? 30 : (isLeapJalali(jy) ? 30 : 29);
    if (jd < 1 || jd > maxDay) return null;
    return { jy, jm, jd };
}

export function isoToJalali(iso) {
    if (!iso) return "";
    const parts = String(iso).split("-");
    if (parts.length !== 3) return "";
    const [gy, gm, gd] = parts.map(Number);
    if (!gy || !gm || !gd) return "";
    const { jy, jm, jd } = g2j(gy, gm, gd);
    return formatJalali(jy, jm, jd, true);
}

export function jalaliToIso(jalaliStr) {
    const j = parseJalali(jalaliStr);
    if (!j) return "";
    const { gy, gm, gd } = j2g(j.jy, j.jm, j.jd);
    const m = String(gm).padStart(2, "0");
    const d = String(gd).padStart(2, "0");
    return `${gy}-${m}-${d}`;
}
