#!/usr/bin/env python3
"""
CSV Data Cleaner - Clean and normalize CSV files automatically.
Usage: python csv_cleaner.py --input dirty.csv --output clean.csv
"""
import csv, sys, argparse, re
from collections import Counter

def clean_value(val):
    if val is None or val.strip() == "":
        return ""
    val = val.strip()
    val = re.sub(r'\s+', ' ', val)
    return val

def detect_type(values):
    non_empty = [v for v in values if v]
    if not non_empty:
        return "empty"
    
    int_count = sum(1 for v in non_empty if re.match(r'^-?\d+$', v))
    float_count = sum(1 for v in non_empty if re.match(r'^-?\d+\.?\d*$', v))
    date_count = sum(1 for v in non_empty if re.match(r'\d{4}-\d{2}-\d{2}', v))
    email_count = sum(1 for v in non_empty if '@' in v)
    url_count = sum(1 for v in non_empty if v.startswith('http'))
    
    total = len(non_empty)
    if int_count > total * 0.8: return "integer"
    if float_count > total * 0.8: return "float"
    if date_count > total * 0.5: return "date"
    if email_count > total * 0.5: return "email"
    if url_count > total * 0.5: return "url"
    return "text"

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="CSV Data Cleaner")
    p.add_argument("--input", required=True, help="Input CSV file")
    p.add_argument("--output", required=True, help="Output CSV file")
    p.add_argument("--drop-empty", action="store_true", help="Remove rows with empty values")
    p.add_argument("--dedupe", action="store_true", help="Remove duplicate rows")
    args = p.parse_args()
    
    rows = []
    with open(args.input, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        for row in reader:
            rows.append({k: clean_value(v) for k, v in row.items()})
    
    if args.drop_empty:
        rows = [r for r in rows if all(v for v in r.values())]
    
    if args.dedupe:
        seen = set()
        unique = []
        for r in rows:
            key = tuple(r.values())
            if key not in seen:
                seen.add(key)
                unique.append(r)
        rows = unique
    
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    
    # Analysis
    print(f"Input: {len(rows)} rows, {len(headers)} columns")
    print(f"Output: {len(rows)} rows")
    print("\nColumn Analysis:")
    for col in headers:
        values = [r[col] for r in rows]
        dtype = detect_type(values)
        empty = sum(1 for v in values if not v)
        unique = len(set(values))
        print(f"  {col}: {dtype} | {empty} empty | {unique} unique")
