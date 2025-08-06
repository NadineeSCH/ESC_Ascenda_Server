const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.exp <= Date.now() / 1000) {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.sendStatus(404).json({ error: "User not found" });

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = authenticateToken;
