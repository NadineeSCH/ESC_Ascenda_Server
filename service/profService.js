const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -__v -createdAt -updatedAt');
  if (!user) throw new Error('User not found');
  return user;
};

exports.updateProfile = async (userId, stripeCustomerId, updates) => {
  const allowedUpdates = ['name', 'email', 'phone', 'address'];
  const invalidFields = Object.keys(updates).filter(
    field => !allowedUpdates.includes(field)
  );
  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
  }

  // Prepare Stripe update payload
  const stripePayload = {};
  if (updates.email) stripePayload.email = updates.email;
  if (updates.phone) stripePayload.phone = updates.phone;
  if (updates.address) {
    stripePayload.address = typeof updates.address === 'object'
      ? updates.address
      : { line1: updates.address };
  }

  if (Object.keys(stripePayload).length > 0) {
    await stripe.customers.update(stripeCustomerId, stripePayload);
  }

  // Update MongoDB
  return await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
};

exports.getPurchaseHistory = async (stripeCustomerId) => {
  try {
    const charges = await stripe.charges.list({
      customer: stripeCustomerId,
      limit: 100,
      expand: ['data.invoice'] // Optional: expand related objects
    });

    return charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount, 
      currency: charge.currency,
      created: new Date(charge.created * 1000), // Convert timestamp to Date
      description: charge.description || 'Payment',
      status: charge.status,
      receipt_url: charge.receipt_url,
      data: charge.metadata
    }));
    
  } catch (err) {
    console.error('Stripe API error:', err);
    throw new Error('Failed to retrieve purchase history');
  }
};

exports.deleteAccount = async (userId, stripeCustomerId) => {

  // Delete Stripe customer
  await stripe.customers.del(stripeCustomerId);

  // Delete user from MongoDB
  await User.findByIdAndDelete(userId);
};
