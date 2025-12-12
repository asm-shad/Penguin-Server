#!/usr/bin/env bash
# exit on error
set -o errexit

pnpm install
pnpm run build:schema
pnpm exec ts-node prisma generate --schema=./prisma/schema.prisma
pnpm exec ts-node prisma migrate deploy
