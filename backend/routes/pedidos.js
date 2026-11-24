
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET: consultar todos los pedidos
router.get('/', async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT *
            FROM pedidos
            ORDER BY FechaPedido DESC
        `);

        res.json({
            success: true,
            total: pedidos.length,
            pedidos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar los pedidos',
            error: error.message
        });
    }
});

// GET: consultar un pedido por ID
router.get('/:id', async (req, res) => {
    try {
        const [pedidos] = await pool.query(
            'SELECT * FROM pedidos WHERE PedidoID = ?',
            [req.params.id]
        );

        if (pedidos.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            pedido: pedidos[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar el pedido',
            error: error.message
        });
    }
});

// POST: registrar un pedido
router.post('/', async (req, res) => {
    try {
        const {
            numeroPedido,
            usuarioID,
            courierID,
            provinciaID,
            nombreCliente,
            correoCliente,
            telefonoCliente,
            provincia,
            municipioSector,
            direccion,
            metodoPago,
            estadoPago,
            estadoPedido,
            numeroSeguimiento,
            subtotal,
            costoEnvio,
            descuento,
            total
        } = req.body;

        const requeridos = [
            nombreCliente,
            correoCliente,
            telefonoCliente,
            provincia,
            municipioSector,
            direccion,
            metodoPago,
            estadoPago,
            estadoPedido
        ];

        if (requeridos.some(valor => valor === undefined || valor === null || String(valor).trim() === '') ||
            [subtotal, costoEnvio, descuento, total].some(valor =>
                valor === undefined || valor === null || !Number.isFinite(Number(valor))
            )) {
            return res.status(400).json({
                success: false,
                mensaje: 'Completa todos los campos obligatorios y los valores numéricos'
            });
        }

        const numero = numeroPedido || `PED-${Date.now()}`;

        const [resultado] = await pool.query(`
            INSERT INTO pedidos (
                NumeroPedido, UsuarioID, CourierID, ProvinciaID,
                NombreCliente, CorreoCliente, TelefonoCliente,
                Provincia, MunicipioSector, Direccion,
                MetodoPago, EstadoPago, EstadoPedido,
                NumeroSeguimiento, Subtotal, CostoEnvio,
                Descuento, Total
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numero,
            usuarioID || null,
            courierID || null,
            provinciaID || null,
            nombreCliente,
            correoCliente,
            telefonoCliente,
            provincia,
            municipioSector,
            direccion,
            metodoPago,
            estadoPago,
            estadoPedido,
            numeroSeguimiento || null,
            subtotal,
            costoEnvio,
            descuento,
            total
        ]);

        res.status(201).json({
            success: true,
            mensaje: 'Pedido registrado correctamente',
            pedidoID: resultado.insertId,
            numeroPedido: numero
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el pedido',
            error: error.message
        });
    }
});

// PUT: actualizar un pedido
router.put('/:id', async (req, res) => {
    try {
        const {
            nombreCliente,
            correoCliente,
            telefonoCliente,
            provincia,
            municipioSector,
            direccion,
            metodoPago,
            estadoPago,
            estadoPedido,
            numeroSeguimiento,
            courierID,
            provinciaID,
            subtotal,
            costoEnvio,
            descuento,
            total
        } = req.body;

        const [resultado] = await pool.query(`
            UPDATE pedidos SET
                NombreCliente = ?,
                CorreoCliente = ?,
                TelefonoCliente = ?,
                Provincia = ?,
                MunicipioSector = ?,
                Direccion = ?,
                MetodoPago = ?,
                EstadoPago = ?,
                EstadoPedido = ?,
                NumeroSeguimiento = ?,
                CourierID = ?,
                ProvinciaID = ?,
                Subtotal = ?,
                CostoEnvio = ?,
                Descuento = ?,
                Total = ?
            WHERE PedidoID = ?
        `, [
            nombreCliente,
            correoCliente,
            telefonoCliente,
            provincia,
            municipioSector,
            direccion,
            metodoPago,
            estadoPago,
            estadoPedido,
            numeroSeguimiento || null,
            courierID || null,
            provinciaID || null,
            subtotal,
            costoEnvio,
            descuento,
            total,
            req.params.id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Pedido actualizado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el pedido',
            error: error.message
        });
    }
});

// DELETE: eliminar un pedido
router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await pool.query(
            'DELETE FROM pedidos WHERE PedidoID = ?',
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Pedido eliminado correctamente'
        });

    } catch (error) {
        res.status(409).json({
            success: false,
            mensaje: 'No se pudo eliminar el pedido. Puede tener detalles relacionados.',
            error: error.message
        });
    }
});

module.exports = router;
