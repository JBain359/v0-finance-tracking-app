#!/bin/bash

# Database Setup Script
# This script runs the migrations in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting database setup..."
echo ""

# Check if supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✓ Supabase CLI detected"
    echo ""

    # Prompt user
    echo "This will reset your database and apply all migrations."
    echo "⚠️  WARNING: This will delete all existing data!"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Step 1: Resetting database..."

        if supabase db reset; then
            echo ""
            echo -e "${GREEN}✅ Database setup complete!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Database setup failed${NC}"
            echo ""
            echo "Common issues:"
            echo "1. Check if Supabase project is linked: supabase link"
            echo "2. Check if local Supabase is running: supabase start"
            echo "3. Review SQL syntax in migration files"
            echo ""
            echo "To run migrations manually:"
            echo "  supabase db execute --file migrations/000_schema.sql"
            echo "  supabase db execute --file migrations/001_config.sql"
            exit 1
        fi

        echo ""
        echo "✅ Database setup complete!"
        echo ""
        echo "Verification:"
        supabase db execute --sql "
SELECT
  table_name,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = t.table_name) as index_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
"
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "Please run migrations manually:"
    echo "1. psql -d your_database < migrations/000_schema.sql"
    echo "2. psql -d your_database < migrations/001_config.sql"
    echo ""
    echo "Or install Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi
