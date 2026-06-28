// ApiTestPage.jsx
import ApiTableCRUDServer from "./ApiTableCRUDServer";

export default function ApiTestPage() {
    return (
        <div className="p-6">
            <ApiTableCRUDServer
                baseUrl="http://localhost:5000/api"
                apiPath="items"
                pageSize={8}
                columns={[
                    { key: "itemCode", label: "کد کالا", type: "number", required: true },
                    { key: "itemName", label: "نام کالا", type: "text", required: true },
                    { key: "brand", label: "برند", type: "text" },
                    { key: "model", label: "مدل", type: "text" },
                    { key: "originCountry", label: "کشور سازنده", type: "text" },
                    {
                        key: "itemType",
                        label: "نوع",
                        type: "select",
                        options: [
                            { value: "product", label: "کالا" },
                            { value: "service", label: "خدمت" },
                            { value: "package", label: "بسته" },
                        ],
                        required: true,
                    },
                    { key: "basePrice", label: "قیمت", type: "number", required: true },
                    { key: "taxRate", label: "مالیات (%)", type: "number" },
                    { key: "description", label: "توضیحات", type: "textarea" },
                ]}
            />
        </div>
    );
}
