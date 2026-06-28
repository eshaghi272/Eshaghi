import React, { useEffect, useState, useRef, useCallback } from 'react';

function SelectAccountDrawer({ visible, onClose, onSelect }) {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef(null);

  useEffect(() => {
  if (!visible) return;

  fetch("http://localhost:5000/api/accounts")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`❌ وضعیت پاسخ ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        const mapped = data.map((acc) => ({
          accCode: acc.AccountCode,
          accTitleFa: acc.TitleFa,
          accKind: acc.Type,
          // parentGroupTitle: acc.GroupCode,
          ...acc
        }));
        setAccounts(mapped);
      } else {
        console.warn("❌ پاسخ API آرایه نیست:", data);
        setAccounts([]);
      }
    })
    .catch((err) => {
      console.error("❌ خطا در دریافت حساب‌ها:", err.message);
      setAccounts([]);
    });
}, [visible]);

  const normalized = (text) => text?.toString().trim().toLowerCase();

  const safeAccounts = Array.isArray(accounts)
    ? accounts.filter((a) => a?.accCode && a?.accTitleFa)
    : [];

  const filtered = safeAccounts.filter(
    (acc) =>
      normalized(acc.accCode).includes(normalized(searchTerm)) ||
      normalized(acc.accTitleFa).includes(normalized(searchTerm))
  );

  const grouped = {
    گروه: filtered.filter((a) => a.accKind === 'گروه'),
    کل: filtered.filter((a) => a.accKind === 'کل'),
    معین: filtered.filter((a) => a.accKind === 'معین'),
  };

  const flatList = [...grouped.گروه, ...grouped.کل, ...grouped.معین];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setFocusedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      const acc = flatList[focusedIndex];
      handleSelect(acc);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelectorAll('li')[focusedIndex];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleSelect = useCallback((acc) => {
    onSelect({
      AccountCode: acc.accCode,
      TitleFa: acc.accTitleFa || acc.path
    });
    onClose();
  }, [onSelect, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-white rounded shadow-lg p-4 w-[600px] max-h-[80vh] overflow-y-auto relative outline-none">
        <h4 className="text-lg font-bold mb-2">🔍 انتخاب حساب</h4>
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-gray-500 hover:text-red-600"
        >
          ✖
        </button>

        <input
          type="text"
          autoFocus
          placeholder="جستجو بر اساس کد یا عنوان..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setFocusedIndex(-1);
          }}
          className="w-full border rounded px-3 py-2 mb-3"
        />

        <div ref={listRef}>
          {['گروه', 'کل', 'معین'].map(
            (kind) =>
              grouped[kind].length > 0 && (
                <div key={kind} className="mb-4">
                  <h5 className="text-sm font-bold text-gray-600 mb-1">{kind}</h5>
                  <ul className="space-y-1">
                    {grouped[kind].map((acc) => {
                      const globalIdx = flatList.findIndex((a) => a.accCode === acc.accCode);

                      return (
                        <li
                          key={acc.accCode}
                          className={`flex justify-between items-center border-b pb-1 px-2 py-1 rounded cursor-pointer ${
                            globalIdx === focusedIndex ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => handleSelect(acc)}
                          onDoubleClick={() => handleSelect(acc)}
                          onMouseEnter={() => setFocusedIndex(globalIdx)}
                        >
                          <span className="text-sm font-medium">
                            {acc.accCode} - {acc.parentGroupTitle || ''} &gt; {acc.parentKolTitle || ''} &gt; {acc.accTitleFa}
                          </span>

                          <button
                            onClick={() => handleSelect(acc)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                          >
                            انتخاب
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

export default SelectAccountDrawer;
