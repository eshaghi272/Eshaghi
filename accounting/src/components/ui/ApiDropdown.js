import { useEffect, useState } from "react";

export default function ApiDropdown({
    baseUrl = "http://localhost:5000/api", // آدرس پایه API
    apiPath,                               // مسیر API که موقع استفاده ست میشه
    name,
    label,
    optionValue = "id",
    optionLabel = (opt) => opt.name,
    value,
    onChange,
    required = false,
    className = ""
}) {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!apiPath) return;
        setLoading(true);

        fetch(`${baseUrl}/${apiPath}`)   // اینجا ترکیب میشه
            .then((res) => res.json())
            .then((data) => {
                setOptions(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error(`❌ خطا در دریافت داده‌های ${apiPath}:`, err);
            })
            .finally(() => setLoading(false));
    }, [apiPath, baseUrl]);

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <select
                name={name}
                value={value || ""}
                onChange={(e) => onChange?.(e.target.value)}
                required={required}
                className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
                <option value="">{loading ? "در حال بارگذاری..." : `انتخاب ${label}`}</option>
                {options.map((opt) => (
                    <option key={opt[optionValue]} value={opt[optionValue]}>
                        {typeof optionLabel === "function" ? optionLabel(opt) : opt[optionLabel]}
                    </option>
                ))}
            </select>
        </div>
    );
}
