import React, { useState } from "react";

export default function CodeInput({
    label = "کد حساب",
    placeholder = "کد حساب را وارد کنید",
    apiUrl = "http://localhost:5000/api/accounts",
    onResult,
    className = "",
}) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && code) {
            e.preventDefault();
            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}/${code}`);
                if (!res.ok) throw new Error("خطا در دریافت داده");
                const data = await res.json();
                onResult?.(data); // پاس دادن داده کامل به فرم والد
            } catch (err) {
                console.error("❌ خطا در جستجو:", err);
                onResult?.({ TitleFa: "یافت نشد" });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="block text-sm font-medium mb-1">{label}:</label>
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="border rounded px-2 py-1"
            />
            {loading && <p>در حال جستجو...</p>}
        </div>
    );
}
