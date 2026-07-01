// 📁 src/components/ui/Fdate.jsx
import React, { useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";

export default function Fdate() {
  const [FaDate, setFaDate] = useState("");
  
  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
      {/* <h2 className="text-2xl font-bold text-gray-800 mb-6">سیستم حقوق و دستمزد</h2> */}
      <DatePicker
                calendar={persian}
                locale={persian_en}
                value={FaDate}
                
                //  onChange={date()}
                 onChange={(date) => setFaDate(date.format("YYYY/MM/DD"))}
                inputClass="border rounded px-3 py-2 w-full"
                placeholder="انتخاب تاریخ "
              />
            </div>
    
  );
}