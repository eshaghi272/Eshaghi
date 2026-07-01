import { useEffect, useMemo, useState } from "react";

export default function ApiTableCRUDServer({
    baseUrl,
    apiPath,
    pageSize = 10,
    columns = [], // [{ key, label, type?: "text"|"number"|"textarea"|"select"|"date", options?: [{value,label}], required?: boolean }]
    headers = { "Content-Type": "application/json" }, // اگر احراز هویت داری، Authorization اضافه کن
}) {
    // --- State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(columns[0]?.key || null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Add modal
    const [newRow, setNewRow] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);

    // Edit modal
    const [editedRow, setEditedRow] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // --- Derived columns with defaults
    const safeColumns = useMemo(
        () =>
            (columns || []).map((c) => ({
                type: "text",
                required: false,
                ...c,
            })),
        [columns]
    );

    // --- Fetch list (server-side pagination/sorting/search)
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                size: String(pageSize),
                sort: sortField || "",
                order: sortOrder,
                search,
            });
            const res = await fetch(`${baseUrl}/${apiPath}?${params.toString()}`, {
                headers,
            });
            const json = await res.json();
            // انتظار: { data: [], totalPages: N }
            setData(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
            setTotalPages(Number(json.totalPages) || 1);
        } catch (err) {
            console.error(err);
            setError("خطا در دریافت داده‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, apiPath, currentPage, sortField, sortOrder, search, pageSize]);

    // --- Sort
    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    // --- Validation & coercion
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
            // پس از افزودن، صفحه را به 1 برگردان تا رکورد دیده شود (اختیاری)
            setCurrentPage(1);
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
            const res = await fetch(`${baseUrl}/${apiPath}/${id}`, {
                method: "DELETE",
                headers,
            });
            if (!res.ok) throw new Error("DELETE failed");
            // اگر صفحه خالی شد، به صفحه قبل برو
            if (data.length === 1 && currentPage > 1) {
                setCurrentPage((p) => p - 1);
            } else {
                fetchData();
            }
        } catch (e) {
            console.error(e);
            setError("حذف ردیف انجام نشد");
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
                        {data.map((row, idx) => (
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

                        <FormGrid
                            columns={safeColumns}
                            values={newRow}
                            onChange={(key, val) => setNewRow((prev) => ({ ...prev, [key]: val }))}
                        />

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

                        <FormGrid
                            columns={safeColumns}
                            values={editedRow}
                            onChange={(key, val) => setEditedRow((prev) => ({ ...prev, [key]: val }))}
                        />

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

    // --- Inner form grid component (uses renderInput)
    function FormGrid({ columns, values, onChange }) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {columns.map((col) => (
                    <div key={col.key}>
                        <label className="block text-sm mb-1">
                            {col.label}
                            {col.required ? " *" : ""}
                        </label>
                        {renderInput(values?.[col.key] ?? "", col, (val) => onChange(col.key, val))}
                    </div>
                ))}
            </div>
        );
    }

    // --- Input renderer (private)
    function renderInput(value, col, onChange) {
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
    }
}
