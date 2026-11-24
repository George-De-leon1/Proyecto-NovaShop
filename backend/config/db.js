
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectDB() {
    try {
        const connection = await pool.getConnection();

        console.log('MySQL conectado correctamente a NovaShop');

        connection.release();

        return pool;
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
        throw error;
    }
}

module.exports = {
    connectDB,
    pool
};
