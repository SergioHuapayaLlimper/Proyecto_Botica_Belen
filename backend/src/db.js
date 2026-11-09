import mysql from 'mysql2/promise';

// Pool de conexiones a MySQL. Usamos pool.query() con parámetros "?" (los valores se escapan, sin inyección SQL).
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'botica_belen_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL(10,2) llega como número y no como texto
  dateStrings: true, // DATETIME llega como 'AAAA-MM-DD HH:MM:SS'
});

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

// Ejecuta varias operaciones como una sola unidad: si algo falla, se deshace todo (ROLLBACK).
export async function transaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
