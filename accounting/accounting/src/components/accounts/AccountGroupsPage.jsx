import React, { useEffect, useState } from "react";

function AccountGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    GroupCode: "",
    TitleFa: "",
    TitleEn: "",
    Type: "گروه",
  });
  const [editId, setEditId] = useState(null);

  // گرفتن داده‌ها از API
  const fetchGroups = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/accountgroups");
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("خطا در دریافت گروه‌ها:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // تغییر ورودی فرم
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // افزودن یا ویرایش
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetch(`http://127.0.0.1:5000/api/accountgroups/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setEditId(null);
      } else {
        await fetch("http://127.0.0.1:5000/api/account-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setForm({ GroupCode: "", TitleFa: "", TitleEn: "", Type: "گروه" });
      fetchGroups();
    } catch (error) {
      console.error("خطا در ذخیره گروه:", error);
    }
  };

  // حذف
  const handleDelete = async (id) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;
    await fetch(`http://127.0.0.1:5000/api/accountgroups/${id}`, {
      method: "DELETE",
    });
    fetchGroups();
  };

  // پر کردن فرم برای ویرایش
  const handleEdit = (group) => {
    setForm(group);
    setEditId(group.GroupCode);
  };

  if (loading) return <p>در حال بارگذاری گروه‌ها...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📂 مدیریت گروه حساب‌ها</h2>

      {/* فرم افزودن/ویرایش */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          name="GroupCode"
          placeholder="کد گروه"
          value={form.GroupCode}
          onChange={handleChange}
          required
        />
        <input
          name="TitleFa"
          placeholder="عنوان فارسی"
          value={form.TitleFa}
          onChange={handleChange}
          required
        />
        <input
          name="TitleEn"
          placeholder="عنوان انگلیسی"
          value={form.TitleEn}
          onChange={handleChange}
        />
        <input
          name="Type"
          placeholder="نوع (گروه/کل/تفصیلی)"
          value={form.Type}
          onChange={handleChange}
        />
        <button type="submit">{editId ? "ویرایش" : "افزودن"}</button>
      </form>

      {/* جدول گروه‌ها */}
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>کد گروه</th>
            <th>عنوان فارسی</th>
            <th>عنوان انگلیسی</th>
            <th>نوع</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.GroupCode}>
              <td>{group.GroupCode}</td>
              <td>{group.TitleFa}</td>
              <td>{group.TitleEn}</td>
              <td>{group.Type}</td>
              <td>
                <button onClick={() => handleEdit(group)}>✏️ ویرایش</button>
                <button onClick={() => handleDelete(group.GroupCode)}>🗑️ حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AccountGroupsPage;
