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
      expand: ['data.payment_intent'] // Expand payment intent to get full metadata
    });
    return charges.data.map(charge => {
      // Get metadata from either the charge or the payment intent
      const metadata = charge.payment_intent?.metadata || charge.metadata || {};
      
      // Parse any stringified JSON fields in metadata
      const parsedMetadata = Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => {
          try {
            // Attempt to parse JSON strings (like stringified objects)
            return [key, typeof value === 'string' ? 
                   (value.startsWith('{') ? JSON.parse(value) : value) : 
                   value];
          } catch (e) {
            return [key, value]; // Return original if parsing fails
          }
        })
      );

    return {
        id: charge.id,
        amount: charge.amount / 100, // Convert cents to dollars
        currency: charge.currency.toUpperCase(),
        created: new Date(charge.created * 1000),
        description: charge.description || 'Payment',
        status: charge.status,
        receipt_url: charge.receipt_url,
        metadata: parsedMetadata,
        payment_method: charge.payment_method_details?.type,
        card_last4: charge.payment_method_details?.card?.last4
      };
    });
    
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
