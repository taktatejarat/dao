# ai-engine/main.py - FINAL AND COMPLETE AI ORACLE SERVICE

import asyncio
from fastapi import FastAPI
from typing import Dict, Any

# ✅ FIX: وارد کردن ماژول‌های اصلی
from config import AI_ORACLE_ADDRESS
from oracle_caller import update_user_pop_score
from risk_assessor import analyze_risk # این برای API Routeها لازم است

app = FastAPI(title="RayanChain AI Engine")

# --- Background Task ---
async def continuous_pop_update_task():
    print("[AI-TASK] Starting continuous PoP update service...")
    mock_user_history = { "num_votes_cast": 20, "vote_accuracy_rate": 0.90, "delegated_power": 1e22, "time_since_last_vote_days": 1 }
    
    while True:
        try:
            print(f"[AI-TASK] Updating PoP score for {AI_ORACLE_ADDRESS}...")
            update_user_pop_score(AI_ORACLE_ADDRESS, mock_user_history)
        except Exception as e:
            print(f"[AI-TASK] Error during continuous PoP update: {e}")
        await asyncio.sleep(5 * 60) # 5 minutes

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(continuous_pop_update_task())
    print("[AI-TASK] Background task created.")

# --- API Routes ---
@app.get("/")
def health_check():
    return {"service": "AI Oracle", "status": "running"}

@app.post("/action/update-risk/{proposal_id}")
async def trigger_risk_update(proposal_id: int, request_body: Dict[str, Any]):
    try:
        ai_features = request_body.get("aiFeatures")
        milestone_amounts = request_body.get("milestoneAmounts")
        
        if not ai_features or not milestone_amounts:
            raise ValueError("Missing 'aiFeatures' or 'milestoneAmounts' in request body.")
            
        # فراخوانی تابع اصلی (می‌تواند در پس‌زمینه اجرا شود)
        # asyncio.create_task(update_proposal_risk(proposal_id, ai_features, milestone_amounts))
        # برای سادگی، فعلاً به صورت همزمان اجرا می‌کنیم
        update_proposal_risk(proposal_id, ai_features, milestone_amounts)
        
        return {"status": "success", "message": f"Risk update triggered for proposal {proposal_id}."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# ✅ NEW: Endpoint برای دریافت گزارش تحلیل ریسک
@app.get("/reports/proposal/{proposal_id}")
async def get_risk_report(proposal_id: int):
    """
    Simulates generating a detailed report for a proposal.
    In a real system, this would fetch saved analysis data from a database.
    """
    # برای این مثال، ما تحلیل را به صورت زنده انجام می‌دهیم
    # در آینده، شما باید داده‌های پروپوزال را از دیتابیس MongoDB خود بخوانید
    mock_features = {
        "industry": "AI",
        "team_experience_years": 15,
        "requested_amount_usd": 1000000,
        "milestone_count": 3
    }
    
    try:
        risk_score, confidence = analyze_risk(mock_features)
        
        return {
            "proposalId": proposal_id,
            "riskScore": risk_score,
            "confidenceScore": confidence,
            "summary": f"The model predicts a risk score of {risk_score} with {confidence}% confidence.",
            "details": {
                "Key Risk Factors": ["Market Competition", "Technology Scalability"],
                "Key Strengths": ["Experienced Team", "Clear Milestone Plan"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))