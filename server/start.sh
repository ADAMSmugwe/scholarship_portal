#!/bin/bash
chmod +x "$0"
cd "$(dirname "$0")"

echo "--- Activating Virtual Environment ---"
source venv/bin/activate

echo "\n--- Stopping any existing server on port 5000 ---"
lsof -ti:5000 | xargs -r kill -9

echo "\n--- Installing/Updating Dependencies ---"
python -m pip install --upgrade pip
pip install -r requirements.txt

export FLASK_APP=app.py
export FLASK_DEBUG=1

echo "\n--- Starting Flask Server in Background ---"
flask run &
FLASK_PID=$!
sleep 3

echo "\n--- Checking Server Status (PID: $FLASK_PID) ---"
if ! ps -p $FLASK_PID > /dev/null; then
    echo "Error: Server failed to start."
    exit 1
fi
echo "Server is running. Pinging root URL..."
curl http://localhost:5000/

echo "\n\n--- Server is ready ---"
echo "You can now run curl commands in this terminal."
echo "To stop the server later, run: kill $FLASK_PID"