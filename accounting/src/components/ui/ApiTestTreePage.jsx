// ApiTestTreePage.jsx
import ApiTreeViewCRUD from "./ApiTreeViewCRUD";

export default function ApiTestTreePage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">TreeView حساب‌ها (عمومی)</h2>
            <ApiTreeViewCRUD
                baseUrl="http://localhost:5000/api"
                apiPath="accounts"
                idKey="AccountCode"       // کلید یکتا
                parentKey="TopCode"       // کلید والد
                labelKey="TitleFa"        // کلید نمایش
                headers={{
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}`, // اگر لازم شد
                }}
                fields={[
                    { key: "AccountCode", label: "کد حساب", type: "number", required: true },
                    { key: "TitleFa", label: "عنوان فارسی", type: "text", required: true },
                    { key: "TitleEn", label: "عنوان انگلیسی", type: "text" },
                    { key: "Nature", label: "ماهیت", type: "text" },
                    { key: "Type", label: "نوع", type: "text" },
                ]}
            />
        </div>
    );
}
