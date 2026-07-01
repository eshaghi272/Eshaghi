import { useEffect, useState } from "react";

// تبدیل داده‌های flat به درخت
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

export default function ApiTreeView({
    baseUrl,
    apiPath,
    headers = { "Content-Type": "application/json" },
}) {
    const [treeData, setTreeData] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [search, setSearch] = useState("");
    const [selectedNode, setSelectedNode] = useState(null); // 👈 انتخاب فعلی
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 📌 دریافت داده‌ها از API
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${baseUrl}/${apiPath}`, { headers });
            const json = await res.json();
            const tree = buildTree(json);
            setTreeData(tree);
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

    // 📌 باز/بسته کردن شاخه
    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // 📌 بررسی اینکه نود یا فرزندش مطابق جستجو هست
    const matchesSearch = (node) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        const text = `${node.TitleFa} ${node.TitleEn} ${node.AccountCode}`.toLowerCase();
        if (text.includes(term)) return true;
        return node.children?.some(matchesSearch);
    };

    // 📌 رندر درخت بازگشتی
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
                        onClick={() => setSelectedNode(node)} // 👈 انتخاب نود
                        className={`cursor-pointer ${search && node.TitleFa.toLowerCase().includes(search.toLowerCase())
                                ? "bg-yellow-200"
                                : ""
                            } ${selectedNode?.AccountCode === node.AccountCode ? "font-bold text-blue-600" : ""}`}
                    >
                        {node.TitleFa} ({node.AccountCode})
                    </span>
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
    if (error) return <p className="text-red-600">{error}</p>;
    if (treeData.length === 0) return <p>هیچ داده‌ای یافت نشد.</p>;

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
        </div>
    );
}
