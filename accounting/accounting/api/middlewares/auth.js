// api/middleware/auth.js
const { verify } = require('../core/jwt');

function auth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ message: 'نیاز به ورود دارید' });

  try {
    req.user = verify(token);
    next();
  } catch {
    res.status(401).json({ message: 'توکن نامعتبر' });
  }
}

module.exports = auth;
