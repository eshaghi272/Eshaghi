import { useEffect, useState } from "react";

export default function ApiTableCRUD({
    baseUrl,
    apiPath,
    pageSize = 5,
    columns = [], // [{ key, label }]
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(columns[0]?.key || null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    const [editingRowId, setEditingRowId] = useState(null);
    const [editedRow, setEditedRow] = useState(null);

    const [newRow, setNewRow] = useState({});
    const [showModal, setShowModal] = useState(false);

    // Fetch list
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`);
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error(err);
            setError("خطا در دریافت داده‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [baseUrl, apiPath]);

    // Sort handler
    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    // Filter + sort (client-side)
    const filteredData = data
        .filter((row) =>
            Object.values(row)
                .map((v) => String(v).toLowerCase())
                .join(" ")
                .includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (!sortField) return 0;
            const valA = a[sortField];
            const valB = b[sortField];
            const isString = typeof valA === "string" || typeof valB === "string";
            if (isString) {
                return sortOrder === "asc"
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            }
            return sortOrder === "asc"
                ? Number(valA || 0) - Number(valB || 0)
                : Number(valB || 0) - Number(valA || 0);
        });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredData.slice(startIndex, startIndex + pageSize);

    // Edit
    const startEdit = (row) => {
        setEditingRowId(row.id);
        setEditedRow(row);
    };

    const cancelEdit = () => {
        setEditingRowId(null);
        setEditedRow(null);
    };

    const saveEdit = async () => {
        if (!editedRow?.id) return;
        try {
            await fetch(`${baseUrl}/${apiPath}/${editedRow.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editedRow),
            });
            cancelEdit();
            fetchData();
        } catch (e) {
            console.error(e);
            setError("ذخیره ویرایش انجام نشد");
        }
    };

    // Delete
    const handleDelete = async (id) => {
        if (!id) return;
        try {
            await fetch(`${baseUrl}/${apiPath}/${id}`, { method: "DELETE" });
            fetchData();
        } catch (e) {
            console.error(e);
            setError("حذف ردیف انجام نشد");
        }
    };

    // Add (Modal)
    const handleAddRow = async () => {
        try {
            await fetch(`${baseUrl}/${apiPath}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRow),
            });
            setNewRow({});
            setShowModal(false);
            fetchData();
        } catch (e) {
            console.error(e);
            setError("افزودن ردیف انجام نشد");
        }
    };

    if (loading) return <p>در حال بارگذاری...</p>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">جدول ({apiPath})</h2>

            {error && (
                <div className="mb-3 p-3 rounded border border-red-300 text-red-700 bg-red-50">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <input
                    type="text"
                    placeholder="🔎 جستجو..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full max-w-md border p-2 rounded"
                />
                <button
                    onClick={() => setShowModal(true)}
                    className="ml-4 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                    ➕ افزودن
                </button>
            </div>

            {data.length > 0 ? (
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
                            <th className="border p-2">عملیات</th>
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
                                        {editingRowId === row.id ? (
                                            <input
                                                value={editedRow?.[col.key] ?? ""}
                                                onChange={(e) =>
                                                    setEditedRow((prev) => ({
                                                        ...prev,
                                                        [col.key]: e.target.value,
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        ) : (
                                            String(row?.[col.key] ?? "")
                                        )}
                                    </td>
                                ))}
                                <td className="border p-2 text-center space-x-2">
                                    {editingRowId === row.id ? (
                                        <>
                                            <button
                                                onClick={saveEdit}
                                                className="bg-green-600 text-white px-2 py-1 rounded"
                                            >
                                                ذخیره
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="bg-gray-500 text-white px-2 py-1 rounded"
                                            >
                                                لغو
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => startEdit(row)}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded"
                                        >
                                            ویرایش
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(row.id)}
                                        className="bg-red-600 text-white px-2 py-1 rounded"
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>هیچ داده‌ای یافت نشد.</p>
            )}

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

            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[95%] max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">افزودن ردیف جدید</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-600 hover:text-gray-900"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {columns.map((col) => (
                                <div key={col.key}>
                                    <label className="block text-sm mb-1">{col.label}</label>
                                    <input
                                        value={newRow?.[col.key] ?? ""}
                                        onChange={(e) =>
                                            setNewRow((prev) => ({ ...prev, [col.key]: e.target.value }))
                                        }
                                        className="border p-2 rounded w-full"
                                        placeholder={col.label}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-3 py-2 border rounded">
                                لغو
                            </button>
                            <button
                                onClick={handleAddRow}
                                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                            >
                                افزودن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
