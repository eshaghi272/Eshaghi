import React, { useRef } from 'react';

export default function ImageUploader({ imageUrl, onChange }) {
  const fileInputRef = useRef();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result); // درج لینک base64 در فرم
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="text-center mt-4" dir="rtl">
      {imageUrl && (
        <div className="mb-4">
          <img
            src={imageUrl}
            alt="پیش‌نمایش تصویر"
            className="w-32 h-auto rounded shadow mx-auto"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition"
      >
        انتخاب تصویر
      </button>

      {imageUrl && (
        <p className="text-sm text-gray-600 mt-2">تصویر انتخاب‌شده درج شد</p>
      )}
    </div>
  );
}
