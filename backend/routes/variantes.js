
const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');

// ==========================================
// GET: OBTENER TODAS LAS VARIANTES
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [variantes] = await pool.query(`
            SELECT
                v.VarianteID,
                v.ProductoID,
                p.Nombre AS NombreProducto,
                v.Color,
                v.CodigoHex,
                v.Talla,
                v.Imagen,
                v.Stock
            FROM variantesproducto v
            INNER JOIN productos p
                ON v.ProductoID = p.ProductoID
            ORDER BY v.VarianteID DESC
        `);

        res.json({
            success: true,
            total: variantes.length,
            variantes
        });

    } catch (error) {
        console.error('Error al obtener variantes:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las variantes'
        });
    }
});

// ==========================================
// GET: OBTENER VARIANTES DE UN PRODUCTO
// ==========================================
router.get('/producto/:productoID', async (req, res) => {
    try {
        const { productoID } = req.params;

        if (!/^\d+$/.test(productoID) || Number(productoID) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de producto inválido'
            });
        }

        const [variantes] = await pool.query(`
            SELECT
                VarianteID,
                ProductoID,
                Color,
                CodigoHex,
                Talla,
                Imagen,
                Stock
            FROM variantesproducto
            WHERE ProductoID = ?
            ORDER BY VarianteID DESC
        `, [productoID]);

        res.json({
            success: true,
            total: variantes.length,
            variantes
        });

    } catch (error) {
        console.error('Error al consultar variantes del producto:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar las variantes'
        });
    }
});

// ==========================================
// GET: OBTENER UNA VARIANTE POR ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de variante inválido'
            });
        }

        const [variantes] = await pool.query(`
            SELECT
                v.VarianteID,
                v.ProductoID,
                p.Nombre AS NombreProducto,
                v.Color,
                v.CodigoHex,
                v.Talla,
                v.Imagen,
                v.Stock
            FROM variantesproducto v
            INNER JOIN productos p
                ON v.ProductoID = p.ProductoID
            WHERE v.VarianteID = ?
        `, [id]);

        if (variantes.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Variante no encontrada'
            });
        }

        res.json({
            success: true,
            variante: variantes[0]
        });

    } catch (error) {
        console.error('Error al consultar variante:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar la variante'
        });
    }
});

// ==========================================
// POST: CREAR UNA VARIANTE
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            productoID,
            color = null,
            codigoHex = null,
            talla = null,
            imagen = null,
            stock = 0
        } = req.body;

        if (!Number.isInteger(Number(productoID)) || Number(productoID) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'El producto es obligatorio y debe ser válido'
            });
        }

        if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El stock debe ser un número entero mayor o igual a cero'
            });
        }

        const camposTexto = [
            ['color', color],
            ['codigoHex', codigoHex],
            ['talla', talla],
            ['imagen', imagen]
        ];

        for (const [campo, valor] of camposTexto) {
            if (valor !== null && typeof valor !== 'string') {
                return res.status(400).json({
                    success: false,
                    mensaje: `El campo ${campo} debe ser texto`
                });
            }
        }

        if (codigoHex !== null && !/^#[0-9A-Fa-f]{6}$/.test(codigoHex)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El código de color debe tener formato hexadecimal, por ejemplo #000000'
            });
        }

        const [productos] = await pool.query(
            'SELECT ProductoID FROM productos WHERE ProductoID = ?',
            [Number(productoID)]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'El producto no existe'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO variantesproducto
                (ProductoID, Color, CodigoHex, Talla, Imagen, Stock)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            Number(productoID),
            color?.trim() || null,
            codigoHex,
            talla?.trim() || null,
            imagen?.trim() || null,
            Number(stock)
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Variante registrada correctamente',
            varianteID: resultado.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Esta combinación de producto, color y talla ya existe'
            });
        }

        console.error('Error al registrar variante:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar la variante'
        });
    }
});

// ==========================================
// PUT: MODIFICAR UNA VARIANTE
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            productoID,
            color = null,
            codigoHex = null,
            talla = null,
            imagen = null,
            stock
        } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de variante inválido'
            });
        }

        if (!Number.isInteger(Number(productoID)) || Number(productoID) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'El producto debe ser válido'
            });
        }

        if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El stock debe ser un número entero mayor o igual a cero'
            });
        }

        for (const [campo, valor] of [
            ['color', color],
            ['codigoHex', codigoHex],
            ['talla', talla],
            ['imagen', imagen]
        ]) {
            if (valor !== null && typeof valor !== 'string') {
                return res.status(400).json({
                    success: false,
                    mensaje: `El campo ${campo} debe ser texto`
                });
            }
        }

        if (codigoHex !== null && !/^#[0-9A-Fa-f]{6}$/.test(codigoHex)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El código de color debe tener formato hexadecimal'
            });
        }

        const [productos] = await pool.query(
            'SELECT ProductoID FROM productos WHERE ProductoID = ?',
            [Number(productoID)]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'El producto no existe'
            });
        }

        const [resultado] = await pool.query(`
            UPDATE variantesproducto
            SET ProductoID = ?,
                Color = ?,
                CodigoHex = ?,
                Talla = ?,
                Imagen = ?,
                Stock = ?
            WHERE VarianteID = ?
        `, [
            Number(productoID),
            color?.trim() || null,
            codigoHex,
            talla?.trim() || null,
            imagen?.trim() || null,
            Number(stock),
            id
        ]);

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT VarianteID FROM variantesproducto WHERE VarianteID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Variante no encontrada'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Variante actualizada correctamente'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Esta combinación de producto, color y talla ya existe'
            });
        }

        console.error('Error al actualizar variante:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la variante'
        });
    }
});

// ==========================================
// PATCH: ACTUALIZAR STOCK
// ==========================================
router.patch('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (!/^\d+$/.test(id) || Number(id) < 1) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de variante inválido'
            });
        }

        if (!Number.isInteger(Number(stock)) || stock === '' || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El stock debe ser un número entero mayor o igual a cero'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE variantesproducto SET Stock = ? WHERE VarianteID = ?',
            [Number(stock), id]
        );

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT VarianteID FROM variantesproducto WHERE VarianteID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Variante no encontrada'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Stock actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar stock:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el stock'
        });
    }
});

module.exports = router;
