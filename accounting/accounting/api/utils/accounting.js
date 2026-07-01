import db from '../db.js';

export function getAccountSetting(key) {
  const stmt = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`);
  const row = stmt.get(key);
  return row?.settingValue || null;
}
