import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendAppointmentEmail = async (appointment) => {
  try {
    const transporter = createTransporter();

    const appointmentDate = new Date(appointment.appointmentDate);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"PawCare Vet" <${process.env.EMAIL_USER}>`,
      to: appointment.user.email,
      subject: 'Appointment Confirmation - PawCare Vet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Appointment Confirmed!</h2>
          
          <p>Dear ${appointment.user.name},</p>
          
          <p>Your appointment has been successfully scheduled.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details:</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            <p><strong>Pet:</strong> ${appointment.pet.name} (${appointment.pet.species})</p>
            <p><strong>Veterinarian:</strong> Dr. ${appointment.vet.name}</p>
            ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
            <p><strong>Payment:</strong> ${appointment.paymentMethod === 'pay_now' ? 'Paid Online' : 'Pay at Clinic'}</p>
          </div>
          
          <p>Please arrive 10 minutes before your scheduled appointment time.</p>
          
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>PawCare Vet Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', appointment.user.email);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendPasswordResetByAdmin = async (email, name, tempPassword) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PawCare Vet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Has Been Reset - PawCare Vet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Password Reset by Administrator</h2>
          
          <p>Dear ${name},</p>
          
          <p>Your password has been reset by an administrator at PawCare Vet.</p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0;">For security reasons, please change this password immediately after logging in.</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Temporary Password:</h3>
            <p style="font-size: 24px; font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 4px; text-align: center; letter-spacing: 2px;">
              <strong>${tempPassword}</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: linear-gradient(to right, #3B82F6, #06B6D4); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Login Now
            </a>
          </div>
          
          <div style="background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF;"><strong>Next Steps:</strong></p>
            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1E40AF;">
              <li>Login with the temporary password above</li>
              <li>Go to Settings</li>
              <li>Change your password to something secure</li>
              <li>Never share your password with anyone</li>
            </ol>
          </div>
          
          <p>If you did not request this password reset, please contact us immediately.</p>
          
          <p>Best regards,<br>PawCare Vet Team</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            This is an automated email. Please do not reply to this message. For assistance, please contact us at ${process.env.EMAIL_USER}.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Admin password reset email sent to:', email);
  } catch (error) {
    console.error('Admin password reset email error:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PawCare Vet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - PawCare Vet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Password Reset Request</h2>
          
          <p>Dear ${name},</p>
          
          <p>You have requested to reset your password for your PawCare Vet account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(to right, #3B82F6, #06B6D4); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: #F3F4F6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
          <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          
          <p>Best regards,<br>PawCare Vet Team</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset email error:', error);
    throw error;
  }
};
