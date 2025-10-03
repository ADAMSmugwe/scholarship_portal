#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Scholarship Portal Development Servers...${NC}\n"

# Start Backend Server
echo -e "${GREEN}Starting Flask Backend Server...${NC}"
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --port 5003 &
BACKEND_PID=$!

# Wait a moment to ensure backend starts
sleep 2

# Start Frontend Server
echo -e "\n${GREEN}Starting React Frontend Server...${NC}"
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Set up trap for script termination
trap cleanup SIGINT SIGTERM

# Keep script running and show server status
echo -e "\n${GREEN}Both servers are running:${NC}"
echo -e "Backend:  ${BLUE}http://localhost:5003${NC}"
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "\n${BLUE}Press Ctrl+C to stop both servers${NC}"

# Wait for user interrupt
wait
