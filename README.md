# Personal Electronics ERP

A local web app for tracking electronics parts, stock, purchase history, and project BOM costs.

The main workflow is simple:

- import LCSC order CSVs to update stock and pricing
- audit a cart before buying duplicates
- check BOM cost and shortages before building
- keep a dashboard of inventory and recent activity

## Stack

- Next.js
- React
- Prisma
- SQLite

## Main Pages

- `Dashboard` for inventory stats and recent activity
- `Parts` for browsing parts and stock history
- `Import` for loading LCSC order CSV files
- `Audit` for checking a cart against stock and purchase history
- `Projects` for BOM pre-flight checks and committed build usage

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
```

3. Apply migrations:

```bash
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Notes

This project uses Prisma with SQLite.

- `prisma/schema.prisma` contains the schema
- `prisma/migrations/` contains the migration history
- the local `.db` file is ignored by git on purpose

If you only want the same code on another machine, commit the source files, Prisma schema, and migrations.

If you want the exact same local data too, copy the SQLite `.db` file and `.env` file manually to the other machine.

## Useful Commands

```bash
npm run dev
npm run lint
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Troubleshooting

- If the app starts but the database is empty, check `DATABASE_URL`.
- If Prisma types look stale, run `npm run db:generate`.
- If a fresh clone is missing tables, run `npm run db:migrate`.
