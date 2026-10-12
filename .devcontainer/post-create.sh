#!/bin/bash

echo "🚀 Setting up OpenStacks development environment..."

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check PostgreSQL connection
echo "🔍 Checking PostgreSQL connection..."
until pg_isready -h localhost -p 5432 -U openstacks; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Check Redis connection
echo "🔍 Checking Redis connection..."
until redis-cli -h localhost -p 6379 ping; do
  echo "Waiting for Redis..."
  sleep 2
done
echo "✅ Redis is ready!"

# Check Elasticsearch connection
echo "🔍 Checking Elasticsearch connection..."
until curl -s http://localhost:9200/_cluster/health; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done
echo "✅ Elasticsearch is ready!"

# Install dependencies for all services
echo "📦 Installing dependencies..."
cd /workspace

# Install root dependencies
if [ -f "package.json" ]; then
  echo "Installing root dependencies..."
  pnpm install
fi

# Install backend dependencies
if [ -f "backend/package.json" ]; then
  echo "Installing backend dependencies..."
  cd backend
  pnpm install
  cd ..
fi

# Create services directory structure if it doesn't exist
echo "📁 Setting up microservices structure..."
mkdir -p services/{auth,catalog,circulation,acquisitions,discovery,reporting}
mkdir -p services/api-gateway
mkdir -p shared/{types,utils,config}

echo "🎉 Development environment setup complete!"
echo ""
echo "🌐 Available services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Elasticsearch: localhost:9200"
echo "  - Kibana: localhost:5601"
echo "  - MailHog: localhost:8025"
echo ""
echo "🚀 You can now start developing OpenStacks!"
