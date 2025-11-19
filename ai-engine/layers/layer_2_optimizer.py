# ai-engine/layers/layer_2_optimizer.py - نسخه نهایی و پایدار

import re
from typing import List, Dict

# ما الگوهای Regex را از قبل کامپایل می‌کنیم تا عملکرد بهتری داشته باشند
PATTERNS = {
    "uint_comparison": {
        "regex": re.compile(r'require\s*\(\s*(\w+)\s*>\s*0\s*\)'),
        "suggestion_key": "optimizer.suggestion.uint_comparison",
        "severity": "low"
    },
    "for_loop_gas": {
        "regex": re.compile(r'for\s*\(.*[;\s]i\+\+.*\)'),
        "suggestion_key": "optimizer.suggestion.for_loop_gas",
        "severity": "medium"
    },
    "string_literal": {
        "regex": re.compile(r'string\s+(public|private|internal|memory|storage)\s+\w+\s*=\s*"(.{33,})"'),
        "suggestion_key": "optimizer.suggestion.string_literal",
        "severity": "low"
    },
    # ✅ NEW RULE: بررسی visibility توابع برای external/public
    "external_visibility": {
        "regex": re.compile(r'function\s+\w+\s*\([^)]*\)\s*public'),
        "suggestion_key": "optimizer.suggestion.external_visibility",
        "severity": "low"
    },
    # ✅ NEW RULE: بررسی استفاده از a + b به جای a.add(b)
    "safe_math": {
        "regex": re.compile(r'\w+\s*\+\s*\w+'),
        "suggestion_key": "optimizer.suggestion.safe_math",
        "severity": "high"
    }
}

def analyze_for_gas_optimizations(code: str) -> List[Dict]:
    """
    یک تحلیل استاتیک پایدار برای پیدا کردن الگوهای بهینه‌سازی Gas انجام می‌دهد.
    """
    suggestions = []
    lines = code.split('\n')

    # یک دیکشنری برای جلوگیری از ثبت پیشنهادات تکراری برای یک خط
    found_suggestions = {}

    for i, line in enumerate(lines):
        line_num = i + 1
        
        for rule_name, rule in PATTERNS.items():
            # ✅ FIX: ما فقط روی یک خط کار می‌کنیم، بنابراین finditer بهتر است
            for match in rule["regex"].finditer(line):
                # اگر برای این خط و این قانون قبلاً پیشنهادی ثبت نشده باشد
                if f"{line_num}-{rule_name}" not in found_suggestions:
                    suggestions.append({
                        "line": line_num,
                        "suggestion_key": rule["suggestion_key"],
                        "severity": rule["severity"],
                        "values": {}
                    })
                    found_suggestions[f"{line_num}-{rule_name}"] = True
    
    # اگر هیچ پیشنهادی پیدا نشد، یک پیام موفقیت‌آمیز برمی‌گردانیم
    if not suggestions:
        suggestions.append({
            "line": 0,
            "suggestion_key": "optimizer.suggestion.no_issues_found",
            "severity": "low",
            "values": {}
        })

    return suggestions