import { useEffect, useState } from 'react';
import axios from 'axios';

const SidebarItemManager = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    id: null,
    path: '',
    label: '',
    icon: '❓',
    group_key: '',
    order_index: 0,
    roles: 'admin,user',
    is_active: 1
  });

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/layout/sidebar');
      setItems(res.data);
    } catch (err) {
      console.error('❌ خطا در دریافت آیتم‌های سایدبار:', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? (checked ? 1 : 0) : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`http://localhost:5000/api/admin/sidebar/${form.id}`, form);
      } else {
        await axios.post('http://localhost:5000/api/admin/sidebar', form);
}
      setForm({ id: null, path: '', label: '', icon: '❓', group_key: '', order_index: 0, roles: 'admin,user', is_active: 1 });
      fetchItems();
    } catch (err) {
      console.error('❌ خطا در ذخیره آیتم:', err);
    }
  };

  const handleEdit = (item) => {
    setForm(item);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این آیتم مطمئن هستید؟')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/sidebar/${id}`);
      fetchItems();
    } catch (err) {
      console.error('❌ خطا در حذف آیتم:', err);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <h2 className="text-xl font-bold mb-4">مدیریت آیتم‌های سایدبار</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input name="label" value={form.label} onChange={handleChange} placeholder="عنوان" className="input" required />
        <input name="path" value={form.path} onChange={handleChange} placeholder="مسیر (مثلاً /ledger)" className="input" required />
        <input name="icon" value={form.icon} onChange={handleChange} placeholder="آیکون (مثلاً 📄)" className="input" />
        <input name="group_key" value={form.group_key} onChange={handleChange} placeholder="کلید گروه (مثلاً accounting)" className="input" />
        <input name="order_index" type="number" value={form.order_index} onChange={handleChange} placeholder="ترتیب نمایش" className="input" />
        <input name="roles" value={form.roles} onChange={handleChange} placeholder="نقش‌ها (مثلاً admin,user)" className="input" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" checked={form.is_active === 1} onChange={handleChange} />
          فعال
        </label>
        <button type="submit" className="btn btn-primary col-span-1 md:col-span-2">
          {form.id ? 'ویرایش آیتم' : 'افزودن آیتم'}
        </button>
      </form>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100 dark:bg-gray-700 text-right">
          <tr>
            <th className="p-2">عنوان</th>
            <th className="p-2">مسیر</th>
            <th className="p-2">گروه</th>
            <th className="p-2">آیکون</th>
            <th className="p-2">نقش‌ها</th>
            <th className="p-2">فعال؟</th>
            <th className="p-2">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.label}</td>
              <td className="p-2">{item.path}</td>
              <td className="p-2">{item.group_key}</td>
              <td className="p-2">{item.icon}</td>
              <td className="p-2">{item.roles}</td>
              <td className="p-2">{item.is_active ? '✅' : '❌'}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => handleEdit(item)} className="text-blue-600">ویرایش</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SidebarItemManager;
