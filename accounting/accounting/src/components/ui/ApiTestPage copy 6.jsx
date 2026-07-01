// ApiTestTreePage.jsx
import ApiTreeView from "./ApiTreeView";
import ApiTreeViewCRUD from "./ApiTreeViewCRUD";
export default function ApiTestTreePage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">TreeView حساب‌ها با جستجو</h2>
            <ApiTreeView
                baseUrl="http://localhost:5000/api"
                apiPath="accounts"
                onSelect={(node) => console.log("انتخاب شد:", node)}
            />

            <h2 className="text-xl font-bold mb-4">TreeView حساب‌ها با CRUD</h2>
            <ApiTreeViewCRUD baseUrl="http://localhost:5000/api" apiPath="accounts" />
        </div>
    );
}
