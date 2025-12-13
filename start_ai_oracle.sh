#!/bin/bash

# --- Configuration (Absolute Paths) ---
# پیدا کردن مسیر دقیق پوشه جاری
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$SCRIPT_DIR"

# مسیرهای محیط مجازی و پوشه موتور هوش مصنوعی
VENV_DIR="$ROOT_DIR/.venv_ai_oracle"
AI_ENGINE_DIR="$ROOT_DIR/ai-engine"
LOG_FILE="$AI_ENGINE_DIR/ai_oracle_service.log"
PID_FILE="$AI_ENGINE_DIR/ai_oracle.pid"

# تنظیم مفسر پایتون و پیپ
PYTHON_EXECUTABLE="$VENV_DIR/bin/python3"
PIP_EXECUTABLE="$VENV_DIR/bin/pip"
REQUIREMENTS_FILE="$AI_ENGINE_DIR/requirements.txt"

# ✅ اسکریپت‌های جدید معماری هوش مصنوعی
PREPARE_DATA_SCRIPT="$AI_ENGINE_DIR/training/prepare_data.py"
TRAIN_RISK_SCRIPT="$AI_ENGINE_DIR/training/train_risk_model.py"
TRAIN_SECURITY_SCRIPT="$AI_ENGINE_DIR/training/train_security_model.py"

# --- Colors ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} - $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} - ✅ $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} - ❌ $1"
}

setup_environment() {
    log "--- [AI Oracle] Setup Environment ---"
    
    # ساخت محیط مجازی اگر وجود ندارد
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv "$VENV_DIR"
    fi

    # آپدیت وابستگی‌ها
    log "Checking dependencies..."
    "$PIP_EXECUTABLE" install --upgrade pip setuptools wheel > /dev/null 2>&1
    "$PIP_EXECUTABLE" install -r "$REQUIREMENTS_FILE" > /dev/null 2>&1 || {
        error "CRITICAL ERROR: Failed to install dependencies."
        exit 1
    }
    success "Environment ready."
}

run_ml_pipeline() {
    log "--- [AI Oracle] MLOps Pipeline Started ---"
    
    # 1. آماده‌سازی داده‌ها (ETL)
    if [ -f "$PREPARE_DATA_SCRIPT" ]; then
        echo -e "${YELLOW}Step 1: Preparing Data from Real Datasets...${NC}"
        "$PYTHON_EXECUTABLE" "$PREPARE_DATA_SCRIPT"
        if [ $? -ne 0 ]; then
            error "Data preparation failed."
            exit 1
        fi
    else
        error "Prepare script not found at $PREPARE_DATA_SCRIPT"
        exit 1
    fi

    # 2. آموزش مدل ریسک مالی (XGBoost)
    if [ -f "$TRAIN_RISK_SCRIPT" ]; then
        echo -e "${YELLOW}Step 2: Training Financial Risk Model...${NC}"
        "$PYTHON_EXECUTABLE" "$TRAIN_RISK_SCRIPT"
        if [ $? -ne 0 ]; then
            error "Financial model training failed."
            exit 1
        fi
    else
        error "Risk training script not found at $TRAIN_RISK_SCRIPT"
        exit 1
    fi

    # 3. آموزش مدل امنیت (Isolation Forest)
    if [ -f "$TRAIN_SECURITY_SCRIPT" ]; then
        echo -e "${YELLOW}Step 3: Training Security Model...${NC}"
        "$PYTHON_EXECUTABLE" "$TRAIN_SECURITY_SCRIPT"
        if [ $? -ne 0 ]; then
            error "Security model training failed."
            # امنیت مدل ثانویه است، پس اگر شکست خورد فقط هشدار می‌دهیم
        fi
    else
        echo -e "${YELLOW}Step 3: Security training script not found (Skipping).${NC}"
    fi
    
    success "Pipeline Completed Successfully."
}

start_fastapi_service() {
    log "--- [AI Oracle] Starting API Service ---"
    
    # مدیریت پورت (بستن سرویس قبلی روی پورت 8000)
    if command -v lsof &> /dev/null; then
        EXISTING_PID=$(lsof -t -i:8000)
        if [ -n "$EXISTING_PID" ]; then
            echo -e "${YELLOW}Stopping existing service on port 8000 (PID: $EXISTING_PID)...${NC}"
            kill -9 "$EXISTING_PID"
            sleep 2
        fi
    fi

    # اجرای Uvicorn
    cd "$AI_ENGINE_DIR" || exit 1
    
    # اجرا در پس‌زمینه
    nohup "$PYTHON_EXECUTABLE" -u -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info > "$LOG_FILE" 2>&1 &
    
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    
    # بازگشت به مسیر اصلی
    cd "$ROOT_DIR"
    sleep 3

    # بررسی وضعیت اجرا
    if ps -p "$NEW_PID" > /dev/null; then
        success "Service RUNNING (PID: $NEW_PID)."
        echo -e "📄 Logs available at: ${YELLOW}$LOG_FILE${NC}"
    else
        error "Service FAILED to start."
        echo "--- Last 20 lines of log ---"
        tail -n 20 "$LOG_FILE"
        exit 1
    fi
}

# --- Execution Flow ---
setup_environment
run_ml_pipeline
start_fastapi_service

log "--- [AI Oracle] Startup Sequence Finished Successfully ---"