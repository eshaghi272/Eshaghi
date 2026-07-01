import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function UserProfile() {
  const { role, id } = useParams();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/users/${role}/${id}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error('❌ خطا در دریافت اطلاعات پروفایل:', err));
  }, [role, id]);

  if (!userData) return <div className="p-4">در حال بارگذاری پروفایل...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow" dir="rtl">
      <h2 className="text-xl font-bold text-blue-700 mb-4">پروفایل کاربر</h2>
      <p>نام: {userData.firstName} {userData.lastName}</p>
      <p>کد ملی: {userData.nationalCode}</p>
      <p>نقش: {role}</p>
      {/* سایر اطلاعات */}
    </div>
  );
}
