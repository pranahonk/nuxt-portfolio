#!/usr/bin/env python3
"""Fetch OG images for articles that have an empty featuredImage."""
import json, re, time, sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser

ARTICLES_DIR = Path(__file__).parent.parent / 'server/data/articles'
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; portfolio-og-fetcher/1.0)'}

class OGParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og_image = ''
    def handle_starttag(self, tag, attrs):
        if tag == 'meta':
            d = dict(attrs)
            if d.get('property') == 'og:image' and d.get('content'):
                self.og_image = d['content']
            elif d.get('name') == 'twitter:image' and not self.og_image and d.get('content'):
                self.og_image = d['content']

def fetch_og_image(url: str) -> str:
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=8) as resp:
            # only read first 30 KB — OG tags are always in <head>
            html = resp.read(30_000).decode('utf-8', errors='ignore')
        parser = OGParser()
        parser.feed(html)
        return parser.og_image
    except (URLError, HTTPError, Exception):
        return ''

def main():
    files = sorted(ARTICLES_DIR.glob('*.json'))
    updated = 0
    skipped = 0
    failed = 0

    for f in files:
        d = json.loads(f.read_text())
        if d.get('featuredImage'):
            skipped += 1
            continue

        src_match = re.search(r'Source: (https?://[^\s<"]+)', d.get('content', ''))
        if not src_match:
            skipped += 1
            continue

        url = src_match.group(1).rstrip(')')
        print(f'Fetching OG for: {d["title"][:50]}')
        print(f'  URL: {url}')

        og = fetch_og_image(url)
        if og:
            d['featuredImage'] = og
            f.write_text(json.dumps(d, indent=2, ensure_ascii=False))
            print(f'  ✓ {og[:80]}')
            updated += 1
        else:
            print(f'  ✗ no OG image found')
            failed += 1

        time.sleep(0.4)

    print(f'\nDone: {updated} updated, {skipped} skipped, {failed} failed')

if __name__ == '__main__':
    main()
