import { useState } from 'react';

export default function GeneralLedgerForm({ groups = [], onSubmit }) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('نام حساب کل الزامی است');
    if (!groupId) return setError('انتخاب گروه حساب الزامی است');

    onSubmit(
      { name: name.trim(), group_id: Number(groupId) },
      () => {
        setName('');
        setGroupId('');
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          نام حساب کل
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="مثلاً موجودی نقدی"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          گروه حساب
        </label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="mt-1 w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">انتخاب کنید</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
      >
        ثبت حساب کل
      </button>
    </form>
  );
}
