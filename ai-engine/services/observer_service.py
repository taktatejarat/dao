# ai-engine/services/observer_service.py - SMART FILTERING

import time
import httpx
from services.oracle_caller import get_dao_contract, check_and_execute_proposal
from config import NODE_API_BASE_URL, logger

def get_active_proposals_from_db():
    """
    دریافت لیست پروپوزال‌هایی که هنوز تکلیفشان روشن نشده است.
    """
    try:
        # فرض: یک اندپوینت در نکست جی‌اس داریم که فقط فعال‌ها را می‌دهد
        # اگر ندارید، باید بسازید یا فعلا همه را بگیرید و فیلتر کنید
        # ما از روت اصلی استفاده می‌کنیم و فیلتر می‌کنیم
        url = f"{NODE_API_BASE_URL}/proposals?status=active" 
        
        # نکته: چون اندپوینت فیلتردار ندارید، همه را می‌گیریم و اینجا فیلتر می‌کنیم
        with httpx.Client(verify=False, timeout=5.0) as client:
            resp = client.get(f"{NODE_API_BASE_URL}/proposals")
            if resp.status_code == 200:
                data = resp.json().get('data', [])
                # فقط آن‌هایی که وضعیت نهایی ندارند
                active_ones = [
                    p for p in data 
                    if p.get('onChainStatus') not in ['defeated', 'executed', 'expired', 'canceled']
                    and p.get('proposalIdOnChain') is not None
                ]
                return active_ones
            return []
    except Exception as e:
        logger.error(f"Failed to fetch active proposals from DB: {e}")
        return []

def update_db_status(proposal_id: int, status: str):
    try:
        url = f"{NODE_API_BASE_URL}/admin/update-status"
        with httpx.Client(verify=False, timeout=5.0) as client:
            client.post(url, json={"id": proposal_id, "status": status})
            logger.info(f"💾 DB Updated: Proposal {proposal_id} -> {status}")
    except Exception as e:
        logger.error(f"DB Sync Error: {e}")

def run_proposal_observer():
    logger.info("🔍 [Smart Observer] Checking ACTIVE proposals only...")
    
    try:
        # 1. دریافت لیست هوشمند (فقط فعال‌ها)
        active_proposals = get_active_proposals_from_db()
        
        if not active_proposals:
            logger.info("😴 No active proposals found in DB. Observer sleeping.")
            return

        dao_contract = get_dao_contract()
        current_time = int(time.time())

        for prop in active_proposals:
            try:
                pid = int(prop['proposalIdOnChain'])
                
                # خواندن وضعیت دقیق از بلاکچین
                prop_data = dao_contract.functions.proposals(pid).call()
                deadline = prop_data[8]
                for_votes = int(prop_data[9])
                against_votes = int(prop_data[10])
                state = prop_data[11] 
                
                logger.info(f"Checking ID {pid}: State {state}, Deadline in {deadline - current_time}s")

                # State 2: Voting
                if state == 2:
                    if current_time > deadline:
                        if for_votes > against_votes:
                            logger.info(f"⚡ Proposal {pid}: Passed. Executing...")
                            check_and_execute_proposal(pid)
                        else:
                            logger.warning(f"❌ Proposal {pid}: Failed. Marking as defeated.")
                            # این خط کلیدی است: با تغییر وضعیت در دیتابیس، در چرخه بعدی این پروپوزال چک نمی‌شود
                            update_db_status(pid, 'defeated')

                # State 8: Funding
                elif state == 8:
                    funding_deadline = prop_data[19]
                    if current_time > funding_deadline:
                        logger.info(f"💰 Proposal {pid}: Funding expired. Finalizing...")
                        check_and_execute_proposal(pid)

            except Exception as e:
                logger.error(f"Error checking proposal {prop.get('proposalIdOnChain')}: {e}")

    except Exception as e:
        logger.error(f"Observer Fatal Error: {e}")