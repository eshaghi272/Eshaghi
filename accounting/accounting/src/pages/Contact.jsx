import axios from 'axios';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await axios.post('http://localhost:5000/api/contact', formData);
    alert('✅ پیام شما با موفقیت ارسال شد!');
    setFormData({ name: '', email: '', message: '' });
  } catch (err) {
    console.error('❌ خطا در ارسال پیام:', err);
    alert('خطا در ارسال پیام');
  }
};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">تماس با ما</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* فرم تماس */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام کامل</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">پیام</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              ارسال پیام
            </button>
          </form>
        </div>

        {/* اطلاعات تماس */}
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">اطلاعات تماس</h3>
            <div className="space-y-3">
              <p className="flex items-center text-gray-600">
                <span className="ml-2">📧</span>
                info@example.com
              </p>
              <p className="flex items-center text-gray-600">
                <span className="ml-2">📞</span>
                ۰۲۱-۱۲۳۴۵۶۷۸
              </p>
              <p className="flex items-center text-gray-600">
                <span className="ml-2">📍</span>
                تهران، خیابان نمونه، پلاک ۱۲۳
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;