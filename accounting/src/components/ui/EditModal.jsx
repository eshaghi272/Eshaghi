import { useState } from "react";

export default function EditModal({ isOpen, onClose, item, columns, onSave }) {
    const [formData, setFormData] = useState(item);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setError(null); // پاک کردن خطا هنگام تغییر
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await onSave(item.id, formData);
            // اگر موفق بود، مودال بسته می‌شود
        } catch (err) {
            setError(err.message || "خطا در ذخیره تغییرات");
            // مودال نبسته می‌شود تا کاربر بتواند اصلاح کند
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // فیلتر کردن ستون‌هایی که باید نمایش داده شوند
    const displayColumns = columns.filter(col => !col.key.startsWith('_') && col.key !== 'id');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden">
                {/* هدر مودال */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            ویرایش اطلاعات
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg"
                            disabled={isSaving}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* بدنه مودال */}
                <form onSubmit={handleSubmit} className="p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="max-h-[55vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            {displayColumns.map((col) => (
                                <div
                                    key={col.key}
                                    className={col.key.includes('address') || col.key.includes('description') ? 'col-span-2' : ''}
                                >
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        {col.label}
                                    </label>
                                    {col.key.includes('address') || col.key.includes('description') ? (
                                        <textarea
                                            value={formData[col.key] || ""}
                                            onChange={(e) => handleChange(col.key, e.target.value)}
                                            rows="2"
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData[col.key] || ""}
                                            onChange={(e) => handleChange(col.key, e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* فوتر مودال */}
                    <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            disabled={isSaving}
                        >
                            لغو
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></span>
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    ذخیره
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}