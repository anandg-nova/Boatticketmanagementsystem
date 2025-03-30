#!/bin/bash

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Stopping Boat Ticket Management System..."

# Kill processes using PIDs from .pids file if it exists
if [ -f "$PROJECT_ROOT/.pids" ]; then
    echo "Stopping processes using PIDs from .pids file..."
    kill $(cat "$PROJECT_ROOT/.pids") 2>/dev/null || true
    rm "$PROJECT_ROOT/.pids"
fi

# Clean up remaining processes
echo "Cleaning up remaining processes..."

# Stop MongoDB
echo "Stopping MongoDB..."
pkill -f "mongod" || true

# Stop Frontend
echo "Stopping Frontend..."
pkill -f "vite" || true

# Stop Backend
echo "Stopping Backend..."
pkill -f "node" || true

# Clean up MongoDB socket file
echo "Cleaning up MongoDB socket file..."
rm -f /tmp/mongodb-27017.sock

# Clean up ports
echo "Cleaning up ports..."
lsof -ti:5173-5180 | xargs kill -9 2>/dev/null || true
lsof -ti:3000-3001 | xargs kill -9 2>/dev/null || true
lsof -ti:27017 | xargs kill -9 2>/dev/null || true

echo "All services stopped successfully!" 