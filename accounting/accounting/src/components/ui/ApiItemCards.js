import { useEffect, useState } from "react";

export default function ApiItemCards({
    baseUrl = "http://localhost:5000/api",
    apiPath = "items",
    onSelect, // تابعی که id کالا انتخاب‌شده رو به والد پاس میده
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(`${baseUrl}/${apiPath}`)
            .then((res) => res.json())
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("❌ خطا در دریافت کالاها:", err);
                setError("خطا در دریافت کالاها");
            })
            .finally(() => setLoading(false));
    }, [baseUrl, apiPath]);

    const handleSelect = (id) => {
        setSelectedItem(id);
        onSelect?.(id);
    };

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">لیست کالاها</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`border rounded-lg shadow-md p-4 bg-white dark:bg-gray-800 hover:shadow-lg transition flex flex-col justify-between ${selectedItem === item.id ? "ring-2 ring-blue-500" : ""
                            }`}
                    >
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                                {item.itemName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                کد کالا: <strong>{item.itemCode}</strong>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                برند: {item.brand}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                مدل: {item.model}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                کشور سازنده: {item.originCountry}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                قیمت پایه: {item.basePrice.toLocaleString()} تومان
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                توضیحات: {item.description}
                            </p>
                        </div>

                        {/* دکمه انتخاب */}
                        <button
                            onClick={() => handleSelect(item.id)}
                            className="mt-4 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
                        >
                            انتخاب کالا
                        </button>
                    </div>
                ))}
            </div>

            {selectedItem && (
                <p className="mt-6 text-lg text-gray-800 dark:text-gray-100">
                    ✅ کالای انتخاب‌شده: <strong>{selectedItem}</strong>
                </p>
            )}
        </div>
    );
}
