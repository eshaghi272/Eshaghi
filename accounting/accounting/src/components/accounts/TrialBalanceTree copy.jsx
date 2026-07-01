import { useEffect, useState } from "react";

function AccountRow({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const indent = { paddingRight: `${level * 2}rem` };

  const format = (val) =>
    Number(val || 0).toLocaleString("fa-IR", { maximumFractionDigits: 0 });

  return (
    <>
      <tr
        className={level === 0 ? "bg-blue-50 dark:bg-blue-900 font-bold" : ""}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: node.children.length > 0 ? "pointer" : "default" }}
      >
        <td style={indent}>{node.TitleFa}</td>
        <td>{node.AccountCode}</td>
        <td className="text-right">{format(node.TotalDebit)}</td>
        <td className="text-right">{format(node.TotalCredit)}</td>
        <td className="text-right">{format(node.Balance)}</td>
      </tr>

      {expanded &&
        node.children.map((child) => (
          <AccountRow key={child.AccountCode} node={child} level={level + 1} />
        ))}
    </>
  );
}

export default function TrialBalanceTreeTable() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/trialbalance/tree");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("فرمت داده نامعتبر است");
        setTree(data);
      } catch (err) {
        console.error("❌", err.message);
        setError("خطا در دریافت گزارش");
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-green-700 dark:text-green-100 mb-4">
        📊 تراز آزمایشی چندسطحی
      </h2>

      {loading ? (
        <div>در حال بارگذاری...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full text-sm text-right border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-100">
            <tr>
              <th className="px-4 py-2">عنوان حساب</th>
              <th className="px-4 py-2">کد حساب</th>
              <th className="px-4 py-2">بدهکار</th>
              <th className="px-4 py-2">بستانکار</th>
              <th className="px-4 py-2">مانده</th>
            </tr>
          </thead>
          <tbody>
            {tree.map((node) => (
              <AccountRow key={node.AccountCode} node={node} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
