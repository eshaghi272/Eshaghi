import React, { useState } from 'react';

const AccountGroupForm = ({ initialData = {}, onSubmit }) => {
  const [groupCode, setGroupCode] = useState(initialData.GroupCode || '');
  const [titleFa, setTitleFa] = useState(initialData.TitleFa || '');
  const [titleEn, setTitleEn] = useState(initialData.TitleEn || '');
  const [type, setType] = useState(initialData.Type || 'گروه');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { GroupCode: groupCode, TitleFa: titleFa, TitleEn, Type: type };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow text-right">
      <h2 className="text-lg font-semibold mb-4">ثبت / اصلاح گروه حساب</h2>

      <div className="mb-4">
        <label className="block mb-1 text-sm">کد گروه</label>
        <input
          type="number"
          value={groupCode}
          onChange={(e) => setGroupCode(e.target.value)}
          className="w-full border rounded px-3 py-2 text-right"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm">عنوان فارسی</label>
        <input
          type="text"
          value={titleFa}
          onChange={(e) => setTitleFa(e.target.value)}
          className="w-full border rounded px-3 py-2 text-right"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm">عنوان انگلیسی</label>
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full border rounded px-3 py-2 text-right"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm">نوع</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border rounded px-3 py-2 text-right"
        >
          <option value="گروه">گروه</option>
          <option value="کل">کل</option>
          <option value="تفصیلی">تفصیلی</option>
        </select>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        ثبت اطلاعات
      </button>
    </form>
  );
};

export default AccountGroupForm;
