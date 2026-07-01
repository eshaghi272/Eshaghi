import { useState } from 'react';

export default function AccountGroupForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('نام گروه حساب الزامی است');
      return;
    }

    onSubmit({ name: name.trim() }, () => setName(''));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        نام گروه حساب:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="مثلاً دارایی‌ها"
        />
      </label>

      {error && (
        <div className="text-red-600 text-sm font-medium">{error}</div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
      >
        ثبت گروه
      </button>
    </form>
  );
}
