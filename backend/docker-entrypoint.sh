#!/bin/sh
set -e

# No committed migrations yet, so push the schema straight to the database.
npx prisma db push --skip-generate
npx prisma db seed

exec node dist/index.js
