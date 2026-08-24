#!/usr/bin/env python3
"""Python port of scripts/enrich-founding-candidates.mjs (no Node available in this env).
Mirrors its CSV schema/logic exactly so output drops into the existing pipeline
(research/founding-batches/, build-founding-promotion-review.mjs, promote-founding-candidates.mjs).
"""
import csv
import io
import json
import os
import re
import sys
import time
import argparse
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(ROOT, 'research', 'founding-date-template.csv')
REQUEST_TIMEOUT = 15
REQUEST_DELAY = 0.35
MAX_RETRIES = 4

HEADERS = [
    'company', 'latest_exit_date', 'deal_type', 'hq_location', 'normalized_company',
    'founding_date', 'date_basis', 'source', 'confidence', 'score', 'status',
    'wikidata_id', 'wikidata_label', 'notes',
]

US_STATES = {
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
    'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
    'VT','VA','WA','WV','WI','WY','DC',
}
COUNTRY_ALIASES = {'usa': 'united states', 'u.s.': 'united states', 'u.s.a.': 'united states', 'uk': 'united kingdom', 'uae': 'united arab emirates'}

SUFFIX_RE = re.compile(r'\b(incorporated|inc|corp|corporation|company|co|ltd|limited|holdings|holding|group|plc|sa|ag|nv|ab)\b')
TICKER_RE = re.compile(r'\s+\([A-Z]+:\s*[^)]+\)$')


def csv_escape(value):
    text = '' if value is None else str(value)
    if re.search(r'[",\n]', text):
        return '"' + text.replace('"', '""') + '"'
    return text


def strip_ticker(value):
    return TICKER_RE.sub('', value or '').strip()


def normalize_name(value):
    v = strip_ticker(value or '').lower()
    v = v.replace('&', ' and ')
    v = re.sub(r"['\".,]", '', v)
    v = SUFFIX_RE.sub(' ', v)
    v = re.sub(r'\s+', ' ', v)
    return v.strip()


def extract_country(hq):
    parts = [p.strip() for p in (hq or '').replace('"', '').split(',') if p.strip()]
    if not parts:
        return ''
    last = parts[-1]
    if last.upper() in US_STATES:
        return 'united states'
    return COUNTRY_ALIASES.get(last.lower(), last.lower())


def fetch_json(url):
    last_err = None
    for attempt in range(MAX_RETRIES + 1):
        req = urllib.request.Request(url, headers={
            'User-Agent': 'exits-dash-app/1.0 (founding date enrichment)',
            'Accept': 'application/json',
        })
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < MAX_RETRIES:
                time.sleep((attempt + 1) * 2)
                continue
            if 400 <= e.code < 500:
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


def get_inception(entity):
    claims = ((entity or {}).get('claims') or {}).get('P571') or []
    if not claims:
        return ''
    time_val = (((claims[0] or {}).get('mainsnak') or {}).get('datavalue') or {}).get('value', {}).get('time')
    if not time_val:
        return ''
    cleaned = time_val.lstrip('+')
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})T', cleaned)
    if not m:
        return ''
    year, month, day = m.groups()
    if month == '01' and day == '01':
        return year
    if day == '01':
        return f'{year}-{month}'
    return f'{year}-{month}-{day}'


def get_country_labels(entity, label_map):
    claims = ((entity or {}).get('claims') or {}).get('P17') or []
    ids = [((c.get('mainsnak') or {}).get('datavalue') or {}).get('value', {}).get('id') for c in claims]
    labels = [label_map.get(i) for i in ids if i]
    return [l.lower() for l in labels if l]


def score_candidate(company_norm, country_norm, result_norm, aliases_norm, country_labels):
    score = 0
    if company_norm == result_norm:
        score += 70
    elif result_norm and (result_norm in company_norm or company_norm in result_norm):
        score += 45
    if company_norm in aliases_norm:
        score += 20
    if country_norm and country_norm in country_labels:
        score += 10
    return score


def search_wikidata(company):
    params = {
        'action': 'wbsearchentities', 'format': 'json', 'language': 'en', 'type': 'item',
        'limit': '5', 'search': strip_ticker(company),
    }
    url = 'https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(params)
    return fetch_json(url)


def fetch_entity_bundle(ids):
    if not ids:
        return {}
    joined = urllib.parse.quote('|'.join(ids), safe='|')
    url = f'https://www.wikidata.org/wiki/Special:EntityData/{joined}.json'
    return fetch_json(url)


def build_candidate(row):
    company_norm = normalize_name(row['company'])
    country_norm = extract_country(row['hq_location'])
    base = {**row, 'normalized_company': company_norm, 'source': 'Wikidata',
            'wikidata_id': '', 'wikidata_label': '', 'founding_date': '', 'date_basis': ''}
    try:
        search = search_wikidata(row['company'])
        results = search.get('search') or []
        if not results:
            return {**base, 'confidence': 'NONE', 'score': 0, 'status': 'NO_MATCH', 'notes': 'No Wikidata search results'}

        ids = [r['id'] for r in results]
        bundle = fetch_entity_bundle(ids)
        entities = bundle.get('entities') or {}
        label_map = {i: (e.get('labels', {}).get('en', {}).get('value', '')) for i, e in entities.items()}

        candidates = []
        for result in results:
            entity = entities.get(result['id'])
            label = result.get('label') or (entity or {}).get('labels', {}).get('en', {}).get('value', '')
            aliases = [a['value'] for a in (entity or {}).get('aliases', {}).get('en', [])]
            result_norm = normalize_name(label)
            aliases_norm = [normalize_name(a) for a in aliases]
            country_labels = get_country_labels(entity, label_map)
            founding_date = get_inception(entity)
            score = score_candidate(company_norm, country_norm, result_norm, aliases_norm, country_labels)
            confidence = 'HIGH' if (score >= 85 and founding_date) else 'MEDIUM' if (score >= 60 and founding_date) else 'LOW' if founding_date else 'NONE'
            notes = '; '.join(filter(None, [
                f'hq={country_norm}' if country_norm else '',
                f'wikidata_country={"|".join(country_labels)}' if country_labels else '',
                f'aliases={"|".join(aliases[:3])}' if aliases else '',
                f'desc={result.get("description")}' if result.get('description') else '',
            ]))
            candidates.append({**base, 'wikidata_id': result['id'], 'wikidata_label': label,
                                'founding_date': founding_date, 'date_basis': 'operating_founding' if founding_date else '',
                                'confidence': confidence, 'score': score,
                                'status': 'CANDIDATE' if founding_date else 'NO_INCEPTION', 'notes': notes})

        candidates.sort(key=lambda c: c['score'], reverse=True)
        best = candidates[0]
        if best['score'] >= 85 and best['founding_date']:
            status = 'LIKELY_MATCH'
        elif best['founding_date']:
            status = 'REVIEW'
        else:
            status = 'NO_MATCH'
        return {**best, 'status': status}
    except Exception as e:
        return {**base, 'confidence': 'ERROR', 'score': 0, 'status': 'ERROR', 'notes': str(e)}


def parse_template_rows():
    with open(TEMPLATE_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return [{'company': r['company'], 'latest_exit_date': r['latest_exit_date'],
                  'deal_type': r['deal_type'], 'hq_location': r['hq_location']} for r in reader]


def row_to_csv(row):
    return ','.join(csv_escape(row.get(h, '')) for h in HEADERS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', type=int, default=0)
    ap.add_argument('--limit', type=int, default=None)
    ap.add_argument('--out', required=True)
    ap.add_argument('--resume', action='store_true')
    args = ap.parse_args()

    rows = parse_template_rows()
    subset = rows[args.start:args.start + args.limit] if args.limit else rows[args.start:]
    out_path = os.path.join(ROOT, args.out) if not os.path.isabs(args.out) else args.out

    resumed = []
    if args.resume and os.path.exists(out_path):
        with open(out_path, newline='', encoding='utf-8') as f:
            text = f.read().strip()
        if text:
            reader = csv.DictReader(io.StringIO(text))
            resumed = list(reader)

    processed = len(resumed)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    if not args.resume or not os.path.exists(out_path):
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(','.join(HEADERS) + '\n')

    summary = {}
    for r in resumed:
        summary[r.get('status', '')] = summary.get(r.get('status', ''), 0) + 1

    with open(out_path, 'a', encoding='utf-8') as f:
        for i in range(processed, len(subset)):
            candidate = build_candidate(subset[i])
            f.write(row_to_csv(candidate) + '\n')
            f.flush()
            summary[candidate['status']] = summary.get(candidate['status'], 0) + 1
            time.sleep(REQUEST_DELAY)
            if (i + 1) % 25 == 0 or i == len(subset) - 1:
                print(f'Progress: {i + 1}/{len(subset)}', file=sys.stderr)

    print(json.dumps({'output': out_path, 'range': f'start={args.start} limit={args.limit}', 'summary': summary}, indent=2))


if __name__ == '__main__':
    main()
