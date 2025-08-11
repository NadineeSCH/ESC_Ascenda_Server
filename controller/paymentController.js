const paymentService = require("../service/paymentService");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, customerId, userId, address } = req.body;
    const clientSecret = await paymentService.createPaymentIntent({ amount, customerId, userId, address });
    res.send({ clientSecret });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
