import React from 'react';
import { useParams } from 'react-router-dom';
import StaffProfileForm from './StaffProfileForm';
import AdminProfileForm from './AdminProfileForm';

export default function ProfileRouter() {
  const { role, id } = useParams();

  switch (Number(role)) {
    case 1:
      return <AdminProfileForm userId={id} />;
    case 2:
      return <StaffProfileForm userId={id} />;
    default:
      return <div className="p-4 text-red-600">نقش کاربر نامعتبر است.</div>;
  }
}
