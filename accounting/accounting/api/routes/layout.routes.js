// 📁 routes/layout.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

//
// 📌 مسیرهای عمومی برای تب‌های لایوت
//

/**
 * 📊 دریافت تب‌ها به‌صورت گروه‌بندی‌شده
 * GET /api/layout/tabs/grouped
 */
router.get('/tabs/grouped', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, tabLabel AS label, routePath AS "to", groupKey
      FROM tblTabs
      ORDER BY groupKey, id
    `).all();

    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.groupKey]) grouped[row.groupKey] = [];
      grouped[row.groupKey].push({ id: row.id, label: row.label, to: row.to });
    }

    res.json(grouped);
  } catch (err) {
    console.error('❌ خطا در دریافت تب‌های گروه‌بندی‌شده:', err.message);
    res.status(500).json({ error: 'خطا در دریافت تب‌ها' });
  }
});

/**
 * ✅ دریافت لیست تب‌ها
 * GET /api/layout/tabs
 */
router.get('/tabs', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, tabLabel AS label, routePath AS "to", groupKey
      FROM tblTabs
      ORDER BY id
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت تب‌ها:', err.message);
    res.status(500).json({ error: 'خطا در دریافت تب‌ها' });
  }
});

/**
 * ➕ افزودن تب جدید
 * POST /api/layout/tabs
 */
router.post('/tabs', (req, res) => {
  const { tabLabel, routePath, groupKey } = req.body;

  if (!tabLabel || !routePath || !groupKey) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }

  try {
    db.prepare(`
      INSERT INTO tblTabs (tabLabel, routePath, groupKey)
      VALUES (?, ?, ?)
    `).run(tabLabel, routePath, groupKey);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در افزودن تب:', err.message);
    res.status(500).json({ error: 'خطا در افزودن تب' });
  }
});

/**
 * ✏️ ویرایش تب موجود
 * PUT /api/layout/tabs/:id
 */
router.put('/tabs/:id', (req, res) => {
  const { id } = req.params;
  const { tabLabel, routePath, groupKey } = req.body;

  if (!tabLabel || !routePath || !groupKey) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }

  try {
    db.prepare(`
      UPDATE tblTabs
      SET tabLabel = ?, routePath = ?, groupKey = ?
      WHERE id = ?
    `).run(tabLabel, routePath, groupKey, id);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ویرایش تب:', err.message);
    res.status(500).json({ error: 'خطا در ویرایش تب' });
  }
});

/**
 * 🗑 حذف تب
 * DELETE /api/layout/tabs/:id
 */
router.delete('/tabs/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare(`DELETE FROM tblTabs WHERE id = ?`).run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در حذف تب:', err.message);
    res.status(500).json({ error: 'خطا در حذف تب' });
  }
});


router.get('/sidebar', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT path, label, icon
      FROM tblsidebar_items
      WHERE is_active = 1
      ORDER BY order_index ASC
    `).all();
    res.json(items);
  } catch (err) {
    console.error('❌ خطا در دریافت آیتم‌های سایدبار:', err);
    res.status(500).json({ error: 'خطا در دریافت آیتم‌ها' });
  }
});

router.get('/layout/sidebar', (req, res) => {
  const role = req.query.role || 'user';

  const rows = db.prepare(`
    SELECT path, label, icon, group_key, roles
    FROM tblsidebar_items
    WHERE is_active = 1
    ORDER BY order_index
  `).all();

  const filtered = rows.filter(item => {
    const allowedRoles = item.roles?.split(',').map(r => r.trim());
    return allowedRoles?.includes(role);
  });

  res.json(filtered);
});

router.get('/layout/tabs/grouped', (req, res) => {
  const role = req.query.role || 'user';

  const rows = db.prepare(`
    SELECT tabLabel, routePath, groupKey, roles
    FROM tblTabs
    ORDER BY id
  `).all();

  const grouped = {};
  for (const row of rows) {
    const allowedRoles = row.roles?.split(',').map(r => r.trim());
    if (!allowedRoles?.includes(role)) continue;

    const group = row.groupKey;
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push({
      label: row.tabLabel,
      to: row.routePath
    });
  }

  res.json(grouped);
});

// GET all tabs
router.get('/layout/tabs', (req, res) => {
  const rows = db.prepare('SELECT * FROM tblTabs ORDER BY id').all();
  res.json(rows);
});

// POST new tab
router.post('/layout/tabs', (req, res) => {
  const { tabLabel, routePath, groupKey, roles } = req.body;
  const stmt = db.prepare('INSERT INTO tblTabs (tabLabel, routePath, groupKey, roles) VALUES (?, ?, ?, ?)');
  const info = stmt.run(tabLabel, routePath, groupKey, roles);
  res.json({ id: info.lastInsertRowid });
});

// PUT update tab
router.put('/layout/tabs/:id', (req, res) => {
  const { tabLabel, routePath, groupKey, roles } = req.body;
  const stmt = db.prepare('UPDATE tblTabs SET tabLabel = ?, routePath = ?, groupKey = ?, roles = ? WHERE id = ?');
  stmt.run(tabLabel, routePath, groupKey, roles, req.params.id);
  res.sendStatus(200);
});

// DELETE tab
router.delete('/layout/tabs/:id', (req, res) => {
  db.prepare('DELETE FROM tblTabs WHERE id = ?').run(req.params.id);
  res.sendStatus(200);
});

// GET all sidebar items
router.get('/layout/sidebar', (req, res) => {
  const rows = db.prepare('SELECT * FROM tblsidebar_items ORDER BY order_index').all();
  res.json(rows);
});

// POST new item
router.post('/layout/sidebar', (req, res) => {
  const { path, label, icon, group_key, order_index, roles, is_active } = req.body;
  const stmt = db.prepare(`
    INSERT INTO tblsidebar_items (path, label, icon, group_key, order_index, roles, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(path, label, icon, group_key, order_index, roles, is_active);
  res.json({ id: info.lastInsertRowid });
});

// PUT update item
router.put('/layout/sidebar/:id', (req, res) => {
  const { path, label, icon, group_key, order_index, roles, is_active } = req.body;
  db.prepare(`
    UPDATE tblsidebar_items
    SET path = ?, label = ?, icon = ?, group_key = ?, order_index = ?, roles = ?, is_active = ?
    WHERE id = ?
  `).run(path, label, icon, group_key, order_index, roles, is_active, req.params.id);
  res.sendStatus(200);
});

// DELETE item
router.delete('/layout/sidebar/:id', (req, res) => {
  db.prepare('DELETE FROM tblsidebar_items WHERE id = ?').run(req.params.id);
  res.sendStatus(200);
});

// GET all groups
router.get('/layout/groups', (req, res) => {
  const rows = db.prepare('SELECT * FROM tbltabGroups ORDER BY id').all();
  res.json(rows);
});

// POST new group
router.post('/layout/groups', (req, res) => {
  const { groupKey, groupLabel, icon } = req.body;
  const stmt = db.prepare('INSERT INTO tbltabGroups (groupKey, groupLabel, icon) VALUES (?, ?, ?)');
  const info = stmt.run(groupKey, groupLabel, icon);
  res.json({ id: info.lastInsertRowid });
});

// PUT update group
router.put('/layout/groups/:id', (req, res) => {
  const { groupKey, groupLabel, icon } = req.body;
  db.prepare('UPDATE tbltabGroups SET groupKey = ?, groupLabel = ?, icon = ? WHERE id = ?')
    .run(groupKey, groupLabel, icon, req.params.id);
  res.sendStatus(200);
});

// DELETE group
router.delete('/layout/groups/:id', (req, res) => {
  db.prepare('DELETE FROM tbltabGroups WHERE id = ?').run(req.params.id);
  res.sendStatus(200);
});

export default router;
