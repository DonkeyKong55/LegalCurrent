const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-very-strong-secret-key'; // MUST be the same as in server.js

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get the token from the "Bearer <token>" string

  if (token == null) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Attach the user payload to the request object
    next(); // Pass control to the next middleware or route handler
  });
};

module.exports = authenticateToken;