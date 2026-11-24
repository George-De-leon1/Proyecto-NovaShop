
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ==========================================
// GET: CONSULTAR TODOS LOS COURIERS
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [couriers] = await pool.query(
            'SELECT * FROM couriers ORDER BY CourierID DESC'
        );

        res.json({
            success: true,
            total: couriers.length,
            couriers
        });

    } catch (error) {
        console.error('Error al consultar couriers:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar los couriers'
        });
    }
});

// ==========================================
// GET: CONSULTAR UN COURIER
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [couriers] = await pool.query(
            'SELECT * FROM couriers WHERE CourierID = ?',
            [id]
        );

        if (couriers.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Courier no encontrado'
            });
        }

        res.json({
            success: true,
            courier: couriers[0]
        });

    } catch (error) {
        console.error('Error al consultar courier:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar el courier'
        });
    }
});

// ==========================================
// POST: REGISTRAR UN COURIER
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            nombre,
            contacto = null,
            telefono = null,
            whatsapp = null,
            correo = null,
            sitioWeb = null,
            tarifaBase,
            tiempoEstimado = null,
            tipoServicio = null,
            activo = 1
        } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del courier es obligatorio'
            });
        }

        const tarifa = Number(tarifaBase);

        if (tarifaBase === undefined || tarifaBase === null ||
            tarifaBase === '' || !Number.isFinite(tarifa) || tarifa < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La tarifa base debe ser un número válido mayor o igual a cero'
            });
        }

        if (![0, 1].includes(Number(activo))) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado activo debe ser 0 o 1'
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO couriers
            (Nombre, Contacto, Telefono, WhatsApp, Correo,
             SitioWeb, TarifaBase, TiempoEstimado, TipoServicio, Activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre.trim(),
                contacto,
                telefono,
                whatsapp,
                correo,
                sitioWeb,
                tarifa,
                tiempoEstimado,
                tipoServicio,
                Number(activo)
            ]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Courier registrado correctamente',
            courierID: resultado.insertId
        });

    } catch (error) {
        console.error('Error al registrar courier:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el courier'
        });
    }
});

// ==========================================
// PUT: ACTUALIZAR UN COURIER
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            contacto = null,
            telefono = null,
            whatsapp = null,
            correo = null,
            sitioWeb = null,
            tarifaBase,
            tiempoEstimado = null,
            tipoServicio = null,
            activo = 1
        } = req.body;

        if (typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del courier es obligatorio'
            });
        }

        const tarifa = Number(tarifaBase);

        if (tarifaBase === undefined || tarifaBase === null ||
            tarifaBase === '' || !Number.isFinite(tarifa) || tarifa < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La tarifa base no es válida'
            });
        }

        if (![0, 1].includes(Number(activo))) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado activo debe ser 0 o 1'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE couriers SET
            Nombre = ?, Contacto = ?, Telefono = ?, WhatsApp = ?,
            Correo = ?, SitioWeb = ?, TarifaBase = ?,
            TiempoEstimado = ?, TipoServicio = ?, Activo = ?
            WHERE CourierID = ?`,
            [
                nombre.trim(),
                contacto,
                telefono,
                whatsapp,
                correo,
                sitioWeb,
                tarifa,
                tiempoEstimado,
                tipoServicio,
                Number(activo),
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            const [existe] = await pool.query(
                'SELECT CourierID FROM couriers WHERE CourierID = ?',
                [id]
            );

            if (existe.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Courier no encontrado'
                });
            }
        }

        res.json({
            success: true,
            mensaje: 'Courier actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar courier:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el courier'
        });
    }
});

// ==========================================
// DELETE: ELIMINAR UN COURIER
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM couriers WHERE CourierID = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Courier no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Courier eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar courier:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'No se pudo eliminar el courier. Puede estar relacionado con pedidos o provincias.'
        });
    }
});

module.exports = router;
