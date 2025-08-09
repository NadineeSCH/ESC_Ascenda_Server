const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = authenticateToken;
