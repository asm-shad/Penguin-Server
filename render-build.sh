#!/usr/bin/env bash
# exit on error
set -o errexit

pnpm install
pnpm run build
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate deploy