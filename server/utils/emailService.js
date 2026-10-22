import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer transporter using Zoho SMTP environment variables
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.zoho.in';
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send Welcome Email on Account Creation
 */
export const sendWelcomeEmail = async ({ name, email }) => {
  try {
    const transporter = getTransporter();
    const fromAddress = `"Uravuu" <${process.env.SMTP_USER || 'admin@tarvinoinnovis.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Welcome to Uravuu | உங்கள் கணக்கு தொடங்கப்பட்டது',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #F7F3EB; padding: 30px; color: #432C20;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 25px; border: 1px solid #DDD1BF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 2px solid #EFE6D7; padding-bottom: 20px;">
              <h1 style="color: #B68A3D; margin: 0; font-size: 26px;">மொய் கணக்கு • Uravuu</h1>
              <p style="color: #7A6553; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Traditional Records • Digital Management</p>
            </div>
            
            <div style="padding: 25px 0;">
              <h2 style="color: #432C20; margin-top: 0;">Welcome, ${name}!</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #555;">
                Thank you for creating an account with <strong>Uravuu</strong>. Your account has been registered successfully with the email address: <strong>${email}</strong>.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #555;">
                You can now record event ledgers (Marriage, Seemantham, Temple events) and personal ledgers with ease and peace of mind.
              </p>
              
              <div style="background-color: #FAF7F0; border-left: 4px solid #B68A3D; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #432C20;">
                  <strong>Quick Tip:</strong> Keep your records accurate and export or review summary statements anytime from your dashboard.
                </p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #EFE6D7; padding-top: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">Uravuu • Tarvino Innovis</p>
              <p style="margin: 5px 0 0 0;">If you did not create this account, please ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    return false;
  }
};

/**
 * Send Password Reset OTP Email
 */
export const sendPasswordResetOtpEmail = async ({ name, email, otp }) => {
  try {
    const transporter = getTransporter();
    const fromAddress = `"Uravuu Support" <${process.env.SMTP_USER || 'admin@tarvinoinnovis.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Password Reset OTP | கடவுச்சொல் மாற்றுக் குறியீடு',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #F7F3EB; padding: 30px; color: #432C20;">
          <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 25px; border: 1px solid #DDD1BF; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 2px solid #EFE6D7; padding-bottom: 20px;">
              <h1 style="color: #B68A3D; margin: 0; font-size: 24px;">Uravuu • மொய் கணக்கு</h1>
              <p style="color: #7A6553; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Password Reset Request</p>
            </div>
            
            <div style="padding: 25px 0; text-align: center;">
              <h2 style="color: #432C20; margin-top: 0; font-size: 18px;">Hello ${name || 'User'},</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #555;">
                We received a request to reset the password for your Uravuu account. Use the following One-Time Password (OTP) to complete the reset:
              </p>
              
              <div style="display: inline-block; background-color: #FAF7F0; border: 2px dashed #B68A3D; border-radius: 10px; padding: 15px 30px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #432C20; font-family: monospace;">${otp}</span>
              </div>
              
              <p style="font-size: 13px; color: #888; margin: 10px 0 0 0;">
                This OTP is valid for <strong>15 minutes</strong>. Do not share this code with anyone.
              </p>
            </div>
            
            <div style="border-top: 1px solid #EFE6D7; padding-top: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">If you did not request this password reset, please secure your email account.</p>
              <p style="margin: 5px 0 0 0;">Uravuu Support</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reset OTP email:', error.message);
    throw error;
  }
};

/**
 * Send Sign-In Notification Email
 */
export const sendLoginNotificationEmail = async ({ name, email, ip, userAgent }) => {
  try {
    const transporter = getTransporter();
    const fromAddress = `"Uravuu Security" <${process.env.SMTP_USER || 'admin@tarvinoinnovis.com'}>`;
    const timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Security Alert: New Sign-In to Your Account | புதிய உள்நுழைவு',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #F7F3EB; padding: 30px; color: #432C20;">
          <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 25px; border: 1px solid #DDD1BF;">
            <div style="text-align: center; border-bottom: 2px solid #EFE6D7; padding-bottom: 15px;">
              <h2 style="color: #B68A3D; margin: 0; font-size: 22px;">Uravuu Security Alert</h2>
            </div>
            
            <div style="padding: 20px 0;">
              <p style="font-size: 14px; color: #432C20;">
                Hello <strong>${name || 'User'}</strong>,
              </p>
              <p style="font-size: 14px; color: #555; line-height: 1.5;">
                A new sign-in was detected for your account:
              </p>
              
              <ul style="font-size: 13px; color: #432C20; background: #FAF7F0; padding: 15px 25px; border-radius: 6px; list-style-type: square;">
                <li><strong>Account:</strong> ${email}</li>
                <li><strong>Date & Time:</strong> ${timeString} IST</li>
                ${ip ? `<li><strong>IP Address:</strong> ${ip}</li>` : ''}
              </ul>
              
              <p style="font-size: 12px; color: #777; line-height: 1.5; margin-top: 15px;">
                If this was you, no action is needed. If you did not sign in recently, please reset your password immediately.
              </p>
            </div>
            
            <div style="border-top: 1px solid #EFE6D7; padding-top: 15px; text-align: center; font-size: 11px; color: #999;">
              Uravuu Automated Security Notification
            </div>
          </div>
        </div>
      `,
    };

    // Send asynchronously without blocking the login response
    transporter.sendMail(mailOptions).catch((err) => {
      console.error('Non-blocking login notification error:', err.message);
    });
    return true;
  } catch (error) {
    console.error('Error in sendLoginNotificationEmail:', error.message);
    return false;
  }
};
