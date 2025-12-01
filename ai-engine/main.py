# ai-engine/main.py

from fastapi import FastAPI, HTTPException
import httpx 
import traceback
from pydantic import BaseModel 

from config import AI_ORACLE_ADDRESS
from logger_config import logger # ✅ استفاده از لاگر جدید
from layers.layer_1_security import analyze_user_behavior
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
from layers.layer_3_financial import generate_financial_report
from layers.layer_5_integration import generate_final_investability_score
from services.oracle_caller import update_proposal_risk_score, update_participation_score
from services.blockchain_reader import get_user_onchain_profile
from score_calculator import calculate_pop_score

NODE_API_BASE_URL = "http://localhost:3000/api"

app = FastAPI(title="RayanChain AI Engine")

@app.get("/")
def health_check():
    return {"status": "running", "oracle": AI_ORACLE_ADDRESS}

# --- Shared Logic ---
async def fetch_and_analyze(proposal_id: str):
    url = f"{NODE_API_BASE_URL}/proposals/{proposal_id}"
    logger.info(f"Fetching data from: {url}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            
            # ✅ دیباگ مهم: اگر 200 نبود، متن خطا را چاپ کن
            if response.status_code != 200:
                logger.error(f"Next.js API Error [{response.status_code}]: {response.text}")
                raise ValueError(f"Backend returned {response.status_code}")
                
            data = response.json()
            # اگر فرمت پاسخ { success: true, data: {...} } است:
            proposal_data = data.get('data', data) 

        except httpx.RequestError as exc:
            logger.error(f"Connection error to {exc.request.url!r}")
            raise ValueError("Failed to connect to Next.js API")
            
    if not proposal_data:
        logger.error("Proposal data is empty or null")
        raise ValueError("Proposal data is empty")

    try:
        # 1. تحلیل مالی
        financial_report = generate_financial_report(proposal_data)
        
        # 2. تحلیل امنیتی
        proposer = proposal_data.get('proposerAddress')
        if proposer:
            profile = get_user_onchain_profile(proposer)
            security_report = analyze_user_behavior(profile)
        else:
            security_report = analyze_user_behavior({})
        
        # 3. ترکیب
        final_report = generate_final_investability_score(financial_report, security_report)
        return final_report, proposal_data

    except Exception as e:
        logger.error(f"Analysis Logic Failed: {str(e)}")
        logger.error(traceback.format_exc()) # چاپ کامل خطای پایتون
        raise e

# --- ROUTES ---

@app.post("/action/trigger-risk-analysis/{proposal_id}")
async def trigger_risk_analysis(proposal_id: str):
    try:
        logger.info(f"Trigger Risk Analysis for: {proposal_id}")
        final_report, p_data = await fetch_and_analyze(proposal_id)
        
        score = final_report.get('investability_score', 0)
        on_chain_id = p_data.get('proposalIdOnChain')
        
        if on_chain_id:
            try:
                update_proposal_risk_score(int(on_chain_id), int(score))
            except Exception as tx_err:
                logger.error(f"Transaction failed: {tx_err}")
        else:
            logger.warning("No on-chain ID, skipping transaction.")
            
        return final_report
    except Exception as e:
        # خطا قبلاً لاگ شده است
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/proposal/{proposal_id}")
async def get_proposal_report(proposal_id: str):
    try:
        logger.info(f"Get Report for: {proposal_id}")
        final_report, _ = await fetch_and_analyze(proposal_id)
        return final_report
    except Exception as e:
        # در اینجا جزییات خطا به کلاینت (فرانت) فرستاده می‌شود
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@app.get("/analytics/user/{user_address}")
async def get_user_analytics(user_address: str):
    try:
        profile = get_user_onchain_profile(user_address)
        report = analyze_user_behavior(profile)
        report['user_address'] = user_address
        return report
    except Exception as e:
        logger.error(f"User Analytics Failed: {e}")
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
        logger.error(f"Consensus Score Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ContractCode(BaseModel):
    code: str

@app.post("/analytics/contract")
async def analyze_contract(contract: ContractCode):
    if len(contract.code) < 10:
        raise HTTPException(status_code=400, detail="Code too short")
    return analyze_for_gas_optimizations(contract.code)