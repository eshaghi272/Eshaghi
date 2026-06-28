import { useState } from "react";
import ApiItemCards from "./ApiItemCards";
import ApiItemList from "./ApiItemList";
import ApiItemTable from "./ApiItemTable";
import ApiDataTable from "./ApiDataTable";


export default function ApiTestPage() {
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <div className="p-6">

            <ApiDataTable
                baseUrl="http://localhost:5000/api"
                apiPath="items"
                columns={[
                    { key: "itemCode", label: "کد کالا" },
                    { key: "itemName", label: "نام کالا" },
                    { key: "brand", label: "برند" },
                    { key: "basePrice", label: "قیمت" },
                ]}
            />

            <ApiItemCards
                baseUrl="http://localhost:5000/api"
                apiPath="items"
                onSelect={setSelectedItem}
            />

            {selectedItem && (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                    <h3 className="font-bold">کالای انتخاب‌شده:</h3>
                    <p>{selectedItem}</p>
                </div>
            )}
            <div className="p-6">
                <ApiItemTable
                    baseUrl="http://localhost:5000/api"
                    apiPath="items"
                    onSelect={setSelectedItem}
                />
                {selectedItem && (
                    <div className="mt-4 p-4 border rounded bg-gray-50">
                        <h3 className="font-bold">کالای انتخاب‌شده:</h3>
                        <p>{selectedItem}</p>
                    </div>
                )}
            </div>

            <div className="p-6">
                <ApiItemList
                    baseUrl="http://localhost:5000/api"
                    apiPath="items"
                    onSelect={setSelectedItem}
                />
                {selectedItem && (
                    <div className="mt-4 p-4 border rounded bg-gray-50">
                        <h3 className="font-bold">کالای انتخاب‌شده:</h3>
                        <p>{selectedItem}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
