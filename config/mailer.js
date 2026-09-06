// config/mailer.js
const nodemailer = require('nodemailer');

// Configuración de transporte usando Ethereal (Ideal para pruebas y desarrollo libre de bloqueos)
const crearTransportador = async () => {
    // Genera una cuenta de prueba automática en Ethereal
    const cuentaPrueba = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true para puerto 465, false para otros puertos
        auth: {
            user: cuentaPrueba.user, // Usuario generado automáticamente
            pass: cuentaPrueba.pass, // Contraseña generada automáticamente
        },
    });

    return transporter;
};

module.exports = { crearTransportador };