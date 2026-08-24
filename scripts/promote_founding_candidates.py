#!/usr/bin/env python3
"""Python port of scripts/promote-founding-candidates.mjs (no Node available in this env)."""
import csv
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW_PATH = os.path.join(ROOT, 'research', 'revisit-lists', 'founding-promotion-review.csv')
PUBLIC_FOUNDING_PATH = os.path.join(ROOT, 'public', 'company_founding_dates.csv')
ALLOWED_RECOMMENDATION = 'PROMOTE_CANDIDATE'
OUTPUT_HEADERS = ['company', 'founding_date', 'date_basis', 'source', 'confidence', 'notes']


def csv_escape(value):
    text = '' if value is None else str(value)
    if re.search(r'[",\n]', text):
        return '"' + text.replace('"', '""') + '"'
    return text


def company_key(value):
    return str(value or '').strip().lower()


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


def rows_from_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def main():
    existing_rows = rows_from_csv(PUBLIC_FOUNDING_PATH)
    existing_companies = {company_key(r['company']) for r in existing_rows}
    review_rows = rows_from_csv(REVIEW_PATH)

    promoted_rows = []
    for row in review_rows:
        if row.get('recommendation') != ALLOWED_RECOMMENDATION:
            continue
        if not row.get('company') or not row.get('founding_date') or company_key(row['company']) in existing_companies:
            continue
        existing_companies.add(company_key(row['company']))
        promoted_rows.append({
            'company': row['company'],
            'founding_date': normalize_candidate_date(row['founding_date']),
            'date_basis': row.get('date_basis') or 'operating_founding',
            'source': row.get('source') or '',
            'confidence': row.get('confidence') or '',
            'notes': '; '.join(filter(None, [row.get('notes', ''), f"Source URL: {row['url']}" if row.get('url') else ''])),
        })

    output_rows = existing_rows + promoted_rows
    with open(PUBLIC_FOUNDING_PATH, 'w', encoding='utf-8') as f:
        f.write(','.join(OUTPUT_HEADERS) + '\n')
        for row in output_rows:
            f.write(','.join(csv_escape(row.get(h, '')) for h in OUTPUT_HEADERS) + '\n')

    print(json.dumps({'promoted': len(promoted_rows), 'total_live_rows': len(output_rows)}, indent=2))


if __name__ == '__main__':
    main()
