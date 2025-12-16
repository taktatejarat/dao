# ai-engine/blockchain_listener.py

import time
import asyncio
from web3 import Web3
from config import w3, DAO_REGISTRY_ADDRESS, DAO_ABI, logger
from services.oracle_caller import get_dao_contract
from services.observer_service import update_db_status

# لیستی از رویدادهایی که می‌خواهیم رصد کنیم
INTERESTING_EVENTS = ['ProposalCreated', 'VoteCast', 'ProposalExecuted']

def handle_event(event):
    """
    پردازش رویداد دریافت شده
    """
    try:
        event_name = event['event']
        args = event['args']
        logger.info(f"🔔 New Event Detected: {event_name} | Args: {args}")

        if event_name == 'ProposalExecuted':
            # وقتی پروپوزال اجرا شد، وضعیت دیتابیس را executed کن تا ناظر دیگر آن را چک نکند
            proposal_id = args['id']
            update_db_status(proposal_id, 'executed')
            logger.info(f"✅ Proposal {proposal_id} execution confirmed on-chain.")

        elif event_name == 'ProposalCreated':
            # وقتی پروپوزال جدید آمد، می‌توانیم آنالیز هوش مصنوعی را استارت بزنیم
            proposal_id = args['id']
            logger.info(f"🆕 New Proposal {proposal_id} detected on-chain.")
            # اینجا می‌توان متد trigger_risk_analysis را صدا زد

    except Exception as e:
        logger.error(f"Error handling event: {e}")

async def log_loop(poll_interval):
    """
    حلقه اصلی شنود رویدادها
    """
    logger.info("🎧 Blockchain Listener Started...")
    
    dao_contract = get_dao_contract()
    
    # فیلتر کردن از آخرین بلاک
    last_block = w3.eth.block_number
    
    while True:
        try:
            current_block = w3.eth.block_number
            if current_block > last_block:
                # دریافت لاگ‌ها در بازه بلاک جدید
                for event_name in INTERESTING_EVENTS:
                    event_filter = getattr(dao_contract.events, event_name).create_filter(fromBlock=last_block + 1, toBlock=current_block)
                    entries = event_filter.get_all_entries()
                    
                    for entry in entries:
                        handle_event(entry)
                
                last_block = current_block
            
            await asyncio.sleep(poll_interval)
            
        except Exception as e:
            logger.error(f"Listener Error: {e}")
            await asyncio.sleep(5) # صبر در صورت خطا

def start_listener_task():
    # این تابع در پس‌زمینه FastAPI اجرا می‌شود
    asyncio.run(log_loop(poll_interval=2))