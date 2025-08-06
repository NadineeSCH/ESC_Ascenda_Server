const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -__v -createdAt -updatedAt');
  if (!user) throw new Error('User not found');
  return user;
};

exports.updateProfile = async (userId, stripeCustomerId, updates) => {
  // Prevent unauthorized updates
  const allowedUpdates = ['name', 'email', 'phone', 'address'];
  const invalidUpdates = Object.keys(updates).filter(
    field => !allowedUpdates.includes(field)
  );

  if (invalidUpdates.length > 0) {
    throw new Error(`Invalid fields: ${invalidUpdates.join(', ')}`);
  }

  // Update Stripe customer if contact info changes
  if (updates.email || updates.phone || updates.address) {
    await stripe.customers.update(stripeCustomerId, {
      email: updates.email,
      phone: updates.phone,
      address: updates.address ? { line1: updates.address } : undefined
    });
  }

  // Update database
  return await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
};

exports.getPurchaseHistory = async (stripeCustomerId) => {
  const charges = await stripe.charges.list({
    customer: stripeCustomerId,
    limit: 100
  });

  return charges.data.map(charge => ({
    id: charge.id,
    amount: charge.amount / 100,
    currency: charge.currency,
    created: new Date(charge.created * 1000),
    description: charge.description || 'Hotel Booking',
    receipt_url: charge.receipt_url
  }));
};

exports.deleteAccount = async (userId, stripeCustomerId) => {
  // Cancel any active subscriptions first
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId
  });
  await Promise.all(
    subscriptions.data.map(sub => 
      stripe.subscriptions.del(sub.id)
    )
  );

  // Then delete the customer
  await stripe.customers.del(stripeCustomerId);

  // Finally delete the user
  await User.findByIdAndDelete(userId);

  return { success: true };
};