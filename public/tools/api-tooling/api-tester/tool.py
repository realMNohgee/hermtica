#!/usr/bin/env python3
"""
API Endpoint Tester - Test REST API endpoints with various payloads.
Usage: python api_tester.py --url https://api.example.com/endpoint --method POST --data '{"key":"value"}'
"""
import sys, json, argparse, requests, time
from datetime import datetime

METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]

def test_endpoint(url, method="GET", headers=None, data=None, timeout=10):
    start = time.time()
    try:
        if method in ["POST", "PUT", "PATCH"]:
            r = requests.request(method, url, headers=headers, json=data, timeout=timeout)
        else:
            r = requests.request(method, url, headers=headers, timeout=timeout)
        elapsed = (time.time() - start) * 1000
        
        return {
            "url": url,
            "method": method,
            "status": r.status_code,
            "latency_ms": round(elapsed, 1),
            "size": len(r.content),
            "headers": dict(r.headers),
            "body": r.text[:1000] if r.text else None,
            "success": r.ok,
        }
    except Exception as e:
        return {"url": url, "method": method, "error": str(e), "success": False}

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="API Endpoint Tester")
    p.add_argument("--url", required=True)
    p.add_argument("--method", default="GET", choices=METHODS)
    p.add_argument("--data", help="JSON payload for POST/PUT/PATCH")
    p.add_argument("--header", action="append", help="Custom headers (key:value)")
    p.add_argument("--output", help="Output JSON file")
    args = p.parse_args()
    
    headers = {"Content-Type": "application/json", "User-Agent": "Hermtica-API-Tester/1.0"}
    if args.header:
        for h in args.header:
            k, v = h.split(":", 1)
            headers[k.strip()] = v.strip()
    
    payload = None
    if args.data:
        try:
            payload = json.loads(args.data)
        except:
            payload = args.data
    
    result = test_endpoint(args.url, args.method, headers, payload)
    output = json.dumps(result, indent=2)
    
    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
    
    status_icon = "✅" if result.get("success") else "❌"
    print(f"{status_icon} {result.get('status', 'ERR')} | {result.get('latency_ms', '?')}ms | {result.get('size', 0)}B")
    
    if not result.get("success") and "error" in result:
        print(f"   Error: {result['error']}")
