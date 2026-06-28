import React, { useState } from "react";

export default function AccountCodeInput({
    label = "کد حساب",
    placeholder = "کد حساب را وارد کنید",
    apiUrl = "http://localhost:5000/api/accounts",
    onResult,
    className = "",
}) {
    const [code, setCode] = useState("");
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && code) {
            e.preventDefault(); // جلوگیری از submit فرم
            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}/${code}`);
                if (!res.ok) throw new Error("خطا در دریافت داده");
                const data = await res.json();
                setAccount(data || null);
                onResult?.(data); // پاس دادن نتیجه به فرم والد
            } catch (err) {
                console.error("❌ خطا در جستجو:", err);
                setAccount({ TitleFa: "یافت نشد" });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div>
                <label className="block text-sm font-medium mb-1">{label}:</label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="border rounded p-2 bg-gray-50">
                {loading ? (
                    <p>در حال جستجو...</p>
                ) : account ? (
                    <>
                        <p><strong>عنوان حساب:</strong> {account.TitleFa}</p>
                        <p><strong>عنوان انگلیسی:</strong> {account.TitleEn}</p>
                        <p><strong>ماهیت:</strong> {account.Nature}</p>
                        <p><strong>نوع:</strong> {account.Type}</p>
                    </>
                ) : (
                    <p>هنوز جستجو نشده</p>
                )}
            </div>
        </div>
    );
}
