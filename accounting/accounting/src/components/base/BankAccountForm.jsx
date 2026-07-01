import { useState } from "react";
import GenericTablePage from "../ui/GenericTablePage";
import BankAccountModal from "./BankAccountModal";

export default function BankAccountPage() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapResponse = (row) => ({
    ...row,
    id: row.id || row.accountNumber
  });

  const handleAddAccount = () => {
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
    { key: "bankName", label: "نام بانک" },
    { key: "branchName", label: "شعبه" },
    { key: "accountNumber", label: "شماره حساب" },
    { key: "shebaNumber", label: "شماره شبا" },
    { key: "cardNumber", label: "شماره کارت" },
    { key: "accountType", label: "نوع حساب" },
    { key: "currency", label: "واحد پول" },
    { key: "description", label: "توضیحات" }
  ];

  const fields = [];

  return (
    <>
      <GenericTablePage
        table="bankaccounts"
        apiPath="bankaccounts"
        fields={fields}
        columns={columns}
        mapResponse={mapResponse}
        refreshTrigger={refreshFlag}
        title="حساب‌های بانکی"
        onAddNew={handleAddAccount}
      />

      {isModalOpen && (
        <BankAccountModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}