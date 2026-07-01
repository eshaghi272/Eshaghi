import { useEffect, useState } from "react";

export default function ApiDataTableEdit({
    baseUrl = "http://localhost:5000/api",
    apiPath,
    pageSize = 5,
    columns = null, // [{key:"itemCode",label:"کد کالا"}, ...]
    selectable = true,
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [editingRow, setEditingRow] = useState(null);
    const [editedRow, setEditedRow] = useState(null);

    // 📌 خواندن داده‌ها
    const fetchData = () => {
        setLoading(true);
        fetch(`${baseUrl}/${apiPath}`)
            .then((res) => res.json())
            .then((resData) => {
                setData(Array.isArray(resData) ? resData : []);
                if (Array.isArray(resData) && resData.length > 0) {
                    setSortField(Object.keys(resData[0])[0]);
                }
            })
            .catch((err) => {
                console.error("❌ خطا در دریافت داده‌ها:", err);
                setError("خطا در دریافت داده‌ها");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [baseUrl, apiPath]);

    // 📌 مرتب‌سازی
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
            if (!sortField) return 0;
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
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (data.length === 0) return <p>هیچ داده‌ای یافت نشد.</p>;

    const tableColumns =
        columns ||
        Object.keys(data[0]).map((key) => ({ key, label: key }));

    // 📌 ذخیره ویرایش
    const handleSaveEdit = async () => {
        await fetch(`${baseUrl}/${apiPath}/${editedRow.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedRow),
        });
        setEditingRow(null);
        setEditedRow(null);
        fetchData();
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">لیست داده‌ها ({apiPath})</h2>

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
                                {sortField === col.key &&
                                    (sortOrder === "asc" ? "⬆️" : "⬇️")}
                            </th>
                        ))}
                        {selectable && <th className="border p-2">عملیات</th>}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => (
                        <tr
                            key={row.id || idx}
                            className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {tableColumns.map((col) => (
                                <td key={col.key} className="border p-2">
                                    {editingRow === row.id ? (
                                        <input
                                            value={editedRow[col.key]}
                                            onChange={(e) =>
                                                setEditedRow({
                                                    ...editedRow,
                                                    [col.key]: e.target.value,
                                                })
                                            }
                                            className="border p-1 rounded w-full"
                                        />
                                    ) : (
                                        String(row[col.key])
                                    )}
                                </td>
                            ))}
                            {selectable && (
                                <td className="border p-2 text-center space-x-2">
                                    {editingRow === row.id ? (
                                        <>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="bg-green-600 text-white px-2 py-1 rounded"
                                            >
                                                ذخیره
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingRow(null);
                                                    setEditedRow(null);
                                                }}
                                                className="bg-gray-500 text-white px-2 py-1 rounded"
                                            >
                                                لغو
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingRow(row.id);
                                                setEditedRow(row);
                                            }}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded"
                                        >
                                            ویرایش
                                        </button>
                                    )}
                                </td>
                            )}
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
        </div>
    );
}
