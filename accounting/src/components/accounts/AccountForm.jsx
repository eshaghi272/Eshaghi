import React, { useState, useEffect } from "react";

function AccountForm({ initialData = null, onSubmit }) {
  const [accCode, setAccCode] = useState(initialData?.accCode || "");
  const [accTitleFa, setAccTitleFa] = useState(initialData?.accTitleFa || "");
  const [accTitleEn, setAccTitleEn] = useState(initialData?.accTitleEn || "");
  const [accNature, setAccNature] = useState(initialData?.accNature || "");
  const [accKind, setAccKind] = useState(initialData?.accKind || "معین");
  const [currency, setCurrency] = useState(initialData?.currency || "");
  const [isActive, setIsActive] = useState(initialData?.isActive || "true");
  const [isView, setIsView] = useState(initialData?.isView || "false");
  const [exp, setExp] = useState(initialData?.exp || "");
  const [accTopId, setAccTopId] = useState(initialData?.accTopId || "");

  const [parentAccounts, setParentAccounts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/accounts/parents")
      .then((res) => res.json())
      .then((data) => setParentAccounts(data))
      .catch((err) => console.error("❌ خطا در دریافت حساب‌های والد:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const account = {
      accCode: Number(accCode),
      accTitleFa: accTitleFa.trim(),
      accTitleEn: accTitleEn.trim(),
      accNature,
      accKind,
      currency,
      isActive,
      isView,
      exp,
      accTopId: Number(accTopId) || null,
    };
    onSubmit(account);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rtl text-right">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>کد حساب:</label>
          <input type="number" value={accCode} onChange={(e) => setAccCode(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label>نوع حساب:</label>
          <select value={accKind} onChange={(e) => setAccKind(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="گروه">گروه</option>
            <option value="کل">کل</option>
            <option value="معین">معین</option>
          </select>
        </div>
        <div>
          <label>ماهیت حساب:</label>
          <select value={accNature} onChange={(e) => setAccNature(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="بدهکار">بدهکار</option>
            <option value="بستانکار">بستانکار</option>
            <option value="دوطرفه">دوطرفه</option>
          </select>
        </div>
        <div>
          <label>واحد پول:</label>
          <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>عنوان فارسی:</label>
          <input type="text" value={accTitleFa} onChange={(e) => setAccTitleFa(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label>عنوان انگلیسی:</label>
          <input type="text" value={accTitleEn} onChange={(e) => setAccTitleEn(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>فعال باشد؟</label>
          <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="true">بله</option>
            <option value="false">خیر</option>
          </select>
        </div>
        <div>
          <label>قابل نمایش باشد؟</label>
          <select value={isView} onChange={(e) => setIsView(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="true">بله</option>
            <option value="false">خیر</option>
          </select>
        </div>
        <div className="col-span-2">
          <label>توضیحات:</label>
          <textarea value={exp} onChange={(e) => setExp(e.target.value)} className="border rounded px-2 py-1 w-full" rows={2} />
        </div>
        <div className="col-span-2">
          <label>حساب والد:</label>
          <select value={accTopId} onChange={(e) => setAccTopId(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="">— بدون والد —</option>
            {parentAccounts.map((acc) => (
              <option key={acc.accCode} value={acc.accCode}>
                {acc.accCode} - {acc.accTitleFa}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-left">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold">
          💾 ذخیره حساب
        </button>
      </div>
    </form>
  );
}

export default AccountForm;
