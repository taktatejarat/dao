#!/bin/bash

# --- Configuration using Absolute Paths ---
# ✅ FIX: از pwd برای گرفتن مسیر مطلق دایرکتوری ریشه پروژه استفاده می‌کنیم
ROOT_DIR=$(pwd)
VENV_DIR="$ROOT_DIR/.venv_ai_oracle"
AI_ENGINE_DIR="$ROOT_DIR/ai-engine"
LOG_FILE="$AI_ENGINE_DIR/ai_oracle_service.log"
PID_FILE="$AI_ENGINE_DIR/ai_oracle.pid"
PYTHON_EXECUTABLE="$VENV_DIR/bin/python3"
REQUIREMENTS_FILE="$AI_ENGINE_DIR/requirements.txt"

# --- Helper Functions ---
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - $1"
}

setup_environment() {
    log "--- [AI Oracle] Starting Setup and Activation ---"
    if [ ! -d "$VENV_DIR" ]; then
        log "Creating virtual environment: $VENV_DIR"
        python3 -m venv "$VENV_DIR"
    fi

    if [ ! -f "$PYTHON_EXECUTABLE" ]; then
        log "CRITICAL ERROR: VENV Python executable not found at $PYTHON_EXECUTABLE."
        exit 1
    fi

    log "Installing/Updating Python dependencies..."
    "$PYTHON_EXECUTABLE" -m pip install -q -r "$REQUIREMENTS_FILE"
    log "Dependencies installed."
}

prepare_training_data() {
    log "--- [AI Oracle] Preparing Training Data ---"
    "$PYTHON_EXECUTABLE" "$AI_ENGINE_DIR/training/prepare_data.py"
    if [ $? -ne 0 ]; then
        log "CRITICAL ERROR: Data preparation failed."
        exit 1
    fi
    log "Data preparation complete."
}

train_ai_model() {
    log "--- [AI Oracle] Training AI Risk Model ---"
    "$PYTHON_EXECUTABLE" "$AI_ENGINE_DIR/training/train_risk_model.py"
    if [ $? -ne 0 ]; then
        log "CRITICAL ERROR: Model training failed."
        exit 1
    fi
    log "Model training complete."
}

# Function to start the FastAPI service
start_fastapi_service() {
    log "--- [AI Oracle] Starting FastAPI Service ---"
    
    # ✅ FIX: به جای kill کردن PID، هر فرآیندی که از پورت 8000 استفاده می‌کند را متوقف می‌کنیم.
    # این روش بسیار قاطعانه‌تر و قابل اعتمادتر است.
    log "Checking for existing service on port 8000..."
    EXISTING_PID=$(lsof -t -i:8000)

    if [ -n "$EXISTING_PID" ]; then
        log "Found existing service on port 8000 with PID: $EXISTING_PID. Stopping it..."
        kill -9 "$EXISTING_PID"
        sleep 2 # زمان برای آزاد شدن پورت
    fi

    if [ ! -f "$AI_ENGINE_DIR/models/risk_model.json" ]; then
        log "WARNING: AI model not found. Service will run but predictions may fail."
    fi

    log "Running FastAPI service in background (Port 8000)..."
    
    # ✅ FIX: از مسیر مطلق برای اجرای uvicorn استفاده می‌کنیم
    # وارد پوشه ai-engine می‌شویم تا uvicorn بتواند main:app را پیدا کند.
    cd "$AI_ENGINE_DIR"
    nohup "$PYTHON_EXECUTABLE" -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info > "$LOG_FILE" 2>&1 &
    
    echo $! > "$PID_FILE"
    cd "$ROOT_DIR" # بازگشت به دایرکتوری اصلی

    sleep 3 # زمان بیشتر برای اطمینان از اجرای سرویس

    if ps -p $(cat "$PID_FILE") > /dev/null; then
        log "Service started successfully. PID saved to $PID_FILE."
        log "Check $LOG_FILE for service logs."
    else
        log "CRITICAL ERROR: Failed to start FastAPI service. See logs below."
        # ✅ FIX: نمایش محتوای فایل لاگ در صورت بروز خطا
        log "--- START of $LOG_FILE ---"
        cat "$LOG_FILE"
        log "--- END of $LOG_FILE ---"
        exit 1
    fi
}

# --- Main Execution Flow ---
setup_environment
prepare_training_data
train_ai_model
start_fastapi_service

log "--- [AI Oracle] Full startup script finished successfully. ---"