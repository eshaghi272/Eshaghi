export default function ItemCard({ item, onSelect }) {
    return (
        <div className="border rounded-lg shadow-md p-4 bg-white dark:bg-gray-800 hover:shadow-lg transition flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {item.itemName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    کد کالا: <strong>{item.itemCode}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    برند: {item.brand}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    مدل: {item.model}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    کشور سازنده: {item.originCountry}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    قیمت پایه: {item.basePrice.toLocaleString()} تومان
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    توضیحات: {item.description}
                </p>
            </div>

            {/* دکمه انتخاب */}
            <button
                onClick={() => onSelect?.(item.id)}
                className="mt-4 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
            >
                انتخاب کالا
            </button>
        </div>
    );
}
