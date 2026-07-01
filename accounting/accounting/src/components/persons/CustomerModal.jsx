import { useState } from "react";
import FdatePicker from "../ui/FdatePicker";

export default function CustomerModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        nationalCode: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        birthDate: "",
        gender: "0",
        address: "",
        postalCode: "",
        companyName: "",
        economicCode: "",
        isSeller: 0,
        isLegalEntity: 0
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
   
    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (value) => {
        const birthDate = String(value || "");
        setFormData({ ...formData , birthDate: birthDate });
        
      };
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nationalCode || !formData.firstName || !formData.lastName) {
            alert("نام، نام خانوادگی و کد ملی الزامی هستند");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("http://localhost:5000/api/persons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)

            });

            if (res.ok) {
                alert("✅ مشتری با موفقیت ثبت شد");
                onSuccess();
                resetForm();
            } else {
                const error = await res.text();
                console.error("❌ خطا در ثبت مشتری:", error);
                alert("❌ خطا در ثبت مشتری");
            }
        } catch (err) {
            console.error("❌ خطای شبکه:", err);
            alert("❌ خطای شبکه یا سرور");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nationalCode: "",
            firstName: "",
            lastName: "",
            phoneNumber: "",
            email: "",
            birthDate: "",
            gender: "0",
            address: "",
            postalCode: "",
            companyName: "",
            economicCode: "",
            isSeller: 0,
            isLegalEntity: 0
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                {/* هدر مودال */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            ➕ ثبت مشتری جدید
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* بدنه مودال */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* اطلاعات اصلی */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    کد ملی *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nationalCode}
                                    onChange={(e) => handleChange("nationalCode", e.target.value)}
                                    placeholder="کد ملی"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    جنسیت
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => handleChange("gender", e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                >
                                    <option value="0">نامشخص</option>
                                    <option value="1">مرد</option>
                                    <option value="2">زن</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    نام *
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                    placeholder="نام"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    نام خانوادگی *
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    placeholder="نام خانوادگی"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    required
                                />
                            </div>
                        </div>

                        {/* اطلاعات تماس */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    تلفن
                                </label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                                    placeholder="تلفن"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    کد پستی
                                </label>
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={(e) => handleChange("postalCode", e.target.value)}
                                    placeholder="کد پستی"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                ایمیل
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="ایمیل"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                آدرس
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                placeholder="آدرس"
                                rows="2"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
                            />
                        </div>

                        {/* اطلاعات اضافی */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                تاریخ تولد
                            </label>
                    <FdatePicker
                        value={formData.birthDate}
                         onChange={handleDateChange}
                       
                    />
                        </div>

                        {/* اطلاعات حقوقی */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    نام شرکت
                                </label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange("companyName", e.target.value)}
                                    placeholder="نام شرکت"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    شماره اقتصادی
                                </label>
                                <input
                                    type="text"
                                    value={formData.economicCode}
                                    onChange={(e) => handleChange("economicCode", e.target.value)}
                                    placeholder="شماره اقتصادی"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        {/* چک‌باکس‌ها */}
                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                وضعیت‌ها
                            </label>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSeller === 1}
                                        onChange={(e) => handleChange("isSeller", e.target.checked ? 1 : 0)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">فروشنده</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isLegalEntity === 1}
                                        onChange={(e) => handleChange("isLegalEntity", e.target.checked ? 1 : 0)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">شخص حقوقی</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* فوتر مودال */}
                    <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            disabled={isSubmitting}
                        >
                            لغو
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                    در حال ثبت...
                                </>
                            ) : (
                                "ثبت مشتری"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}