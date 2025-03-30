#!/bin/bash

echo "Starting all services..."

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ~/data/db --bind_ip 127.0.0.1 &
sleep 5

# Start Backend
echo "Starting Backend..."
cd backend && npm run dev &
sleep 5

# Start Frontend
echo "Starting Frontend..."
cd frontend && npm run dev -- --host --port 3000 &

echo "All services started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "MongoDB: mongodb://127.0.0.1:27017"
