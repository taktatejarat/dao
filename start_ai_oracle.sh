#!/bin/bash

# start_ai_oracle.sh - Runs the AI Oracle FastAPI service in the background (FINAL ROBUST VERSION)

# --- Configuration ---
VENV_NAME=".venv_ai_oracle" 
AI_ENGINE_DIR="ai-engine" 
# ✅ FIX: Define the full path for the log file
LOG_FILE="$(pwd)/$AI_ENGINE_DIR/ai_oracle_startup.log" 
PID_FILE="$AI_ENGINE_DIR/ai_oracle.pid" 
PYTHON_EXECUTABLE="$VENV_NAME/bin/python3" # Explicitly use python3 executable from VENV

echo "--- [AI Oracle] Starting Setup and Activation ---"

# --- 1. Create Virtual Environment ---
if [ ! -d "$VENV_NAME" ]; then
    echo "[AI Oracle] Creating virtual environment: $VENV_NAME"
    python3 -m venv $VENV_NAME
fi

# Check for executable
if [ ! -f "$PYTHON_EXECUTABLE" ]; then
    echo "[AI Oracle] CRITICAL ERROR: VENV Python executable not found at $PYTHON_EXECUTABLE. Ensure 'python3-venv' is installed."
    exit 1
fi

# --- 2. Install Dependencies ---
echo "[AI Oracle] Installing/Updating Python dependencies using VENV interpreter..."
# Use the explicit VENV python interpreter
"$PYTHON_EXECUTABLE" -m pip install -r "$AI_ENGINE_DIR/requirements.txt" > /dev/null 2>&1 
echo "[AI Oracle] Dependencies installed."

# --- 3. Check and Stop Previous Instance ---
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo "[AI Oracle] Service is already running (PID: $PID). Stopping previous instance..."
        kill $PID
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# --- 4. Run the FastAPI Service in Background ---
echo "[AI Oracle] Running FastAPI service in background (Port 8000)..."

# ✅ FIX: Use the full path for LOG_FILE 
cd $AI_ENGINE_DIR
"../$PYTHON_EXECUTABLE" -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level critical > "$LOG_FILE" 2>&1 &

# Store the Process ID for management
echo $! > "$PID_FILE"

echo "[AI Oracle] Service started. PID saved to $PID_FILE. Check $LOG_FILE for startup errors."
echo "--- [AI Oracle] Setup script finished. ---"