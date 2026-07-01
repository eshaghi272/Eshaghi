// import React from "react";
// import { QRCodeCanvas } from "qrcode.react";

// export default function QRCodeExample() {
//     return (
//         <div>
//             <h3>onlineserco.com</h3>
//             <QRCodeCanvas value="https://onlineserco.com" size={128} />
//         </div>
//     );
// }
import React, { useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_fa";
import { QRCodeCanvas } from "qrcode.react";

export default function JalaliDatePicker() {
    const [value, setValue] = useState(new Date());

    return (
        <div>
                   <h3>onlineserco.com</h3>
                 <QRCodeCanvas value="https://onlineserco.com" size={128} />
            
        
            <DatePicker
                value={value}
                onChange={setValue}
                calendar={persian}
                locale={persian_en}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
            />
        
          </div>
       
    );
}
