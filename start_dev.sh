#!/bin/bash

# Store the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any processes running on ports 3000 and 5001
echo "Cleaning up existing processes..."
lsof -ti:3000,5001 | xargs kill -9 2>/dev/null || true

# Function to run the backend server
start_backend() {
    echo "Starting backend server..."
    cd "$BASE_DIR/server"
    source ../venv/bin/activate
    export FLASK_APP=wsgi.py
    export FLASK_ENV=development
    export FLASK_DEBUG=1
    export PYTHONPATH="$BASE_DIR/server"
    python -m flask run --port=5001
}

# Function to run the frontend server
start_frontend() {
    echo "Starting frontend server..."
    cd "$BASE_DIR/frontend"
    npm start
}

# Function to check if a process is running
wait_for_server() {
    local port=$1
    local name=$2
    echo "Waiting for $name to start on port $port..."
    while ! nc -z localhost $port; do
        sleep 1
    done
    echo "$name is running on port $port"
}

# Start backend server
start_backend &
backend_pid=$!

# Wait for backend to start
sleep 5

# Start frontend server
start_frontend &
frontend_pid=$!

# Wait for both processes
wait $backend_pid $frontend_pid
