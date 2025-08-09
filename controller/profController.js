const profService = require('../services/profService');

exports.getProfile = async (req, res) => {
  try {
    const profile = await profService.getProfile(req.user._id);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updatedProfile = await profService.updateProfile(
      req.user._id,
      req.user.stripeCustomerId,
      req.body
    );
    res.json(updatedProfile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPurchaseHistory = async (req, res) => {
  try {
    const history = await profService.getPurchaseHistory(req.user.stripeCustomerId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await profService.deleteAccount(req.user._id, req.user.stripeCustomerId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({
      error: 'Account deletion failed',
      details: err.message
    });
  }
};
