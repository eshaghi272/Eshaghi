import { useState, useEffect } from "react";
import { isoToJalali, jalaliToIso, toPersianDigits } from "../utils/dateUtilsJalali";

export default function JalaliDateField({ label = "تاریخ", isoValue = "", onChange }) {
    const [jalali, setJalali] = useState("");

    useEffect(() => {
        setJalali(isoToJalali(isoValue));
    }, [isoValue]);

    const handleInput = (val) => {
        const persian = toPersianDigits(val);
        setJalali(persian);
        const iso = jalaliToIso(persian);
        if (iso && onChange) onChange(iso);
    };

    return (
        <div>
            {label && <label className="block text-sm mb-1">{label}</label>}
            <input
                type="text"
                value={jalali}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="۱۴۰۴/۰۹/۲۷"
                className="border p-2 rounded w-full"
            />
        </div>
    );
}
