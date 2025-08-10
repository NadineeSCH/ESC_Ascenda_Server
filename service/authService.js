const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.signup = async ({ name, email, phone, password, address }) => {
  if (!name || !email || !phone || !password || !address) {
    throw new Error("All fields (name, email, phone, password, address) are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const customer = await stripe.customers.create({ name, email, phone, 
      address: {
      line1: address, 
      country: 'SG' // Default country 
    },
    metadata: { source: 'hotel-booking-app' } });

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    stripeCustomerId: customer.id,
    address,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    stripeCustomerId: user.stripeCustomerId,
    address: user.address
  };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!email || !password) throw new Error("Email and password are required");
  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("Email and password must be strings");
  }
  if (!user) throw new Error("Invalid email or password");

  console.log("passwords debug", password, user.password);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      stripeCustomerId: user.stripeCustomerId,
      address: user.address
    },
  };
};