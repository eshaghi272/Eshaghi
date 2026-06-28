import { useState } from "react";
import ApiItemCards from "./ApiItemCards";
import ApiItemList from "./ApiItemList";
import ApiItemTable from "./ApiItemTable";
import ApiDataTableEdit from "./ApiDataTableEdit";


export default function ApiTestPage() {
    
    return (
        <div className="p-6">

            <ApiDataTableEdit
                baseUrl="http://localhost:5000/api"
                apiPath="items"
                columns={[
                    { key: "itemCode", label: "کد کالا" },
                    { key: "itemName", label: "نام کالا" },
                    { key: "brand", label: "برند" },
                    { key: "basePrice", label: "قیمت" },
                ]}
            />

            <ApiDataTableEdit
                baseUrl="http://localhost:5000/api"
                apiPath="accounts"
                columns={[
                    { key: "TopCode", label: "کد حساب" },
                    { key: "TitleFa", label: "نام فارسی" },
                    { key: "TitleEn", label: "عنوان انگلیسی" },
                    { key: "Nature", label: "ماهیت" },
                ]}
            />

        </div>
    );
}
