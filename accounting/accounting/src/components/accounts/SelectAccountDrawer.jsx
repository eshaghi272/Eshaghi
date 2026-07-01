import React, { useEffect, useState } from "react";

function SelectAccountDrawer({ visible, onClose, onSelect }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedKol, setSelectedKol] = useState(null);

  useEffect(() => {
    if (!visible) return;

    fetch("http://localhost:5000/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccounts(
            data.map((acc) => ({
              accCode: acc.AccountCode,
              accTitleFa: acc.TitleFa,
              accKind: acc.Type,
              parentGroup: acc.TopCode, // فرض: TopCode کد والد است
              ...acc,
            }))
          );
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت حساب‌ها:", err));
  }, [visible]);

  if (!visible) return null;

  // فقط گروه‌ها
  const groups = accounts.filter((a) => a.accKind === "گروه");

  // کل‌های زیر گروه انتخاب‌شده
  const kols = selectedGroup
    ? accounts.filter(
        (a) => a.accKind === "کل" && a.TopCode === selectedGroup.accCode
      )
    : [];

  // معین‌های زیر کل انتخاب‌شده
  const moeins = selectedKol
    ? accounts.filter(
        (a) => a.accKind === "معین" && a.TopCode === selectedKol.accCode
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg p-4 w-[600px] max-h-[80vh] overflow-y-auto relative">
        <h4 className="text-lg font-bold mb-2">🔍 انتخاب حساب</h4>
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-gray-500 hover:text-red-600"
        >
          ✖
        </button>

        {/* مرحله ۱: انتخاب گروه */}
        {!selectedGroup && (
          <>
            <h5 className="font-bold mb-2">گروه‌ها</h5>
            <ul className="space-y-1">
              {groups.map((g) => (
                <li
                  key={g.accCode}
                  className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                  onClick={() => setSelectedGroup(g)}
                >
                  {g.accCode} - {g.accTitleFa}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* مرحله ۲: انتخاب کل */}
        {selectedGroup && !selectedKol && (
          <>
            <h5 className="font-bold mb-2">
              کل‌های گروه {selectedGroup.accTitleFa}
            </h5>
            <ul className="space-y-1">
              {kols.map((k) => (
                <li
                  key={k.accCode}
                  className="cursor-pointer hover:bg-green-100 px-2 py-1 rounded"
                  onClick={() => setSelectedKol(k)}
                >
                  {k.accCode} - {k.accTitleFa}
                </li>
              ))}
            </ul>
            <button
              className="mt-2 text-sm text-red-600"
              onClick={() => setSelectedGroup(null)}
            >
              ← بازگشت به گروه‌ها
            </button>
          </>
        )}

        {/* مرحله ۳: انتخاب معین */}
        {selectedKol && (
          <>
            <h5 className="font-bold mb-2">
              معین‌های کل {selectedKol.accTitleFa}
            </h5>
            <ul className="space-y-1">
              {moeins.map((m) => (
                <li
                  key={m.accCode}
                  className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded"
                  onClick={() => {
                    onSelect({ AccountCode: m.accCode, TitleFa: m.accTitleFa });
                    onClose();
                  }}
                >
                  {m.accCode} - {m.accTitleFa}
                </li>
              ))}
            </ul>
            <button
              className="mt-2 text-sm text-red-600"
              onClick={() => setSelectedKol(null)}
            >
              ← بازگشت به کل‌ها
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectAccountDrawer;
