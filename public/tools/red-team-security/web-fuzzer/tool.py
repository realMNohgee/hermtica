#!/usr/bin/env python3
"""
Web Fuzzer - Discover hidden directories and files on web servers.
Usage: python web_fuzzer.py --url https://example.com --wordlist common.txt
"""
import sys, argparse, requests, concurrent.futures
from urllib.parse import urljoin

COMMON_PATHS = [
    "admin","login","wp-admin","dashboard","api","graphql","swagger","docs",
    ".env","config","backup","robots.txt","sitemap.xml","crossdomain.xml",
    ".git/config","phpinfo.php","info.php","test.php","console","debug",
    "wp-content","wp-includes","uploads","assets","static","vendor","node_modules",
    ".htaccess","web.config","server-status","actuator","health","metrics",
    "admin.php","administrator","wp-login.php","cms","db","database",
]

def fuzz_path(base_url, path, timeout=5):
    url = urljoin(base_url, path)
    try:
        r = requests.get(url, timeout=timeout, allow_redirects=False, headers={"User-Agent": "Hermtica-Fuzzer/1.0"})
        if r.status_code not in [404, 400, 500]:
            return {"path": path, "status": r.status_code, "size": len(r.content)}
    except:
        pass
    return None

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Web Path Fuzzer")
    p.add_argument("--url", required=True, help="Target base URL")
    p.add_argument("--wordlist", help="Custom wordlist file")
    p.add_argument("--threads", type=int, default=20)
    p.add_argument("--extensions", help="Comma-separated extensions (e.g. php,asp,bak)")
    args = p.parse_args()
    
    base = args.url.rstrip("/") + "/"
    paths = COMMON_PATHS
    
    if args.wordlist:
        with open(args.wordlist) as f:
            paths = [line.strip() for line in f if line.strip()]
    
    # Add extensions if specified
    if args.extensions:
        exts = args.extensions.split(",")
        ext_paths = []
        for path in paths:
            ext_paths.append(path)
            for ext in exts:
                ext_paths.append(f"{path}.{ext}")
        paths = ext_paths
    
    print(f"Fuzzing {base} ({len(paths)} paths)...")
    found = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(fuzz_path, base, path): path for path in paths}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                found.append(result)
                print(f"  [{result['status']}] /{result['path']} ({result['size']}B)")
    
    print(f"\nDone. {len(found)} paths discovered.")
