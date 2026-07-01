// api/utils/password.js
const bcrypt = require('bcryptjs');
const ROUNDS = 12;

async function hashPassword(plain) {
  return await bcrypt.hash(plain, ROUNDS);
}
async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
