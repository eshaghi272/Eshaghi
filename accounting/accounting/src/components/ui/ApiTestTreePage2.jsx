// ApiTestTreePage.jsx
import ApiTreeViewCRUD from "./ApiTreeViewCRUD";

export default function ApiTestTreePage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">TreeView حساب‌ها (عمومی + CRUD)</h2>
            <ApiTreeViewCRUD
                baseUrl="http://localhost:5000/api"
                apiPath="accounts"
                headers={{ "Content-Type": "application/json" }}

                idKey="AccountCode"
                parentKey="TopCode"
                labelKey="TitleFa"

                fields={[
                    { key: "AccountCode", label: "کد حساب", type: "number", required: true },
                    { key: "TopCode", label: "کد والد", type: "number" },
                    { key: "TitleFa", label: "عنوان فارسی", type: "text", required: true },
                    { key: "TitleEn", label: "عنوان انگلیسی", type: "text" },
                    {
                        key: "Nature",
                        label: "ماهیت",
                        type: "select",
                        options: [
                            { value: "بدهكار", label: "بدهکار" },
                            { value: "بستانكار", label: "بستانکار" },
                            { value: "مهم نيست", label: "مهم نیست" },
                        ],
                    },
                    {
                        key: "Type",
                        label: "نوع",
                        type: "select",
                        options: [
                            { value: "گروه", label: "گروه" },
                            { value: "کل", label: "کل" },
                            { value: "معین", label: "معین" },
                        ],
                    },
                ]}

                // اختیاری: جلوگیری از حذف نودهای دارای فرزند
                disableDeleteIfHasChildren={true}
            />
        </div>
    );
}
