/**
 * mailer.js — Email Utility
 *
 * Configures Nodemailer to send OTP verification and password reset emails.
 * Defaults to logging to console if SMTP credentials are missing.
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTP = async (email, otp, type = 'verification') => {
  const isSetup = process.env.SMTP_USER && process.env.SMTP_PASS;

  const subjects = {
    verification: 'LayerForge 3D - Verify Your Email',
    reset: 'LayerForge 3D - Password Reset Code',
  };

  const htmls = {
    verification: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #8b5cf6;">Welcome to LayerForge 3D!</h2>
        <p>Thank you for registering. Please use the following 6-digit code to verify your email address. This code expires in 5 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    reset: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #ec4899;">Password Reset Request</h2>
        <p>We received a request to reset your password. Use the code below to set a new password. This code expires in 5 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `
  };

  const mailOptions = {
    from: `"LayerForge 3D" <${process.env.SMTP_USER || 'noreply@layerforge3d.com'}>`,
    to: email,
    subject: subjects[type],
    html: htmls[type],
  };

  if (!isSetup) {
    console.log(`\n=========================================`);
    console.log(`✉️  MOCK EMAIL SENT TO: ${email}`);
    console.log(`✉️  TYPE: ${type}`);
    console.log(`✉️  OTP CODE: ${otp}`);
    console.log(`=========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendOTP };
