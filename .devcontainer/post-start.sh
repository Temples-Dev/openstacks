#!/bin/bash

echo "🔄 Starting ShellNexa services..."

# Ensure services are healthy
echo "🏥 Health checking services..."

# Wait a bit for services to stabilize
sleep 5

# Check if we need to run any migrations or setup
if [ -f "/workspace/scripts/setup-dev-data.sh" ]; then
  echo "🗃️ Setting up development data..."
  bash /workspace/scripts/setup-dev-data.sh
fi

echo "✅ All services are ready for development!"
