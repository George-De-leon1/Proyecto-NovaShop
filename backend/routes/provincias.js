
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ==========================================
// GET: CONSULTAR TODAS LAS PROVINCIAS
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [provincias] = await pool.query(
            'SELECT ProvinciaID, Nombre FROM provincias ORDER BY Nombre ASC'
        );

        res.json({
            success: true,
            total: provincias.length,
            provincias
        });

    } catch (error) {
        console.error('Error al consultar provincias:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar las provincias'
        });
    }
});

// ==========================================
// GET: CONSULTAR UNA PROVINCIA
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [provincias] = await pool.query(
            'SELECT ProvinciaID, Nombre FROM provincias WHERE ProvinciaID = ?',
            [id]
        );

        if (provincias.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Provincia no encontrada'
            });
        }

        res.json({
            success: true,
            provincia: provincias[0]
        });

    } catch (error) {
        console.error('Error al consultar provincia:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar la provincia'
        });
    }
});

// ==========================================
// POST: REGISTRAR UNA PROVINCIA
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { nombre } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre de la provincia es obligatorio'
            });
        }

        const nombreLimpio = nombre.trim();

        const [existe] = await pool.query(
            'SELECT ProvinciaID FROM provincias WHERE Nombre = ?',
            [nombreLimpio]
        );

        if (existe.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'La provincia ya está registrada'
            });
        }

        const [resultado] = await pool.query(
            'INSERT INTO provincias (Nombre) VALUES (?)',
            [nombreLimpio]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Provincia registrada correctamente',
            provinciaID: resultado.insertId
        });

    } catch (error) {
        console.error('Error al registrar provincia:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar la provincia'
        });
    }
});

// ==========================================
// PUT: ACTUALIZAR UNA PROVINCIA
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre de la provincia es obligatorio'
            });
        }

        const nombreLimpio = nombre.trim();

        const [existe] = await pool.query(
            'SELECT ProvinciaID FROM provincias WHERE ProvinciaID = ?',
            [id]
        );

        if (existe.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Provincia no encontrada'
            });
        }

        const [duplicada] = await pool.query(
            'SELECT ProvinciaID FROM provincias WHERE Nombre = ? AND ProvinciaID <> ?',
            [nombreLimpio, id]
        );

        if (duplicada.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'Ya existe otra provincia con ese nombre'
            });
        }

        await pool.query(
            'UPDATE provincias SET Nombre = ? WHERE ProvinciaID = ?',
            [nombreLimpio, id]
        );

        res.json({
            success: true,
            mensaje: 'Provincia actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar provincia:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la provincia'
        });
    }
});

// ==========================================
// DELETE: ELIMINAR UNA PROVINCIA
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM provincias WHERE ProvinciaID = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Provincia no encontrada'
            });
        }

        res.json({
            success: true,
            mensaje: 'Provincia eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar provincia:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'No se pudo eliminar la provincia. Puede estar relacionada con otros registros.'
        });
    }
});

module.exports = router;
