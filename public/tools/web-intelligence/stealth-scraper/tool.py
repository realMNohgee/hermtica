#!/usr/bin/env python3
"""
Stealth Web Scraper - Extract structured data from websites with rotating user agents.
Usage: python stealth_scraper.py --url https://example.com --selector "h1,a,p"
"""
import sys, json, argparse, requests, random
from html.parser import HTMLParser

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
]

class ContentExtractor(HTMLParser):
    def __init__(self, selectors):
        super().__init__()
        self.selectors = set(selectors)
        self.results = {s: [] for s in selectors}
        self.current_tag = None
        self.current_attrs = None
    
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        self.current_attrs = dict(attrs)
    
    def handle_data(self, data):
        if self.current_tag in self.selectors:
            text = data.strip()
            if text:
                entry = {"text": text}
                if self.current_attrs:
                    entry.update(self.current_attrs)
                self.results[self.current_tag].append(entry)
    
    def handle_endtag(self, tag):
        self.current_tag = None
        self.current_attrs = None

def scrape(url, selectors, timeout=10):
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    
    extractor = ContentExtractor(selectors)
    extractor.feed(r.text)
    
    return {
        "url": url,
        "status": r.status_code,
        "size": len(r.content),
        "title": extractor.results.get("title", [{}])[0].get("text", "") if "title" in selectors else "",
        "data": extractor.results
    }

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Stealth Web Scraper")
    p.add_argument("--url", required=True)
    p.add_argument("--selector", default="h1,h2,h3,a,p,title", help="Comma-separated HTML tags")
    p.add_argument("--output", help="Output JSON file")
    p.add_argument("--timeout", type=int, default=10)
    args = p.parse_args()
    
    selectors = [s.strip() for s in args.selector.split(",")]
    result = scrape(args.url, selectors, args.timeout)
    
    output = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"Saved to {args.output}")
    else:
        print(output)
