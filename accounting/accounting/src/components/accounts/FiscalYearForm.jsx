import React, { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";

function FiscalYearForm() {
  const [years, setYears] = useState([]);
  const [form, setForm] = useState({
    YearCode: "",
    StartDate: null,
    EndDate: null
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/fiscal-year")
      .then(res => res.json())
      .then(data => setYears(data.data || []));
  }, []);

  const addYear = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/fiscal-year", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        YearCode: form.YearCode,
        StartDate: form.StartDate?.format("YYYY/MM/DD"),
        EndDate: form.EndDate?.format("YYYY/MM/DD")
      })
    });
    const data = await res.json();
    if (data.success) {
      alert("سال مالی جدید ثبت شد");
      window.location.reload();
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">مدیریت سال مالی</h3>

      <form onSubmit={addYear} className="mb-6 space-y-3">
        <div>
          <label>کد سال</label>
          <input
            type="text"
            value={form.YearCode}
            onChange={(e) => setForm({ ...form, YearCode: e.target.value })}
            className="border p-2 w-full rounded"
            placeholder="مثلاً 1405"
            required
          />
        </div>
        <div>
          <label>تاریخ شروع</label>
          <DatePicker
            calendar={persian}
            locale={persian_en}
            value={form.StartDate}
            onChange={(date) => setForm({ ...form, StartDate: date })}
            format="YYYY/MM/DD"
          />
        </div>
        <div>
          <label>تاریخ پایان</label>
          <DatePicker
            calendar={persian}
            locale={persian_en}
            value={form.EndDate}
            onChange={(date) => setForm({ ...form, EndDate: date })}
            format="YYYY/MM/DD"
          />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          ثبت سال مالی جدید
        </button>
      </form>

      {/* جدول نمایش سال‌های مالی */}
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">کد سال</th>
            <th className="border p-2">تاریخ شروع</th>
            <th className="border p-2">تاریخ پایان</th>
            <th className="border p-2">فعال</th>
          </tr>
        </thead>
        <tbody>
          {years.map(y => (
            <tr key={y.FiscalYearId}>
              <td className="border p-2">{y.YearCode}</td>
              <td className="border p-2">{y.StartDate}</td>
              <td className="border p-2">{y.EndDate}</td>
              <td className="border p-2">{y.IsActive ? "✅" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FiscalYearForm;
