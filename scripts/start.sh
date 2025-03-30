#!/bin/bash

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Boat Ticket Management System..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1

    echo "Waiting for $service to be ready..."
    while ! check_port $port; do
        if [ $attempt -eq $max_attempts ]; then
            echo "Error: $service failed to start after $max_attempts attempts"
            exit 1
        fi
        echo "Attempt $attempt/$max_attempts: Waiting for $service..."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo "$service is ready!"
}

# Clean up existing processes
echo "Cleaning up existing processes..."
"$PROJECT_ROOT/scripts/stop.sh"

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ~/data/db --bind_ip 127.0.0.1 &
MONGOD_PID=$!

# Wait for MongoDB to be ready
wait_for_service 27017 "MongoDB"

# Start Backend
echo "Starting Backend..."
cd "$PROJECT_ROOT/backend" && npm run dev &
BACKEND_PID=$!

# Wait for Backend to be ready
wait_for_service 3001 "Backend"

# Start Frontend
echo "Starting Frontend..."
cd "$PROJECT_ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

# Wait for Frontend to be ready
wait_for_service 5173 "Frontend"

# Save PIDs to a file for stop script
echo "$MONGOD_PID $BACKEND_PID $FRONTEND_PID" > "$PROJECT_ROOT/.pids"

echo "All services started successfully!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001"
echo "MongoDB: mongodb://127.0.0.1:27017"

# Keep the script running to maintain the processes
wait 