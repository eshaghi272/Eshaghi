import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// 📁 ساخت __dirname برای ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📁 آدرس فایل دیتابیس
const dbPath = path.resolve(__dirname, './database/accDb.db');

// 🎯 اتصال به دیتابیس با verbose برای لاگ‌گیری
let db;
try {
  db = new Database(dbPath, { verbose: console.log });
  console.log('✅ اتصال موفق به دیتابیس better-sqlite3 برقرار شد.');
} catch (err) {
  console.error('❌ خطا در اتصال به دیتابیس:', err.message);
  process.exit(1);
}

// ✅ فعال‌سازی foreign_keys
try {
  db.exec('PRAGMA foreign_keys = ON');
  console.log('✅ foreign_keys فعال شد.');
} catch (err) {
  console.error('❌ خطا در فعال‌سازی foreign_keys:', err.message);
}

export default db;
