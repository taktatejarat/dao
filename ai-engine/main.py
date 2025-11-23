# ai-engine/main.py (نسخه نهایی)

from fastapi import FastAPI, HTTPException
import httpx 
from pydantic import BaseModel 

# ✅ اصلاح ایمپورت‌ها (حذف وابستگی به فایل روت)
from config import AI_ORACLE_ADDRESS
from layers.layer_1_security import analyze_user_behavior
from layers.layer_2_optimizer import analyze_for_gas_optimizations 
from layers.layer_3_financial import generate_financial_report
from layers.layer_5_integration import generate_final_investability_score

# ✅ اشاره دقیق به services
from services.oracle_caller import update_proposal_risk_score

NODE_API_BASE_URL = "http://localhost:3000/api"

app = FastAPI(
    title="RayanChain AI Engine (AIPoX)",
    description="A multi-layer AI service for decentralized venture capital analysis."
)

@app.get("/")
def health_check():
    return {"service": "RayanChain AI Engine", "status": "running", "oracle_address": AI_ORACLE_ADDRESS}

@app.post("/action/trigger-risk-analysis/{proposal_id}")
async def trigger_risk_analysis(proposal_id: str):
    try:
        print(f"[API] Trigger received for proposal {proposal_id}")
        
        # 1. دریافت داده‌ها
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NODE_API_BASE_URL}/proposals/{proposal_id}")
            response.raise_for_status()
            proposal_data = response.json().get('data', {})

        if not proposal_data:
            raise ValueError(f"Proposal data not found for ID {proposal_id}")

        # 2. تحلیل
        financial_report = generate_financial_report(proposal_data)
        mock_user_history = [{'amount': 1000, 'gas_used': 50000}] 
        security_report = analyze_user_behavior(mock_user_history)
        
        # تولید امتیاز نهایی
        final_report = generate_final_investability_score(financial_report, security_report)
        
        # استخراج امتیاز نهایی (Investability Score)
        # این امتیاز (0-100) نشان‌دهنده کیفیت پروژه است (100 = عالی)
        final_score = final_report.get('investability_score', 0)

        # 3. ارسال به بلاکچین
        # نکته: ما باید مطمئن شویم که آیا قرارداد امتیاز "کیفیت" می‌خواهد یا امتیاز "ریسک"؟
        # اگر قرارداد Risk Score می‌خواهد (یعنی 100 = پرخطر)، باید معکوس کنیم: (100 - final_score)
        # اما معمولاً در DAO، امتیاز بالاتر بهتر است. فرض بر امتیاز کیفیت است.
        
        on_chain_id = proposal_data.get('proposalIdOnChain')
        if on_chain_id:
            print(f"[API] Sending score {final_score} to on-chain ID {on_chain_id}")
            # فراخوانی تابعی که در services/oracle_caller است
            update_proposal_risk_score(int(on_chain_id), int(final_score))
        else:
            print(f"[API WARN] On-chain ID missing for proposal {proposal_id}. Skipping blockchain update.")

        # بازگشت نتیجه به Node.js برای ذخیره در دیتابیس
        return final_report

    except Exception as e:
        print(f"[API ERROR] trigger_risk_analysis failed: {e}")
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