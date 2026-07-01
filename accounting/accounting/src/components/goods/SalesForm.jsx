import GenericForm from "../ui/GenericForm";

export default function SalesForm({ initialData = null, onSubmit }) {
  return (
    <GenericForm
      table="tblSalesInvoice"
      apiPath="tblSalesInvoice"
      initialData={initialData}
      fields={[
        {
          name: "customerName",
          label: "نام مشتری",
          type: "text",
          required: true
        },
        {
          name: "customerNationalCode",
          label: "کد ملی مشتری",
          type: "text"
        },
        {
          name: "invoiceDate",
          label: "تاریخ فاکتور",
          type: "date",
          required: true
        },
        {
          name: "description",
          label: "توضیحات",
          type: "textarea"
        }
      ]}
      onSubmit={onSubmit}
    />
  );
}
