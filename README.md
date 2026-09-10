# Standard Task Library

A maintenance-strategy task library app (React + TypeScript + Tailwind CSS frontend,
Node/Express + Prisma + PostgreSQL backend), built from the `Pump_Standard_Task_Library.xlsx`
workbook's structure: a Task Register with linked Operations, Labour, Materials, Safety
Controls, and References sheets, plus editable Controlled Lists for dropdown values.

## Project structure

```
standard-task-library/
├── backend/            Express + TypeScript + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma    Data model (see project chat for the ERD)
│   │   ├── seed.ts          Loads controlled lists + the 5 example pump tasks
│   │   └── seed_data.json   Extracted verbatim from the source workbook
│   └── src/
│       ├── index.ts         App entry point
│       ├── prisma.ts        Shared Prisma client
│       └── routes/
│           ├── tasks.ts     Task CRUD incl. nested sub-resources + revision log
│           └── lists.ts     Controlled-list CRUD (dropdown values)
└── frontend/            Vite + React + TypeScript + Tailwind v4
    └── src/
        ├── pages/
        │   ├── TaskRegisterPage.tsx   Filterable task list
        │   ├── TaskDetailPage.tsx     Full authoring form (header + 5 sub-tables)
        │   └── ListsAdminPage.tsx     Manage controlled dropdown values
        ├── components/Layout.tsx
        ├── lib/api.ts        Fetch client
        └── types/index.ts    Shared types mirroring the API shape
```

## Setup

### 1. Database

You need a running PostgreSQL instance. Easiest local option:

```bash
docker run --name stl-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=standard_task_library -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init   # creates tables from schema.prisma
npm run prisma:seed                  # loads controlled lists + 5 example pump tasks
npm run dev                          # http://localhost:4000
```

> **Note:** this project was scaffolded in a sandboxed environment without access to
> `binaries.prisma.sh`, so `prisma generate` / `prisma migrate` could not be run or verified
> here. Both `schema.prisma` and every route were hand-checked and type-checked against the
> Prisma client's base types, but run `npx prisma generate` yourself as the first step — if
> anything doesn't line up with the real generated client, it'll surface immediately as a
> TypeScript error in `src/routes/tasks.ts` or `lists.ts`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173, proxies /api to localhost:4000
```

## What's implemented (v1 scope, per project decisions)

- Full data model: Task Register, Operations, Labour, Materials, Safety Controls,
  References, plus a `TaskRevision` audit table and 7 editable controlled-list tables.
- Task Register: filterable list (status, discipline, search) with calculated columns
  (total labour hours, operation count) computed at query time, never stored.
- Full authoring/edit forms for a task and all five of its sub-tables.
- Controlled Lists admin screen — add new dropdown values without a code change.
- Revision history is logged automatically whenever `currentRevision` or `status` changes
  on save.

## Deliberately out of scope for v1

- Authentication / roles (any user can edit anything)
- Search/filter beyond status, discipline, and title text
- Embedded images per operation step
- PDF/CMS export (the workbook's structure — not the earlier PDF SOP layout — is what's
  modeled here; a PDF/Excel export can be layered on later without a schema change)

## Seed data

`prisma/seed_data.json` is extracted verbatim from every sheet of the source workbook.
`seed.ts` reads it, creates the 7 controlled lists from the `Lists` sheet, then creates
the 5 example pump tasks (`PMP-ST-001` through `PMP-ST-005`) with all of their linked
operations, labour, materials, safety controls, and references.
