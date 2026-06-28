import { useEffect, useState } from "react";

function buildTree(data, idKey, parentKey) {
    const map = {};
    const roots = [];
    data.forEach((item) => {
        map[item[idKey]] = { ...item, children: [] };
    });
    data.forEach((item) => {
        if (item[parentKey] && map[item[parentKey]]) {
            map[item[parentKey]].children.push(map[item[idKey]]);
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
    idKey = "AccountCode",       // کلید یکتا
    parentKey = "TopCode",       // کلید والد
    labelKey = "TitleFa",        // کلید نمایش
    fields = [                   // فیلدهای فرم عمومی
        { key: "AccountCode", label: "کد حساب", type: "number", required: true },
        { key: "TitleFa", label: "عنوان فارسی", type: "text", required: true },
        { key: "TitleEn", label: "عنوان انگلیسی", type: "text" },
        { key: "Nature", label: "ماهیت", type: "text" },
        { key: "Type", label: "نوع", type: "text" },
    ],
}) {
    const [treeData, setTreeData] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [search, setSearch] = useState("");
    const [selectedNode, setSelectedNode] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newNode, setNewNode] = useState({});
    const [editedNode, setEditedNode] = useState(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`, { headers });
            const json = await res.json();
            setTreeData(buildTree(json, idKey, parentKey));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [baseUrl, apiPath]);

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const matchesSearch = (node) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        const text = Object.values(node).join(" ").toLowerCase();
        if (text.includes(term)) return true;
        return node.children?.some(matchesSearch);
    };

    // --- CRUD
    const handleAdd = async () => {
        await fetch(`${baseUrl}/${apiPath}`, {
            method: "POST",
            headers,
            body: JSON.stringify(newNode),
        });
        setNewNode({});
        setShowAddModal(false);
        fetchData();
    };

    const handleEdit = async () => {
        await fetch(`${baseUrl}/${apiPath}/${editedNode[idKey]}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(editedNode),
        });
        setEditedNode(null);
        setShowEditModal(false);
        fetchData();
    };

    const handleDelete = async (id) => {
        await fetch(`${baseUrl}/${apiPath}/${id}`, { method: "DELETE", headers });
        fetchData();
    };

    const renderNode = (node, level = 0) => {
        if (!matchesSearch(node)) return null;
        const hasChildren = node.children && node.children.length > 0;
        const isOpen = expanded[node[idKey]];

        return (
            <div key={node[idKey]} style={{ marginLeft: level * 20 }}>
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpand(node[idKey])}
                            className="px-1 text-sm border rounded"
                        >
                            {isOpen ? "−" : "+"}
                        </button>
                    )}
                    <span
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer ${search && String(node[labelKey]).toLowerCase().includes(search.toLowerCase())
                                ? "bg-yellow-200"
                                : ""
                            }`}
                    >
                        {node[labelKey]} ({node[idKey]})
                    </span>
                    {/* عملیات CRUD */}
                    <button
                        onClick={() => {
                            setEditedNode(node);
                            setShowEditModal(true);
                        }}
                        className="text-xs bg-yellow-500 text-white px-2 rounded"
                    >
                        ویرایش
                    </button>
                    <button
                        onClick={() => handleDelete(node[idKey])}
                        className="text-xs bg-red-600 text-white px-2 rounded"
                    >
                        حذف
                    </button>
                    <button
                        onClick={() => {
                            setNewNode({ [parentKey]: node[idKey] });
                            setShowAddModal(true);
                        }}
                        className="text-xs bg-green-600 text-white px-2 rounded"
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

    return (
        <div>
            {/* لیبل انتخاب */}
            {selectedNode && (
                <div className="mb-4 p-2 border rounded bg-gray-100">
                    انتخاب فعلی: <strong>{selectedNode[labelKey]}</strong> ({selectedNode[idKey]})
                </div>
            )}

            {/* جستجو */}
            <input
                type="text"
                placeholder="🔎 جستجو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 w-full border p-2 rounded"
            />

            {treeData.map((node) => renderNode(node))}

            {/* مودال افزودن */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg w-[400px]">
                        <h3 className="font-bold mb-4">افزودن حساب جدید</h3>
                        {fields.map((f) => (
                            <input
                                key={f.key}
                                placeholder={f.label}
                                type={f.type || "text"}
                                value={newNode[f.key] || ""}
                                onChange={(e) => setNewNode({ ...newNode, [f.key]: e.target.value })}
                                className="border p-2 rounded mb-2 w-full"
                            />
                        ))}
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-2 rounded">
                            ذخیره
                        </button>
                        <button onClick={() => setShowAddModal(false)} className="ml-2 px-3 py-2 border rounded">
                            لغو
                        </button>
                    </div>
                </div>
            )}

            {/* مودال ویرایش */}
            {showEditModal && editedNode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg w-[400px]">
                        <h3 className="font-bold mb-4">ویرایش حساب</h3>
                        {fields.map((f) => (
                            <input
                                key={f.key}
                                placeholder={f.label}
                                type={f.type || "text"}
                                value={editedNode[f.key] || ""}
                                onChange={(e) => setEditedNode({ ...editedNode, [f.key]: e.target.value })}
                                className="border p-2 rounded mb-2 w-full"
                            />
                        ))}
                        <button onClick={handleEdit} className="bg-green-600 text-white px-3 py-2 rounded">
                            ذخیره
                        </button>
                        <button onClick={() => setShowEditModal(false)} className="ml-2 px-3 py-2 border rounded">
                            لغو
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
