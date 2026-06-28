// src/components/ui/JalaliDatePicker.jsx
import { useState } from "react";
import { g2j, jalaliToIso, isoToJalali, toPersianDigits } from "../utils/dateUtilsJalali";

const monthNamesFa = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export default function JalaliDatePicker({ label = "تاریخ", isoValue = "", onChange }) {
    const now = new Date();
    let init;
    if (isoValue) {
        const parts = String(isoValue).split("-");
        if (parts.length === 3) {
            const [gy, gm, gd] = parts.map(Number);
            init = g2j(gy, gm, gd);
        }
    }
    if (!init) init = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const [jy, setJy] = useState(init.jy);
    const [jm, setJm] = useState(init.jm);
    const [selectedIso, setSelectedIso] = useState(isoValue);

    // تعداد روزهای ماه (اسفند 29، ساده‌سازی)
    const daysInMonth = jm <= 6 ? 31 : jm <= 11 ? 30 : 29;

    const pickDay = (d) => {
        const iso = jalaliToIso(`${jy}/${jm}/${d}`);
        setSelectedIso(iso);
        onChange?.(iso);
    };

    const prevMonth = () => {
        if (jm > 1) {
            setJm(jm - 1);
        } else {
            setJm(12);
            setJy(jy - 1);
        }
    };

    const nextMonth = () => {
        if (jm < 12) {
            setJm(jm + 1);
        } else {
            setJm(1);
            setJy(jy + 1);
        }
    };

    const changeYear = (val) => {
        const num = Number(val);
        if (!isNaN(num)) setJy(num);
    };

    return (
        <div>
            {label && <label className="block text-sm mb-1">{label}</label>}
            <div className="mb-2 p-2 border rounded bg-gray-50">
                {selectedIso ? `انتخاب: ${isoToJalali(selectedIso)}` : "تاریخی انتخاب نشده"}
            </div>

            {/* کنترل سال و ماه */}
            <div className="flex items-center justify-between mb-2 gap-2">
                <button onClick={prevMonth} className="px-2 py-1 border rounded">ماه قبل</button>
                <div className="flex items-center gap-2">
                    <span>{monthNamesFa[jm - 1]}</span>
                    <input
                        type="number"
                        value={jy}
                        onChange={(e) => changeYear(e.target.value)}
                        className="w-20 border rounded p-1 text-center"
                    />
                    <button onClick={() => setJy(jy - 1)} className="px-2 py-1 border rounded">سال قبل</button>
                    <button onClick={() => setJy(jy + 1)} className="px-2 py-1 border rounded">سال بعد</button>
                </div>
                <button onClick={nextMonth} className="px-2 py-1 border rounded">ماه بعد</button>
            </div>

            {/* شبکه روزها */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
                    <div key={d} className="text-xs text-gray-600 py-1">{d}</div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <button
                        key={d}
                        onClick={() => pickDay(d)}
                        className={
                            "h-9 border rounded " +
                            (selectedIso && isoToJalali(selectedIso) === `${jy}/${String(jm).padStart(2, "0")}/${String(d).padStart(2, "0")}`
                                ? " bg-blue-100 border-blue-400"
                                : " hover:bg-blue-50")
                        }
                    >
                        {toPersianDigits(d)}
                    </button>
                ))}
            </div>
        </div>
    );
}
