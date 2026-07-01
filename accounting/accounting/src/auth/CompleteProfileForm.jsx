import React from 'react';
import { useParams } from 'react-router-dom';

import StaffProfileForm from './StaffProfileForm';
import AdminProfileForm from './AdminProfileForm';

export default function CompleteProfileForm() {
  const { role, id } = useParams(); // 👈 دریافت از URL

  if (!role || !id) {
    return (
      <div className="mt-10 text-center text-gray-600" dir="rtl">
        در حال دریافت اطلاعات کاربر...
      </div>
    );
  }

  switch (Number(role)) {
    case 2:
      return <StaffProfileForm userId={id} />;
    
         case 1:
      return <AdminProfileForm userId={id} />;
    default:
      return (
        <div className="mt-10 text-center text-red-600 font-semibold" dir="rtl">
          نقش کاربر نامشخص است یا فرم مربوطه تعریف نشده
        </div>
      );
  }
}
