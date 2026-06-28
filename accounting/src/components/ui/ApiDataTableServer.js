import { useEffect, useState } from "react";

export default function ApiDataTableServer({
    baseUrl = "http://localhost:5000/api",
    apiPath,
    pageSize = 10,
    columns = null, // [{key:"itemCode",label:"کد کالا"}, ...]
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 📌 خواندن داده‌ها از سرور با پارامترها
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                size: pageSize,
                sort: sortField || "",
                order: sortOrder,
                search,
            });
            const res = await fetch(`${baseUrl}/${apiPath}?${params.toString()}`);
            const json = await res.json();

            // فرض: API برمی‌گرداند { data: [], totalPages: N }
            setData(json.data || []);
            setTotalPages(json.totalPages || 1);

            if (!sortField && json.data?.length > 0) {
                setSortField(Object.keys(json.data[0])[0]);
            }
        } catch (e) {
            console.error("❌ خطا در دریافت داده‌ها:", e);
            setError("خطا در دریافت داده‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [baseUrl, apiPath, currentPage, sortField, sortOrder, search, pageSize]);

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (data.length === 0) return <p>هیچ داده‌ای یافت نشد.</p>;

    const tableColumns =
        columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">جدول سرور ساید ({apiPath})</h2>

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
                        {tableColumns.map((col) => (
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
                    {data.map((row, idx) => (
                        <tr
                            key={row.id || idx}
                            className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {tableColumns.map((col) => (
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
