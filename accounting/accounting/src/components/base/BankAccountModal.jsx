import { useState } from "react";
import axios from "axios";

export default function BankAccountModal({ isOpen, onClose, onSuccess }) {
    const [bank, setBank] = useState({
        bankName: "",
        branchName: "",
        accountNumber: "",
        shebaNumber: "",
        cardNumber: "",
        accountType: "جاری",
        currency: "IRR",
        description: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
        setBank((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!bank.bankName || !bank.accountNumber) {
            setError("نام بانک و شماره حساب الزامی است");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await axios.post("http://localhost:5000/api/bankaccounts", bank);
            alert("✅ حساب بانکی با موفقیت ثبت شد");
            onSuccess();
            resetForm();
        } catch (err) {
            console.error("❌ خطا در ثبت حساب بانکی:", err);
            const errorMessage = err.response?.data?.message || "❌ خطا در ثبت حساب بانکی";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setBank({
            bankName: "",
            branchName: "",
            accountNumber: "",
            shebaNumber: "",
            cardNumber: "",
            accountType: "جاری",
            currency: "IRR",
            description: ""
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
                {/* هدر مودال */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">🏦</span>
                            ثبت حساب بانکی جدید
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

                    <div className="grid grid-cols-2 gap-4">
                        {/* فیلدهای اولیه */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                نام بانک *
                            </label>
                            <input
                                type="text"
                                value={bank.bankName}
                                onChange={(e) => handleChange("bankName", e.target.value)}
                                placeholder="مثلاً: ملی، ملت، صادرات"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                شعبه
                            </label>
                            <input
                                type="text"
                                value={bank.branchName}
                                onChange={(e) => handleChange("branchName", e.target.value)}
                                placeholder="نام شعبه"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                شماره حساب *
                            </label>
                            <input
                                type="text"
                                value={bank.accountNumber}
                                onChange={(e) => handleChange("accountNumber", e.target.value)}
                                placeholder="شماره حساب"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                شماره شبا
                            </label>
                            <input
                                type="text"
                                value={bank.shebaNumber}
                                onChange={(e) => handleChange("shebaNumber", e.target.value)}
                                placeholder="IR..."
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                شماره کارت
                            </label>
                            <input
                                type="text"
                                value={bank.cardNumber}
                                onChange={(e) => handleChange("cardNumber", e.target.value)}
                                placeholder="شماره ۱۶ رقمی کارت"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                نوع حساب
                            </label>
                            <select
                                value={bank.accountType}
                                onChange={(e) => handleChange("accountType", e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="جاری">جاری</option>
                                <option value="پس‌انداز">پس‌انداز</option>
                                <option value="کوتاه‌مدت">کوتاه‌مدت</option>
                                <option value="بلندمدت">بلندمدت</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                واحد پول
                            </label>
                            <select
                                value={bank.currency}
                                onChange={(e) => handleChange("currency", e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="IRR">ریال</option>
                                <option value="USD">دلار</option>
                                <option value="EUR">یورو</option>
                            </select>
                        </div>
                    </div>

                    {/* توضیحات */}
                    <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            توضیحات
                        </label>
                        <textarea
                            value={bank.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="توضیحات اضافی"
                            rows="2"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
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
                                    <span>🏦</span>
                                    ثبت حساب بانکی
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}