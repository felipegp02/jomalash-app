const nodemailer = require('nodemailer');

function crearTransporte() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporte = crearTransporte();

// RF-02: enlace de un solo uso enviado al correo registrado.
async function enviarCorreoRecuperacion(destinatario, tokenCrudo) {
  const enlace = `${process.env.APP_URL}/restablecer?token=${tokenCrudo}`;

  if (!transporte) {
    // Sin SMTP configurado (entorno local): se deja constancia en consola
    // para poder probar el flujo sin depender de un proveedor de correo.
    console.log(`[mailer] SMTP no configurado. Enlace de recuperación para ${destinatario}: ${enlace}`);
    return;
  }

  await transporte.sendMail({
    from: process.env.SMTP_FROM,
    to: destinatario,
    subject: 'Recuperar contraseña - Jomalash',
    text: `Solicitaste recuperar tu contraseña. Este enlace expira pronto y solo puede usarse una vez:\n\n${enlace}\n\nSi no solicitaste esto, ignora este correo.`,
  });
}

module.exports = { enviarCorreoRecuperacion };
