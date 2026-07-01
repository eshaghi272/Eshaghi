import { useEffect, useState } from "react";

export default function ApiItemList({
    baseUrl = "http://localhost:5000/api",
    apiPath = "items",
    onSelect, // تابعی برای انتخاب یک کالا
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(`${baseUrl}/${apiPath}`)
            .then((res) => res.json())
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("❌ خطا در دریافت لیست:", err);
                setError("خطا در دریافت لیست کالاها");
            })
            .finally(() => setLoading(false));
    }, [baseUrl, apiPath]);

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">لیست کالاها</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                                {item.itemName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                کد کالا: {item.itemCode} | برند: {item.brand} | قیمت:{" "}
                                {item.basePrice.toLocaleString()} تومان
                            </p>
                        </div>
                        <button
                            onClick={() => onSelect?.(item.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                            انتخاب
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
