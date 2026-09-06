const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config(); // npm install dotenv

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('imagenes'));

const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexion.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err);
        process.exit(1);
    }
    console.log('✅ Conectado a zama_db');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './imagenes/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- CONFIGURACIÓN DE CORREO (nodemailer) ---
// Usa tu cuenta de Gmail. En Gmail debes activar "Contraseñas de aplicación"
// en: Cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de app
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Almacén temporal de tokens (en memoria — se borra al reiniciar el server)
// Para producción usa Redis o una tabla en MySQL
const tokensRecuperacion = {};

// --- RUTAS DE AUTENTICACIÓN ---

// Registro: Encripta la contraseña antes de guardarla
app.post('/api/usuarios/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        conexion.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, hash, 'cliente'], (err) => {
                if (err) return res.status(500).json({ error: 'Error al registrar' });
                res.status(201).json({ mensaje: 'Registrado correctamente' });
            });

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Login: Compara la contraseña enviada con el hash de la base de datos
app.post('/api/usuarios/login', (req, res) => {
    const { email, password } = req.body;

    conexion.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
        if (err || resultados.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = resultados[0];
        const match = await bcrypt.compare(password, usuario.password);

        if (match) {
            const { password, ...usuarioSeguro } = usuario;
            res.json({ usuario: usuarioSeguro });
        } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });
});

// --- RUTA ACTUALIZACIÓN PERFIL ---
app.put('/api/usuarios/:id', upload.single('foto'), (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;
    let query = 'UPDATE usuarios SET nombre=?, email=?, telefono=?, direccion=?';
    let params = [nombre, email, telefono, direccion];

    if (req.file) {
        query += ', foto=?';
        params.push(req.file.filename);
    }
    query += ' WHERE id=?';
    params.push(id);

    conexion.query(query, params, (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar' });
        res.json({ mensaje: 'Actualizado', nombre, email, telefono, direccion, foto: req.file ? req.file.filename : null });
    });
});

// --- RUTAS DE PEDIDOS Y PRODUCTOS (SIN CAMBIOS) ---
app.get('/api/pedidos/usuario/:usuarioId', (req, res) => {
    conexion.query('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC', [req.params.usuarioId], (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(resultados);
    });
});

app.get('/api/productos', (req, res) => {
    conexion.query('SELECT * FROM productos', (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(resultados);
    });
});

// Obtener UN producto por ID (usado por producto.html)
app.get('/api/productos/:id', (req, res) => {
    conexion.query(
        'SELECT * FROM productos WHERE id = ?',
        [req.params.id],
        (err, resultados) => {
            if (err) return res.status(500).json({ error: 'Error' });
            if (resultados.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
            const producto = resultados[0];
            // Construir URL completa de la imagen
            if (producto.imagen && !producto.imagen.startsWith('http')) {
                producto.imagen = `http://localhost:3000/${producto.imagen}`;
            }
            res.json(producto);
        }
    );
});

app.post('/api/productos', upload.single('imagen'), (req, res) => {
    const { nombre, precio, categoria } = req.body;
    const imagen = req.file ? req.file.filename : null;
    conexion.query('INSERT INTO productos (nombre, precio, categoria, imagen) VALUES (?, ?, ?, ?)',
        [nombre, precio, categoria, imagen], (err) => {
            if (err) return res.status(500).json({ error: 'Error al insertar' });
            res.status(201).json({ mensaje: 'Producto creado' });
        });
});

app.put('/api/productos/:id', upload.single('imagen'), (req, res) => {
    const { id } = req.params;
    const { nombre, precio, categoria } = req.body;
    if (req.file) {
        conexion.query('UPDATE productos SET nombre=?, precio=?, categoria=?, imagen=? WHERE id=?',
            [nombre, precio, categoria, req.file.filename, id], (err) => {
                if (err) return res.status(500).json({ error: 'Error' });
                res.json({ mensaje: 'Actualizado' });
            });
    } else {
        conexion.query('UPDATE productos SET nombre=?, precio=?, categoria=? WHERE id=?',
            [nombre, precio, categoria, id], (err) => {
                if (err) return res.status(500).json({ error: 'Error' });
                res.json({ mensaje: 'Actualizado' });
            });
    }
});

app.delete('/api/productos/:id', (req, res) => {
    conexion.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json({ mensaje: 'Producto eliminado' });
    });
});

app.get('/api/pedidos', (req, res) => {
    conexion.query('SELECT * FROM pedidos ORDER BY id DESC', (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(resultados);
    });
});

app.put('/api/pedidos/:id/estado', (req, res) => {
    conexion.query('UPDATE pedidos SET estado = ? WHERE id = ?', [req.body.estado, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json({ mensaje: 'Actualizado' });
    });
});

// --- RUTA CREAR PEDIDO (usada por el carrito al pagar con Nequi) ---
app.post('/api/pedidos/crear', (req, res) => {
    const { usuario_id, total, metodo_pago, productos } = req.body;

    if (!usuario_id || !total || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Datos del pedido incompletos' });
    }

    // 1. Insertar el pedido principal
    conexion.query(
        'INSERT INTO pedidos (usuario_id, total, metodo_pago, estado) VALUES (?, ?, ?, ?)',
        [usuario_id, total, metodo_pago || 'Nequi', 'Pendiente'],
        (err, resultado) => {
            if (err) {
                console.error('Error al crear pedido:', err);
                return res.status(500).json({ error: 'Error al guardar el pedido' });
            }

            const pedidoId = resultado.insertId;

            // 2. Insertar cada producto del pedido (si tienes tabla detalle_pedidos)
            // Si no tienes esa tabla aún, igual devuelve el ID sin error
            const hayTablaDetalle = true; // Cambia a false si no tienes tabla detalle_pedidos

            if (!hayTablaDetalle || !productos.length) {
                return res.status(201).json({ pedidoId, mensaje: 'Pedido creado' });
            }

            const valores = productos.map(p => [pedidoId, p.nombre, p.cantidad, p.precio_unitario]);

            conexion.query(
                'INSERT INTO detalle_pedidos (pedido_id, nombre_producto, cantidad, precio_unitario) VALUES ?',
                [valores],
                (errDetalle) => {
                    if (errDetalle) {
                        // Si falla el detalle, igual el pedido quedó — no revertimos
                        console.warn('Pedido creado pero sin detalle:', errDetalle.message);
                    }
                    res.status(201).json({ pedidoId, mensaje: 'Pedido creado correctamente' });
                }
            );
        }
    );
});
// ... tus rutas existentes ...

// --- RECUPERACIÓN DE CONTRASEÑA ---
app.post('/api/usuarios/recuperar', (req, res) => {
    const { email } = req.body;

    conexion.query('SELECT id FROM usuarios WHERE email = ?', [email], (err, resultados) => {
        if (err || resultados.length === 0) {
            return res.status(404).json({ error: 'Correo no registrado en Zama' });
        }

        // Generar código de 6 dígitos con expiración de 15 minutos
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = Date.now() + 15 * 60 * 1000;
        tokensRecuperacion[email] = { token, expira };

        const mailOptions = {
            from: `"Zama Shop" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔐 Código para restablecer tu contraseña - Zama',
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;">
                    <h2 style="text-align:center;letter-spacing:4px;">ZAMA</h2>
                    <hr>
                    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                    <p>Tu código de verificación es:</p>
                    <h1 style="text-align:center;letter-spacing:8px;background:#f4f4f4;padding:16px;">${token}</h1>
                    <p style="color:#999;font-size:0.85rem;">Este código expira en <strong>15 minutos</strong>. Si no lo solicitaste, ignora este mensaje.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (errMail) => {
            if (errMail) {
                console.error('Error enviando correo:', errMail);
                return res.status(500).json({ error: 'No se pudo enviar el correo' });
            }
            res.json({ mensaje: 'Código enviado al correo' });
        });
    });
});

app.post('/api/usuarios/restablecer-password', async (req, res) => {
    const { email, token, nuevaPassword } = req.body;

    const registro = tokensRecuperacion[email];

    if (!registro) {
        return res.status(400).json({ error: 'No hay solicitud activa para este correo' });
    }
    if (registro.token !== token) {
        return res.status(400).json({ error: 'Código incorrecto' });
    }
    if (Date.now() > registro.expira) {
        delete tokensRecuperacion[email];
        return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    try {
        const hash = await bcrypt.hash(nuevaPassword, 10);
        conexion.query('UPDATE usuarios SET password = ? WHERE email = ?', [hash, email], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar contraseña' });
            delete tokensRecuperacion[email]; // Invalida el token
            res.json({ mensaje: 'Contraseña actualizada correctamente' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    conexion.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, resultados) => {
        if (err || resultados.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(resultados[0]);
    });
});

app.listen(3000, () => {
    console.log('🚀 Servidor arriba en http://localhost:3000');
});