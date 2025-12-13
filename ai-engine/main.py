# ai-engine/main.py - FINAL WITH RETRAIN & NETWORK FIX

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import httpx 
from pydantic import BaseModel 
import os
import sys

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ایمپورت کردن NODE_API_BASE_URL از کانفیگ
from config import AI_ORACLE_ADDRESS, logger, NODE_API_BASE_URL
from layers.layer_1_security import analyze_user_behavior, security_engine
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
from layers.layer_3_financial import generate_financial_report, ai_engine
from layers.layer_5_integration import generate_final_investability_score
from services.oracle_caller import update_proposal_risk_score, update_participation_score
from services.blockchain_reader import get_user_onchain_profile
from score_calculator import calculate_pop_score

# ✅ FIX: ایمپورت از فایل‌های صحیح
from training.train_risk_model import train_model as train_financial_core
from training.train_security_model import train_security_model

app = FastAPI(title="RayanChain AI Engine")

# --- تنظیمات حیاتی CORS برای شبکه ---
# این بخش اجازه می‌دهد وقتی با موبایل (172.16...) وصل می‌شوید، 
# درخواست‌ها مسدود نشوند.
origins = [
    "http://localhost:3000",       # دسترسی از روی سرور
    "http://127.0.0.1:3000",
    "https://localhost:3001",      # دسترسی با پروکسی لوکال
    "https://172.16.22.141:3001",  # دسترسی اصلی شبکه (موبایل/لپ‌تاپ)
    "https://172.16.22.141:3000",
    "*"                            # (اختیاری) برای تست راحت‌تر همه را باز می‌گذاریم
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "running", 
        "oracle": AI_ORACLE_ADDRESS, 
        "connected_to_node": NODE_API_BASE_URL
    }

# --- Shared Fetch Logic ---
async def fetch_proposal_data(proposal_id: str):
    # ✅ FIX: تنظیمات کلاینت برای پایداری بیشتر
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    timeout = httpx.Timeout(15.0, connect=5.0) # 15 ثانیه کل، 5 ثانیه اتصال

    async with httpx.AsyncClient(verify=False, limits=limits, timeout=timeout) as client:
        url = f"{NODE_API_BASE_URL}/proposals/{proposal_id}"
        logger.info(f"Fetching data from: {url}")
        
        try:
            response = await client.get(url)
            
            # لاگ کردن وضعیت برای دیباگ دقیق‌تر
            if response.status_code != 200:
                logger.error(f"❌ Backend Error {response.status_code}: {response.text[:200]}")
                # اگر 404 داد یعنی پروپوزال پیدا نشد
                if response.status_code == 404:
                     raise ValueError(f"Proposal {proposal_id} not found in Node backend.")
                raise ValueError(f"Backend returned status {response.status_code}")
            
            data = response.json()
            # پشتیبانی از ساختار { success: true, data: ... } یا دیتای مستقیم
            return data.get('data', data)

        except httpx.ConnectError as e:
            # خطای اتصال معمولاً یعنی سرور Next.js بالا نیست یا آدرس غلط است
            logger.critical(f"🔥 Connection Failed to {url}. Is Next.js running on port 3000? Error: {e}")
            raise ValueError("Connection refused by Node backend. Check if Next.js is running.")
            
        except Exception as e:
            logger.error(f"Fetch unexpected error: {e}")
            raise ValueError(f"Failed to fetch proposal data: {str(e)}")

# --- MLOps: Retrain Route ---
def run_retraining_task():
    """Background task to retrain models without stopping the server"""
    logger.info("🔄 Background Retraining Started...")
    try:
        # 1. Train Financial Model (Pipeline)
        train_financial_core()
        ai_engine.load_models() # Reload in Layer 3
        
        # 2. Train Security Model
        train_security_model()
        security_engine.load_models() # Reload in Layer 1
        
        logger.info("✅ Retraining Complete & Models Reloaded.")
    except Exception as e:
        logger.error(f"❌ Retraining Failed: {e}")

@app.post("/admin/retrain")
async def retrain_models(background_tasks: BackgroundTasks):
    """Trigger model retraining in background"""
    background_tasks.add_task(run_retraining_task)
    return {"message": "Retraining started in background."}

# --- Analysis Routes ---

@app.post("/action/trigger-risk-analysis/{proposal_id}")
async def trigger_risk_analysis(proposal_id: str):
    try:
        logger.info(f"Trigger Analysis: {proposal_id}")
        proposal_data = await fetch_proposal_data(proposal_id)

        # 1. Financial (AI Model)
        financial_report = generate_financial_report(proposal_data)
        
        # 2. Security (Anomaly Detection)
        proposer = proposal_data.get('proposerAddress')
        if proposer:
            profile = get_user_onchain_profile(proposer)
            security_report = analyze_user_behavior(profile)
        else:
            security_report = analyze_user_behavior({})
        
        # 3. Integration
        final_report = generate_final_investability_score(financial_report, security_report)
        final_score = final_report.get('investability_score', 0)

        # 4. Transaction
        on_chain_id = proposal_data.get('proposalIdOnChain')
        if on_chain_id:
            update_proposal_risk_score(int(on_chain_id), int(final_score))
        
        return final_report

    except Exception as e:
        logger.error(f"Trigger Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/proposal/{proposal_id}")
async def get_proposal_report(proposal_id: str):
    try:
        logger.info(f"Get Report: {proposal_id}")
        proposal_data = await fetch_proposal_data(proposal_id)
        
        # Run analysis (view only)
        financial_report = generate_financial_report(proposal_data)
        
        proposer = proposal_data.get('proposerAddress')
        if proposer:
            profile = get_user_onchain_profile(proposer)
            security_report = analyze_user_behavior(profile)
        else:
            security_report = analyze_user_behavior({})
            
        final_report = generate_final_investability_score(financial_report, security_report)
        return final_report

    except Exception as e:
        logger.error(f"Get Report Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Other Routes ---
@app.get("/analytics/user/{user_address}")
async def get_user_analytics(user_address: str):
    try:
        profile = get_user_onchain_profile(user_address)
        report = analyze_user_behavior(profile)
        report['user_address'] = user_address
        return report
    except Exception as e:
        logger.error(f"User analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/action/update-user-score/{user_address}")
async def update_user_consensus_score(user_address: str):
    try:
        profile = get_user_onchain_profile(user_address)
        gov_data = {"total_votes_cast": 5, "successful_votes": 3} 
        score = calculate_pop_score(profile, gov_data)
        if score > 0:
            update_participation_score(user_address, score)
            return {"status": "updated", "score": score}
        return {"status": "skipped", "score": score}
    except Exception as e:
        logger.error(f"Consensus error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ContractCode(BaseModel):
    code: str

@app.post("/analytics/contract")
async def analyze_contract(contract: ContractCode):
    if len(contract.code) < 10:
        raise HTTPException(status_code=400, detail="Code too short")
    return analyze_for_gas_optimizations(contract.code)