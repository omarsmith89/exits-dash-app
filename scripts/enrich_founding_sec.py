#!/usr/bin/env python3
"""Python port of scripts/enrich-founding-sec.mjs (no Node available in this env)."""
import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(ROOT, 'research', 'founding-date-template.csv')
REQUEST_TIMEOUT = 20
REQUEST_DELAY = 0.4
MAX_RETRIES = 3

HEADERS = [
    'company', 'ticker', 'cik', 'latest_exit_date', 'deal_type', 'hq_location',
    'founding_date', 'date_basis', 'source', 'confidence', 'status', 'matched_name',
    'form', 'filing_url', 'notes',
]

SUFFIX_RE = re.compile(r'\b(incorporated|inc|corp|corporation|company|co|ltd|limited|holdings|holding|group|plc|sa|ag|nv|ab)\b')
TICKER_EXTRACT_RE = re.compile(r'\(([A-Z]{2,5}):\s*([A-Z.\-]+)\)$')
TARGET_FORMS = {'S-1', 'S-1/A', 'F-1', 'F-1/A', '10-K', '20-F', '8-K'}

MONTHS = {m: i + 1 for i, m in enumerate(['January','February','March','April','May','June','July','August','September','October','November','December'])}

PATTERNS = [
    (re.compile(r'\bincorporated(?: in [A-Za-z .]+)? on ([A-Z][a-z]+ \d{1,2}, \d{4})\b', re.I), 'HIGH', 'legal_incorporation'),
    (re.compile(r'\bincorporated(?: in [A-Za-z .]+)? in ([A-Z][a-z]+ \d{4})\b', re.I), 'MEDIUM_HIGH', 'legal_incorporation'),
    (re.compile(r'\bincorporated(?: in [A-Za-z .]+)? in (\d{4})\b', re.I), 'MEDIUM', 'legal_incorporation'),
    (re.compile(r'\bfounded in ([A-Z][a-z]+ \d{4})\b', re.I), 'MEDIUM', 'operating_founding'),
    (re.compile(r'\bfounded in (\d{4})\b', re.I), 'LOW', 'operating_founding'),
]


def csv_escape(value):
    text = '' if value is None else str(value)
    if re.search(r'[",\n]', text):
        return '"' + text.replace('"', '""') + '"'
    return text


def normalize_name(value):
    v = (value or '').lower()
    v = v.replace('&', ' and ')
    v = re.sub(r"['\".,]", '', v)
    v = SUFFIX_RE.sub(' ', v)
    v = re.sub(r'\s+', ' ', v)
    return v.strip()


def extract_ticker(company):
    m = TICKER_EXTRACT_RE.search(company or '')
    return m.group(2) if m else ''


def fetch_text(url):
    last_err = None
    for attempt in range(MAX_RETRIES + 1):
        req = urllib.request.Request(url, headers={
            'User-Agent': 'exits-dash-app founding-date research omarsmith89@gmail.com',
            'Accept': 'text/plain, text/html, application/json',
        })
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                return resp.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < MAX_RETRIES:
                time.sleep((attempt + 1) * 2)
                continue
            if 400 <= e.code < 500 and e.code != 403:
                raise
            last_err = e
            if attempt >= MAX_RETRIES:
                raise
            time.sleep((attempt + 1) * 1.5)
        except Exception as e:
            last_err = e
            if attempt >= MAX_RETRIES:
                raise
            time.sleep((attempt + 1) * 1.5)
    raise last_err or RuntimeError(f'Exhausted retries for {url}')


def fetch_json(url):
    return json.loads(fetch_text(url))


def parse_founding_from_text(text):
    flat = re.sub(r'\s+', ' ', text)
    for pattern, confidence, date_basis in PATTERNS:
        m = pattern.search(flat)
        if not m:
            continue
        raw = m.group(1)
        if re.match(r'^\d{4}$', raw):
            date = raw
        elif re.match(r'^[A-Z][a-z]+ \d{4}$', raw):
            month, year = raw.split(' ')
            month_num = MONTHS.get(month)
            if not month_num:
                continue
            date = f'{year}-{month_num:02d}'
        else:
            dm = re.match(r'^([A-Z][a-z]+) (\d{1,2}), (\d{4})$', raw)
            if not dm:
                continue
            month_num = MONTHS.get(dm.group(1))
            if not month_num:
                continue
            date = f'{dm.group(3)}-{month_num:02d}-{int(dm.group(2)):02d}'
        return {
            'founding_date': date, 'date_basis': date_basis, 'confidence': confidence,
            'notes': f'Extracted from filing text: {m.group(0)[:160]}',
        }
    return None


def load_ticker_map():
    data = fetch_json('https://www.sec.gov/files/company_tickers.json')
    by_ticker, by_name = {}, {}
    for item in data.values():
        row = {'cik': str(item['cik_str']).zfill(10), 'ticker': item['ticker'], 'title': item['title']}
        by_ticker[(item.get('ticker') or '').upper()] = row
        by_name[normalize_name(item['title'])] = row
    return by_ticker, by_name


def pick_sec_match(row, by_ticker, by_name):
    ticker = extract_ticker(row['company'])
    if ticker and ticker.upper() in by_ticker:
        return {**by_ticker[ticker.upper()], 'match_type': 'ticker'}
    name = normalize_name(re.sub(r'\s+\([^)]+\)$', '', row['company']))
    if name in by_name:
        return {**by_name[name], 'match_type': 'name'}
    return None


def build_candidate(row, by_ticker, by_name):
    ticker = extract_ticker(row['company'])
    match = pick_sec_match(row, by_ticker, by_name)
    base = {**row, 'ticker': ticker, 'cik': '', 'founding_date': '', 'date_basis': '', 'source': 'SEC'}
    if not match:
        return {**base, 'confidence': 'NONE', 'status': 'NO_SEC_MATCH', 'matched_name': '', 'form': '', 'filing_url': '', 'notes': 'No SEC ticker/name match'}

    try:
        time.sleep(REQUEST_DELAY)
        submissions = fetch_json(f'https://data.sec.gov/submissions/CIK{match["cik"]}.json')
        filings = ((submissions or {}).get('filings') or {}).get('recent') or {}
        forms = filings.get('form') or []
        accession_numbers = filings.get('accessionNumber') or []
        primary_docs = filings.get('primaryDocument') or []
        filing_dates = filings.get('filingDate') or []
        filing_idx = next((i for i, f in enumerate(forms) if f in TARGET_FORMS), -1)
        if filing_idx == -1:
            return {**base, 'ticker': match['ticker'], 'cik': match['cik'], 'confidence': 'LOW', 'status': 'NO_TARGET_FORM',
                    'matched_name': match['title'], 'form': '', 'filing_url': '',
                    'notes': f'Matched by {match["match_type"]}, but no target form found in recent submissions'}

        accession = accession_numbers[filing_idx].replace('-', '')
        doc = primary_docs[filing_idx]
        form = forms[filing_idx]
        filing_url = f'https://www.sec.gov/Archives/edgar/data/{int(match["cik"])}/{accession}/{doc}'
        time.sleep(REQUEST_DELAY)
        filing_text = fetch_text(filing_url)
        parsed = parse_founding_from_text(filing_text)

        if not parsed:
            return {**base, 'ticker': match['ticker'], 'cik': match['cik'], 'confidence': 'LOW', 'status': 'MATCH_NO_DATE',
                    'matched_name': match['title'], 'form': form, 'filing_url': filing_url,
                    'notes': f'Matched by {match["match_type"]}; no founding/incorporation text extracted from {form} filed {filing_dates[filing_idx]}'}

        return {**base, 'ticker': match['ticker'], 'cik': match['cik'], 'founding_date': parsed['founding_date'],
                'date_basis': parsed['date_basis'], 'source': 'SEC filing', 'confidence': parsed['confidence'],
                'status': 'SEC_MATCH', 'matched_name': match['title'], 'form': form, 'filing_url': filing_url,
                'notes': parsed['notes']}
    except Exception as e:
        return {**base, 'ticker': match['ticker'], 'cik': match['cik'], 'confidence': 'ERROR', 'status': 'ERROR',
                'matched_name': match['title'], 'form': '', 'filing_url': '', 'notes': str(e)}


def parse_template_rows():
    with open(TEMPLATE_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return [{'company': r['company'], 'latest_exit_date': r['latest_exit_date'],
                  'deal_type': r['deal_type'], 'hq_location': r['hq_location']} for r in reader]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', type=int, default=0)
    ap.add_argument('--limit', type=int, default=None)
    ap.add_argument('--out', required=True)
    ap.add_argument('--only-companies', default=None, help='path to newline file of company names to restrict to')
    args = ap.parse_args()

    rows = [r for r in parse_template_rows() if extract_ticker(r['company'])]
    if args.only_companies:
        with open(args.only_companies, encoding='utf-8') as f:
            allow = {l.strip().lower() for l in f if l.strip()}
        rows = [r for r in rows if r['company'].strip().lower() in allow]
    subset = rows[args.start:args.start + args.limit] if args.limit else rows[args.start:]

    out_path = os.path.join(ROOT, args.out) if not os.path.isabs(args.out) else args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    print('Loading SEC ticker map...', file=sys.stderr)
    by_ticker, by_name = load_ticker_map()

    summary = {}
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(','.join(HEADERS) + '\n')
        for i, row in enumerate(subset):
            result = build_candidate(row, by_ticker, by_name)
            f.write(','.join(csv_escape(result.get(h, '')) for h in HEADERS) + '\n')
            f.flush()
            summary[result['status']] = summary.get(result['status'], 0) + 1
            if (i + 1) % 10 == 0 or i == len(subset) - 1:
                print(f'Progress: {i + 1}/{len(subset)}', file=sys.stderr)

    print(json.dumps({'output': out_path, 'rows': len(subset), 'summary': summary}, indent=2))


if __name__ == '__main__':
    main()
