// server/src/seedAdmin.js
require('dotenv').config();
const db = require('./db');
const { hashPassword } = require('./utils/password');

(async () => {
  const email = 'admin@clinic.local';
  const exists = db.prepare('SELECT id FROM tblusers WHERE email = ?').get(email);
  if (exists) return console.log('Admin exists');

  const passwordHash = await hashPassword('Admin1234');
  db.prepare(`
    INSERT INTO tblusers (firstName, lastName, userName, email, passwordHash, role, status)
    VALUES ('Admin', 'Root', 'admin', ?, ?, 1, 'active')
  `).run(email, passwordHash);
  console.log('Admin created:', email);
})();
