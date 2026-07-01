import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ContactMessagesAdmin() {
  const [messages, setMessages] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/contact/messages')
      .then(res => setMessages(res.data))
      .catch(() => setStatus('خطا در دریافت پیام‌ها'));
  }, []);

  const handleReplyChange = (id, value) => {
    setReplyMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleReplySubmit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/contact/messages/${id}/reply`, {
        reply: replyMap[id]
      });
      setStatus('✅ پاسخ ثبت شد');
    } catch {
      setStatus('❌ خطا در ثبت پاسخ');
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 p-6 bg-white dark:bg-gray-800 rounded shadow" dir="rtl">
      <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-400">مدیریت پیام‌های تماس</h2>

      {status && <div className="mb-4 text-sm text-green-600 dark:text-green-400">{status}</div>}

      {messages.map((msg) => (
        <div key={msg.id} className="border-b py-4 space-y-2">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <strong>نام:</strong> {msg.name} | <strong>ایمیل:</strong> {msg.email}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>پیام:</strong> {msg.message}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>تاریخ:</strong> {msg.createdAt}
          </div>

          <textarea
            rows={3}
            placeholder="پاسخ شما..."
            value={replyMap[msg.id] || msg.reply || ''}
            onChange={(e) => handleReplyChange(msg.id, e.target.value)}
            className="w-full mt-2 px-3 py-2 border rounded dark:bg-gray-900 dark:text-white"
          />

          <button
            onClick={() => handleReplySubmit(msg.id)}
            className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
          >
            ثبت پاسخ
          </button>
        </div>
      ))}
    </div>
  );
}
