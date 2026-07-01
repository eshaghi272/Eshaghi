import { useEffect, useState } from "react";
import axios from "axios";

export default function TableWithEditDialog({ apiUrl, columns, mapResponse, refreshTrigger }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  const tableName = apiUrl.split("/").pop()?.split("?")[0] || "unknown";
  const table = tableName.startsWith("tbl") ? tableName : `tbl${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`;

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      try {
        const res = await axios.get(apiUrl);
        const mapped = res.data.map(mapResponse);
        setRows(mapped);
      } catch (err) {
        console.error("❌ خطا در دریافت داده‌ها:", err);
        setError("خطا در دریافت اطلاعات");
      } finally {
        setLoading(false);
      }
    };
    fetchRows();
  }, [apiUrl, refreshTrigger]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleEditClick = (row) => {
    const editable = {};
    columns.forEach(col => {
      if (!col.key.startsWith("_")) {
        editable[col.key] = row[col.key];
      }
    });
    setEditRow(row);
    setFormData(editable);
    setError("");
  };

  const handleClose = () => {
    setEditRow(null);
    setFormData({});
    setError("");
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const primaryKeyField = Object.keys(editRow).find((k) => k.toLowerCase() === "id");
      const primaryKeyValue = editRow?.[primaryKeyField];

      const method = primaryKeyValue ? "PUT" : "POST";
      const url = primaryKeyValue
        ? `http://localhost:5000/api/${table}/${primaryKeyValue}`
        : `http://localhost:5000/api/${table}`;

      const cleanedData = {};
      columns.forEach(({ key }) => {
        if (!key.startsWith("_") && formData[key] !== undefined) {
          const value = formData[key];
          cleanedData[key] =
            typeof value === "boolean" ? (value ? 1 : 0)
            : Number.isNaN(value) ? null
            : value;
        }
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "خطا در ثبت داده");

      const updatedRows = rows.map((r) =>
        r[primaryKeyField] === primaryKeyValue ? { ...r, ...cleanedData } : r
      );
      setRows(updatedRows);
      handleClose();
    } catch (err) {
      console.error("❌ خطا در ارسال:", err);
      setError("خطا در ذخیره‌سازی اطلاعات. لطفاً فیلدها را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const primaryKey = Object.keys(row).find((k) => k.toLowerCase() === "id");
    const id = row[primaryKey];
    if (!window.confirm("آیا از حذف مطمئن هستید؟")) return;

    try {
      await axios.delete(`http://localhost:5000/api/${table}/${id}`);
      setRows((prev) => prev.filter((r) => r[primaryKey] !== id));
    } catch (err) {
      console.error("❌ خطا در حذف:", err);
      alert("خطا در حذف اطلاعات");
    }
  };

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <div className="overflow-x-auto border border-gray-300 dark:border-gray-700 rounded-lg">
      <div className="p-4 flex justify-between items-center">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="جستجو..."
          className="border p-2 rounded w-1/2"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <table className="min-w-full text-sm text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <thead className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-4 py-3 font-bold border-b border-gray-300 dark:border-gray-700">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 font-bold border-b border-gray-300 dark:border-gray-700">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const rowId = row.id || row.itemId || row.groupId;
              return (
                <tr key={rowId} className="hover:bg-blue-50 dark:hover:bg-blue-800 transition">
                  {columns.map((col, index) => (
                    <td key={index} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      {row[col.key]}
                    </td>
                  ))}
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(row)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editRow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-100">ویرایش اطلاعات</h2>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns.map((col, index) => {
                  if (col.key.startsWith("_")) return null;

                  return (
                    <div key={index}>
                      <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">{col.label}</label>
                      {col.key === "gender" ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => handleChange("gender", e.target.value)}
                          className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        >
                          <option value="0">نامشخص</option>
                          <option value="1">مرد</option>
                          <option value="2">زن</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData[col.key] ?? ""}
                          onChange={(e) => handleChange(col.key, e.target.value)}
                          className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        />
                      )}
                      
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-4">{error}</p>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
