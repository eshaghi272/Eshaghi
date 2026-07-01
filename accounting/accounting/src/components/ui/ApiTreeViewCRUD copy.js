import { useEffect, useState } from "react";

function buildTree(data) {
    const map = {};
    const roots = [];
    data.forEach((item) => {
        map[item.AccountCode] = { ...item, children: [] };
    });
    data.forEach((item) => {
        if (item.TopCode && map[item.TopCode]) {
            map[item.TopCode].children.push(map[item.AccountCode]);
        } else {
            roots.push(map[item.AccountCode]);
        }
    });
    return roots;
}

export default function ApiTreeViewCRUD({
    baseUrl,
    apiPath,
    headers = { "Content-Type": "application/json" },
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
            setTreeData(buildTree(json));
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
        const text = `${node.TitleFa} ${node.TitleEn} ${node.AccountCode}`.toLowerCase();
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
        await fetch(`${baseUrl}/${apiPath}/${editedNode.AccountCode}`, {
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
        const isOpen = expanded[node.AccountCode];

        return (
            <div key={node.AccountCode} style={{ marginLeft: level * 20 }}>
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpand(node.AccountCode)}
                            className="px-1 text-sm border rounded"
                        >
                            {isOpen ? "−" : "+"}
                        </button>
                    )}
                    <span
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer ${search && node.TitleFa.toLowerCase().includes(search.toLowerCase())
                                ? "bg-yellow-200"
                                : ""
                            }`}
                    >
                        {node.TitleFa} ({node.AccountCode})
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
                        onClick={() => handleDelete(node.AccountCode)}
                        className="text-xs bg-red-600 text-white px-2 rounded"
                    >
                        حذف
                    </button>
                    <button
                        onClick={() => {
                            setNewNode({ TopCode: node.AccountCode });
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
                    انتخاب فعلی: <strong>{selectedNode.TitleFa}</strong> ({selectedNode.AccountCode})
                </div>
            )}

            {/* جستجو */}
            <input
                type="text"
                placeholder="🔎 جستجو حساب..."
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
                        <input
                            placeholder="کد حساب"
                            value={newNode.AccountCode || ""}
                            onChange={(e) => setNewNode({ ...newNode, AccountCode: e.target.value })}
                            className="border p-2 rounded mb-2 w-full"
                        />
                        <input
                            placeholder="عنوان فارسی"
                            value={newNode.TitleFa || ""}
                            onChange={(e) => setNewNode({ ...newNode, TitleFa: e.target.value })}
                            className="border p-2 rounded mb-2 w-full"
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 text-white px-3 py-2 rounded"
                        >
                            ذخیره
                        </button>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="ml-2 px-3 py-2 border rounded"
                        >
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
                        <input
                            placeholder="عنوان فارسی"
                            value={editedNode.TitleFa || ""}
                            onChange={(e) => setEditedNode({ ...editedNode, TitleFa: e.target.value })}
                            className="border p-2 rounded mb-2 w-full"
                        />
                        <button
                            onClick={handleEdit}
                            className="bg-green-600 text-white px-3 py-2 rounded"
                        >
                            ذخیره
                        </button>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="ml-2 px-3 py-2 border rounded"
                        >
                            لغو
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
