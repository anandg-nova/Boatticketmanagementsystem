# Boat Ticket Management System Scripts

This directory contains utility scripts for managing the Boat Ticket Management System.

## Available Scripts

### start.sh
Starts all services required for the application:
- MongoDB database
- Backend server
- Frontend development server

Usage:
```bash
./start.sh
```

### stop.sh
Stops all running services and cleans up resources:
- Stops MongoDB
- Stops Frontend Vite server
- Stops Backend Node.js server
- Cleans up MongoDB socket file
- Kills any remaining processes on ports 5173-5180 and 3000

Usage:
```bash
./stop.sh
```

## Prerequisites

- MongoDB installed and configured
- Node.js and npm installed
- Frontend and backend dependencies installed
- MongoDB data directory at `~/data/db`

## Notes

- The scripts require sudo access for cleaning up MongoDB socket files
- Make sure to run the scripts from the project root directory
- The start script includes appropriate delays to ensure services start in the correct order 