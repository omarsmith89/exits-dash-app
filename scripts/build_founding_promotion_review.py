#!/usr/bin/env python3
"""Python port of scripts/build-founding-promotion-review.mjs (no Node available in this env)."""
import csv
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_FOUNDING_PATH = os.path.join(ROOT, 'public', 'company_founding_dates.csv')
OUT_PATH = os.path.join(ROOT, 'research', 'revisit-lists', 'founding-promotion-review.csv')

SOURCES = [
    (os.path.join(ROOT, 'research', 'founding-sec-batches'), re.compile(r'^founding-date-sec-candidates-\d+\.csv$')),
    (os.path.join(ROOT, 'research', 'founding-batches'), re.compile(r'^founding-date-candidates-\d+\.csv$')),
    (os.path.join(ROOT, 'research'), re.compile(r'^founding-date-site-candidates-\d+\.csv$')),
]

HEADERS = [
    'company', 'latest_exit_date', 'deal_type', 'hq_location', 'founding_date', 'date_basis',
    'source', 'confidence', 'status', 'time_to_exit_years', 'recommendation', 'review_reason',
    'matched_name', 'url', 'notes',
]


def csv_escape(value):
    text = '' if value is None else str(value)
    if re.search(r'[",\n]', text):
        return '"' + text.replace('"', '""') + '"'
    return text


def company_key(value):
    return str(value or '').strip().lower()


MONTH_ABBR = {m: i + 1 for i, m in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}


def parse_date(value):
    if not value:
        return None
    text = str(value).strip()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', text)
    if m:
        import datetime
        return datetime.date(int(m[1]), int(m[2]), int(m[3]))
    m = re.match(r'^(\d{4})-(\d{2})$', text)
    if m:
        import datetime
        return datetime.date(int(m[1]), int(m[2]), 1)
    m = re.match(r'^(\d{4})$', text)
    if m:
        import datetime
        return datetime.date(int(m[1]), 1, 1)
    m = re.match(r'^(\d{1,2})-(\w{3})-(\d{4})', text)
    if m and m[2] in MONTH_ABBR:
        import datetime
        return datetime.date(int(m[3]), MONTH_ABBR[m[2]], int(m[1]))
    return None


def years_between(start_value, end_value):
    start = parse_date(start_value)
    end = parse_date(end_value)
    if not start or not end or end < start:
        return ''
    return f'{(end - start).days / 365.25:.2f}'


def normalize_candidate_date(value):
    text = str(value or '').strip()
    m = re.match(r'^(\d{4})-00-00$', text)
    if m:
        return m[1]
    m = re.match(r'^(\d{4})-(\d{2})-00$', text)
    if m:
        return m[1] if m[2] == '00' else f'{m[1]}-{m[2]}'
    m = re.match(r'^(\d{4})-00$', text)
    if m:
        return m[1]
    return text


def infer_date_basis(row):
    if row.get('date_basis'):
        return row['date_basis']
    text = f"{row.get('source', '')} {row.get('notes', '')}".lower()
    if re.search(r'founded|inception|official site|wikidata', text):
        return 'operating_founding'
    if re.search(r'incorporated|incorporation', text):
        return 'legal_incorporation'
    return ''


def recommendation_for(row, time_to_exit):
    basis = row.get('date_basis')
    confidence = row.get('confidence') or ''
    status = row.get('status') or ''
    years = None if time_to_exit == '' else float(time_to_exit)
    text = f"{row.get('company', '')} {row.get('matched_name', '')} {row.get('notes', '')}".lower()

    if not row.get('founding_date'):
        return 'SKIP', 'No founding date candidate'
    if status not in ('SEC_MATCH', 'LIKELY_MATCH', 'SITE_MATCH', 'REVIEW'):
        return 'SKIP', f'Candidate status is {status or "blank"}'
    if re.search(r'spac|blank check|special purpose acquisition|successor|reorganization|holding company', text):
        return 'REVIEW', 'Possible issuer, SPAC, holding-company, or reorganization date'
    if basis == 'operating_founding' and confidence in ('HIGH', 'MEDIUM_HIGH', 'MEDIUM'):
        if row.get('source') == 'Wikidata' and confidence != 'HIGH':
            return 'REVIEW', 'Wikidata match below HIGH confidence needs review'
        return 'PROMOTE_CANDIDATE', 'Operating founding date with usable confidence'
    if basis == 'legal_incorporation' and years is not None and years < 3:
        return 'REVIEW', 'Very short legal age may be issuer/reorg incorporation'
    if basis == 'legal_incorporation':
        return 'REVIEW', 'Legal incorporation needs operating-company review'
    return 'REVIEW', 'Needs manual basis review'


def rows_from_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def main():
    existing_rows = rows_from_csv(PUBLIC_FOUNDING_PATH) if os.path.exists(PUBLIC_FOUNDING_PATH) else []
    existing_companies = {company_key(r['company']) for r in existing_rows}
    seen = set()
    candidates = []

    for source_dir, pattern in SOURCES:
        if not os.path.isdir(source_dir):
            continue
        for name in sorted(os.listdir(source_dir)):
            if not pattern.match(name):
                continue
            for row in rows_from_csv(os.path.join(source_dir, name)):
                if not row.get('company') or company_key(row['company']) in existing_companies or not row.get('founding_date'):
                    continue
                key = f"{company_key(row['company'])}|{row['founding_date']}|{row.get('source', '')}"
                if key in seen:
                    continue
                seen.add(key)
                enriched = {**row, 'founding_date': normalize_candidate_date(row['founding_date'])}
                enriched['date_basis'] = infer_date_basis(enriched)
                time_to_exit = years_between(enriched['founding_date'], enriched.get('latest_exit_date'))
                recommendation, review_reason = recommendation_for(enriched, time_to_exit)
                candidates.append({
                    **enriched,
                    'time_to_exit_years': time_to_exit,
                    'recommendation': recommendation,
                    'review_reason': review_reason,
                    'url': enriched.get('filing_url') or enriched.get('page_url') or '',
                })

    rank = {'PROMOTE_CANDIDATE': 0, 'REVIEW': 1, 'SKIP': 2}
    candidates.sort(key=lambda r: (rank.get(r['recommendation'], 9), str(r.get('company', ''))))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(','.join(HEADERS) + '\n')
        for row in candidates:
            f.write(','.join(csv_escape(row.get(h, '')) for h in HEADERS) + '\n')

    summary = {}
    for row in candidates:
        summary[row['recommendation']] = summary.get(row['recommendation'], 0) + 1

    print(json.dumps({'output': OUT_PATH, 'rows': len(candidates), 'summary': summary}, indent=2))


if __name__ == '__main__':
    main()
