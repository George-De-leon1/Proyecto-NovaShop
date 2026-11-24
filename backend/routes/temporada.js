
const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');

// ==========================================
// GET: OBTENER TODAS LAS TEMPORADAS
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [temporadas] = await pool.query(`
            SELECT
                TemporadaID,
                Nombre,
                Clave,
                Descripcion,
                Activa
            FROM temporadas
            ORDER BY TemporadaID DESC
        `);

        res.json({
            success: true,
            total: temporadas.length,
            temporadas
        });

    } catch (error) {
        console.error('Error al obtener temporadas:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las temporadas'
        });
    }
});

// ==========================================
// GET: OBTENER UNA TEMPORADA POR ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de temporada inválido'
            });
        }

        const [temporadas] = await pool.query(`
            SELECT
                TemporadaID,
                Nombre,
                Clave,
                Descripcion,
                Activa
            FROM temporadas
            WHERE TemporadaID = ?
        `, [id]);

        if (temporadas.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Temporada no encontrada'
            });
        }

        res.json({
            success: true,
            temporada: temporadas[0]
        });

    } catch (error) {
        console.error('Error al consultar temporada:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar la temporada'
        });
    }
});

// ==========================================
// POST: CREAR UNA TEMPORADA
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            nombre,
            clave,
            descripcion = null
        } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre de la temporada es obligatorio'
            });
        }

        if (nombre.trim().length > 100) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre no puede superar los 100 caracteres'
            });
        }

        if (typeof clave !== 'string' || !clave.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'La clave de la temporada es obligatoria'
            });
        }

        if (clave.trim().length > 50) {
            return res.status(400).json({
                success: false,
                mensaje: 'La clave no puede superar los 50 caracteres'
            });
        }

        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO temporadas (Nombre, Clave, Descripcion)
            VALUES (?, ?, ?)
        `, [
            nombre.trim(),
            clave.trim().toUpperCase(),
            descripcion?.trim() || null
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Temporada creada correctamente',
            temporadaID: resultado.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Ya existe una temporada con esa clave'
            });
        }

        console.error('Error al crear temporada:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear la temporada'
        });
    }
});

// ==========================================
// PUT: MODIFICAR UNA TEMPORADA
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, clave, descripcion = null } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de temporada inválido'
            });
        }

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre es obligatorio'
            });
        }

        if (nombre.trim().length > 100) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre no puede superar los 100 caracteres'
            });
        }

        if (typeof clave !== 'string' || !clave.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'La clave es obligatoria'
            });
        }

        if (clave.trim().length > 50) {
            return res.status(400).json({
                success: false,
                mensaje: 'La clave no puede superar los 50 caracteres'
            });
        }

        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        const [resultado] = await pool.query(`
            UPDATE temporadas
            SET Nombre = ?,
                Clave = ?,
                Descripcion = ?
            WHERE TemporadaID = ?
        `, [
            nombre.trim(),
            clave.trim().toUpperCase(),
            descripcion?.trim() || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT TemporadaID FROM temporadas WHERE TemporadaID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Temporada no encontrada'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Temporada actualizada correctamente'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Ya existe una temporada con esa clave'
            });
        }

        console.error('Error al actualizar temporada:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la temporada'
        });
    }
});

// ==========================================
// PATCH: ACTIVAR O DESACTIVAR TEMPORADA
// ==========================================
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { activa } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de temporada inválido'
            });
        }

        if (typeof activa !== 'boolean' && activa !== 0 && activa !== 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado debe ser true o false'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE temporadas SET Activa = ? WHERE TemporadaID = ?',
            [Number(activa), id]
        );

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT TemporadaID FROM temporadas WHERE TemporadaID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Temporada no encontrada'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Estado de la temporada actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar estado:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar el estado de la temporada'
        });
    }
});

module.exports = router;
