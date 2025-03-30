#!/bin/bash

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on a port
kill_port() {
    lsof -ti :$1 | xargs kill -9 2>/dev/null
}

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
kill_port 3001  # Backend
kill_port 27017 # MongoDB
kill_port 5173  # Frontend

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ~/data/db --bind_ip 127.0.0.1 &
MONGO_PID=$!

# Wait for MongoDB to start
sleep 2

# Start Backend
echo "Starting Backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Save PIDs to a file for later use
echo $MONGO_PID > .mongo.pid
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "All services started!"
echo "MongoDB PID: $MONGO_PID"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID" 