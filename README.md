# HRMS

A unified and centralized platform where all components—whether administrators, employees, or stakeholders—are seamlessly integrated in one place. It serves as a comprehensive and efficient module that streamlines all operations without complexity or unnecessary hassle.

HRMS is a React + Vite frontend with an Express API backed by MySQL through Sequelize.

## Run Locally

1. Make sure your MySQL instance is running on `127.0.0.1:3306`, or set `DB_PORT` / `DB_FALLBACK_PORTS` in `.env` if your local MySQL uses another port such as `3307`.
2. Create a MySQL database named `hrms`.
3. Set database credentials in `.env`.
4. Start the backend:

```bash
npm run server
```

5. Start the frontend:

```bash
npm run dev
```

6. Or run both together:

```bash
npm run dev:full
```

## Useful Commands

```bash
npm run db:sync
npm run seed
npm run build
npm run lint
```

## License

This project is licensed under the MIT License.
