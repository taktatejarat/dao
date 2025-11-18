# ai-engine/main.py - FINAL, INTEGRATED, MULTI-LAYER ARCHITECTURE

from fastapi import FastAPI, HTTPException
from typing import Dict, Any
import httpx # کتابخانه جدید برای ارسال درخواست‌های HTTP

# ✅ 1. وارد کردن لایه‌های معماری AI
from config import AI_ORACLE_ADDRESS
from layers.layer_1_security import analyze_user_behavior
from layers.layer_3_financial import generate_financial_report
from layers.layer_5_integration import generate_final_investability_score
from services.oracle_caller import update_proposal_risk_score

# آدرس API بک‌اند Node.js شما
NODE_API_BASE_URL = "http://localhost:3000/api"

app = FastAPI(
    title="RayanChain AI Engine (AIPoX)",
    description="A multi-layer AI service for decentralized venture capital analysis."
)

# --- API Routes ---
@app.get("/")
def health_check():
    return {"service": "RayanChain AI Engine", "status": "running", "version": "1.0"}

@app.post("/action/trigger-risk-analysis/{proposal_id}")
async def trigger_risk_analysis(proposal_id: str):
    """
    این Endpoint توسط Node.js بعد از تأیید تراکنش فراخوانی می‌شود
    تا تحلیل ریسک را آغاز کرده و نتیجه را در قرارداد هوشمند ثبت کند.
    """
    try:
        # ۱. دریافت داده‌های کامل پروپوزال از API بک‌اند Node.js
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NODE_API_BASE_URL}/proposals/{proposal_id}")
            response.raise_for_status() # اگر خطا رخ داد، Exception ایجاد می‌کند
            proposal_data = response.json().get('data', {})

        if not proposal_data:
            raise ValueError(f"Proposal data for ID {proposal_id} not found.")

        # ۲. اجرای تحلیل ریسک مالی
        financial_report = generate_financial_report(proposal_data)
        risk_score = financial_report.get('risk_score')

        # ۳. ارسال امتیاز ریسک به قرارداد هوشمند
        if risk_score is not None:
            print(f"Submitting risk score {risk_score} for proposal {proposal_id} to the blockchain...")
            # این تابع اکنون باید فقط شناسه پروپوزال آن‌چین را بپذیرد
            on_chain_id = proposal_data.get('proposalIdOnChain')
            if on_chain_id:
                update_proposal_risk_score(int(on_chain_id), risk_score)
            else:
                print(f"Warning: On-chain ID not found for proposal {proposal_id}. Cannot update risk score.")

        return {"status": "success", "message": f"Risk analysis for proposal {proposal_id} completed and score submitted."}

    except Exception as e:
        print(f"ERROR in trigger_risk_analysis for proposal {proposal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/proposal/{proposal_id}")
async def get_full_proposal_report(proposal_id: str):
    """
    یک گزارش تحلیلی کامل و جامع برای نمایش در داشبورد فرانت‌اند تولید می‌کند.
    """
    try:
        # ۱. دریافت داده‌های کامل پروپوزال از API بک‌اند Node.js
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NODE_API_BASE_URL}/proposals/{proposal_id}")
            response.raise_for_status()
            proposal_data = response.json().get('data', {})
        
        if not proposal_data:
            raise HTTPException(status_code=404, detail="Proposal not found")

        # ۲. اجرای تحلیل‌های لایه‌های مختلف
        # لایه ۳: تحلیل مالی
        financial_report = generate_financial_report(proposal_data)

        # لایه ۱: تحلیل رفتار (در این نسخه با داده‌های Mock)
        mock_user_history = [{'amount': 1000, 'gas_used': 50000}]
        security_report = analyze_user_behavior(mock_user_history)

        # لایه ۵: تجمیع نتایج
        final_score_report = generate_final_investability_score(financial_report, security_report)
        
        # ۳. ترکیب تمام گزارش‌ها در یک پاسخ جامع
        full_report = {
            "proposalId": proposal_id,
            "projectName": proposal_data.get("projectName"),
            "summary": final_score_report,
            "financialAnalysis": financial_report,
            "securityAnalysis": security_report,
            # در آینده لایه‌های دیگر نیز اضافه می‌شوند
        }
        
        return full_report

    except Exception as e:
        print(f"ERROR in get_full_proposal_report for proposal {proposal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))