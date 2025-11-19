# ai-engine/main.py - FINAL, INTEGRATED, MULTI-LAYER ARCHITECTURE

from fastapi import FastAPI, HTTPException
from typing import Dict, Any
import httpx # کتابخانه جدید برای ارسال درخواست‌های HTTP
from pydantic import BaseModel 

# ✅ 1. وارد کردن لایه‌های معماری AI
from config import AI_ORACLE_ADDRESS
from layers.layer_1_security import analyze_user_behavior
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
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

@app.get("/analytics/user/{user_address}")
async def get_user_analytics_report(user_address: str):
    """
    گزارش تحلیل رفتار برای یک کاربر خاص تولید می‌کند.
    """
    try:
        # TODO: در آینده، اینجا باید داده‌های واقعی تاریخچه کاربر را از دیتابیس یا بلاکچین واکشی کنیم.
        # برای نسخه فعلی، از داده‌های Mock استفاده می‌کنیم تا پایپ‌لاین کامل شود.
        mock_user_history = [
            {'amount': 1500, 'gas_used': 60000, 'type': 'vote'},
            {'amount': 10000, 'gas_used': 150000, 'type': 'stake'},
        ]
        
        security_report = analyze_user_behavior(mock_user_history)
        
        return security_report

    except Exception as e:
        print(f"ERROR in get_user_analytics_report for {user_address}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/proposal/{proposal_id}")
async def get_full_proposal_report(proposal_id: str):
    """
    یک گزارش تحلیلی کامل و جامع برای نمایش در داشبورد فرانت‌اند تولید می‌کند.
    """
    try:
        async with httpx.AsyncClient() as client:
            # ۱. دریافت داده‌های کامل پروپوزال از API بک‌اند Node.js
            response = await client.get(f"{NODE_API_BASE_URL}/proposals/{proposal_id}")
            response.raise_for_status()
            proposal_data = response.json().get('data', {})
        
        if not proposal_data:
            raise HTTPException(status_code=404, detail="Proposal not found")

        # ۲. اجرای تحلیل‌های لایه‌های مختلف
        financial_report = generate_financial_report(proposal_data)
        mock_user_history = [{'amount': 1000, 'gas_used': 50000}] # داده موقت
        security_report = analyze_user_behavior(mock_user_history)
        final_score_report = generate_final_investability_score(financial_report, security_report)
        
        # ۳. ترکیب تمام گزارش‌ها در یک پاسخ جامع
        full_report = {
            "proposalId": proposal_id,
            "projectName": proposal_data.get("projectName"),
            "summary": final_score_report,
            "financialAnalysis": financial_report,
            "securityAnalysis": security_report,
        }
        # ❌ حذف کد اضافی برای ذخیره گزارش. این تابع فقط برای خواندن است.
        return full_report

    except Exception as e:
        print(f"ERROR in get_full_proposal_report for proposal {proposal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

# ✅ تعریف مدل ورودی برای اعتبارسنجی
class ContractCode(BaseModel):
    code: str


@app.post("/analytics/contract")
async def analyze_contract_code(contract: ContractCode):
    """
    کد Solidity را دریافت کرده و پیشنهاداتی برای بهینه‌سازی برمی‌گرداند.
    """
    try:
        print(f"--- [AI-ENGINE] Starting contract analysis for code snippet (length: {len(contract.code)}) ---")
        
        if not contract.code or len(contract.code) < 50:
            raise HTTPException(status_code=400, detail="Contract code is too short for analysis.")

        # ✅ FIX: فراخوانی تابع تحلیل با مدیریت خطا
        suggestions = analyze_for_gas_optimizations(contract.code)
        
        print(f"--- [AI-ENGINE] Contract analysis complete. Found {len(suggestions)} suggestions. ---")
        
        return suggestions

    except HTTPException as http_err:
        # خطاهای HTTP را دوباره throw می‌کنیم
        raise http_err
    except Exception as e:
        # سایر خطاها را لاگ کرده و یک خطای عمومی برمی‌گردانیم
        print(f"CRITICAL ERROR in analyze_contract_code: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during contract analysis.")