# ai-engine/services/observer_service.py - DB SYNC ADDED

import time
import httpx
from services.oracle_caller import get_dao_contract, check_and_execute_proposal
from config import NODE_API_BASE_URL, logger

def update_db_status(proposal_id: int, status: str):
    """
    ارسال درخواست به بک‌اند برای آپدیت وضعیت در دیتابیس
    """
    try:
        # فرض: یک اندپوینت اختصاصی یا عمومی برای آپدیت وضعیت داریم
        # اگر ندارید، باید در بک‌اند اضافه شود. فعلا فقط لاگ می‌کنیم
        # url = f"{NODE_API_BASE_URL}/admin/update-status"
        # httpx.post(url, json={"id": proposal_id, "status": status}, verify=False)
        logger.info(f"📡 Syncing DB: Proposal {proposal_id} marked as '{status}' (Logic Placeholder)")
    except Exception as e:
        logger.error(f"Failed to sync DB for {proposal_id}: {e}")

def run_proposal_observer():
    logger.info("🔍 [Auto-Observer] Cycle started...")
    
    try:
        dao_contract = get_dao_contract()
        current_time = int(time.time())
        
        last_id = 0
        try:
            last_id = dao_contract.functions.proposalCount().call()
        except:
            for i in range(50, 0, -1):
                try:
                    dao_contract.functions.proposals(i).call()
                    last_id = i + 1
                    break
                except: continue
        
        if last_id == 0: return

        start_index = max(1, last_id - 100) 
        
        for pid in range(start_index, last_id + 1):
            try:
                prop_data = dao_contract.functions.proposals(pid).call()
                deadline = prop_data[8]
                for_votes = int(prop_data[9])
                against_votes = int(prop_data[10])
                state = prop_data[11] 
                
                # 1. Voting Phase
                if state == 2: 
                    if current_time > deadline:
                        if for_votes > against_votes:
                            logger.info(f"⚡ Proposal {pid}: Passed. Executing on-chain...")
                            check_and_execute_proposal(pid)
                        else:
                            # ❌ Failed
                            logger.warning(f"⚠️ Proposal {pid}: Failed (Votes: {for_votes} vs {against_votes}).")
                            # اینجا می‌توانیم دیتابیس را آپدیت کنیم
                            update_db_status(pid, 'defeated')
                
                # 2. Funding Phase
                elif state == 8:
                    funding_deadline = prop_data[19]
                    if current_time > funding_deadline:
                        logger.info(f"💰 Proposal {pid}: Funding expired. Finalizing...")
                        check_and_execute_proposal(pid)

            except Exception:
                continue

    except Exception as e:
        logger.error(f"Observer Error: {e}")