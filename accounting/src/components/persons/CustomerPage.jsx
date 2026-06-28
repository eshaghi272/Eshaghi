import { useState } from "react";
import GenericTablePage from "../ui/GenericTablePage";
import CustomerModal from "./CustomerModal";

export default function CustomerPage() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapResponse = (row) => ({
    ...row,
    _genderLabel:
      row.gender === "1" ? "مرد" :
        row.gender === "2" ? "زن" : "نامشخص",
    _typeLabel: row.isLegalEntity === 1 ? "حقوقی" : "حقیقی",
    _sellerLabel: row.isSeller === 1 ? "✅" : "❌"
  });

  const handleAddCustomer = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setRefreshFlag((f) => f + 1);
    setIsModalOpen(false);
  };

  const columns = [
    { key: "nationalCode", label: "کد ملی" },
    { key: "firstName", label: "نام" },
    { key: "lastName", label: "نام خانوادگی" },
    { key: "phoneNumber", label: "تلفن" },
    { key: "email", label: "ایمیل" },
    { key: "birthDate", label: "تاریخ تولد" },
    { key: "_genderLabel", label: "جنس" },
    { key: "_typeLabel", label: "نوع شخص" },
    { key: "companyName", label: "نام شرکت" },
    { key: "economicCode", label: "شماره اقتصادی" },
    { key: "_sellerLabel", label: "فروشنده" },
    { key: "postalCode", label: "کد پستی" },
    { key: "address", label: "آدرس" }
  ];

  return (
    <>
      <GenericTablePage
        table="persons"
        apiPath="persons"
        fields={[]}
        columns={columns}
        mapResponse={mapResponse}
        refreshTrigger={refreshFlag}
        title="مشتریان" // عنوان سفارشی
        onAddNew={handleAddCustomer} // دکمه افزودن
      />

      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}