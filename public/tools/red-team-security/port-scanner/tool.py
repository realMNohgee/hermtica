#!/usr/bin/env python3
"""
Port Scanner - Lightweight TCP port scanner for security testing.
Usage: python port_scanner.py --host example.com --ports 1-1000
"""
import socket, sys, argparse, concurrent.futures
from datetime import datetime

def scan_port(host, port, timeout=1):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            try:
                service = socket.getservbyport(port)
            except:
                service = "unknown"
            return {"port": port, "status": "open", "service": service}
    except:
        pass
    return None

COMMON_PORTS = [21,22,23,25,53,80,110,143,443,465,587,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443,9090,27017]

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="TCP Port Scanner")
    p.add_argument("--host", required=True)
    p.add_argument("--ports", default="common", help="Port range (e.g. 1-1000) or 'common'")
    p.add_argument("--threads", type=int, default=50)
    args = p.parse_args()
    
    if args.ports == "common":
        ports = COMMON_PORTS
    else:
        start, end = map(int, args.ports.split("-"))
        ports = range(start, end + 1)
    
    print(f"Scanning {args.host} ({len(ports)} ports)...")
    start_time = datetime.now()
    
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(scan_port, args.host, port): port for port in ports}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                results.append(result)
                print(f"  [OPEN] {result['port']}/tcp - {result['service']}")
    
    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\nDone. {len(results)} open ports found in {elapsed:.1f}s")
