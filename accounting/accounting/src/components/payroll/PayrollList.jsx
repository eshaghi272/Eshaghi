import React, { useEffect, useState } from "react";

export default function PayrollList() {
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/payroll")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setPayrolls(data.data);
        } else if (Array.isArray(data)) {
          setPayrolls(data);
        } else {
          setPayrolls([]);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت لیست حقوق:", err));
  }, []);

  const toNumber = (val) => Number(val) || 0;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">لیست حقوق‌ها</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">کد پرسنل</th>
            <th className="border p-2">نام</th>
            <th className="border p-2">دوره</th>
            <th className="border p-2">حقوق پایه</th>
            <th className="border p-2">مزایا</th>
            <th className="border p-2">کسورات</th>
            <th className="border p-2">خالص پرداختی</th>
            <th className="border p-2">تاریخ پرداخت</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((p) => (
            <tr key={p.PayrollId || p.PersonnelCode}>
              <td className="border p-2">{p.PersonnelCode}</td>
              <td className="border p-2">{p.FullName}</td>
              <td className="border p-2">{p.Period}</td>
              <td className="border p-2">{toNumber(p.BaseSalary)}</td>
              <td className="border p-2">
                {toNumber(p.HousingAllowance) +
                 toNumber(p.FoodAllowance) +
                 toNumber(p.TransportAllowance) +
                 toNumber(p.OtherAllowances) +
                 toNumber(p.OvertimePay)}
              </td>
              <td className="border p-2 text-red-600">{toNumber(p.Deductions)}</td>
              <td className="border p-2 text-green-600 font-bold">{toNumber(p.NetSalary)}</td>
              <td className="border p-2">{p.PayDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
