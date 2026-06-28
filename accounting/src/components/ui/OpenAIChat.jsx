import React, { useState } from "react";
import axios from "axios";

export default function OpenAIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  // اطلاعات تستی بیمار (می‌تونی از کانتکست یا API بگیری)
  const dummyPatient = {
    firstName: "حسن",
    lastName: "کریمی",
    age: 42,
    gender: "مرد",
    history: "بیمار از دو روز پیش دچار تب و لرز شده و سابقه آسم دارد.",
    symptoms: ["سرفه", "تب", "خستگی"],
    medications: ["استامینوفن", "آزیترومایسین"],
    vitals: {
      temperature: 38.5,
      heartRate: 92,
      bloodPressure: "130/85"
    },
    labs: {
      WBC: 12000,
      CRP: 45,
      ESR: 30
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        messages: newMessages,
      });

      const reply = res.data.choices[0].message.content;
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "❌ خطا در دریافت پاسخ از سرور. لطفاً اتصال را بررسی کنید.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-6 text-center">
        🤖 گفت‌وگو با هوش مصنوعی
      </h2>

      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-md shadow-sm whitespace-pre-wrap transition-all duration-300 ${
              msg.role === "user"
                ? "bg-blue-50 dark:bg-blue-900 text-right border-r-4 border-blue-400"
                : "bg-gray-100 dark:bg-gray-700 text-left border-l-4 border-green-400"
            }`}
          >
            <strong className="block mb-1 text-sm text-gray-600 dark:text-gray-300">
              {msg.role === "user" ? "شما" : "هوش مصنوعی"}
            </strong>
            {msg.content}
          </div>
        ))}
      </div>

      <textarea
        rows={3}
        className={inputClass}
        placeholder="سوال یا پیام خود را بنویسید..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "در حال ارسال..." : "ارسال"}
      </button>

      <button
        onClick={() => setShowInsight(true)}
        className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
      >
        دریافت نظر هوش مصنوعی درباره بیمار
      </button>
    </div>
  );
}
