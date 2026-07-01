// api/utils/validators.js
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function normalizeUserName(u) {
  return String(u || '').trim().toLowerCase();
}
function validatePassword(pw) {
  const s = String(pw || '');
  // حداقل 8 کاراکتر، شامل حرف و عدد
  return s.length >= 8 && /[A-Za-zآ-ی]/.test(s) && /\d/.test(s);
}

module.exports = { normalizeEmail, normalizeUserName, validatePassword };
