const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async ({ amount, customerId }) => {
  if (!amount || amount <= 0) throw new Error("Invalid amount.");
  if (!customerId) throw new Error("Missing Stripe customer ID.");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "sgd",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: {  // Store the address line in metadata
      billing_address: address
    }
  });

  return paymentIntent.client_secret;
};
