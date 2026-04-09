#!/bin/bash

# Reset Database Script
# =====================
# This script will:
# 1. Drop all tables and data
# 2. Recreate schema from Prisma migrations
# 3. Start fresh

set -e

# Load environment variables from .env file
if [ -f "apps/backend/.env" ]; then
  export $(cat apps/backend/.env | grep -v '^#' | xargs)
fi

echo "🗑️  Database Reset Script"
echo "========================"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA from your database!"
echo ""

# Ask for confirmation
read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "🔄 Resetting database..."
echo ""

# Run Prisma migrate reset (drops DB, recreates, runs migrations)
npx prisma migrate reset --force --skip-generate --schema=packages/db/prisma/schema.prisma

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "1. Backend will need to be restarted: npm run dev:backend"
echo "2. All data has been deleted"
echo "3. You can now run fresh tests"
echo ""
