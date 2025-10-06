const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = (req, res) => {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos" });
    }

    /*
Para efectos de depuración: imprime la contraseña recibida y su hash (solo para pruebas), les puede ayudar para su usuario
     bcrypt.hash(contrasena, 10, (err, hash) => {
    if (err) {
        console.error("Error al hashear la contraseña:", err);
    } else {
        console.log("Contraseña recibida:", contrasena);
        console.log("Contraseña hasheada:", hash);
    }
});
*/

    db.query(
        "SELECT * FROM usuario WHERE nombre_usuario = ?",
        [nombre_usuario],
        async (err, results) => {
            if (err) return res.status(500).json({ message: "Error en el servidor" });
            if (results.length === 0) return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });

            const user = results[0];

            // Validar si la cuenta está desactivada
            if (user.estado == 0) {
                return res.status(403).json({
                    message: "Tu cuenta está desactivada. Por favor, contacta al administrador al correo maicol.monge@catolica.edu.sv"
                });
            }

            // Validar contraseña
            const match = await bcrypt.compare(contrasena, user.password);
            if (!match) return res.status(401).json({ message: "Correo o contraseña incorrectos" });

            // Login normal: genera el token


            const payload = {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                rol: user.rol
            };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

            return res.status(200).json({
                message: "Inicio de sesión exitoso",
                token, // <-- aquí va el JWT
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    nombre_usuario: user.nombre_usuario,
                    rol: user.rol,
                    estado: user.estado,
                    requiereCambioPassword: user.requiere_cambio_password
                }
            });
        }
    );
};

//Metodo temporal, se espera que ya no se use
// Registrar según la tabla `usuario` proporcionada:
// Campos esperados en req.body: nombre, apellido, nombre_usuario, password (o contrasena), rol, estado (opcional)
exports.registrar = (req, res) => {
    const { nombre, apellido, nombre_usuario, password, rol, estado, contrasena } = req.body;
    const pwd = password || contrasena; // aceptar ambas variantes por compatibilidad

    if (!nombre || !apellido || !nombre_usuario || !pwd || rol === undefined) {
        return res.status(400).json({ message: "Los campos nombre, apellido, nombre_usuario, password y rol son requeridos" });
    }

    // Verificar duplicado de nombre_usuario
    db.query("SELECT id_usuario FROM usuario WHERE nombre_usuario = ?", [nombre_usuario], (err, results) => {
        if (err) return res.status(500).json({ message: "Error en el servidor", error: err });
        if (results.length > 0) return res.status(409).json({ message: "El nombre de usuario ya está registrado" });

        // Hashear la contraseña
        bcrypt.hash(pwd, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: "Error al encriptar la contraseña", error: err });

            const query = `INSERT INTO usuario (nombre, apellido, nombre_usuario, password, rol, estado, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;
            const estadoVal = typeof estado !== 'undefined' ? String(estado) : '1';
            db.query(query, [nombre, apellido, nombre_usuario, hashedPassword, String(rol), estadoVal], (err, result) => {
                if (err) {
                    // manejar duplicados por clave única si existen
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ message: 'El nombre de usuario ya está registrado' });
                    }
                    return res.status(500).json({ message: 'Error en el servidor', error: err });
                }

                const id_usuario = result.insertId;
                return res.status(201).json({ message: 'Usuario registrado correctamente', id_usuario });
            });
        });
    });
};

// Cambiar contraseña del usuario autenticado
exports.changePassword = (req, res) => {
    const userId = req.user && req.user.id_usuario;
    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Se requieren currentPassword, newPassword y confirmPassword' });
    }
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'La nueva contraseña y la confirmación no coinciden' });
    // Política de contraseña: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial
    if (newPassword.length < 8) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    const strongRe = /(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (!strongRe.test(newPassword)) return res.status(400).json({ message: 'La nueva contraseña debe contener al menos una mayúscula, un número y un carácter especial' });

    // Obtener usuario actual
    db.query('SELECT * FROM usuario WHERE id_usuario = ?', [userId], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en el servidor', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        const user = results[0];
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

        // Hashear la nueva contraseña
        bcrypt.hash(newPassword, 10, (err2, hashed) => {
            if (err2) return res.status(500).json({ message: 'Error al encriptar la contraseña', error: err2 });
            db.query('UPDATE usuario SET password = ?, requiere_cambio_password = 0, updated_at = NOW() WHERE id_usuario = ?', [hashed, userId], (err3) => {
                if (err3) return res.status(500).json({ message: 'Error al actualizar contraseña', error: err3 });
                return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
            });
        });
    });
};

// Recuperar contraseña (sin autenticación)
exports.recuperarPassword = (req, res) => {
    const { nombre_usuario } = req.body;

    if (!nombre_usuario) {
        return res.status(400).json({ message: "El nombre de usuario es obligatorio." });
    }

    db.query("SELECT * FROM usuario WHERE nombre_usuario = ?", [nombre_usuario], async (err, results) => {
        if (err) return res.status(500).json({ message: "Error en el servidor." });

        if (results.length === 0) {
            return res.status(200).json({
                message: "Si el usuario existe, se enviarán instrucciones."
            });
        }

        const usuario = results[0];

        // Generar contraseña temporal segura
        const tempPassword = crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Actualizar la contraseña y marcar que requiere cambio
        db.query(
            "UPDATE usuario SET password = ?, requiere_cambio_password = 1, updated_at = NOW() WHERE id_usuario = ?",
            [hashedPassword, usuario.id_usuario],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: "Error actualizando la contraseña." });
                }

                // Configuración de Nodemailer
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: usuario.correo,
                    subject: "Recuperación de Contraseña",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background: #fafcff;">
                            <h2 style="color: #00C2CC; text-align: center;">Recuperación de contraseña</h2>
                            <p>Hola <b>${usuario.nombre_usuario}</b>,</p>
                            <p>Se ha generado una nueva contraseña temporal para tu cuenta. Utilízala para iniciar sesión y cámbiala inmediatamente por tu seguridad.</p>
                            <ul>
                                <li><b>Nombre de usuario:</b> ${usuario.nombre_usuario}</li>
                            </ul>
                            <div style="margin: 24px 0; padding: 16px; background: #f1f8fa; border-radius: 6px; text-align: center;">
                                <span style="font-size: 1.1em; color: #222;">Contraseña temporal:</span><br>
                                <span style="font-size: 1.3em; font-weight: bold; letter-spacing: 2px; color: #00C2CC;">${tempPassword}</span>
                            </div>
                            <p style="color: #888; font-size: 0.95em;">Si no solicitaste este cambio, ignora este mensaje o contacta al administrador.</p>
                            <hr style="margin: 24px 0;">
                            <p style="font-size: 0.9em; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} Sistema de Gestión</p>
                        </div>
                    `,
                };

                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        console.error("Error enviando correo:", error);
                        return res.status(500).json({ message: "Error al enviar el correo." });
                    }

                    res.status(200).json({
                        message: "Si el usuario existe, se enviará una contraseña temporal al correo registrado.",
                        correoOfuscado: ofuscarCorreo(usuario.correo)
                    });
                });
            }
        );
    });
};

function ofuscarCorreo(correo) {
    // Ejemplo: p****a@c****o.com
    const [user, domain] = correo.split("@");
    const userMasked = user[0] + "****" + user[user.length - 1];
    const domainMasked = domain[0] + "****" + domain[domain.length - 5] + domain.slice(-4);
    return `${userMasked}@${domainMasked}`;
}
