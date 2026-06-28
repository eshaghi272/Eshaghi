import { useState } from "react";
import TableWithEditDialog from "../ui/TableWithEditDialog";
import CompanyModal from "./CompanyModal"; // کامپوننت مودال جدید

export default function CompanyPage() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "companyName", label: "نام شرکت" },
    { key: "economicCode", label: "شماره اقتصادی" },
    { key: "nationalId", label: "شناسه ملی" },
    { key: "registrationNumber", label: "شماره ثبت" },
    { key: "postalCode", label: "کد پستی" },
    { key: "phoneNumber", label: "تلفن" },
    { key: "email", label: "ایمیل" },
    { key: "address", label: "آدرس" },
    { key: "_isCustomerLabel", label: "مشتری؟" },
    { key: "_isSupplierLabel", label: "تأمین‌کننده؟" },
    { key: "_isSelfLabel", label: "شرکت خودمان؟" }
  ];

  const mapResponse = (row) => ({
    ...row,
    _isCustomerLabel: row.isCustomer ? "✅" : "❌",
    _isSupplierLabel: row.isSupplier ? "✅" : "❌",
    _isSelfLabel: row.isSelf ? "✅" : "❌"
  });

  const handleAddCompany = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setRefreshFlag((f) => f + 1);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-100">🏢 مدیریت شرکت‌ها</h2>
        <button
          onClick={handleAddCompany}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          افزودن شرکت جدید
        </button>
      </div>

      <TableWithEditDialog
        apiUrl="http://localhost:5000/api/companies"
        columns={columns}
        mapResponse={mapResponse}
        refreshTrigger={refreshFlag}
      />

      {isModalOpen && (
        <CompanyModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}