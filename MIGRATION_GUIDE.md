# MySQL Setup

This project now uses MySQL with Sequelize.

## Environment

Set these values in `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_FALLBACK_PORTS=3307,3308
DB_NAME=hrms
DB_USER=root
DB_PASSWORD=
PORT=5000
```

## Database

Create the database before starting the server:

```sql
CREATE DATABASE hrms;
```

## Commands

```bash
npm run db:sync
npm run seed
npm run server
```

`server/index.js` also auto-syncs tables and seeds starter data when empty.
