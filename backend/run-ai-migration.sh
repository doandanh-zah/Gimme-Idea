#!/bin/bash

# Run AI Features Migration Script
# Usage: ./run-ai-migration.sh

echo "🚀 Running AI Features Migration..."
echo "=================================="

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please run this migration via Supabase Dashboard SQL Editor instead:"
    echo "1. Go to https://pcipyfyannlmvaribhub.supabase.co/project/_/sql"
    echo "2. Copy content from: backend/database/migration_add_ai_features.sql"
    echo "3. Paste and execute"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Extract connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env"
    exit 1
fi

echo "📊 Connecting to database..."
echo "📄 Executing migration_add_ai_features.sql..."

# Run migration
psql "$DATABASE_URL" -f database/migration_add_ai_features.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Created tables:"
    echo "  - ai_interactions"
    echo "  - user_ai_credits"
    echo "  - ai_market_assessments"
    echo "  - Added columns to comments table"
    echo ""
    echo "Created functions:"
    echo "  - can_user_use_ai()"
    echo "  - track_ai_interaction()"
    echo "  - initialize_user_ai_credits()"
else
    echo "❌ Migration failed"
    echo "Please check the error messages above"
    exit 1
fi
