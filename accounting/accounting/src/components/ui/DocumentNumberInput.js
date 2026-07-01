import React, { useEffect, useState } from "react";

export default function DocumentNumberInput({
    apiUrl = "http://localhost:5000/api/journal/last", // آدرس API برای گرفتن آخرین سند
     label = "شماره سند",
    value,
    onChange,
    className = "",
    triggerNewDoc, // وقتی دکمه سند جدید زده شود این پراپرتی تغییر می‌کند
}) {
    const [docNumber, setDocNumber] = useState(value || "");

    // گرفتن آخرین شماره سند هنگام بارگذاری یا تغییر triggerNewDoc
    useEffect(() => {
        const fetchLastDoc = async () => {
            try {
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error("خطا در دریافت شماره سند");
                const data = await res.json();
                const nextNumber = (data?.lastNumber || 0) + 1;
                setDocNumber(nextNumber);
                onChange?.(nextNumber);
            } catch (err) {
                console.error("❌ خطا در دریافت شماره سند:", err);
            }
        };

        fetchLastDoc();
    }, [apiUrl, triggerNewDoc]); // وقتی فرم بارگذاری یا دکمه سند جدید زده شود

    const handleChange = (e) => {
        setDocNumber(e.target.value);
        onChange?.(e.target.value);
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {label}:
            </label>
            <input
                type="text"
                value={docNumber}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            />
        </div>
    );
}