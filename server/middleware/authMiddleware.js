const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Assign the entire decoded user object
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};