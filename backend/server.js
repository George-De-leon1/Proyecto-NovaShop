
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');

require('dotenv').config();

// ==========================================
// IMPORTAR RUTAS
// ==========================================

const usuariosRoutes = require('./routes/usuarios');
const categoriasRoutes = require('./routes/categorias');
const productosRoutes = require('./routes/productos');
const variantesRoutes = require('./routes/variantes');
const temporadaRoutes = require('./routes/temporada');
const provinciasRoutes = require('./routes/provincias');
const couriersRoutes = require('./routes/couriers');
const courierProvinciaRoutes = require('./routes/courierProvincia');
const pedidosRoutes = require('./routes/pedidos');
const detallePedidoRoutes = require('./routes/detallepedido');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// API: ESTADO DEL SERVIDOR
// ==========================================

app.get('/api/estado', async (req, res) => {
    try {
        const pool = await connectDB();

        const [resultado] = await pool.query(`
            SELECT
                DATABASE() AS baseDatos,
                NOW() AS fechaServidor
        `);

        res.json({
            success: true,
            mensaje: 'NovaShop funciona correctamente',
            servidor: 'Node.js + Express',
            baseDatos: resultado[0].baseDatos,
            fechaServidor: resultado[0].fechaServidor
        });

    } catch (error) {
        console.error('Error al consultar la base de datos:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'Error al conectar con la base de datos'
        });
    }
});

// ==========================================
// API: USUARIOS
// ==========================================

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', require('./routes/productos'));
app.use('/api/variantes', require('./routes/variantes'));
app.use('/api/temporadas',require('./routes/temporada'));
app.use('/api/provincias', require('./routes/provincias')); 
app.use('/api/couriers', require('./routes/couriers'));
app.use('/api/courier-provincia', require('./routes/courierProvincia'));
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/detallepedido', detallePedidoRoutes);
// ==========================================
// INICIAR SERVIDOR
// ==========================================

async function iniciarServidor() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log('===================================');
            console.log(' NOVASHOP BACKEND INICIADO');
            console.log('===================================');
            console.log(`Servidor: http://localhost:${PORT}`);
            console.log(`Base de datos: ${process.env.DB_NAME}`);
            console.log('API de usuarios: /api/usuarios');
            console.log('===================================');
        });

    } catch (error) {
        console.error('No se pudo iniciar NovaShop:', error.message);
        process.exit(1);
    }
}

iniciarServidor();
