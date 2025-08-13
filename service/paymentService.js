const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

exports.createPaymentIntent = async ({ amount, customerId, userId, metadata }) => {
  if (!amount || amount <= 0) throw new Error("Invalid amount.");
  if (!customerId) throw new Error("Missing Stripe customer ID.");
  if (!userId) throw new Error("Missing user ID.");

 try {
    // 1. Find the user to get their address
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");


    // 2. Create payment intent with user's address
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,  // Note: amount should be in cents (e.g., $10 = 1000)
      currency: "sgd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { 
      ...metadata,
      billing_address: user.address || "Not provided" 
    },

    });

    return paymentIntent.client_secret;
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    throw new Error(error.message);
  }
};
