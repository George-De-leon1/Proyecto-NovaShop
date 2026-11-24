
const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');

// ==========================================
// GET: OBTENER TODAS LAS CATEGORÍAS
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [categorias] = await pool.query(`
            SELECT
                CategoriaID,
                Nombre,
                Descripcion,
                Activa
            FROM categorias
            ORDER BY CategoriaID DESC
        `);

        res.json({
            success: true,
            total: categorias.length,
            categorias
        });

    } catch (error) {
        console.error('Error al obtener categorías:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las categorías'
        });
    }
});

// ==========================================
// GET: OBTENER UNA CATEGORÍA POR ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de categoría inválido'
            });
        }

        const [categorias] = await pool.query(
            `SELECT CategoriaID, Nombre, Descripcion, Activa
             FROM categorias
             WHERE CategoriaID = ?`,
            [id]
        );

        if (categorias.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            categoria: categorias[0]
        });

    } catch (error) {
        console.error('Error al consultar categoría:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar la categoría'
        });
    }
});

// ==========================================
// POST: CREAR UNA CATEGORÍA
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion = null } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre de la categoría es obligatorio'
            });
        }

        const nombreLimpio = nombre.trim();

        if (nombreLimpio.length > 100) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre no puede superar los 100 caracteres'
            });
        }

        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO categorias (Nombre, Descripcion)
             VALUES (?, ?)`,
            [nombreLimpio, descripcion?.trim() || null]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Categoría creada correctamente',
            categoriaID: resultado.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Ya existe una categoría con ese nombre'
            });
        }

        console.error('Error al crear categoría:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al crear la categoría'
        });
    }
});

// ==========================================
// PUT: MODIFICAR UNA CATEGORÍA
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de categoría inválido'
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

        if (descripcion !== null && descripcion !== undefined &&
            typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE categorias
             SET Nombre = ?, Descripcion = ?
             WHERE CategoriaID = ?`,
            [nombre.trim(), descripcion?.trim() || null, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada o sin cambios'
            });
        }

        res.json({
            success: true,
            mensaje: 'Categoría actualizada correctamente'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Ya existe una categoría con ese nombre'
            });
        }

        console.error('Error al actualizar categoría:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la categoría'
        });
    }
});

// ==========================================
// PATCH: ACTIVAR O DESACTIVAR CATEGORÍA
// ==========================================
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { activa } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de categoría inválido'
            });
        }

        if (typeof activa !== 'boolean' && activa !== 0 && activa !== 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado debe ser true o false'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE categorias
             SET Activa = ?
             WHERE CategoriaID = ?`,
            [Number(activa), id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            mensaje: 'Estado de la categoría actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar estado:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar el estado de la categoría'
        });
    }
});

module.exports = router;
