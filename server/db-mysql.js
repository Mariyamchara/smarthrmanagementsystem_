import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

dotenv.config({ path: envPath, quiet: true });

// Connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
};

// mysql2/promise pool for raw queries and performance
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Sequelize instance for models
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    dialectModule: mysql2, // Fixed: Explicitly pass mysql2 for Vercel compatibility
    logging: false,
    pool: {
      max: 5, // Reduced for serverless
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 30000,
    },
  }
);

export async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected successfully on ${dbConfig.host}:${dbConfig.port}`);
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
    throw error;
  }
}

export { sequelize };