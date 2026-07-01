import { useEffect, useState } from 'react';
import axios from 'axios';

const GroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    id: null,
    groupKey: '',
    groupLabel: '',
    icon: '📁'
  });

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/layout/layout/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('❌ خطا در دریافت گروه‌ها:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`http://localhost:5000/api/layout/layout/groups/${form.id}`, form);
      } else {
        await axios.post('http://localhost:5000/api/layout/layout/groups', form);
      }
      setForm({ id: null, groupKey: '', groupLabel: '', icon: '📁' });
      fetchGroups();
    } catch (err) {
      console.error('❌ خطا در ذخیره گروه:', err);
    }
  };

  const handleEdit = (group) => {
    setForm(group);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این گروه مطمئن هستید؟')) return;
    try {
      await axios.delete(`http://localhost:5000/api/layout/layout/groups/${id}`);
      fetchGroups();
    } catch (err) {
      console.error('❌ خطا در حذف گروه:', err);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <h2 className="text-xl font-bold mb-4">مدیریت گروه‌ها</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input name="groupKey" value={form.groupKey} onChange={handleChange} placeholder="کلید گروه (مثلاً accounting)" className="input" required />
        <input name="groupLabel" value={form.groupLabel} onChange={handleChange} placeholder="عنوان فارسی گروه" className="input" required />
        <input name="icon" value={form.icon} onChange={handleChange} placeholder="آیکون (مثلاً 📦)" className="input" />
        <button type="submit" className="btn btn-primary col-span-1 md:col-span-2">
          {form.id ? 'ویرایش گروه' : 'افزودن گروه'}
        </button>
      </form>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100 dark:bg-gray-700 text-right">
          <tr>
            <th className="p-2">کلید</th>
            <th className="p-2">عنوان</th>
            <th className="p-2">آیکون</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id} className="border-t">
              <td className="p-2">{g.groupKey}</td>
              <td className="p-2">{g.groupLabel}</td>
              <td className="p-2">{g.icon}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => handleEdit(g)} className="text-blue-600">ویرایش</button>
                <button onClick={() => handleDelete(g.id)} className="text-red-600">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupManager;
