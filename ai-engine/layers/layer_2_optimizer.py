# ai-engine/layers/layer_2_optimizer.py

import re
from typing import List, Dict

def analyze_for_gas_optimizations(code: str) -> List[Dict]:
    """
    یک تحلیل استاتیک ساده برای پیدا کردن الگوهای رایج بهینه‌سازی Gas انجام می‌دهد.
    (این یک نسخه Mock و مبتنی بر قوانین است)
    """
    suggestions = []
    lines = code.split('\n')

    for i, line in enumerate(lines):
        line_num = i + 1

        # قانون ۱: بررسی استفاده از uint > 0 به جای uint != 0
        if re.search(r'uint\d*\s+.*>\s*0', line):
            suggestions.append({
                "line": line_num,
                "suggestion_key": "optimizer.suggestion.uint_comparison",
                "severity": "low",
                "values": {}
            })
            
        # قانون ۲: بررسی استفاده از for loop با incrementer
        if re.search(r'for\s*\(.*\+\+', line):
            suggestions.append({
                "line": line_num,
                "suggestion_key": "optimizer.suggestion.for_loop_gas",
                "severity": "medium",
                "values": {}
            })
            
        # قانون ۳: بررسی string literals در داخل توابع
        if re.search(r'=\s*".+"', line) and len(line.split('"')[1]) > 32:
             suggestions.append({
                "line": line_num,
                "suggestion_key": "optimizer.suggestion.string_literal",
                "severity": "low",
                "values": {}
            })

    return suggestions