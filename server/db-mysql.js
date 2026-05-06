import net from 'net';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

dotenv.config({ path: envPath, quiet: true });

/*
====================================================
STEP 4 ADDED FOR INFINITYFREE / CLOUD MYSQL SUPPORT
====================================================

Put these in .env file:

DB_HOST=sql103.infinityfree.com
DB_PORT=3306
DB_NAME=if0_41844154_hrms
DB_USER=if0_41844154
DB_PASSWORD=YOUR_VPANEL_PASSWORD

====================================================
*/

const DEFAULT_LOCAL_HOST = '127.0.0.1';
const DEFAULT_DB_PORT = 3306;
const LOCAL_FALLBACK_PORTS = [3307, 3308];
const SOCKET_TIMEOUT_MS = 3000;

// Detect if cloud host is provided
const usingCloudDatabase = !!process.env.DB_HOST;

const dbHost = normalizeHost(
  process.env.DB_HOST || DEFAULT_LOCAL_HOST
);

const dbPort = parsePort(
  process.env.DB_PORT,
  DEFAULT_DB_PORT
);

const fallbackPorts = usingCloudDatabase
  ? []
  : parsePortList(
      process.env.DB_FALLBACK_PORTS,
      isLocalHost(dbHost) ? LOCAL_FALLBACK_PORTS : []
    );

const connectionTargets = buildConnectionTargets(
  dbHost,
  dbPort,
  fallbackPorts
);

let activeConnectionTarget = connectionTargets[0];

function normalizeHost(host) {
  return host === 'localhost' ? DEFAULT_LOCAL_HOST : host;
}

function isLocalHost(host) {
  return (
    host === '127.0.0.1' ||
    host === '::1' ||
    host === 'localhost'
  );
}

function parsePort(value, defaultPort) {
  const parsedPort = Number(value);
  return Number.isInteger(parsedPort) && parsedPort > 0
    ? parsedPort
    : defaultPort;
}

function parsePortList(value, defaultPorts) {
  if (!value) return defaultPorts;

  return value
    .split(',')
    .map((port) => parsePort(port.trim(), NaN))
    .filter(
      (port, index, ports) =>
        Number.isInteger(port) &&
        ports.indexOf(port) === index
    );
}

function buildConnectionTargets(host, primaryPort, extraPorts) {
  const targets = [{ host, port: primaryPort }];

  for (const port of extraPorts) {
    if (port !== primaryPort) {
      targets.push({ host, port });
    }
  }

  return targets;
}

function canReachTarget(target) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: target.host,
      port: target.port,
    });

    const finish = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(SOCKET_TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function resolveConnectionTarget() {
  // For cloud DB directly use given host
  if (usingCloudDatabase) {
    activeConnectionTarget = connectionTargets[0];
    return activeConnectionTarget;
  }

  const preferredTargets = [
    activeConnectionTarget,
    ...connectionTargets.filter(
      ({ host, port }) =>
        host !== activeConnectionTarget.host ||
        port !== activeConnectionTarget.port
    ),
  ];

  for (const target of preferredTargets) {
    if (await canReachTarget(target)) {
      activeConnectionTarget = target;
      return target;
    }
  }

  activeConnectionTarget = connectionTargets[0];
  return activeConnectionTarget;
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'HRMS',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: activeConnectionTarget.host,
    port: activeConnectionTarget.port,
    dialect: 'mysql',
    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions: {
      connectTimeout: 30000,
    },

    hooks: {
      beforeConnect: async (config) => {
        const target = await resolveConnectionTarget();
        config.host = target.host;
        config.port = target.port;
      },
    },
  }
);

function isConnectionRefused(error) {
  return (
    error?.name === 'SequelizeConnectionRefusedError' ||
    error?.name === 'SequelizeConnectionError' ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.parent?.code === 'ECONNREFUSED' ||
    error?.parent?.code === 'ETIMEDOUT' ||
    error?.original?.code === 'ECONNREFUSED' ||
    error?.original?.code === 'ETIMEDOUT'
  );
}

export async function connectToDatabase() {
  try {
    await sequelize.authenticate();

    console.log(
      `MySQL connected successfully on ${activeConnectionTarget.host}:${activeConnectionTarget.port}`
    );

    return sequelize;
  } catch (error) {
    if (isConnectionRefused(error)) {
      console.error(`
Database connection failed.

Check these .env values:

DB_HOST=${process.env.DB_HOST}
DB_PORT=${process.env.DB_PORT}
DB_NAME=${process.env.DB_NAME}
DB_USER=${process.env.DB_USER}

For InfinityFree:
DB_HOST=sql103.infinityfree.com
DB_PORT=3306
`);
    }

    console.error('Unable to connect to MySQL:', error);
    throw error;
  }
}

export { sequelize };