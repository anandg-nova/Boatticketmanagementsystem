#!/bin/bash

echo "Stopping all services..."

# Kill MongoDB process
echo "Stopping MongoDB..."
pkill -f mongod

# Kill any running Node.js processes for the frontend
echo "Stopping Frontend..."
pkill -f "vite"

# Kill any running Node.js processes for the backend
echo "Stopping Backend..."
pkill -f "nodemon"

# Clean up MongoDB socket file
echo "Cleaning up MongoDB socket file..."
sudo rm -f /tmp/mongodb-27017.sock

# Kill any remaining processes on ports
echo "Cleaning up ports..."
lsof -ti:5173-5180 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "All services stopped successfully!" 