
const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { connectDB } = require('../config/db');

// ==========================================
// MIDDLEWARE: VERIFICAR TOKEN
// ==========================================

function verificarToken(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            mensaje: 'Debes iniciar sesión para continuar'
        });
    }

    const token = autorizacion.split(' ')[1];

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado'
        });
    }
}

// ==========================================
// POST: REGISTRAR USUARIO
// ==========================================

router.post('/registro', async (req, res) => {
    try {
        const { nombre, correo, telefono, contrasena } = req.body;

        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({
                success: false,
                mensaje: 'Nombre, correo y contraseña son obligatorios'
            });
        }

        if (typeof nombre !== 'string' ||
            typeof correo !== 'string' ||
            typeof contrasena !== 'string' ||
            (telefono != null && typeof telefono !== 'string')) {
            return res.status(400).json({
                success: false,
                mensaje: 'Los datos enviados no tienen un formato válido'
            });
        }

        const nombreLimpio = nombre.trim();
        const correoLimpio = correo.trim().toLowerCase();

        if (!nombreLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre o el correo no son válidos'
            });
        }

        if (nombreLimpio.length > 200 || correoLimpio.length > 255) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre o el correo exceden la longitud permitida'
            });
        }

        if (contrasena.length < 8) {
            return res.status(400).json({
                success: false,
                mensaje: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        const pool = await connectDB();

        const [usuariosExistentes] = await pool.query(
            'SELECT UsuarioID FROM usuarios WHERE Correo = ?',
            [correoLimpio]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'Este correo ya está registrado'
            });
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 12);

        const [resultado] = await pool.query(
            `INSERT INTO usuarios
            (Nombre, Correo, Telefono, ContrasenaHash, Rol)
            VALUES (?, ?, ?, ?, ?)`,
            [
                nombreLimpio,
                correoLimpio,
                telefono ? telefono.trim() : null,
                contrasenaHash,
                'cliente'
            ]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                usuarioID: resultado.insertId,
                nombre: nombreLimpio,
                correo: correoLimpio,
                telefono: telefono || null,
                rol: 'cliente'
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno al registrar el usuario'
        });
    }
});

// ==========================================
// POST: INICIAR SESIÓN
// ==========================================

router.post('/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena ||
            typeof correo !== 'string' ||
            typeof contrasena !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'Debes proporcionar correo y contraseña'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no está configurado');
        }

        const correoLimpio = correo.trim().toLowerCase();

        const pool = await connectDB();

        const [usuarios] = await pool.query(
            `SELECT UsuarioID, Nombre, Correo, Telefono,
                    ContrasenaHash, Rol, Activo
             FROM usuarios
             WHERE Correo = ?
             LIMIT 1`,
            [correoLimpio]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = usuarios[0];

        if (usuario.Activo !== 1) {
            return res.status(403).json({
                success: false,
                mensaje: 'Esta cuenta se encuentra desactivada'
            });
        }

        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.ContrasenaHash
        );

        if (!contrasenaValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const token = jwt.sign(
            {
                usuarioID: usuario.UsuarioID,
                rol: usuario.Rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                usuarioID: usuario.UsuarioID,
                nombre: usuario.Nombre,
                correo: usuario.Correo,
                telefono: usuario.Telefono,
                rol: usuario.Rol
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno al iniciar sesión'
        });
    }
});

// ==========================================
// GET: CONSULTAR PERFIL DEL USUARIO
// ==========================================

router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const pool = await connectDB();

        const [usuarios] = await pool.query(
            `SELECT UsuarioID, Nombre, Correo, Telefono,
                    Rol, FechaRegistro
             FROM usuarios
             WHERE UsuarioID = ?
             LIMIT 1`,
            [req.usuario.usuarioID]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error('Error al consultar perfil:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar el perfil'
        });
    }
});

module.exports = router;
