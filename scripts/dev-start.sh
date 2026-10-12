#!/bin/bash

echo "🚀 Starting OpenStacks Development Environment"
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "🏗️ Building shared types..."
cd shared/types
pnpm install
pnpm run build
cd ../..

echo "🐳 Starting infrastructure services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch kibana mailhog

echo "⏳ Waiting for services to be ready..."
echo "   - PostgreSQL..."
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U openstacks > /dev/null 2>&1; do
  sleep 2
done

echo "   - Redis..."
until docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
  sleep 2
done

echo "   - Elasticsearch..."
until curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; do
  sleep 5
done

echo "🗃️ Setting up development data..."
bash scripts/setup-dev-data.sh

echo "📦 Installing API Gateway dependencies..."
cd services/api-gateway
pnpm install
cd ../..

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Available services:"
echo "  - API Gateway:    http://localhost:3001"
echo "  - API Docs:       http://localhost:3001/api/docs"
echo "  - Health Check:   http://localhost:3001/api/v1/health"
echo "  - Kibana:         http://localhost:5601"
echo "  - MailHog:        http://localhost:8025"
echo "  - PostgreSQL:     localhost:5432"
echo "  - Redis:          localhost:6379"
echo "  - Elasticsearch:  localhost:9200"
echo ""
echo "🚀 To start the API Gateway:"
echo "   cd services/api-gateway && pnpm run start:dev"
echo ""
echo "📚 See BACKEND_SETUP.md for detailed instructions"
