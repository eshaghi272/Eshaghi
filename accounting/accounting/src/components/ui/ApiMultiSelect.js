import { useEffect, useState } from "react";

export default function ApiMultiSelect({
    baseUrl = "http://localhost:5000/api",
    apiPath,
    name,
    label,
    optionValue = "id",
    optionLabel = (opt) => opt.itemName,
    values = [],                // آرایه کالاهای انتخاب‌شده
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
            setLoading(true);

            fetch(`${baseUrl}/${apiPath}`)
                .then((res) => res.json())
                .then((data) => {
                    const items = Array.isArray(data) ? data : [];
                    const filtered = query.trim()
                        ? items.filter((opt) =>
                            opt.itemName.toLowerCase().includes(query.toLowerCase())
                        )
                        : items; // اگر چیزی تایپ نشده، همه کالاها
                    setResults(filtered);
                })
                .catch((err) => {
                    console.error(`❌ خطا در دریافت داده‌های ${apiPath}:`, err);
                })
                .finally(() => setLoading(false));
        }, 400); // ⏱️ debounce

        return () => clearTimeout(handler);
    }, [query, apiPath, baseUrl]);

    const toggleSelect = (val) => {
        if (values.includes(val)) {
            // حذف از انتخاب‌ها
            onChange?.(values.filter((v) => v !== val));
        } else {
            // اضافه کردن به انتخاب‌ها
            onChange?.([...values, val]);
        }
    };

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
                    {results.map((opt) => {
                        const val = opt[optionValue];
                        const labelText = typeof optionLabel === "function" ? optionLabel(opt) : opt[optionLabel];
                        const selected = values.includes(val);

                        return (
                            <li
                                key={val}
                                onClick={() => toggleSelect(val)}
                                className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selected ? "bg-blue-100 dark:bg-blue-800" : ""
                                    }`}
                            >
                                {labelText} {selected && "✅"}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                query.trim() !== "" && !loading && (
                    <p className="text-sm text-gray-500 mt-1">کالایی یافت نشد</p>
                )
            )}

            {/* نمایش کالاهای انتخاب‌شده */}
            {values.length > 0 && (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    انتخاب‌شده‌ها: {values.join(", ")}
                </div>
            )}
        </div>
    );
}
