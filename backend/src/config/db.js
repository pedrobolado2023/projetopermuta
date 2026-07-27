/**
 * DATABASE CONNECTION POOL
 * PostgreSQL via node-postgres (pg)
 * 
 * Reads DATABASE_URL from environment variable — never hardcoded.
 * EasyPanel injects: postgres://postpermuta:142635Pe@dados_postpermuta:5432/postpermuta?sslmode=disable
 */

'use strict';

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[DB] DATABASE_URL não está definida. Configure a variável de ambiente no EasyPanel.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Pool sizing — adequado para containers no EasyPanel
  max:              10,   // máximo de conexões simultâneas
  min:              2,    // conexões mínimas mantidas abertas
  idleTimeoutMillis: 30000,  // 30s — fecha conexões ociosas
  connectionTimeoutMillis: 5000,  // 5s — falha rápida se DB indisponível

  // SSL: desabilitado conforme a connection string do EasyPanel (?sslmode=disable)
  // Para ambientes de produção com SSL, alterar para: ssl: { rejectUnauthorized: true }
  ssl: false,
});

// ─── Pool Event Listeners ─────────────────────────────────────────────────────
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Nova conexão estabelecida com o PostgreSQL.');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexão:', err.message);
  // Não encerra o processo — deixa o Express lidar com a falha graciosamente
});

// ─── Helper: Execute Query ─────────────────────────────────────────────────────
/**
 * Executa uma query no pool e retorna os rows.
 * @param {string} text - SQL query com placeholders ($1, $2...)
 * @param {Array}  params - Valores para os placeholders
 * @returns {Promise<pg.QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Query (${duration}ms): ${text.substring(0, 80)}...`);
    }

    return result;
  } catch (err) {
    console.error('[DB] Erro ao executar query:', { text: text.substring(0, 100), error: err.message });
    throw err;
  }
}

// ─── Helper: Transaction ──────────────────────────────────────────────────────
/**
 * Executa múltiplas queries em uma transaction ACID.
 * Garante ROLLBACK automático em caso de erro.
 * @param {Function} callback - async (client) => { ... await client.query(...) }
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
async function checkConnection() {
  try {
    const result = await query('SELECT NOW() AS current_time, version() AS pg_version');
    console.log('[DB] ✅ Conexão com PostgreSQL confirmada.');
    console.log(`[DB]    Hora do servidor: ${result.rows[0].current_time}`);
    console.log(`[DB]    Versão: ${result.rows[0].pg_version.split(' ').slice(0, 2).join(' ')}`);
    return true;
  } catch (err) {
    console.error('[DB] ❌ Falha ao conectar ao PostgreSQL:', err.message);
    return false;
  }
}

// Verifica conexão ao inicializar
checkConnection();

module.exports = { query, withTransaction, pool };
