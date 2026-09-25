import nodemailer from 'nodemailer';

let transporterInstance = null;
let isEthereal = false;

/**
 * Khởi tạo hoặc lấy Transporter gửi Email
 * Hỗ trợ tự động fallback sang Ethereal Test Account nếu chưa cấu hình Gmail SMTP
 */
export const getEmailTransporter = async () => {
  if (transporterInstance) {
    return { transporter: transporterInstance, isEthereal };
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    isEthereal = false;
    console.log(`📧 [Nodemailer] Đã kết nối SMTP thực tế: ${host}:${port} (${user})`);
  } else {
    // Tự động tạo tài khoản kiểm thử Ethereal (Zero-config cho môi trường Dev)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporterInstance = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isEthereal = true;
      console.log(`📧 [Nodemailer] Chưa điền SMTP trong .env -> Đã tự động kích hoạt Ethereal Test Account: ${testAccount.user}`);
    } catch (err) {
      console.error('❌ [Nodemailer] Không thể tạo Ethereal test account:', err.message);
      // Fallback dummy transporter
      transporterInstance = nodemailer.createTransport({
        jsonTransport: true
      });
      isEthereal = true;
    }
  }

  return { transporter: transporterInstance, isEthereal };
};

/**
 * Gửi email và trả về thông tin kết quả kèm link xem trước (nếu là Ethereal)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const { transporter, isEthereal: isTest } = await getEmailTransporter();
  const from = process.env.EMAIL_FROM || '"TaskMaster Pro" <no-reply@taskmaster.pro>';

  const mailOptions = {
    from,
    to,
    subject,
    text: text || '',
    html
  };

  const info = await transporter.sendMail(mailOptions);
  let previewUrl = null;

  if (isTest) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📬 [Ethereal Mail Preview] Bấm để xem email trực tiếp trên web: ${previewUrl}`);
    }
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isEthereal: isTest
  };
};
