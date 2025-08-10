const authService = require("../service/authService");
const { authenticator } = require("otplib");
const emailService = require("../service/emailService");
const validate = require("../service/validate");
const crypto = require("crypto");
const { type } = require("os");

const tempUsers = new Map(); // Replace with Redis if needed

const cleanupInterval=setInterval(() => {
  for (const [email, tempUser] of tempUsers) {
    if (tempUser.expiresAt < Date.now()) {
      tempUsers.delete(email);
    }
  }
}, 300000); //5min

const cleanup = () => {
  clearInterval(cleanupInterval);
  tempUsers.clear();
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    //check for missing fields, null values, or wrong types
    if (!name || !email || !phone || !password || !address) {
      throw new Error(
        "All fields (name, email, phone, password, address) are required"
      );
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      typeof address !== "string"
    ) {
      throw new Error("All fields must be strings");
    }

    await validate.validator({ name, phone, password });

    // const otp = crypto.randomInt(100000, 999999).toString(); // Random 6-digit number
    authenticator.generate = () => "1234";
    const otp = authenticator.generate("any_secret"); //forcing it to be always be 1234
    const OTP_EXPIRY = 300000; //5 mins in miliseconds
    tempUsers.set(email, {
      name,
      email,
      phone,
      password,
      address,
      otp,
      expiresAt: Date.now() + OTP_EXPIRY,
    });

    try {
      await emailService.sendOtp(email, otp);
      res.status(200).json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("OTP Email Error:", err);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
    return;
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json({ message: "Login successful", ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  //validate all inputs
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  if (typeof email !== "string" || typeof otp !== "string") {
    return res.status(400).json({ message: "Email and OTP must be strings" });
  }


  const tempUser = tempUsers.get(email);

  if (!tempUser || tempUser.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }
  if (tempUser.expiresAt < Date.now()) {
    tempUsers.delete(email);
    return res.status(400).json({ message: "OTP expired" });
  }

  try {
    const user = await authService.signup({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      address: tempUser.address,
    });

    tempUsers.delete(email);
    res
      .status(201)
      .json({ message: "User verified and account created", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//UNDO COMMENT BEFORE TESTING
exports.tempUsers = tempUsers; // Export the tempUsers map for testing
exports.cleanup = cleanup; // Export the cleanup function for testing