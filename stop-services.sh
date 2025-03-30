#!/bin/bash

# Function to kill process by PID file
kill_pid_file() {
    if [ -f "$1" ]; then
        pid=$(cat "$1")
        kill -9 $pid 2>/dev/null
        rm "$1"
    fi
}

echo "Stopping all services..."

# Kill processes using PID files
kill_pid_file .mongo.pid
kill_pid_file .backend.pid
kill_pid_file .frontend.pid

# Additional cleanup to ensure ports are free
lsof -ti :3001 | xargs kill -9 2>/dev/null  # Backend
lsof -ti :27017 | xargs kill -9 2>/dev/null # MongoDB
lsof -ti :5173 | xargs kill -9 2>/dev/null  # Frontend

echo "All services stopped!" 