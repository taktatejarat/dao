# ai-engine/main.py - FINAL WITH RETRAIN

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import httpx 
from pydantic import BaseModel 
import os
import sys

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import AI_ORACLE_ADDRESS, logger
from layers.layer_1_security import analyze_user_behavior, security_engine
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
from layers.layer_3_financial import generate_financial_report, ai_engine
from layers.layer_5_integration import generate_final_investability_score
from services.oracle_caller import update_proposal_risk_score, update_participation_score
from services.blockchain_reader import get_user_onchain_profile
from score_calculator import calculate_pop_score

# Import training function for retraining route
from training.train_models import train_financial_model, train_security_model

NODE_API_BASE_URL = "http://localhost:3000/api"

app = FastAPI(title="RayanChain AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "running", "oracle": AI_ORACLE_ADDRESS}

# --- Shared Fetch Logic ---
async def fetch_proposal_data(proposal_id: str):
    async with httpx.AsyncClient() as client:
        url = f"{NODE_API_BASE_URL}/proposals/{proposal_id}"
        logger.info(f"Fetching data: {url}")
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code != 200:
                logger.error(f"Backend Error {response.status_code}: {response.text}")
                raise ValueError(f"Backend status {response.status_code}")
            
            data = response.json()
            return data.get('data', data)
        except Exception as e:
            logger.error(f"Fetch failed: {e}")
            raise ValueError("Failed to fetch proposal data")

# --- MLOps: Retrain Route (NEW) ---
def run_retraining_task():
    """Background task to retrain models without stopping the server"""
    logger.info("🔄 Background Retraining Started...")
    try:
        # 1. Train Financial Model
        train_financial_model()
        # Reload model into memory
        ai_engine.load_models()
        
        # 2. Train Security Model
        train_security_model()
        # Reload security model (re-init singleton)
        security_engine.__init__() 
        
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