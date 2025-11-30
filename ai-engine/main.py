# ai-engine/main.py

from fastapi import FastAPI, HTTPException
import httpx 
from pydantic import BaseModel 

from config import AI_ORACLE_ADDRESS
from layers.layer_1_security import analyze_user_behavior
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
from layers.layer_3_financial import generate_financial_report
from layers.layer_5_integration import generate_final_investability_score
from services.oracle_caller import update_proposal_risk_score
from services.blockchain_reader import get_user_onchain_profile
from score_calculator import calculate_pop_score
from services.oracle_caller import update_participation_score


NODE_API_BASE_URL = "http://localhost:3000/api"

app = FastAPI(title="RayanChain AI Engine (AIPoX)")

@app.get("/")
def health_check():
    return {"service": "RayanChain AI Engine", "status": "running", "oracle_address": AI_ORACLE_ADDRESS}

# --- 1. User Analytics (روت گمشده اضافه شد) ---
@app.get("/analytics/user/{user_address}")
async def get_user_analytics(user_address: str):
    try:
        print(f"[API] Analyzing user: {user_address}")
        
        # 1. خواندن داده واقعی
        real_profile = get_user_onchain_profile(user_address)
        
        # 2. تحلیل (ارسال مستقیم دیکشنری)
        report = analyze_user_behavior(real_profile)
        
        # 3. افزودن آدرس
        report['user_address'] = user_address
        
        return report
    except Exception as e:
        print(f"[API ERROR] User analytics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. Proposal Risk Analysis ---
@app.post("/action/trigger-risk-analysis/{proposal_id}")
async def trigger_risk_analysis(proposal_id: str):
    try:
        print(f"[API] Analyzing proposal: {proposal_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NODE_API_BASE_URL}/proposals/{proposal_id}")
            response.raise_for_status()
            proposal_data = response.json().get('data', {})

        if not proposal_data:
            raise ValueError("Proposal data not found")

        # تحلیل مالی
        financial_report = generate_financial_report(proposal_data)
        
        # تحلیل امنیتی (بر اساس آدرس سازنده پروپوزال)
        proposer_address = proposal_data.get('proposerAddress')
        if proposer_address:
            # استفاده از داده واقعی سازنده
            real_profile = get_user_onchain_profile(proposer_address)
            security_report = analyze_user_behavior([real_profile])
        else:
            # فال‌بک
            security_report = analyze_user_behavior([{'amount': 0, 'gas_used': 0}])
        
        # ترکیب نتایج (امتیاز نهایی)
        final_report = generate_final_investability_score(financial_report, security_report)
        final_score = final_report.get('investability_score', 0)

        # ارسال به بلاکچین
        on_chain_id = proposal_data.get('proposalIdOnChain')
        if on_chain_id:
            update_proposal_risk_score(int(on_chain_id), int(final_score))
        
        return final_report

    except Exception as e:
        print(f"[API ERROR] trigger_risk_analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ContractCode(BaseModel):
    code: str

@app.post("/action/update-user-score/{user_address}")
async def update_user_consensus_score(user_address: str):
    try:
        print(f"[CONSENSUS] Calculating PoP score for: {user_address}")
        
        # 1. خواندن داده‌های واقعی
        profile = get_user_onchain_profile(user_address)
        
        # 2. شبیه‌سازی داده‌های حاکمیتی (چون هنوز دیتابیس گراف نداریم)
        # در نسخه نهایی این را از دیتابیس MongoDB (کالکشن Votes) می‌خوانیم
        mock_governance = {
            "total_votes_cast": int(profile.get('transaction_count', 0) / 5), # فرض: 20% تراکنش‌ها رأی بوده
            "successful_votes": int(profile.get('transaction_count', 0) / 10)
        }
        
        # 3. محاسبه امتیاز
        pop_score = calculate_pop_score(profile, mock_governance)
        
        # 4. ارسال به بلاکچین
        # تنها در صورتی آپدیت می‌کنیم که امتیاز قابل توجه باشد (صرفه‌جویی در Gas)
        if pop_score > 0:
            print(f"[CONSENSUS] Sending PoP Score {pop_score} to DAO for {user_address}")
            update_participation_score(user_address, pop_score)
            return {"status": "updated", "score": pop_score, "tx": "sent"}
        else:
            return {"status": "skipped", "score": pop_score, "reason": "low_score"}

    except Exception as e:
        print(f"[CONSENSUS ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/contract")
async def analyze_contract_code(contract: ContractCode):
    try:
        print(f"--- [AI-ENGINE] Starting contract analysis for code snippet (length: {len(contract.code)}) ---")
        
        if not contract.code or len(contract.code) < 50:
            raise HTTPException(status_code=400, detail="Contract code is too short for analysis.")

        suggestions = analyze_for_gas_optimizations(contract.code)
        
        print(f"--- [AI-ENGINE] Contract analysis complete. Found {len(suggestions)} suggestions. ---")
        
        return suggestions

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"CRITICAL ERROR in analyze_contract_code: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during contract analysis.")