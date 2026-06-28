import { useEffect, useState } from "react";

export default function ApiItemTable({
    baseUrl = "http://localhost:5000/api",
    apiPath = "items",
    pageSize = 5,
    columns = [
        { key: "itemCode", label: "کد کالا" },
        { key: "itemName", label: "نام کالا" },
        { key: "brand", label: "برند" },
        { key: "basePrice", label: "قیمت" },
    ],
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("itemName");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetch(`${baseUrl}/${apiPath}`)
            .then((res) => res.json())
            .then((json) => {
                // چون خروجی مستقیم آرایه است
                setData(Array.isArray(json) ? json : []);
            })
            .catch((err) => {
                console.error("❌ خطا در دریافت داده‌ها:", err);
                setError("خطا در دریافت داده‌ها");
            })
            .finally(() => setLoading(false));
    }, [baseUrl, apiPath]);

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
    };

    const filteredData = data
        .filter((row) =>
            Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
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

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredData.slice(startIndex, startIndex + pageSize);

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (data.length === 0) return <p>هیچ داده‌ای یافت نشد.</p>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">لیست کالاها</h2>

            {/* جستجو */}
            <input
                type="text"
                placeholder="🔎 جستجو..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="mb-4 w-full border p-2 rounded"
            />

            {/* جدول */}
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="border p-2 cursor-pointer"
                                onClick={() => handleSort(col.key)}
                            >
                                {col.label}{" "}
                                {sortField === col.key && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {pageRows.map((row) => (
                        <tr
                            key={row.id}
                            className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="border p-2">
                                    {String(row[col.key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* صفحه‌بندی */}
            <div className="flex justify-center items-center mt-4 gap-3">
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
        </div>
    );
}
