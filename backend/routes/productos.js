
const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');

// ==========================================
// GET: OBTENER TODOS LOS PRODUCTOS
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT
                p.ProductoID,
                p.CategoriaID,
                c.Nombre AS NombreCategoria,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.PrecioOriginal,
                p.Tipo,
                p.Activo,
                p.FechaCreacion
            FROM productos p
            INNER JOIN categorias c
                ON p.CategoriaID = c.CategoriaID
            ORDER BY p.ProductoID DESC
        `);

        res.json({
            success: true,
            total: productos.length,
            productos
        });

    } catch (error) {
        console.error('Error al obtener productos:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los productos'
        });
    }
});

// ==========================================
// GET: OBTENER UN PRODUCTO POR ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de producto inválido'
            });
        }

        const [productos] = await pool.query(`
            SELECT
                p.ProductoID,
                p.CategoriaID,
                c.Nombre AS NombreCategoria,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.PrecioOriginal,
                p.Tipo,
                p.Activo,
                p.FechaCreacion
            FROM productos p
            INNER JOIN categorias c
                ON p.CategoriaID = c.CategoriaID
            WHERE p.ProductoID = ?
        `, [id]);

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            producto: productos[0]
        });

    } catch (error) {
        console.error('Error al consultar producto:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar el producto'
        });
    }
});

// ==========================================
// POST: REGISTRAR UN PRODUCTO
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            categoriaID,
            nombre,
            descripcion = null,
            precio,
            precioOriginal = null,
            tipo = null
        } = req.body;

        if (!Number.isInteger(Number(categoriaID)) || Number(categoriaID) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría es obligatoria y debe ser válida'
            });
        }

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del producto es obligatorio'
            });
        }

        if (typeof precio === 'undefined' || precio === null ||
            precio === '' || !Number.isFinite(Number(precio)) ||
            Number(precio) < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El precio debe ser un número mayor o igual a cero'
            });
        }

        if (precioOriginal !== null &&
            (precioOriginal === '' || !Number.isFinite(Number(precioOriginal)) ||
            Number(precioOriginal) < 0)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El precio original debe ser válido'
            });
        }

        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        if (tipo !== null && typeof tipo !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'El tipo debe ser texto'
            });
        }

        const [categorias] = await pool.query(
            'SELECT CategoriaID FROM categorias WHERE CategoriaID = ? AND Activa = 1',
            [Number(categoriaID)]
        );

        if (categorias.length === 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría no existe o está desactivada'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO productos
                (CategoriaID, Nombre, Descripcion, Precio, PrecioOriginal, Tipo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            Number(categoriaID),
            nombre.trim(),
            descripcion?.trim() || null,
            Number(precio),
            precioOriginal === null ? null : Number(precioOriginal),
            tipo?.trim() || null
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Producto registrado correctamente',
            productoID: resultado.insertId
        });

    } catch (error) {
        console.error('Error al registrar producto:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el producto'
        });
    }
});

// ==========================================
// PUT: MODIFICAR UN PRODUCTO
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            categoriaID,
            nombre,
            descripcion = null,
            precio,
            precioOriginal = null,
            tipo = null
        } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de producto inválido'
            });
        }

        if (!Number.isInteger(Number(categoriaID)) || Number(categoriaID) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría debe ser válida'
            });
        }

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del producto es obligatorio'
            });
        }

        if (precio === null || typeof precio === 'undefined' ||
            precio === '' || !Number.isFinite(Number(precio)) ||
            Number(precio) < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El precio debe ser válido'
            });
        }

        if (precioOriginal !== null &&
            (precioOriginal === '' || !Number.isFinite(Number(precioOriginal)) ||
            Number(precioOriginal) < 0)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El precio original debe ser válido'
            });
        }

        if (descripcion !== null && typeof descripcion !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'La descripción debe ser texto'
            });
        }

        if (tipo !== null && typeof tipo !== 'string') {
            return res.status(400).json({
                success: false,
                mensaje: 'El tipo debe ser texto'
            });
        }

        const [categorias] = await pool.query(
            'SELECT CategoriaID FROM categorias WHERE CategoriaID = ? AND Activa = 1',
            [Number(categoriaID)]
        );

        if (categorias.length === 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La categoría no existe o está desactivada'
            });
        }

        const [resultado] = await pool.query(`
            UPDATE productos
            SET CategoriaID = ?,
                Nombre = ?,
                Descripcion = ?,
                Precio = ?,
                PrecioOriginal = ?,
                Tipo = ?
            WHERE ProductoID = ?
        `, [
            Number(categoriaID),
            nombre.trim(),
            descripcion?.trim() || null,
            Number(precio),
            precioOriginal === null ? null : Number(precioOriginal),
            tipo?.trim() || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT ProductoID FROM productos WHERE ProductoID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Producto no encontrado'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Producto actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el producto'
        });
    }
});

// ==========================================
// PATCH: ACTIVAR O DESACTIVAR UN PRODUCTO
// ==========================================
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de producto inválido'
            });
        }

        if (typeof activo !== 'boolean' && activo !== 0 && activo !== 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado debe ser true o false'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE productos SET Activo = ? WHERE ProductoID = ?',
            [Number(activo), id]
        );

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT ProductoID FROM productos WHERE ProductoID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Producto no encontrado'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Estado del producto actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar estado del producto:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar el estado del producto'
        });
    }
});

module.exports = router;

