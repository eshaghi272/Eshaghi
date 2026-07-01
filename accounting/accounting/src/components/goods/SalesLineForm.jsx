import GenericForm from "../ui/GenericForm";

export default function SalesLineForm({ invoiceId, onLineSubmit }) {
  return (
    <GenericForm
      table="tblSalesLines"
      apiPath="tblSalesLines"
      initialData={{ invoiceId }}
      fields={[
        {
          name: "itemCode",
          label: "کد کالا",
          type: "search-select",
          source: "tblItems",
          optionLabel: "itemName",
          optionValue: "itemCode",
          required: true
        },
        {
          name: "itemName",
          label: "نام کالا",
          type: "text",
          required: true
        },
        {
          name: "quantity",
          label: "تعداد",
          type: "number",
          required: true
        },
        {
          name: "unitPrice",
          label: "قیمت واحد",
          type: "number",
          required: true
        }
       

      ]}
      onSubmit={onLineSubmit}
    />
  );
}
