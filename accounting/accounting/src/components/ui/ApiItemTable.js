import { useEffect, useState } from "react";

export default function ApiItemTable({
    baseUrl = "http://localhost:5000/api",
    apiPath = "items",
    pageSize = 5,
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("itemName");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

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

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
    };

    const filteredItems = items
        .filter((item) =>
            item.itemName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (typeof valA === "string") {
                return sortOrder === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }
            return sortOrder === "asc" ? valA - valB : valB - valA;
        });

    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">لیست کالاها</h2>

            {/* جستجو */}
            <input
                type="text"
                placeholder="🔎 جستجو کالا..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="mb-4 w-full border p-2 rounded"
            />

            {/* جدول کالاها */}
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        <th
                            className="border p-2 cursor-pointer"
                            onClick={() => handleSort("itemName")}
                        >
                            نام کالا {sortField === "itemName" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th
                            className="border p-2 cursor-pointer"
                            onClick={() => handleSort("itemCode")}
                        >
                            کد کالا {sortField === "itemCode" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th
                            className="border p-2 cursor-pointer"
                            onClick={() => handleSort("brand")}
                        >
                            برند {sortField === "brand" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th
                            className="border p-2 cursor-pointer"
                            onClick={() => handleSort("basePrice")}
                        >
                            قیمت {sortField === "basePrice" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th className="border p-2">انتخاب</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedItems.map((item) => (
                        <tr
                            key={item.id}
                            className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <td className="border p-2">{item.itemCode}</td>
                            <td className="border p-2">{item.itemName}</td>
                            <td className="border p-2">{item.brand}</td>
                            <td className="border p-2">{item.basePrice.toLocaleString()} تومان</td>
                            <td className="border p-2 text-center">
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                                >
                                    انتخاب
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* صفحه‌بندی */}
            <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    قبلی
                </button>
                <span>
                    صفحه {currentPage} از {totalPages}
                </span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    بعدی
                </button>
            </div>

            {/* نمایش انتخاب‌شده */}
            {selectedItem && (
                <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold">✅ کالای انتخاب‌شده:</h3>
                    <p>کد: {selectedItem.itemCode}</p>
                    <p>نام: {selectedItem.itemName}</p>
                    <p>برند: {selectedItem.brand}</p>
                    <p>قیمت: {selectedItem.basePrice.toLocaleString()} تومان</p>
                </div>
            )}
        </div>
    );
}
