import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'clinic_secret';

/**
 * امضای توکن با payload و کلید مخفی
 * @param {object} payload
 * @returns {string} JWT token
 */
export function sign(payload) {
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

/**
 * اعتبارسنجی توکن و استخراج payload
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verify(token) {
  return jwt.verify(token, secret);
}
