import { useState, useEffect } from "react";

export default function AccountingReports() {
  const [activeTab, setActiveTab] = useState("journal");
  const [data, setData] = useState([]);

  useEffect(() => {
    let endpoint = "";
    switch (activeTab) {
      case "journal":
        endpoint = "http://localhost:5000/api/accounting/journal";
        break;
      case "group":
        endpoint = "http://localhost:5000/api/accounting/group-ledger";
        break;
      case "ledger":
        endpoint = "http://localhost:5000/api/accounting/general-ledger";
        break;
      case "subsidiary":
        endpoint = "http://localhost:5000/api/accounting/subsidiary-ledger";
        break;
      default:
        endpoint = "http://localhost:5000/api/accounting/journal";
    }

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setData(json);
        } else if (Array.isArray(json.rows)) {
          setData(json.rows);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error("❌ خطا در دریافت گزارش:", err);
        setData([]);
      });
  }, [activeTab]);

  const renderTable = () => {
    if (!Array.isArray(data)) return <p className="text-red-600">❌ داده معتبر دریافت نشد</p>;

    switch (activeTab) {
      case "journal":
        return (
          <table className="w-full text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">شماره سند</th>
                <th className="p-2">تاریخ</th>
                <th className="p-2">شرح</th>
                <th className="p-2">کد حساب</th>
                <th className="p-2">بدهکار</th>
                <th className="p-2">بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.LineId || row.EntryId} className="border-t">
                  <td className="p-2">{row.DocumentNumber}</td>
                  <td className="p-2">{row.EntryDate}</td>
                  <td className="p-2">{row.Description}</td>
                  <td className="p-2">{row.AccountCode}</td>
                  <td className="p-2 text-green-700 font-bold">
                    {row.DebitAmount > 0 ? row.DebitAmount.toLocaleString("fa-IR") : ""}
                  </td>
                  <td className="p-2 text-red-700 font-bold">
                    {row.CreditAmount > 0 ? row.CreditAmount.toLocaleString("fa-IR") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "group":
        return (
          <table className="w-full text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">کد گروه</th>
                <th className="p-2">نام گروه</th>
                <th className="p-2">جمع بدهکار</th>
                <th className="p-2">جمع بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{row.GroupCode}</td>
                  <td className="p-2">{row.GroupName}</td>
                  <td className="p-2 text-green-700 font-bold">
                    {row.TotalDebit?.toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2 text-red-700 font-bold">
                    {row.TotalCredit?.toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "ledger":
        return (
          <table className="w-full text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">کد حساب</th>
                <th className="p-2">نام حساب</th>
                <th className="p-2">جمع بدهکار</th>
                <th className="p-2">جمع بستانکار</th>
                <th className="p-2">مانده</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{row.GeneralCode}</td>
                  <td className="p-2">{row.GeneralName}</td>
                  <td className="p-2 text-green-700 font-bold">
                    {row.TotalDebit?.toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2 text-red-700 font-bold">
                    {row.TotalCredit?.toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2 font-bold">{row.Balance?.toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "subsidiary":
        return (
          <table className="w-full text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">کد حساب</th>
                <th className="p-2">نام حساب</th>
                <th className="p-2">شناسه فرعی</th>
                <th className="p-2">جمع بدهکار</th>
                <th className="p-2">جمع بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{row.AccountCode}</td>
                  <td className="p-2">{row.AccountName}</td>
                  <td className="p-2">{row.SubsidiaryId}</td>
                  <td className="p-2 text-green-700 font-bold">
                    {row.TotalDebit?.toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2 text-red-700 font-bold">
                    {row.TotalCredit?.toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-200 mb-4">
        📊 گزارش‌های حسابداری
      </h2>

      {/* تب‌ها */}
      <div className="flex space-x-2 mb-4">
        {[
          { key: "journal", label: "دفتر روزنامه" },
          { key: "group", label: "دفتر گروه" },
          { key: "ledger", label: "دفتر کل" },
          { key: "subsidiary", label: "دفتر معین" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded ${
              activeTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* جدول */}
      {renderTable()}
    </div>
  );
}
