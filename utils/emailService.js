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
      from: `"Klinik Urban Animal" <${process.env.EMAIL_USER}>`,
      to: appointment.user.email,
      subject: 'Konfirmasi Janji Temu - Klinik Urban Animal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Janji Temu Dikonfirmasi!</h2>
          
          <p>Kepada ${appointment.user.name},</p>
          
          <p>Janji temu Anda telah berhasil dijadwalkan.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detail Janji Temu:</h3>
            <p><strong>Tanggal:</strong> ${formattedDate}</p>
            <p><strong>Waktu:</strong> ${appointment.appointmentTime}</p>
            <p><strong>Hewan:</strong> ${appointment.pet.name} (${appointment.pet.species})</p>
            <p><strong>Dokter Hewan:</strong> Dr. ${appointment.vet.name}</p>
            ${appointment.reason ? `<p><strong>Alasan:</strong> ${appointment.reason}</p>` : ''}
            <p><strong>Pembayaran:</strong> ${appointment.paymentMethod === 'pay_now' ? 'Dibayar Online' : 'Bayar di Klinik'}</p>
          </div>
          
          <p>Harap tiba 10 menit sebelum waktu janji temu yang dijadwalkan.</p>
          
          <p>Jika Anda perlu menjadwal ulang atau membatalkan, harap hubungi kami sesegera mungkin.</p>
          
          <p>Salam hangat,<br>Tim Klinik Urban Animal</p>
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
      from: `"Klinik Urban Animal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Kata Sandi Anda Telah Diatur Ulang - Klinik Urban Animal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Reset Kata Sandi oleh Administrator</h2>
          
          <p>Kepada ${name},</p>
          
          <p>Kata sandi Anda telah direset oleh administrator di Klinik Urban Animal.</p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Pemberitahuan Keamanan:</strong></p>
            <p style="margin: 5px 0 0 0;">Untuk alasan keamanan, harap ubah kata sandi ini segera setelah login.</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Kata Sandi Sementara Anda:</h3>
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
              Login Sekarang
            </a>
          </div>
          
          <div style="background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF;"><strong>Langkah Selanjutnya:</strong></p>
            <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1E40AF;">
              <li>Login dengan kata sandi sementara di atas</li>
              <li>Pergi ke Pengaturan</li>
              <li>Ubah kata sandi Anda menjadi sesuatu yang aman</li>
              <li>Jangan pernah membagikan kata sandi Anda kepada siapa pun</li>
            </ol>
          </div>
          
          <p>Jika Anda tidak meminta reset kata sandi ini, harap hubungi kami segera.</p>
          
          <p>Salam hangat,<br>Tim Klinik Urban Animal</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            Ini adalah email otomatis. Harap jangan membalas pesan ini. Untuk bantuan, harap hubungi kami di ${process.env.EMAIL_USER}.
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
      from: `"Klinik Urban Animal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Permintaan Reset Kata Sandi - Klinik Urban Animal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Permintaan Reset Kata Sandi</h2>
          
          <p>Kepada ${name},</p>
          
          <p>Anda telah meminta untuk mereset kata sandi akun Klinik Urban Animal Anda.</p>
          
          <p>Klik tombol di bawah untuk mereset kata sandi Anda:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
              style="background: linear-gradient(to right, #3B82F6, #06B6D4); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Reset Kata Sandi
            </a>
          </div>
          
          <p>Atau salin dan tempel tautan ini ke browser Anda:</p>
          <p style="background: #F3F4F6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p><strong>Tautan ini akan kedaluwarsa dalam 1 jam.</strong></p>
          
          <p>Jika Anda tidak meminta reset kata sandi, harap abaikan email ini dan kata sandi Anda akan tetap tidak berubah.</p>
          
          <p>Salam hangat,<br>Tim Klinik Urban Animal</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            Ini adalah email otomatis. Harap jangan membalas pesan ini.
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
