import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendMail({ to, subject, text, html }) {
  if (!process.env.MAIL_USER) {
    // Mail disabled in local/dev
    return { messageId: 'disabled', preview: null };
  }
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'noreply@example.com',
    to,
    subject,
    text,
    html,
  });
  return info;
}


