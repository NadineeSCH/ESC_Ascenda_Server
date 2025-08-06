const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD, // App password for Gmail, not your main password
  },
});

exports.sendOtp = async (email, otp) => {
  const info = await transporter.sendMail({
    from: `"Hotel Booking App" <${process.env.EMAIL_SENDER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  });

  console.log("Message sent: %s", info.messageId);
};
