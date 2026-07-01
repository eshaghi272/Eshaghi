import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import bcrypt from 'bcrypt';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

//
// 🔐 الگوریتم پیش‌فرض پروژه: bcrypt
//

/**
 * هش کردن رمز عبور با bcrypt
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hash(plain) {
  return await bcrypt.hash(plain, 10);
}

/**
 * بررسی صحت رمز عبور با bcrypt
 * @param {string} plain
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
export async function verify(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

//
// 🧪 الگوریتم جایگزین: scrypt (برای پروژه‌هایی که امنیت بالاتر می‌خوان)
//

/**
 * هش کردن با scrypt
 * فرمت خروجی: v1$<saltHex>$<hashHex>
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashWithScrypt(plain) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, KEYLEN);
  return `v1$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`;
}

/**
 * بررسی صحت رمز با scrypt
 * @param {string} plain
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyWithScrypt(plain, stored) {
  const [v, saltHex, hashHex] = String(stored || '').split('$');
  if (v !== 'v1' || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(plain, salt, KEYLEN);

  return (
    expected.length === derived.length &&
    timingSafeEqual(expected, derived)
  );
}
