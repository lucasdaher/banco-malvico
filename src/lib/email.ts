import nodemailer from "nodemailer";

// Configuração do "transporter" do Nodemailer usando o serviço do Gmail
// Ele usará as credenciais do seu arquivo .env.local
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendOtpEmailParams {
  to: string;
  otp: string;
}

/**
 * Envia um e-mail com o código OTP para o destinatário.
 * @param to - O e-mail do destinatário.
 * @param otp - O código de 6 dígitos a ser enviado.
 */
export async function sendOtpEmail({ to, otp }: SendOtpEmailParams) {
  const mailOptions = {
    from: `"Banco Malvader" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: `Seu Código de Acesso Único (OTP)`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2 style="color: #dc2626;">Seu Código de Verificação</h2>
        <p>Olá,</p>
        <p>Use o código abaixo para concluir seu login no <strong style="color: #dc2626;">Banco Malvader</strong>.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">
          ${otp}
        </p>
        <p>Este código é válido por 5 minutos.</p>
        <p style="font-size: 0.9em; color: #777;">Se você não solicitou este código, por favor, ignore este e-mail.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ E-mail de OTP enviado com sucesso para ${to}`);
  } catch (error) {
    console.error(`Falha ao enviar e-mail para ${to}:`, error);
    throw new Error("Não foi possível enviar o e-mail de verificação.");
  }
}
