# ai-engine/services/document_processor.py

import pdfplumber
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    استخراج متن خام از فایل PDF برای تحلیل NLP.
    """
    text = ""
    try:
        # در نسخه واقعی، اینجا فایل را از IPFS دانلود می‌کنیم
        # فعلاً فرض می‌کنیم فایل لوکال است یا متن ساختگی برمی‌گردانیم
        if not file_path or not file_path.endswith('.pdf'):
            return ""

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"[DOC PROCESSOR] Error reading PDF: {e}")
        return ""

def analyze_whitepaper_content(text: str) -> dict:
    """
    تحلیل ساده NLP روی متن وایت‌پیپر (xAI).
    """
    text_lower = text.lower()
    
    keywords = {
        "tokenomics": ["token distribution", "vesting", "allocation", "burn"],
        "technology": ["smart contract", "blockchain", "ai", "algorithm"],
        "roadmap": ["q1", "q2", "phase 1", "milestone"],
        "risk": ["volatility", "regulatory", "audit", "security"]
    }
    
    analysis = {"found_sections": [], "missing_sections": [], "sentiment_score": 0.5}
    
    for section, words in keywords.items():
        if any(w in text_lower for w in words):
            analysis["found_sections"].append(section)
        else:
            analysis["missing_sections"].append(section)
            
    return analysis