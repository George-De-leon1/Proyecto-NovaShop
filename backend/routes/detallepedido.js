
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET: consultar todos los detalles de pedidos
router.get('/', async (req, res) => {
    try {
        const [detalles] = await pool.query(`
            SELECT *
            FROM detallepedido
            ORDER BY DetallePedidoID DESC
        `);

        res.json({
            success: true,
            total: detalles.length,
            detalles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar los detalles',
            error: error.message
        });
    }
});

// GET: consultar detalles de un pedido específico
router.get('/pedido/:pedidoID', async (req, res) => {
    try {
        const [detalles] = await pool.query(`
            SELECT *
            FROM detallepedido
            WHERE PedidoID = ?
        `, [req.params.pedidoID]);

        res.json({
            success: true,
            total: detalles.length,
            detalles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar los detalles del pedido',
            error: error.message
        });
    }
});

// POST: agregar producto a un pedido
router.post('/', async (req, res) => {
    try {
        const {
            pedidoID,
            productoID,
            varianteID,
            nombreProducto,
            colorSeleccionado,
            tallaSeleccionada,
            cantidad,
            precioUnitario
        } = req.body;

        if (
            !pedidoID ||
            !productoID ||
            !nombreProducto ||
            !Number.isInteger(Number(cantidad)) ||
            Number(cantidad) <= 0 ||
            precioUnitario === undefined ||
            precioUnitario === null ||
            !Number.isFinite(Number(precioUnitario)) ||
            Number(precioUnitario) < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'Verifica los campos obligatorios y sus valores'
            });
        }

        const subtotal = Number(cantidad) * Number(precioUnitario);

        const [resultado] = await pool.query(`
            INSERT INTO detallepedido (
                PedidoID,
                ProductoID,
                VarianteID,
                NombreProducto,
                ColorSeleccionado,
                TallaSeleccionada,
                Cantidad,
                PrecioUnitario,
                Subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pedidoID,
            productoID,
            varianteID || null,
            nombreProducto,
            colorSeleccionado || null,
            tallaSeleccionada || null,
            cantidad,
            precioUnitario,
            subtotal
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Detalle del pedido registrado correctamente',
            detallePedidoID: resultado.insertId,
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el detalle',
            error: error.message
        });
    }
});

// PUT: actualizar un detalle
router.put('/:id', async (req, res) => {
    try {
        const {
            cantidad,
            precioUnitario,
            colorSeleccionado,
            tallaSeleccionada
        } = req.body;

        if (
            !Number.isInteger(Number(cantidad)) ||
            Number(cantidad) <= 0 ||
            precioUnitario === undefined ||
            precioUnitario === null ||
            !Number.isFinite(Number(precioUnitario)) ||
            Number(precioUnitario) < 0
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'Cantidad o precio no válidos'
            });
        }

        const subtotal = Number(cantidad) * Number(precioUnitario);

        const [resultado] = await pool.query(`
            UPDATE detallepedido
            SET Cantidad = ?,
                PrecioUnitario = ?,
                ColorSeleccionado = ?,
                TallaSeleccionada = ?,
                Subtotal = ?
            WHERE DetallePedidoID = ?
        `, [
            cantidad,
            precioUnitario,
            colorSeleccionado || null,
            tallaSeleccionada || null,
            subtotal,
            req.params.id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Detalle no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Detalle actualizado correctamente',
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el detalle',
            error: error.message
        });
    }
});

// DELETE: eliminar un detalle
router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await pool.query(
            'DELETE FROM detallepedido WHERE DetallePedidoID = ?',
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Detalle no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Detalle eliminado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar el detalle',
            error: error.message
        });
    }
});

module.exports = router;
