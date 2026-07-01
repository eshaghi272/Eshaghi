// ApiTestPage.jsx
import ApiTableCRUD from "./ApiTableCRUD";

export default function ApiTestPage() {
    return (
        <div className="p-6">
            <ApiTableCRUD
                baseUrl="http://localhost:5000/api"
                apiPath="items"
                pageSize={6
                                    }
                columns={[
                    { key: "itemCode", label: "کد کالا" },
                    { key: "itemName", label: "نام کالا" },
                    { key: "brand", label: "برند" },
                    { key: "model", label: "مدل" },
                    { key: "originCountry", label: "کشور سازنده" },
                    { key: "basePrice", label: "قیمت" },
                    { key: "description", label: "توضیحات" },
                ]}
            />
        </div>
    );
}
