#!/bin/bash
# Script to sync schema.sql and init-database.sql with live database
# Usage: ./sync-schema.sh

set -e

DB_NAME="engagium"
DB_USER="postgres"
OUTPUT_DIR="."
TEMP_DIR="/tmp/engagium_schema_sync"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Engagium Schema Sync Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create temp directory
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}Step 1: Extracting schema from live database...${NC}"

# Export the schema from live database (without data, without ownership info)
pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-comments \
    -f "$TEMP_DIR/live_schema.sql"

echo -e "${GREEN}✓ Schema exported to temporary file${NC}"

echo -e "\n${YELLOW}Step 2: Listing tables in live database...${NC}"

# Get table list from live database (trim whitespace)
psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
    "SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
     ORDER BY table_name;" | tr -d ' \t\r' > "$TEMP_DIR/live_tables.txt"

echo -e "${GREEN}✓ Found $(wc -l < $TEMP_DIR/live_tables.txt) tables in live database:${NC}"
cat "$TEMP_DIR/live_tables.txt" | sed 's/^/  - /'

echo -e "\n${YELLOW}Step 3: Extracting tables from schema.sql...${NC}"

# Get table list from schema.sql
grep "CREATE TABLE IF NOT EXISTS" "$OUTPUT_DIR/schema.sql" | \
    sed 's/.*EXISTS //' | sed 's/ (.*//' | sort > "$TEMP_DIR/schema_tables.txt"

echo -e "${GREEN}✓ Found $(wc -l < $TEMP_DIR/schema_tables.txt) tables in schema.sql${NC}"

echo -e "\n${YELLOW}Step 4: Extracting tables from init-database.sql...${NC}"

# Get table list from init-database.sql
grep "CREATE TABLE IF NOT EXISTS" "$OUTPUT_DIR/init-database.sql" | \
    sed 's/.*EXISTS //' | sed 's/ (.*//' | sort > "$TEMP_DIR/init_tables.txt"

echo -e "${GREEN}✓ Found $(wc -l < $TEMP_DIR/init_tables.txt) tables in init-database.sql${NC}"

echo -e "\n${YELLOW}Step 5: Comparing schemas...${NC}"

# Compare live database with schema.sql
DIFF_SCHEMA=$(diff "$TEMP_DIR/live_tables.txt" "$TEMP_DIR/schema_tables.txt" || true)
if [ -z "$DIFF_SCHEMA" ]; then
    echo -e "${GREEN}✓ schema.sql matches live database${NC}"
else
    echo -e "${RED}✗ schema.sql differs from live database:${NC}"
    echo "$DIFF_SCHEMA"
fi

# Compare live database with init-database.sql
DIFF_INIT=$(diff "$TEMP_DIR/live_tables.txt" "$TEMP_DIR/init_tables.txt" || true)
if [ -z "$DIFF_INIT" ]; then
    echo -e "${GREEN}✓ init-database.sql matches live database${NC}"
else
    echo -e "${RED}✗ init-database.sql differs from live database:${NC}"
    echo "$DIFF_INIT"
fi

echo -e "\n${YELLOW}Step 6: Checking for specific differences...${NC}"

# Check for notifications table (which should be removed)
if grep -q "notifications" "$OUTPUT_DIR/schema.sql"; then
    echo -e "${RED}✗ schema.sql still contains 'notifications' table${NC}"
else
    echo -e "${GREEN}✓ schema.sql does not contain 'notifications' table${NC}"
fi

if grep -q "notifications" "$OUTPUT_DIR/init-database.sql"; then
    echo -e "${RED}✗ init-database.sql still contains 'notifications' table${NC}"
else
    echo -e "${GREEN}✓ init-database.sql does not contain 'notifications' table${NC}"
fi

echo -e "\n${YELLOW}Step 7: Verifying indexes...${NC}"

# Get indexes from live database
psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
    "SELECT indexname FROM pg_indexes 
     WHERE schemaname = 'public' 
     ORDER BY indexname;" > "$TEMP_DIR/live_indexes.txt"

echo -e "${GREEN}✓ Found $(wc -l < $TEMP_DIR/live_indexes.txt) indexes in live database${NC}"

# Check for notification indexes in SQL files
if grep -q "idx_notifications" "$OUTPUT_DIR/schema.sql"; then
    echo -e "${RED}✗ schema.sql still contains notification indexes${NC}"
else
    echo -e "${GREEN}✓ schema.sql does not contain notification indexes${NC}"
fi

if grep -q "idx_notifications" "$OUTPUT_DIR/init-database.sql"; then
    echo -e "${RED}✗ init-database.sql still contains notification indexes${NC}"
else
    echo -e "${GREEN}✓ init-database.sql does not contain notification indexes${NC}"
fi

echo -e "\n${YELLOW}Step 8: Summary${NC}"
echo -e "${GREEN}========================================${NC}"

# Final summary
ISSUES=0

if [ -n "$DIFF_SCHEMA" ]; then
    echo -e "${RED}⚠ schema.sql needs updates${NC}"
    ((ISSUES++))
fi

if [ -n "$DIFF_INIT" ]; then
    echo -e "${RED}⚠ init-database.sql needs updates${NC}"
    ((ISSUES++))
fi

if grep -q "notifications\|idx_notifications" "$OUTPUT_DIR/schema.sql" "$OUTPUT_DIR/init-database.sql"; then
    echo -e "${RED}⚠ Notification references found in SQL files${NC}"
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All files are in sync with live database!${NC}"
else
    echo -e "${RED}✗ Found $ISSUES issue(s) - manual review needed${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo ""
echo "Exported schema available at: $TEMP_DIR/live_schema.sql"
echo "You can review it with: cat $TEMP_DIR/live_schema.sql"
echo ""
echo "To clean up temporary files, run: rm -rf $TEMP_DIR"
