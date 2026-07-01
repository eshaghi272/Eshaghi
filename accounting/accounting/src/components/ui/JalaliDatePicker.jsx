import React, { useState, useRef, useEffect } from 'react';

const JalaliDatePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGregorian, setSelectedGregorian] = useState(null);
    const [displayJalali, setDisplayJalali] = useState("");
    const [inputValue, setInputValue] = useState(""); // مقدار ورودی از کیبورد
    const [isEditing, setIsEditing] = useState(false); // حالت ویرایش
    const [currentYear, setCurrentYear] = useState(1404);
    const [currentMonth, setCurrentMonth] = useState(9);
    const [showYearSelector, setShowYearSelector] = useState(false);
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [error, setError] = useState(""); // پیغام خطا
    const inputRef = useRef(null);
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

            // اعتبارسنجی اولیه
            if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1) {
                return null;
            }

            const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

            // اعتبارسنجی روزهای ماه
            const maxDays = (jm <= 6) ? 31 : (jm <= 11) ? 30 :
                ((jy - 1396) % 33) in [1, 5, 9, 13, 17, 22, 26, 30] ? 30 : 29;
            if (jd > maxDays) return null;

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

    // ============ بررسی و فرمت ورودی ============
    const validateAndParseInput = (value) => {
        // حذف فاصله و کاراکترهای اضافی
        const cleaned = value.replace(/\s/g, '');

        // الگوهای مختلف ورودی
        const patterns = [
            /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // 1403/01/01 یا 1403-01-01
            /^(\d{4})(\d{2})(\d{2})$/, // 14030101
            /^(\d{2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // 01/01/1403
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // 1/1/1403
        ];

        for (let pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match) {
                let year, month, day;

                if (pattern.source.includes('\\d{4}\\d{2}\\d{2}')) {
                    // فرمت 14030101
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else if (match[1].length === 4) {
                    // فرمت‌هایی که سال اول می‌آید
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else {
                    // فرمت‌هایی که روز اول می‌آید
                    day = parseInt(match[1]);
                    month = parseInt(match[2]);
                    year = parseInt(match[3]);
                }

                // تبدیل سال دو رقمی به چهار رقمی
                if (year < 100) {
                    year += 1300;
                }

                return { year, month, day };
            }
        }

        return null;
    };

    // ============ اعتبارسنجی تاریخ ============
    const validateDate = (year, month, day) => {
        if (year < 1300 || year > 1500) {
            return "سال باید بین 1300 تا 1500 باشد";
        }

        if (month < 1 || month > 12) {
            return "ماه باید بین 1 تا 12 باشد";
        }

        const daysInMonth = getDaysInJalaliMonth(year, month);
        if (day < 1 || day > daysInMonth) {
            return `روز باید بین 1 تا ${daysInMonth} برای ماه ${months[month - 1]} باشد`;
        }

        return null;
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
            setInputValue(jalaliToday.formatted);
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

                // اگر در حالت ویرایش بودیم، اعتبارسنجی انجام می‌دهیم
                if (isEditing) {
                    handleInputSubmit();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, inputValue]);

    // ============ انتخاب تاریخ ============
    const selectDate = (day) => {
        const gregorianDate = jalaliToGregorian(currentYear, currentMonth, day);

        if (gregorianDate) {
            setSelectedGregorian(gregorianDate);
            const formatted = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            setDisplayJalali(formatted);
            setInputValue(formatted);
            setError("");

            if (onChange) {
                onChange(gregorianDate);
            }

            setIsOpen(false);
            setShowYearSelector(false);
            setShowMonthSelector(false);
            setIsEditing(false);
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
                const formatted = jalaliToday.formatted;
                setDisplayJalali(formatted);
                setInputValue(formatted);
                setError("");

                if (onChange) {
                    onChange(gregorianDate);
                }

                setIsOpen(false);
                setShowYearSelector(false);
                setShowMonthSelector(false);
                setIsEditing(false);
            }
        }
    };

    // ============ پردازش ورودی کیبورد ============
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        setError("");

        // اگر کاربر در حال تایپ است، حالت ویرایش فعال می‌شود
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    // ============ اعمال ورودی کیبورد ============
    const handleInputSubmit = () => {
        if (!inputValue.trim()) {
            setError("لطفا تاریخ را وارد کنید");
            return;
        }

        const parsed = validateAndParseInput(inputValue);
        if (!parsed) {
            setError("فرمت تاریخ نامعتبر است. فرمت صحیح: 1403/01/01");
            return;
        }

        const error = validateDate(parsed.year, parsed.month, parsed.day);
        if (error) {
            setError(error);
            return;
        }

        const gregorianDate = jalaliToGregorian(parsed.year, parsed.month, parsed.day);
        if (!gregorianDate) {
            setError("تاریخ وارد شده معتبر نیست");
            return;
        }

        // اعمال تغییرات
        setSelectedGregorian(gregorianDate);
        const formatted = `${parsed.year}/${String(parsed.month).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}`;
        setDisplayJalali(formatted);
        setCurrentYear(parsed.year);
        setCurrentMonth(parsed.month);
        setError("");

        if (onChange) {
            onChange(gregorianDate);
        }

        setIsEditing(false);
    };

    // ============ کلیدهای کیبورد ============
    const handleKeyDown = (e) => {
        // Enter
        if (e.key === 'Enter') {
            handleInputSubmit();
            setIsOpen(false);
        }
        // Escape
        else if (e.key === 'Escape') {
            setInputValue(displayJalali);
            setError("");
            setIsEditing(false);
            setIsOpen(false);
        }
        // Tab
        else if (e.key === 'Tab') {
            if (!e.shiftKey) {
                handleInputSubmit();
            }
        }
    };

    // ============ تولید جدول سال‌ها ============
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

    // ============ تولید جدول ماه‌ها ============
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

    // ============ کلیدهای میانبر ============
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                selectToday();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const calendarDays = generateCalendar();
    const yearTable = generateYearTable();
    const monthTable = generateMonthTable();

    return (
        <div className="relative inline-block" ref={pickerRef}>
            {/* فیلد ورودی تاریخ */}
            <div className="flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={isEditing ? inputValue : displayJalali}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setIsEditing(true);
                        setIsOpen(true);
                    }}
                    onBlur={() => {
                        // تاخیر برای اجازه دادن به کلیک روی دکمه‌ها
                        setTimeout(() => {
                            if (isEditing) {
                                handleInputSubmit();
                            }
                        }, 200);
                    }}
                    className={`border rounded-r px-3 py-2 w-40 text-center cursor-text bg-white focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-300' : 'focus:ring-blue-300'
                        }`}
                    placeholder="مثال: 1403/01/01"
                    dir="ltr"
                />
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setTimeout(() => inputRef.current?.focus(), 100);
                        }
                    }}
                    className="bg-blue-500 text-white px-3 py-2 rounded-l border border-blue-500 hover:bg-blue-600 transition-colors"
                    type="button"
                    title="باز کردن تقویم"
                >
                    📅
                </button>
            </div>

            {/* نمایش خطا */}
            {error && (
                <div className="mt-1 text-xs text-red-600 text-center">
                    ⚠️ {error}
                </div>
            )}

            {/* نمایش تاریخ میلادی */}
            {selectedGregorian && !error && !isEditing && (
                <div className="mt-1 text-xs text-gray-600 text-center">
                    میلادی: {selectedGregorian.toISOString().split('T')[0]}
                </div>
            )}

            {/* راهنمای فرمت */}
            {isOpen && (
                <div className="mt-1 text-xs text-gray-500 text-center">
                    فرمت‌های قابل قبول: 1403/01/01 | 1403-01-01 | 14030101
                </div>
            )}

            {/* پنل اصلی انتخاب تاریخ */}
            {isOpen && (
                <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-xl p-4 w-96 rtl">
                    {/* هدر - ورودی دستی */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={`flex-1 border px-3 py-2 text-center rounded ${error ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="تایپ کنید..."
                                dir="ltr"
                            />
                            <button
                                onClick={handleInputSubmit}
                                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                title="اعمال تاریخ وارد شده"
                            >
                                ✓
                            </button>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center mb-2">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* هدر - انتخاب سال و ماه */}
                    <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded">
                        {/* دکمه سال قبل */}
                        <button
                            onClick={() => changeYear(-1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                            title="سال قبل"
                        >
                            ▶
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
                                                                onClick={() => {
                                                                    setCurrentYear(year);
                                                                    setShowYearSelector(false);
                                                                }}
                                                                className={`w-10 h-8 text-xs rounded ${year === currentYear
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'hover:bg-gray-100'
                                                                    }`}
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
                            title="سال بعد"
                        >
                            ◀
                        </button>

                        <div className="text-gray-400 mx-2">|</div>

                        {/* دکمه ماه قبل */}
                        <button
                            onClick={() => changeMonth(-1)}
                            className="px-2 py-1 text-gray-600 hover:text-blue-600"
                            title="ماه قبل"
                        >
                            
                            ▶
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
                                                                onClick={() => {
                                                                    setCurrentMonth(month.index);
                                                                    setShowMonthSelector(false);
                                                                }}
                                                                className={`w-full py-2 text-sm rounded ${month.index === currentMonth
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'hover:bg-gray-100'
                                                                    }`}
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
                            title="ماه بعد"
                        >
                            ◀
                           
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
                                        title={`انتخاب ${dayData.day} ${months[currentMonth - 1]}`}
                                    >
                                        {dayData.day}
                                    </button>
                                ) : (
                                    <div className="w-full h-full"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* دکمه‌های عمل
                    <div className="flex justify-between pt-3 border-t">
                        <div className="flex gap-2">
                            <button
                                onClick={selectToday}
                                className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                title="انتخاب تاریخ امروز (Ctrl+T)"
                            >
                                📅 امروز
                            </button>
                            <button
                                onClick={() => {
                                    setInputValue("");
                                    setError("");
                                    setIsEditing(true);
                                    inputRef.current?.focus();
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                                title="پاک کردن و تایپ مجدد"
                            >
                                ✏️ ویرایش
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setInputValue(displayJalali);
                                    setError("");
                                    setIsEditing(false);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                title="لغو تغییرات"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowYearSelector(false);
                                    setShowMonthSelector(false);
                                    setIsEditing(false);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                title="تأیید و بستن"
                            >
                                تأیید
                            </button>
                        </div>
                    </div> */}
                </div>
            )}
        </div>
    );
};

export default JalaliDatePicker;