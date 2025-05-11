#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID
        echo "Backend server (PID $BACKEND_PID) stopped."
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        echo "Frontend server (PID $FRONTEND_PID) stopped."
    fi
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Navigate to the backend directory and start the backend server
echo "Starting backend server..."
cd backend
# Check if virtual environment exists before activating
if [ -d "story-flicks/bin" ]; then
    source story-flicks/bin/activate
    echo "Activated backend virtual environment."
else
    echo "Warning: Backend virtual environment 'story-flicks' not found. Skipping activation."
fi
uvicorn main:app --reload &
BACKEND_PID=$!
echo "Backend server starting with PID $BACKEND_PID (running in background)"
cd ..

# Navigate to the frontend directory and start the frontend server
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend server starting with PID $FRONTEND_PID (running in background)"
cd ..

# Wait indefinitely until interrupted
echo "Servers are running. Press Ctrl+C to stop."
wait