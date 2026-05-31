#!/usr/bin/env python3
"""
Subdomain Finder - Discover subdomains using wordlist-based DNS enumeration.
Usage: python subdomain_finder.py --domain example.com
"""
import socket, sys, argparse, concurrent.futures

COMMON_SUBDOMAINS = [
    "www","mail","ftp","localhost","webmail","smtp","pop","ns1","ns2","api","dev",
    "staging","test","admin","blog","shop","cdn","m","mobile","app","secure","vpn",
    "portal","remote","dashboard","docs","support","status","monitor","auth","login",
    "signin","account","billing","pay","payments","store","static","media","images",
    "img","video","videos","files","download","dl","assets","cpanel","whm","webdisk",
    "autodiscover","autoconfig","beta","demo","sandbox","stage","stg","prod","uat",
    "jenkins","git","gitlab","ci","jira","confluence","wiki","kibana","grafana",
    "prometheus","alertmanager","traefik","registry","vault","consul","nomad",
]

def check_subdomain(domain, sub):
    hostname = f"{sub}.{domain}"
    try:
        socket.gethostbyname(hostname)
        return hostname
    except:
        return None

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Subdomain Finder")
    p.add_argument("--domain", required=True, help="Target domain (e.g. example.com)")
    p.add_argument("--wordlist", help="Custom wordlist file path")
    p.add_argument("--threads", type=int, default=30)
    args = p.parse_args()
    
    subs = COMMON_SUBDOMAINS
    if args.wordlist:
        with open(args.wordlist) as f:
            subs = [line.strip() for line in f if line.strip()]
    
    print(f"Enumerating subdomains for {args.domain} ({len(subs)} names)...")
    found = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(check_subdomain, args.domain, sub): sub for sub in subs}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                found.append(result)
                print(f"  [FOUND] {result}")
    
    print(f"\nDone. {len(found)} subdomains discovered.")
