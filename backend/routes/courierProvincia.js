
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ==========================================
// GET: CONSULTAR TODAS LAS ASIGNACIONES
// ==========================================
router.get('/', async (req, res) => {
    try {
        const [asignaciones] = await pool.query(`
            SELECT
                cp.CourierID,
                c.Nombre AS Courier,
                cp.ProvinciaID,
                p.Nombre AS Provincia
            FROM courierprovincia cp
            INNER JOIN couriers c ON cp.CourierID = c.CourierID
            INNER JOIN provincias p ON cp.ProvinciaID = p.ProvinciaID
            ORDER BY c.Nombre, p.Nombre
        `);

        res.json({
            success: true,
            total: asignaciones.length,
            asignaciones
        });

    } catch (error) {
        console.error('Error al consultar asignaciones:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar las asignaciones'
        });
    }
});

// ==========================================
// GET: CONSULTAR PROVINCIAS DE UN COURIER
// ==========================================
router.get('/courier/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [provincias] = await pool.query(`
            SELECT p.ProvinciaID, p.Nombre
            FROM courierprovincia cp
            INNER JOIN provincias p ON cp.ProvinciaID = p.ProvinciaID
            WHERE cp.CourierID = ?
        `, [id]);

        res.json({
            success: true,
            total: provincias.length,
            provincias
        });

    } catch (error) {
        console.error('Error al consultar provincias del courier:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al consultar las provincias del courier'
        });
    }
});

// ==========================================
// POST: ASIGNAR PROVINCIA A UN COURIER
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { courierID, provinciaID } = req.body;

        if (!Number.isInteger(Number(courierID)) ||
            !Number.isInteger(Number(provinciaID)) ||
            Number(courierID) <= 0 ||
            Number(provinciaID) <= 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'CourierID y ProvinciaID deben ser números válidos'
            });
        }

        const [courier] = await pool.query(
            'SELECT CourierID FROM couriers WHERE CourierID = ?',
            [courierID]
        );

        if (courier.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'El courier no existe'
            });
        }

        const [provincia] = await pool.query(
            'SELECT ProvinciaID FROM provincias WHERE ProvinciaID = ?',
            [provinciaID]
        );

        if (provincia.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'La provincia no existe'
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO courierprovincia (CourierID, ProvinciaID)
             VALUES (?, ?)`,
            [courierID, provinciaID]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Provincia asignada al courier correctamente'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                mensaje: 'Esta provincia ya está asignada al courier'
            });
        }

        console.error('Error al asignar provincia:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al asignar la provincia'
        });
    }
});

// ==========================================
// DELETE: QUITAR PROVINCIA DE UN COURIER
// ==========================================
router.delete('/:courierID/:provinciaID', async (req, res) => {
    try {
        const { courierID, provinciaID } = req.params;

        const [resultado] = await pool.query(
            `DELETE FROM courierprovincia
             WHERE CourierID = ? AND ProvinciaID = ?`,
            [courierID, provinciaID]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'La asignación no existe'
            });
        }

        res.json({
            success: true,
            mensaje: 'Provincia retirada del courier correctamente'
        });

    } catch (error) {
        console.error('Error al retirar provincia:', error.message);
        res.status(500).json({
            success: false,
            mensaje: 'Error al retirar la provincia'
        });
    }
});

module.exports = router;
