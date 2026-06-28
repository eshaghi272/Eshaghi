import { useEffect, useMemo, useState } from "react";

export default function ApiTableCRUD3({
    baseUrl,
    apiPath,
    pageSize = 8,
    columns = [], // [{ key, label, type?: "text"|"number"|"textarea"|"select"|"date", options?: [{value,label}], required?: boolean }]
    headers = { "Content-Type": "application/json" }, // اگر توکن داری اینجا اضافه کن
}) {
    // --- State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(columns[0]?.key || null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    // Add modal
    const [newRow, setNewRow] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);

    // Edit modal
    const [editedRow, setEditedRow] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // --- Derived
    const safeColumns = useMemo(
        () =>
            (columns || []).map((c) => ({
                type: "text",
                required: false,
                ...c,
            })),
        [columns]
    );

    // --- Fetch list
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

    // --- Sort
    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    // --- Filter + sort
    const filteredData = useMemo(() => {
        const term = search.trim().toLowerCase();
        const base = term
            ? data.filter((row) =>
                Object.values(row)
                    .map((v) => String(v).toLowerCase())
                    .join(" ")
                    .includes(term)
            )
            : data;

        if (!sortField) return base;
        return [...base].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (typeof valA === "string") {
                return sortOrder === "asc"
                    ? String(valA ?? "").localeCompare(String(valB ?? ""))
                    : String(valB ?? "").localeCompare(String(valA ?? ""));
            }
            return sortOrder === "asc"
                ? Number(valA ?? 0) - Number(valB ?? 0)
                : Number(valB ?? 0) - Number(valA ?? 0);
        });
    }, [data, search, sortField, sortOrder]);

    // --- Pagination
    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredData.slice(startIndex, startIndex + pageSize);

    // --- Validation helpers
    const validatePayload = (payload) => {
        for (const col of safeColumns) {
            const val = payload[col.key];
            if (col.required && (val === undefined || val === "")) {
                return `فیلد "${col.label}" الزامی است`;
            }
            if (col.type === "number" && val !== undefined && val !== "") {
                const num = Number(val);
                if (Number.isNaN(num)) return `فیلد "${col.label}" باید عدد باشد`;
            }
        }
        return null;
    };

    const coerceTypes = (payload) => {
        const out = { ...payload };
        safeColumns.forEach((c) => {
            if (c.type === "number" && out[c.key] !== undefined && out[c.key] !== "") {
                out[c.key] = Number(out[c.key]);
            }
        });
        return out;
    };

    // --- CRUD: Add
    const handleAddRow = async () => {
        const msg = validatePayload(newRow);
        if (msg) {
            setError(msg);
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`, {
                method: "POST",
                headers,
                body: JSON.stringify(coerceTypes(newRow)),
            });
            if (!res.ok) throw new Error("POST failed");
            setNewRow({});
            setShowAddModal(false);
            fetchData();
        } catch (e) {
            console.error(e);
            setError("افزودن ردیف انجام نشد");
        }
    };

    // --- CRUD: Edit
    const openEditModal = (row) => {
        setEditedRow(row);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        const msg = validatePayload(editedRow || {});
        if (msg) {
            setError(msg);
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/${apiPath}/${editedRow.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(coerceTypes(editedRow)),
            });
            if (!res.ok) throw new Error("PUT failed");
            setEditedRow(null);
            setShowEditModal(false);
            fetchData();
        } catch (e) {
            console.error(e);
            setError("ذخیره ویرایش انجام نشد");
        }
    };

    // --- CRUD: Delete
    const handleDelete = async (id) => {
        if (!id) return;
        try {
            const res = await fetch(`${baseUrl}/${apiPath}/${id}`, { method: "DELETE", headers });
            if (!res.ok) throw new Error("DELETE failed");
            fetchData();
        } catch (e) {
            console.error(e);
            setError("حذف ردیف انجام نشد");
        }
    };

    // --- Input renderer
    const renderInput = (value, col, onChange) => {
        const common = "border p-2 rounded w-full";
        switch (col.type) {
            case "number":
                return (
                    <input
                        type="number"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
            case "textarea":
                return (
                    <textarea
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${common} min-h-[80px]`}
                    />
                );
            case "select":
                return (
                    <select
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    >
                        <option value="">انتخاب کنید</option>
                        {(col.options || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            case "date":
                return (
                    <input
                        type="date"
                        value={value ? String(value).slice(0, 10) : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
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

            {/* جستجو + افزودن */}
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
                    onClick={() => setShowAddModal(true)}
                    className="ml-4 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                    ➕ افزودن
                </button>
            </div>

            {/* جدول */}
            {data.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            {safeColumns.map((col) => (
                                <th
                                    key={col.key}
                                    className="border p-2 cursor-pointer"
                                    onClick={() => handleSort(col.key)}
                                    title={`مرتب‌سازی با ${col.label}`}
                                >
                                    {col.label}{" "}
                                    {sortField === col.key && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                                </th>
                            ))}
                            <th className="border p-2">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, idx) => (
                            <tr
                                key={row.id ?? `${idx}-${safeColumns[0]?.key}`}
                                className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                {safeColumns.map((col) => (
                                    <td key={col.key} className="border p-2 align-top">
                                        {String(row?.[col.key] ?? "")}
                                    </td>
                                ))}
                                <td className="border p-2 text-center space-x-2">
                                    <button
                                        onClick={() => openEditModal(row)}
                                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                                    >
                                        ویرایش
                                    </button>
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

            {/* مودال افزودن */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[95%] max-w-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">افزودن ردیف جدید</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-600 hover:text-gray-900"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {safeColumns.map((col) => (
                                <div key={col.key}>
                                    <label className="block text-sm mb-1">
                                        {col.label}
                                        {col.required ? " *" : ""}
                                    </label>
                                    {renderInput(newRow?.[col.key] ?? "", col, (val) =>
                                        setNewRow((prev) => ({ ...prev, [col.key]: val }))
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowAddModal(false)} className="px-3 py-2 border rounded">
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

            {/* مودال ویرایش */}
            {showEditModal && editedRow && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => {
                        setShowEditModal(false);
                        setEditedRow(null);
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[95%] max-w-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">ویرایش ردیف</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditedRow(null);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {safeColumns.map((col) => (
                                <div key={col.key}>
                                    <label className="block text-sm mb-1">
                                        {col.label}
                                        {col.required ? " *" : ""}
                                    </label>
                                    {renderInput(editedRow?.[col.key] ?? "", col, (val) =>
                                        setEditedRow((prev) => ({ ...prev, [col.key]: val }))
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditedRow(null);
                                }}
                                className="px-3 py-2 border rounded"
                            >
                                لغو
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                            >
                                ذخیره
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
