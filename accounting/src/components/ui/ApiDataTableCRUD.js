import { useEffect, useMemo, useState } from "react";

/**
 * ApiDataTableCRUD
 * - عمومی و ماژولار برای هر API
 * - ستون‌ها قابل تنظیم با label و type و editable
 * - CRUD کامل: Read, Create, Update, Delete
 * - جستجو، مرتب‌سازی، صفحه‌بندی، زیبرا استرایپ
 * - رویدادهای خروجی onRowAdd/onRowUpdate/onRowDelete/onRowSelect
 */
export default function ApiDataTableCRUD({
    baseUrl = "http://localhost:5000/api",
    apiPath,
    pageSize = 10,
    columns = null, // [{ key, label, type, editable, required }]
    zebra = true,
    selectable = true,
    showActions = true,
    headers = { "Content-Type": "application/json" },
    initialNewRow = {}, // مقدار‌های اولیه فرم افزودن
    onRowAdd, // (createdRow) => void
    onRowUpdate, // (updatedRow) => void
    onRowDelete, // (deletedId) => void
    onRowSelect, // (row) => void
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    const [editingRowId, setEditingRowId] = useState(null);
    const [editedRow, setEditedRow] = useState(null);

    const [newRow, setNewRow] = useState(initialNewRow);

    // --- Utilities
    const apiUrl = `${baseUrl}/${apiPath}`;

    const safeColumns = useMemo(() => {
        if (columns && Array.isArray(columns) && columns.length > 0) return columns;
        if (data.length > 0) {
            return Object.keys(data[0]).map((key) => ({
                key,
                label: key,
                type: "text",
                editable: true,
                required: false,
            }));
        }
        return [];
    }, [columns, data]);

    // Default sort field
    useEffect(() => {
        if (!sortField && safeColumns.length > 0) setSortField(safeColumns[0].key);
    }, [safeColumns, sortField]);

    // --- Fetch
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl);
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error("Fetch error:", e);
            setError("خطا در دریافت داده‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiUrl]);

    // --- Sort
    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    // --- Filter + Sort
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
            const isStringA = typeof valA === "string";
            if (isStringA) {
                return sortOrder === "asc"
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            }
            return sortOrder === "asc"
                ? Number(valA || 0) - Number(valB || 0)
                : Number(valB || 0) - Number(valA || 0);
        });
    }, [data, search, sortField, sortOrder]);

    // --- Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredData.slice(startIndex, startIndex + pageSize);

    // --- CRUD
    const handleStartEdit = (row) => {
        setEditingRowId(row.id);
        setEditedRow(row);
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditedRow(null);
    };

    const handleSaveEdit = async () => {
        if (!editedRow?.id) return;
        try {
            const res = await fetch(`${apiUrl}/${editedRow.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(editedRow),
            });
            if (!res.ok) throw new Error("PUT failed");
            const updated = await res.json().catch(() => editedRow);
            setEditingRowId(null);
            setEditedRow(null);
            await fetchData();
            onRowUpdate?.(updated);
        } catch (e) {
            console.error(e);
            setError("ذخیره‌سازی ویرایش با خطا مواجه شد");
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        try {
            const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE", headers });
            if (!res.ok) throw new Error("DELETE failed");
            await fetchData();
            onRowDelete?.(id);
        } catch (e) {
            console.error(e);
            setError("حذف رکورد با خطا مواجه شد");
        }
    };

    const validateNewRow = () => {
        for (const col of safeColumns) {
            if (col.required && (newRow[col.key] === undefined || newRow[col.key] === "")) {
                return `فیلد "${col.label}" الزامی است`;
            }
        }
        return null;
    };

    const handleAddRow = async () => {
        const validation = validateNewRow();
        if (validation) {
            setError(validation);
            return;
        }
        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers,
                body: JSON.stringify(newRow),
            });
            if (!res.ok) throw new Error("POST failed");
            const created = await res.json().catch(() => newRow);
            setNewRow(initialNewRow);
            await fetchData();
            onRowAdd?.(created);
        } catch (e) {
            console.error(e);
            setError("افزودن رکورد با خطا مواجه شد");
        }
    };

    // --- Input renderer by type
    const renderInput = (value, col, onChange) => {
        const common = "border p-1 rounded w-full";
        switch (col.type) {
            case "number":
                return (
                    <input
                        type="number"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        className={common}
                    />
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
            case "select":
                return (
                    <select
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    >
                        {(col.options || []).map((opt) => (
                            <option key={opt.value ?? opt} value={opt.value ?? opt}>
                                {opt.label ?? opt}
                            </option>
                        ))}
                    </select>
                );
            case "textarea":
                return (
                    <textarea
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${common} min-h-[80px]`}
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

    // --- Render
    if (loading) return <p>در حال بارگذاری...</p>;
    if (error) {
        // پیام خطا نشان داده شود اما جدول را هم نشان دهیم تا قابل ادامه باشد
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">جدول عمومی ({apiPath})</h2>

            {error && (
                <div className="mb-3 p-3 rounded border border-red-300 text-red-700 bg-red-50">
                    {error}
                </div>
            )}

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
                            {showActions && <th className="border p-2">عملیات</th>}
                            {selectable && <th className="border p-2">انتخاب</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, idx) => (
                            <tr
                                key={row.id ?? `${idx}-${row[safeColumns[0]?.key]}`}
                                className={
                                    (zebra
                                        ? "odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-700 "
                                        : "") + "hover:bg-gray-100 dark:hover:bg-gray-600"
                                }
                            >
                                {safeColumns.map((col) => (
                                    <td key={col.key} className="border p-2 align-top">
                                        {editingRowId === row.id && col.editable !== false
                                            ? renderInput(editedRow[col.key], col, (val) =>
                                                setEditedRow((prev) => ({ ...prev, [col.key]: val }))
                                            )
                                            : String(row[col.key] ?? "")}
                                    </td>
                                ))}

                                {showActions && (
                                    <td className="border p-2 text-center space-x-2">
                                        {editingRowId === row.id ? (
                                            <>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="bg-green-600 text-white px-2 py-1 rounded"
                                                >
                                                    ذخیره
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="bg-gray-500 text-white px-2 py-1 rounded"
                                                >
                                                    لغو
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleStartEdit(row)}
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
                                )}

                                {selectable && (
                                    <td className="border p-2 text-center">
                                        <button
                                            onClick={() => onRowSelect?.(row)}
                                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                        >
                                            انتخاب
                                        </button>
                                    </td>
                                )}
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

            {/* افزودن ردیف جدید */}
            {showActions && (
                <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold mb-2">➕ افزودن ردیف جدید</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {safeColumns.map((col) => (
                            <div key={col.key}>
                                <label className="block text-sm mb-1">{col.label}</label>
                                {renderInput(newRow[col.key] ?? "", col, (val) =>
                                    setNewRow((prev) => ({ ...prev, [col.key]: val }))
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-3">
                        <button
                            onClick={handleAddRow}
                            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                        >
                            افزودن
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
