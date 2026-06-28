import GenericTablePage from "../ui/GenericTablePage";

export default function WarehousePage() {
  const fields = [
    { name: "warehouseName", label: "نام انبار" },
    { name: "location", label: "موقعیت" },
    { name: "isActive", label: "فعال باشد", type: "checkbox" }
  ];

  const columns = [
    { key: "warehouseName", label: "نام" },
    { key: "location", label: "موقعیت" },
    { key: "isActive", label: "فعال" }
  ];

  const mapResponse = (row) => ({
    ...row,
    isActive: row.isActive ? "✅" : "❌"
  });

  return (
    <GenericTablePage
      table="warehouses"
      apiPath="warehouses"
      fields={fields}
      columns={columns}
      mapResponse={mapResponse}
    />
  );
}
