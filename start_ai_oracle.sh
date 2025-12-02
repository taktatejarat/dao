#!/bin/bash

# --- Configuration (Absolute Paths) ---
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$SCRIPT_DIR"

VENV_DIR="$ROOT_DIR/.venv_ai_oracle"
AI_ENGINE_DIR="$ROOT_DIR/ai-engine"
LOG_FILE="$AI_ENGINE_DIR/ai_oracle_service.log"
PID_FILE="$AI_ENGINE_DIR/ai_oracle.pid"

# Python & Pip
PYTHON_EXECUTABLE="$VENV_DIR/bin/python3"
PIP_EXECUTABLE="$VENV_DIR/bin/pip"
REQUIREMENTS_FILE="$AI_ENGINE_DIR/requirements.txt"

# New MLOps Scripts
DATA_GEN_SCRIPT="$ROOT_DIR/simulation/AI_Data_Gen.py"
TRAIN_MODEL_SCRIPT="$AI_ENGINE_DIR/training/train_models.py"

# --- Helper Functions ---
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - $1"
}

setup_environment() {
    log "--- [AI Oracle] Setup Environment ---"
    
    if [ ! -d "$VENV_DIR" ]; then
        log "Creating virtual environment..."
        python3 -m venv "$VENV_DIR"
    fi

    # Upgrade pip & install dependencies
    "$PIP_EXECUTABLE" install --upgrade pip setuptools wheel > /dev/null 2>&1
    "$PIP_EXECUTABLE" install -r "$REQUIREMENTS_FILE" > /dev/null 2>&1 || {
        log "CRITICAL ERROR: Failed to install dependencies."
        exit 1
    }
    log "Environment ready."
}

run_ml_pipeline() {
    log "--- [AI Oracle] MLOps Pipeline Started ---"
    
    # 1. Generate Synthetic Data
    if [ -f "$DATA_GEN_SCRIPT" ]; then
        log "Step 1: Generating Synthetic Data..."
        "$PYTHON_EXECUTABLE" "$DATA_GEN_SCRIPT"
        if [ $? -ne 0 ]; then
            log "ERROR: Data generation failed."
            exit 1
        fi
    else
        log "ERROR: Data gen script not found at $DATA_GEN_SCRIPT"
        exit 1
    fi

    # 2. Train Models (XGBoost + Isolation Forest)
    if [ -f "$TRAIN_MODEL_SCRIPT" ]; then
        log "Step 2: Training AI Models..."
        "$PYTHON_EXECUTABLE" "$TRAIN_MODEL_SCRIPT"
        if [ $? -ne 0 ]; then
            log "ERROR: Model training failed."
            exit 1
        fi
    else
        log "ERROR: Training script not found at $TRAIN_MODEL_SCRIPT"
        exit 1
    fi
    
    log "--- [AI Oracle] Pipeline Completed ---"
}

start_fastapi_service() {
    log "--- [AI Oracle] Starting API Service ---"
    
    # Port Management
    if command -v lsof &> /dev/null; then
        EXISTING_PID=$(lsof -t -i:8000)
        if [ -n "$EXISTING_PID" ]; then
            log "Stopping existing service (PID: $EXISTING_PID)..."
            kill -9 "$EXISTING_PID"
            sleep 2
        fi
    fi

    # Run Uvicorn
    cd "$AI_ENGINE_DIR" || exit 1
    nohup "$PYTHON_EXECUTABLE" -u -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info > "$LOG_FILE" 2>&1 &
    
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    
    cd "$ROOT_DIR"
    sleep 3

    if ps -p "$NEW_PID" > /dev/null; then
        log "✅ Service RUNNING (PID: $NEW_PID). Logs: $LOG_FILE"
    else
        log "❌ Service FAILED to start."
        tail -n 20 "$LOG_FILE"
        exit 1
    fi
}

# --- Execution ---
setup_environment
run_ml_pipeline  # ✅ اجرای پایپ‌لاین جدید
start_fastapi_service

log "--- [AI Oracle] Startup Sequence Finished Successfully ---"