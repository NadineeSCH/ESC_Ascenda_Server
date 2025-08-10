const express = require('express');
const router = express.Router();
const profController = require('../controller/profController');
const authenticateToken = require('../middleware/authMiddleware');

// Profile routes
router.get('/get', authenticateToken, profController.getProfile);
router.patch('/patch', authenticateToken, profController.updateProfile);
router.delete('/delete', authenticateToken, profController.deleteAccount);

// Purchase history
router.get('/history', authenticateToken, profController.getPurchaseHistory);

module.exports = router;
