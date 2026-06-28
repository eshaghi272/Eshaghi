import { useEffect, useState } from "react";

export default function ApiSearch({
    baseUrl = "http://localhost:5000/api",
    apiPath,
    name,
    label,
    optionValue = "id",
    optionLabel = (opt) => opt.itemName,
    value,
    onChange,
    required = false,
    className = ""
}) {
    const [query, setQuery] = useState("");      // متن جستجو
    const [results, setResults] = useState([]); // نتایج فیلتر شده
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!apiPath) return;

        const handler = setTimeout(() => {
            if (query.trim() === "") {
                setResults([]);
                return;
            }

            setLoading(true);

            fetch(`${baseUrl}/${apiPath}`)
                .then((res) => res.json())
                .then((data) => {
                    const items = Array.isArray(data) ? data : [];
                    const filtered = items.filter((opt) =>
                        opt.itemName.toLowerCase().includes(query.toLowerCase())
                    );
                    setResults(filtered);
                })
                .catch((err) => {
                    console.error(`❌ خطا در دریافت داده‌های ${apiPath}:`, err);
                })
                .finally(() => setLoading(false));
        }, 500); // ⏱️ تاخیر ۵۰۰ میلی‌ثانیه

        return () => clearTimeout(handler); // پاک کردن تایمر قبلی
    }, [query, apiPath, baseUrl]);

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <input
                type="text"
                name={name}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required={required}
                placeholder={`جستجو ${label}`}
                className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />

            {loading && <p className="text-sm text-gray-500 mt-1">در حال جستجو...</p>}

            {results.length > 0 ? (
                <ul className="border border-gray-300 dark:border-gray-600 rounded mt-2 bg-white dark:bg-gray-800">
                    {results.map((opt) => (
                        <li
                            key={opt[optionValue]}
                            onClick={() => {
                                onChange?.(opt[optionValue]);
                                setQuery(typeof optionLabel === "function" ? optionLabel(opt) : opt[optionLabel]);
                            }}
                            className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {typeof optionLabel === "function" ? optionLabel(opt) : opt[optionLabel]}
                        </li>
                    ))}
                </ul>
            ) : (
                query.trim() !== "" && !loading && (
                    <p className="text-sm text-gray-500 mt-1">کالایی یافت نشد</p>
                )
            )}
        </div>
    );
}
