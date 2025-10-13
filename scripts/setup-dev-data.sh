#!/bin/bash

echo "🗃️ Setting up ShellNexa development data..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U shellnexa; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Create sample data in PostgreSQL
echo "📊 Creating sample data..."

# Connect to each service database and create sample tables
psql -h localhost -p 5432 -U shellnexa -d auth_service -c "
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified)
VALUES 
  ('admin', 'admin@shellnexa.com', '\$2b\$10\$hash', 'Admin', 'User', true, true),
  ('librarian', 'librarian@shellnexa.com', '\$2b\$10\$hash', 'Jane', 'Librarian', true, true),
  ('patron', 'patron@shellnexa.com', '\$2b\$10\$hash', 'John', 'Patron', true, true)
ON CONFLICT (username) DO NOTHING;
"

psql -h localhost -p 5432 -U shellnexa -d catalog_service -c "
CREATE TABLE IF NOT EXISTS bibliographic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  isbn VARCHAR(20),
  publisher VARCHAR(255),
  publication_year INTEGER,
  language VARCHAR(10) DEFAULT 'en',
  format VARCHAR(50) DEFAULT 'book',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bibliographic_records (title, subtitle, isbn, publisher, publication_year)
VALUES 
  ('Introduction to Library Science', 'Fundamentals and Practice', '9781234567890', 'Academic Press', 2023),
  ('Digital Libraries in the 21st Century', 'Technology and Innovation', '9781234567891', 'Tech Publishers', 2024),
  ('Cataloging Best Practices', 'A Comprehensive Guide', '9781234567892', 'Library Publications', 2022)
ON CONFLICT DO NOTHING;
"

# Setup Elasticsearch indices
echo "🔍 Setting up Elasticsearch indices..."
curl -X PUT "localhost:9200/catalog" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "title": { "type": "text", "analyzer": "standard" },
      "author": { "type": "text", "analyzer": "standard" },
      "subject": { "type": "keyword" },
      "isbn": { "type": "keyword" },
      "publication_year": { "type": "integer" },
      "format": { "type": "keyword" },
      "language": { "type": "keyword" }
    }
  }
}' 2>/dev/null || echo "Elasticsearch index creation skipped (service may not be ready)"

# Setup Redis cache keys
echo "💾 Setting up Redis cache..."
redis-cli -h localhost -p 6379 SET "app:version" "1.0.0" EX 3600 2>/dev/null || echo "Redis setup skipped (service may not be ready)"

echo "✅ Development data setup complete!"
