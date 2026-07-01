import React, { useState, useRef, useEffect } from 'react';

const JalaliDatePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGregorian, setSelectedGregorian] = useState(null);
    const [displayJalali, setDisplayJalali] = useState("");
    const [currentYear, setCurrentYear] = useState(1404);
    const [currentMonth, setCurrentMonth] = useState(9);
    const [showYearSelector, setShowYearSelector] = useState(false);
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const pickerRef = useRef(null);

    // روزهای هفته
    const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    // نام ماه‌های شمسی
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    // ============ تبدیل شمسی به میلادی ============
    const jalaliToGregorian = (jy, jm, jd) => {
        try {
            jy = parseInt(jy);
            jm = parseInt(jm);
            jd = parseInt(jd);

            const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

            // محاسبه سال و روز جولین
            jy += 1595;
            let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4);

            for (let i = 0; i < (jm - 1); ++i) {
                days += j_days_in_month[i];
            }

            days += jd;

            // تبدیل روز جولین به میلادی
            let gy = 400 * Math.floor(days / 146097);
            days %= 146097;

            if (days > 36524) {
                gy += 100 * Math.floor(--days / 36524);
                days %= 36524;
                if (days >= 365) days++;
            }

            gy += 4 * Math.floor(days / 1461);
            days %= 1461;

            if (days > 365) {
                gy += Math.floor((days - 1) / 365);
                days = (days - 1) % 365;
            }

            let gd = days + 1;

            const sal_a = [0, 31,
                ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31
            ];

            let gm;
            for (gm = 0; gm < 13; gm++) {
                let v = sal_a[gm];
                if (gd <= v) break;
                gd -= v;
            }

            return new Date(gy, gm - 1, gd, 12, 0, 0);
        } catch (error) {
            console.error("خطا در تبدیل تاریخ:", error);
            return null;
        }
    };

    // ============ تبدیل میلادی به شمسی ============
    const gregorianToJalali = (date) => {
        try {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                return null;
            }

            const gy = date.getFullYear();
            const gm = date.getMonth() + 1;
            const gd = date.getDate();

            const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

            // سال کبیسه میلادی
            if ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) {
                gDaysInMonth[1] = 29;
            }

            const gy2 = gy - 1600;
            const gm2 = gm - 1;
            const gd2 = gd - 1;

            let gDayNo = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);

            for (let i = 0; i < gm2; ++i) {
                gDayNo += gDaysInMonth[i];
            }

            gDayNo += gd2;

            // تبدیل به شمسی
            let jDayNo = gDayNo - 79;
            let j_np = Math.floor(jDayNo / 12053);
            jDayNo %= 12053;

            let jy = 979 + 33 * j_np + 4 * Math.floor(jDayNo / 1461);
            jDayNo %= 1461;

            if (jDayNo >= 366) {
                jy += Math.floor((jDayNo - 1) / 365);
                jDayNo = (jDayNo - 1) % 365;
            }

            let jm, jd;
            for (let i = 0; i < 11; i++) {
                if (jDayNo >= jDaysInMonth[i]) {
                    jDayNo -= jDaysInMonth[i];
                } else {
                    jm = i + 1;
                    jd = jDayNo + 1;
                    break;
                }
            }

            if (!jm) {
                jm = 12;
                jd = jDayNo + 1;
            }

            return {
                year: jy,
                month: jm,
                day: jd,
                formatted: `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
            };
        } catch (error) {
            console.error("خطا در تبدیل به شمسی:", error);
            return null;
        }
    };

    // ============ محاسبه روزهای ماه ============
    const getDaysInJalaliMonth = (year, month) => {
        // ماه‌های 31 روزه (6 ماه اول)
        if (month <= 6) return 31;

        // ماه‌های 30 روزه (5 ماه بعدی)
        if (month <= 11) return 30;

        // اسفند (ماه 12) - محاسبه سال کبیسه
        const remainder = (year - 1396) % 33;
        const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
        return leapYears.includes(remainder) ? 30 : 29;
    };

    // ============ تولید تقویم کامل ماه ============
    const generateCalendar = () => {
        const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
        const todayJalali = gregorianToJalali(new Date());

        // پیدا کردن روز هفته برای روز اول ماه
        const firstDayGregorian = jalaliToGregorian(currentYear, currentMonth, 1);
        let firstDayWeek = firstDayGregorian ? firstDayGregorian.getDay() : 0; // 0=یکشنبه, 6=شنبه

        // تبدیل به جمعه=0, پنجشنبه=1, ..., شنبه=6
        firstDayWeek = (firstDayWeek + 1) % 7;

        const days = [];

        // سلول‌های خالی قبل از روز اول
        for (let i = 0; i < firstDayWeek; i++) {
            days.push({ day: null, isCurrentMonth: false });
        }

        // روزهای ماه جاری
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = todayJalali &&
                todayJalali.year === currentYear &&
                todayJalali.month === currentMonth &&
                todayJalali.day === day;

            const isSelected = displayJalali === `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

            days.push({
                day,
                isCurrentMonth: true,
                isToday,
                isSelected
            });
        }

        return days;
    };

    // ============ مقداردهی اولیه ============
    useEffect(() => {
        const today = new Date();
        const jalaliToday = gregorianToJalali(today);

        if (jalaliToday) {
            setCurrentYear(jalaliToday.year);
            setCurrentMonth(jalaliToday.month);
            setDisplayJalali(jalaliToday.formatted);
            setSelectedGregorian(today);

            if (onChange) {
                onChange(today);
            }
        }
    }, []);

    // ============ بستن با کلیک خارج ============
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowYearSelector(false);
                setShowMonthSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============ انتخاب تاریخ ============
    const selectDate = (day) => {
        const gregorianDate = jalaliToGregorian(currentYear, currentMonth, day);

        if (gregorianDate) {
            setSelectedGregorian(gregorianDate);
            setDisplayJalali(`${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`);

            if (onChange) {
                onChange(gregorianDate);
            }

            setIsOpen(false);
            setShowYearSelector(false);
            setShowMonthSelector(false);
        }
    };

    // ============ تغییر ماه ============
    const changeMonth = (increment) => {
        let newYear = currentYear;
        let newMonth = currentMonth + increment;

        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }

        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
        setShowYearSelector(false);
        setShowMonthSelector(false);
    };

    // ============ تغییر سال ============
    const changeYear = (increment) => {
        setCurrentYear(currentYear + increment);
        setShowYearSelector(false);
    };

    // ============ انتخاب امروز ============
    const selectToday = () => {
        const today = new Date();
        const jalaliToday = gregorianToJalali(today);

        if (jalaliToday) {
            setCurrentYear(jalaliToday.year);
            setCurrentMonth(jalaliToday.month);

            const gregorianDate = jalaliToGregorian(jalaliToday.year, jalaliToday.month, jalaliToday.day);
            if (gregorianDate) {
                setSelectedGregorian(gregorianDate);
                setDisplayJalali(jalaliToday.formatted);

                if (onChange) {
                    onChange(gregorianDate);
                }

                setIsOpen(false);
                setShowYearSelector(false);
                setShowMonthSelector(false);
            }
        }
    };

    // ============ تولید لیست سال‌ها (1300 تا 1450) ============
    const generateYearOptions = () => {
        const years = [];
        for (let year = 1300; year <= 1450; year++) {
            years.push(year);
        }
        return years;
    };

    // ============ انتخاب سال از جدول ============
    const selectYearFromTable = (year) => {
        setCurrentYear(year);
        setShowYearSelector(false);
    };

    // ============ انتخاب ماه از جدول ============
    const selectMonthFromTable = (month) => {
        setCurrentMonth(month);
        setShowMonthSelector(false);
    };

    // ============ تولید جدول سال‌ها (12x13) ============
    const generateYearTable = () => {
        const startYear = Math.floor(currentYear / 12) * 12;
        const yearTable = [];

        for (let i = 0; i < 12; i++) {
            const row = [];
            for (let j = 0; j < 13; j++) {
                const year = startYear + (i * 13) + j;
                if (year >= 1300 && year <= 1450) {
                    row.push(year);
                }
            }
            if (row.length > 0) {
                yearTable.push(row);
            }
        }

        return yearTable;
    };

    // ============ تولید جدول ماه‌ها (3x4) ============
    const generateMonthTable = () => {
        const monthTable = [];
        for (let i = 0; i < 3; i++) {
            const row = [];
            for (let j = 0; j < 4; j++) {
                const monthIndex = (i * 4) + j;
                if (monthIndex < 12) {
                    row.push({
                        index: monthIndex + 1,
                        name: months[monthIndex]
                    });
                }
            }
            monthTable.push(row);
        }
        return monthTable;
    };

    const calendarDays = generateCalendar();
    const yearTable = generateYearTable();
    const monthTable = generateMonthTable();

    return (
        <div className="relative inline-block" ref={pickerRef}>
            {/* فیلد نمایش تاریخ */}
            <div className="flex items-center">
                <input
                    type="text"
                    value={displayJalali || "انتخاب تاریخ"}
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    className="border rounded-r px-3 py-2 w-40 text-center cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="انتخاب تاریخ"
                />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-blue-500 text-white px-3 py-2 rounded-l border border-blue-500 hover:bg-blue-600 transition-colors"
                    type="button"
                >
                    📅
                </button>
            </div>

            {/* نمایش تاریخ میلادی */}
            {selectedGregorian && (
                <div className="mt-1 text-xs text-gray-600 text-center">
                    میلادی: {selectedGregorian.toISOString().split('T')[0]}
                </div>
            )}

            {/* پنل اصلی انتخاب تاریخ */}
            {isOpen && (
                <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-xl p-4 w-96 rtl">

                    {/* هدر - انتخاب سال و ماه */}
                    <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded">
                        {/* دکمه سال قبل */}
                        <button
                            onClick={() => changeYear(-1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                        >
                            ◀
                        </button>

                        {/* نمایش و انتخاب سال */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowYearSelector(!showYearSelector);
                                    setShowMonthSelector(false);
                                }}
                                className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-lg font-bold"
                            >
                                {currentYear}
                            </button>

                            {/* جدول انتخاب سال */}
                            {showYearSelector && (
                                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg p-2 w-64 z-50 max-h-60 overflow-y-auto">
                                    <div className="text-sm font-bold mb-2 text-center">انتخاب سال (1300-1450)</div>
                                    <table className="w-full text-center">
                                        <tbody>
                                            {yearTable.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {row.map((year, colIndex) => (
                                                        <td key={colIndex} className="p-1">
                                                            <button
                                                                onClick={() => selectYearFromTable(year)}
                                                                className={`w-10 h-8 text-xs rounded ${year === currentYear ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                                            >
                                                                {year}
                                                            </button>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* دکمه سال بعد */}
                        <button
                            onClick={() => changeYear(1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                        >
                            ▶
                        </button>

                        <div className="text-gray-400 mx-2">|</div>

                        {/* دکمه ماه قبل */}
                        <button
                            onClick={() => changeMonth(-1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                        >
                            ◀
                        </button>

                        {/* نمایش و انتخاب ماه */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowMonthSelector(!showMonthSelector);
                                    setShowYearSelector(false);
                                }}
                                className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-lg font-bold"
                            >
                                {months[currentMonth - 1]}
                            </button>

                            {/* جدول انتخاب ماه */}
                            {showMonthSelector && (
                                <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow-lg p-2 w-48 z-50">
                                    <div className="text-sm font-bold mb-2 text-center">انتخاب ماه</div>
                                    <table className="w-full text-center">
                                        <tbody>
                                            {monthTable.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {row.map((month, colIndex) => (
                                                        <td key={colIndex} className="p-1">
                                                            <button
                                                                onClick={() => selectMonthFromTable(month.index)}
                                                                className={`w-full py-2 text-sm rounded ${month.index === currentMonth ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                                            >
                                                                {month.name}
                                                            </button>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* دکمه ماه بعد */}
                        <button
                            onClick={() => changeMonth(1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                        >
                            ▶
                        </button>
                    </div>

                    {/* نمایش تاریخ انتخاب شده */}
                    <div className="mb-3 p-2 bg-blue-50 rounded text-center">
                        <div className="text-sm text-blue-700">تاریخ انتخاب شده:</div>
                        <div className="font-bold text-lg">{displayJalali}</div>
                        {selectedGregorian && (
                            <div className="text-xs text-green-600">
                                میلادی: {selectedGregorian.toISOString().split('T')[0]}
                            </div>
                        )}
                    </div>

                    {/* روزهای هفته */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map((day, index) => (
                            <div key={index} className="text-center text-sm font-medium text-gray-600 p-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* روزهای ماه */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {calendarDays.map((dayData, index) => (
                            <div key={index} className="h-8">
                                {dayData.day ? (
                                    <button
                                        onClick={() => selectDate(dayData.day)}
                                        className={`w-full h-full rounded text-sm transition-colors
                                            ${dayData.isToday ? 'bg-green-500 text-white font-bold' : ''}
                                            ${dayData.isSelected && !dayData.isToday ? 'bg-blue-500 text-white' : ''}
                                            ${!dayData.isToday && !dayData.isSelected ? 'hover:bg-gray-100 text-gray-700' : ''}
                                        `}
                                    >
                                        {dayData.day}
                                    </button>
                                ) : (
                                    <div className="w-full h-full"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* دکمه‌های عمل */}
                    <div className="flex justify-between pt-3 border-t">
                        <button
                            onClick={selectToday}
                            className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                            📅 امروز
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowYearSelector(false);
                                    setShowMonthSelector(false);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                            >
                                بازگشت
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowYearSelector(false);
                                    setShowMonthSelector(false);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                                تأیید
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JalaliDatePicker;