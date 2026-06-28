import { useState } from "react";
import ApiDropdown from "./ApiDropdown";
import ApiSearch from "./ApiSearch";
import ApiMultiSelect from "./ApiMultiSelect"; // 👈 اضافه شد

export default function ApiTestPage() {
    const [formData, setFormData] = useState({ itemId: "" });
    const [selectedItem, setSelectedItem] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);

    // فرم سرچ
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("✅ کالای انتخاب شده از سرچ:", selectedItem);
    };

    // فرم مولتی سلکت
    const handleSubmitMulti = (e) => {
        e.preventDefault();
        console.log("✅ کالاهای انتخاب‌شده:", selectedItems);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow rounded space-y-6">
            <h2 className="text-xl font-bold mb-4">تست جستجو و دراپ‌دان کالا</h2>

            {/* فرم جستجوی کالا */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 border rounded">
                <ApiSearch
                    baseUrl="http://localhost:5000/api"
                    apiPath="items"
                    name="itemId"
                    label="کالا (جستجو)"
                    optionValue="id"
                    optionLabel={(opt) => opt.itemName}
                    value={selectedItem}
                    onChange={setSelectedItem}
                    required
                    className="w-full"
                />

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    ثبت
                </button>
            </form>

            {/* دراپ‌دان کالا */}
            <div className="p-4 space-y-4 border rounded">
                <ApiDropdown
                    baseUrl="http://localhost:5000/api"
                    apiPath="items"
                    name="itemId"
                    label="کالا (دراپ‌دان)"
                    optionValue="id"
                    optionLabel={(opt) => opt.itemName}
                    value={formData.itemId}
                    onChange={(val) => setFormData({ ...formData, itemId: val })}
                />

                <p className="mt-2 text-gray-700">
                    مقدار انتخاب‌شده از دراپ‌دان: <strong>{formData.itemId}</strong>
                </p>
            </div>

            {/* مولتی‌سلکت کالا */}
            <div className="p-4 space-y-4 border rounded">
                <h2 className="text-xl font-bold mb-4">تست مولتی‌سلکت کالا</h2>

                <form onSubmit={handleSubmitMulti} className="space-y-4">
                    <ApiMultiSelect
                        baseUrl="http://localhost:5000/api"
                        apiPath="items"
                        name="items"
                        label="کالاها"
                        optionValue="id"
                        optionLabel={(opt) => opt.itemName}
                        values={selectedItems}
                        onChange={setSelectedItems}
                        className="w-full"
                    />

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        ثبت
                    </button>
                </form>
            </div>
        </div>
    );
}
