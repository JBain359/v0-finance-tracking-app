#!/bin/bash

# SQL Syntax Validation Script
# Tests SQL files for common syntax errors before running

set -e

echo "🔍 Validating SQL files..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found - skipping syntax validation${NC}"
    echo "Install PostgreSQL client tools to enable syntax checking"
    exit 0
fi

# Function to validate SQL file syntax
validate_file() {
    local file=$1
    local filename=$(basename "$file")

    echo -n "Checking $filename... "

    # Try to parse the SQL (dry-run)
    if psql --set ON_ERROR_STOP=on --quiet --no-psqlrc -f "$file" --single-transaction --dry-run postgres 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo ""
        echo -e "${RED}Syntax error in $filename${NC}"
        echo "Run manually to see error details:"
        echo "  psql -d your_database -f $file"
        echo ""
        return 1
    fi
}

# Validate files
errors=0

if [ -f "migrations/000_schema.sql" ]; then
    validate_file "migrations/000_schema.sql" || ((errors++))
else
    echo -e "${RED}✗ migrations/000_schema.sql not found${NC}"
    ((errors++))
fi

if [ -f "migrations/001_config.sql" ]; then
    validate_file "migrations/001_config.sql" || ((errors++))
else
    echo -e "${RED}✗ migrations/001_config.sql not found${NC}"
    ((errors++))
fi

echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All SQL files validated successfully${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $errors error(s)${NC}"
    exit 1
fi
