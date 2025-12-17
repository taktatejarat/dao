# ai-engine/blockchain_listener.py - FIXED WITH get_logs

import time
import asyncio
from web3 import Web3
from config import w3, logger
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
        tx_hash = event['transactionHash'].hex()
        
        logger.info(f"🔔 Event Detected: {event_name} | Tx: {tx_hash}")

        if event_name == 'ProposalExecuted':
            # وقتی پروپوزال اجرا شد، وضعیت دیتابیس را executed کن
            proposal_id = args['id']
            update_db_status(proposal_id, 'executed')
            logger.info(f"✅ Proposal {proposal_id} status updated to EXECUTED.")

        elif event_name == 'ProposalCreated':
            proposal_id = args['id']
            logger.info(f"🆕 New Proposal {proposal_id} created.")
            
        elif event_name == 'VoteCast':
            # لاگ کردن رأی‌ها برای دیباگ (اختیاری)
            voter = args['voter']
            logger.info(f"🗳️ Vote cast by {voter}")

    except Exception as e:
        logger.error(f"Error handling event payload: {e}")

async def log_loop(poll_interval):
    """
    حلقه اصلی شنود رویدادها با استفاده از get_logs
    """
    logger.info("🎧 Blockchain Listener Started (Polling Mode)...")
    
    dao_contract = get_dao_contract()
    
    # شروع از آخرین بلاک شبکه
    try:
        last_block = w3.eth.block_number
    except Exception as e:
        logger.error(f"Failed to fetch initial block number: {e}")
        return

    while True:
        try:
            current_block = w3.eth.block_number
            
            # فقط اگر بلاک جدیدی تولید شده باشد، جستجو کن
            if current_block > last_block:
                
                # برای اطمینان و جلوگیری از خطای همزمانی، یک بلاک عقب‌تر را چک می‌کنیم (Safe zone)
                # اما برای تست می‌توانیم تا current_block برویم
                from_block = last_block + 1
                to_block = current_block
                
                # logger.debug(f"Scanning blocks {from_block} to {to_block}...")

                for event_name in INTERESTING_EVENTS:
                    try:
                        # ✅ FIX: استفاده از get_logs به جای create_filter
                        # این متد پایدارتر است و خطای keyword argument نمیدهد
                        event_contract = getattr(dao_contract.events, event_name)
                        entries = event_contract.get_logs(fromBlock=from_block, toBlock=to_block)
                        
                        for entry in entries:
                            handle_event(entry)
                            
                    except Exception as e:
                        # اگر خطایی در دریافت لاگ یک ایونت خاص بود، کل حلقه نباید قطع شود
                        logger.warning(f"Failed to fetch logs for {event_name}: {e}")
                
                # آپدیت آخرین بلاک بررسی شده
                last_block = current_block
            
            # انتظار تا سیکل بعدی
            await asyncio.sleep(poll_interval)
            
        except Exception as e:
            logger.error(f"Listener Loop Error: {e}")
            await asyncio.sleep(5) # صبر بیشتر در صورت خطا

def start_listener_task():
    # این تابع در ترد جداگانه اجرا می‌شود
    try:
        asyncio.run(log_loop(poll_interval=3))
    except Exception as e:
        logger.critical(f"Listener Thread Crashed: {e}")