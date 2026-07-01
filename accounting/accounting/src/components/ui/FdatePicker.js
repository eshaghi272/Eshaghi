import React from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function FdatePicker({
    value,
    onChange,
    format = "YYYY/MM/DD",
    digits = false,
    calendarPosition = "bottom-right",
    className = "",
    placeholder = "تاریخ را انتخاب کنید",
    showTodayDefault = true,
    height = "42px",
}) {
    
    // ایجاد تاریخ امروز برای نمایش پیش‌فرض
    const getDefaultValue = () => {
        if (value) return value;
        if (showTodayDefault) {
            const today = new Date();
            return new DateObject({
                date: today,
                calendar: persian,
                locale: persian_fa,
            });
        }
        return null;
    };

    return (
        <div className="w-full">
            <DatePicker
                value={getDefaultValue()}
                onChange={onChange}
                calendar={persian}
                locale={persian_fa}
                format={format}
                digits={digits}
                calendarPosition={calendarPosition}
                placeholder={placeholder}
                // استایل‌های سفارشی
                style={{
                    width: "100%",
                    height: height, // ارتفاع قابل تنظیم
                    fontSize: "16px",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                }}
                containerStyle={{
                    width: "100%",
                }}
                inputClass="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                className={`${className}`}
            />
        </div>
    );
}