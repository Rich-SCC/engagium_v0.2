#!/bin/bash
# Engagium Database Setup and Seed Script
# This script sets up the database schema and seeds it with test data

set -e  # Exit on error

echo "🚀 Engagium Database Setup & Seed"
echo "=================================="
echo ""

# Check if we're in the database directory
if [ ! -f "seed-data.sql" ]; then
    echo "❌ Error: Please run this script from the database directory"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first"
    exit 1
fi

# Check if backend .env exists
if [ ! -f "../backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "Creating from .env.example..."
    if [ -f "../backend/.env.example" ]; then
        cp ../backend/.env.example ../backend/.env
        echo "✅ Created backend/.env"
        echo "⚠️  Please update DATABASE_URL in backend/.env if needed"
    else
        echo "❌ Error: backend/.env.example not found"
        exit 1
    fi
fi

# Load DATABASE_URL from backend .env
if [ -f "../backend/.env" ]; then
    export $(grep -v '^#' ../backend/.env | grep DATABASE_URL | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in backend/.env"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database schema..."

# Extract database connection details
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Apply schema
echo "Applying schema.sql..."
if psql "$DATABASE_URL" -f schema.sql > /dev/null 2>&1; then
    echo "✅ Schema applied successfully"
else
    echo "⚠️  Schema may already exist (this is okay)"
fi

echo ""
echo "🌱 Seeding database with test data..."
npm run seed

echo ""
echo "🔍 Verifying seed data..."
npm run verify

echo ""
echo "═══════════════════════════════════════════"
echo "✨ Setup complete! ✨"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. cd ../backend && npm run dev"
echo "2. cd ../frontend && npm run dev"
echo "3. Login with: john.doe@university.edu / Password123!"
echo ""
