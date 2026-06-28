import { useEffect, useState } from "react";

// ساخت درخت از داده‌های flat
function buildTree(data, idKey, parentKey) {
    const map = {};
    const roots = [];
    data.forEach((item) => {
        map[item[idKey]] = { ...item, children: [] };
    });
    data.forEach((item) => {
        const parentId = item[parentKey];
        if (parentId && map[parentId]) {
            map[parentId].children.push(map[item[idKey]]);
        } else {
            roots.push(map[item[idKey]]);
        }
    });
    return roots;
}

export default function ApiTreeViewCRUD({
    baseUrl,
    apiPath,
    headers = { "Content-Type": "application/json" },

    // کلیدها از صفحه تست ست می‌شوند
    idKey = "AccountCode",
    parentKey = "TopCode",
    labelKey = "TitleFa",

    // فیلدهای فرم با type/options از صفحه تست
    fields = [],
    // اگر true باشد، حذف نودهای دارای فرزند غیرفعال می‌شود
    disableDeleteIfHasChildren = true,
}) {
    const [treeData, setTreeData] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [search, setSearch] = useState("");
    const [selectedNode, setSelectedNode] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newNode, setNewNode] = useState({});
    const [editedNode, setEditedNode] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // دریافت داده‌ها
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`, { headers });
            const json = await res.json();
            const arr = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
            setTreeData(buildTree(arr, idKey, parentKey));
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
    }, [baseUrl, apiPath]);

    // جستجو
    const matchesSearch = (node) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        const flat = Object.entries(node)
            .filter(([k]) => k !== "children")
            .map(([, v]) => String(v))
            .join(" ")
            .toLowerCase();
        if (flat.includes(term)) return true;
        return (node.children || []).some(matchesSearch);
    };

    // باز/بسته کردن
    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // اعتبارسنجی ساده
    const validatePayload = (payload) => {
        for (const f of fields) {
            if (f.required && (payload[f.key] === undefined || payload[f.key] === "")) {
                return `فیلد "${f.label}" الزامی است`;
            }
            if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== "") {
                const num = Number(payload[f.key]);
                if (Number.isNaN(num)) return `فیلد "${f.label}" باید عدد باشد`;
            }
        }
        return null;
    };

    // تبدیل نوع‌ها قبل از ارسال
    const coerceTypes = (payload) => {
        const out = { ...payload };
        fields.forEach((f) => {
            if (f.type === "number" && out[f.key] !== undefined && out[f.key] !== "") {
                out[f.key] = Number(out[f.key]);
            }
        });
        return out;
    };

    // افزودن
    const handleAdd = async () => {
        const msg = validatePayload(newNode);
        if (msg) {
            setError(msg);
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`, {
                method: "POST",
                headers,
                body: JSON.stringify(coerceTypes(newNode)),
            });
            if (!res.ok) throw new Error("POST failed");
            setShowAddModal(false);
            setNewNode({});
            fetchData();
        } catch (e) {
            console.error(e);
            setError("افزودن انجام نشد");
        }
    };

    // ویرایش
    const handleEdit = async () => {
        const msg = validatePayload(editedNode || {});
        if (msg) {
            setError(msg);
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/${apiPath}/${editedNode[idKey]}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(coerceTypes(editedNode)),
            });
            if (!res.ok) throw new Error("PUT failed");
            setShowEditModal(false);
            setEditedNode(null);
            fetchData();
        } catch (e) {
            console.error(e);
            setError("ویرایش انجام نشد");
        }
    };

    // حذف
    const handleDelete = async (node) => {
        try {
            const hasChildren = (node.children || []).length > 0;
            if (disableDeleteIfHasChildren && hasChildren) {
                setError("حذف نود دارای فرزند مجاز نیست");
                return;
            }
            const res = await fetch(`${baseUrl}/${apiPath}/${node[idKey]}`, { method: "DELETE", headers });
            if (!res.ok) throw new Error("DELETE failed");
            fetchData();
        } catch (e) {
            console.error(e);
            setError("حذف انجام نشد");
        }
    };

    // ورودی هوشمند
    const renderInput = (value, field, onChange) => {
        const common = "border p-2 rounded mb-2 w-full";
        switch (field.type) {
            case "number":
                return (
                    <input
                        type="number"
                        placeholder={field.label}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
            case "textarea":
                return (
                    <textarea
                        placeholder={field.label}
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
                        {(field.options || []).map((opt) => (
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
                        placeholder={field.label}
                        value={value ? String(value).slice(0, 10) : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        placeholder={field.label}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={common}
                    />
                );
        }
    };

    // رندر نود
    const renderNode = (node, level = 0) => {
        if (!matchesSearch(node)) return null;
        const hasChildren = (node.children || []).length > 0;
        const isOpen = expanded[node[idKey]];

        return (
            <div key={node[idKey]} style={{ marginLeft: level * 20 }}>
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpand(node[idKey])}
                            className="px-1 text-sm border rounded"
                            title={isOpen ? "بستن" : "باز کردن"}
                        >
                            {isOpen ? "−" : "+"}
                        </button>
                    )}
                    <span
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer ${search &&
                                String(node[labelKey] ?? "")
                                    .toLowerCase()
                                    .includes(search.toLowerCase())
                                ? "bg-yellow-200"
                                : ""
                            }`}
                        title="انتخاب نود"
                    >
                        {String(node[labelKey] ?? "")} ({node[idKey]})
                    </span>

                    <button
                        onClick={() => {
                            setEditedNode(node);
                            setShowEditModal(true);
                        }}
                        className="text-xs bg-yellow-500 text-white px-2 rounded"
                        title="ویرایش"
                    >
                        ویرایش
                    </button>
                    <button
                        onClick={() => handleDelete(node)}
                        className="text-xs bg-red-600 text-white px-2 rounded disabled:opacity-50"
                        title={hasChildren && disableDeleteIfHasChildren ? "دارای فرزند است" : "حذف"}
                        disabled={disableDeleteIfHasChildren && hasChildren}
                    >
                        حذف
                    </button>
                    <button
                        onClick={() => {
                            setNewNode({ [parentKey]: node[idKey] });
                            setShowAddModal(true);
                        }}
                        className="text-xs bg-green-600 text-white px-2 rounded"
                        title="افزودن زیرشاخه"
                    >
                        افزودن زیرشاخه
                    </button>
                </div>

                {hasChildren && isOpen && (
                    <div className="ml-4">
                        {node.children.map((child) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <p>در حال بارگذاری...</p>;

    return (
        <div>
            {error && (
                <div className="mb-3 p-2 rounded border border-red-300 text-red-700 bg-red-50">
                    {error}
                </div>
            )}

            {selectedNode && (
                <div className="mb-4 p-2 border rounded bg-gray-100">
                    انتخاب فعلی: <strong>{String(selectedNode[labelKey] ?? "")}</strong> ({selectedNode[idKey]})
                </div>
            )}

            <input
                type="text"
                placeholder="🔎 جستجو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 w-full border p-2 rounded"
            />

            {treeData.length > 0 ? (
                treeData.map((node) => renderNode(node))
            ) : (
                <p>هیچ داده‌ای یافت نشد.</p>
            )}

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
                            <h3 className="font-bold">افزودن حساب جدید</h3>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => setShowAddModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {fields.map((f) => (
                            <div key={f.key} className="mb-2">
                                <label className="block text-sm mb-1">
                                    {f.label}{f.required ? " *" : ""}
                                </label>
                                {renderInput(newNode[f.key] ?? "", f, (val) =>
                                    setNewNode((prev) => ({ ...prev, [f.key]: val }))
                                )}
                            </div>
                        ))}

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowAddModal(false)} className="px-3 py-2 border rounded">
                                لغو
                            </button>
                            <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                                ذخیره
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال ویرایش */}
            {showEditModal && editedNode && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => { setShowEditModal(false); setEditedNode(null); }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[95%] max-w-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">ویرایش حساب</h3>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => { setShowEditModal(false); setEditedNode(null); }}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {fields.map((f) => (
                            <div key={f.key} className="mb-2">
                                <label className="block text-sm mb-1">
                                    {f.label}{f.required ? " *" : ""}
                                </label>
                                {renderInput(editedNode[f.key] ?? "", f, (val) =>
                                    setEditedNode((prev) => ({ ...prev, [f.key]: val }))
                                )}
                            </div>
                        ))}

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => { setShowEditModal(false); setEditedNode(null); }}
                                className="px-3 py-2 border rounded"
                            >
                                لغو
                            </button>
                            <button
                                onClick={handleEdit}
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
