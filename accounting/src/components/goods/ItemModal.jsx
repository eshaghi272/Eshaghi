import { useState } from "react";

export default function ItemModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        itemCode: "",
        itemName: "",
        unit: "",
        barcode: "",
        iranCode: "",
        brand: "",
        model: "",
        originCountry: "",
        itemType: "product",
        basePrice: "",
        taxRate: "",
        isActive: 1,
        itemGroupId: "",
        description: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.itemName || !formData.itemCode) {
            setError("نام کالا و کد کالا الزامی است");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload = {
            ...formData,
            itemCode: parseInt(formData.itemCode) || 0,
            basePrice: parseFloat(formData.basePrice) || 0,
            taxRate: parseFloat(formData.taxRate) || 0,
            itemGroupId: formData.itemGroupId ? parseInt(formData.itemGroupId) : null,
            isActive: formData.isActive ? 1 : 0
        };

        try {
            const res = await fetch("http://localhost:5000/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("✅ کالا با موفقیت ثبت شد");
                onSuccess();
                resetForm();
            } else {
                const errorText = await res.text();
                console.error("❌ خطا در ثبت کالا:", errorText);
                throw new Error("خطا در ثبت کالا");
            }
        } catch (err) {
            console.error("❌ خطا در ثبت:", err);
            setError(err.message || "❌ خطا در ثبت کالا");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            itemCode: "",
            itemName: "",
            unit: "",
            barcode: "",
            iranCode: "",
            brand: "",
            model: "",
            originCountry: "",
            itemType: "product",
            basePrice: "",
            taxRate: "",
            isActive: 1,
            itemGroupId: "",
            description: ""
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden">
                {/* هدر مودال */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">📦</span>
                            ثبت کالای جدید
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg"
                            disabled={isSubmitting}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* بدنه مودال */}
                <form onSubmit={handleSubmit} className="p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    <div className="max-h-[55vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            {/* فیلدهای اصلی */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    کد کالا *
                                </label>
                                <input
                                    type="number"
                                    value={formData.itemCode}
                                    onChange={(e) => handleChange("itemCode", e.target.value)}
                                    placeholder="کد کالا"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    نام کالا *
                                </label>
                                <input
                                    type="text"
                                    value={formData.itemName}
                                    onChange={(e) => handleChange("itemName", e.target.value)}
                                    placeholder="نام کالا"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    واحد
                                </label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => handleChange("unit", e.target.value)}
                                    placeholder="مثلاً: عدد، کیلوگرم"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    بارکد
                                </label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleChange("barcode", e.target.value)}
                                    placeholder="بارکد"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    ایران‌کد
                                </label>
                                <input
                                    type="text"
                                    value={formData.iranCode}
                                    onChange={(e) => handleChange("iranCode", e.target.value)}
                                    placeholder="ایران‌کد"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    برند
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => handleChange("brand", e.target.value)}
                                    placeholder="برند"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    مدل
                                </label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => handleChange("model", e.target.value)}
                                    placeholder="مدل"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    کشور سازنده
                                </label>
                                <input
                                    type="text"
                                    value={formData.originCountry}
                                    onChange={(e) => handleChange("originCountry", e.target.value)}
                                    placeholder="کشور سازنده"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    نوع کالا
                                </label>
                                <select
                                    value={formData.itemType}
                                    onChange={(e) => handleChange("itemType", e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="product">محصول</option>
                                    <option value="service">خدمت</option>
                                    <option value="package">بسته‌بندی</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    شناسه گروه
                                </label>
                                <input
                                    type="number"
                                    value={formData.itemGroupId}
                                    onChange={(e) => handleChange("itemGroupId", e.target.value)}
                                    placeholder="شناسه گروه"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    قیمت پایه
                                </label>
                                <input
                                    type="number"
                                    value={formData.basePrice}
                                    onChange={(e) => handleChange("basePrice", e.target.value)}
                                    placeholder="قیمت پایه"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    درصد مالیات
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.taxRate}
                                    onChange={(e) => handleChange("taxRate", e.target.value)}
                                    placeholder="درصد مالیات"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* توضیحات */}
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                توضیحات
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="توضیحات اضافی"
                                rows="2"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* چک‌باکس فعال بودن */}
                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive === 1}
                                    onChange={(e) => handleChange("isActive", e.target.checked ? 1 : 0)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">کالا فعال است</span>
                            </label>
                        </div>
                    </div>

                    {/* فوتر مودال */}
                    <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            disabled={isSubmitting}
                        >
                            لغو
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></span>
                                    در حال ثبت...
                                </>
                            ) : (
                                <>
                                    <span>📦</span>
                                    ثبت کالا
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}