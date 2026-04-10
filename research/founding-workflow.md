# Founding Date Workflow

## What Lives Where

- `public/company_founding_dates.csv`
  - Verified founding or incorporation dates keyed by exact company name from the dashboard dataset.
- `research/founding-date-template.csv`
  - Generated work queue of companies that still need founding-date enrichment.

## CSV Schema

`public/company_founding_dates.csv` columns:

- `company`
- `founding_date`
- `source`
- `confidence`
- `notes`

Accepted `founding_date` formats:

- `YYYY-MM-DD`
- `YYYY-MM`
- `YYYY`

The dashboard interprets partial dates conservatively using the first day of the month or year when calculating time to exit.

## Recommended Research Order

1. SEC filing or company registry incorporation date
2. Official company about / history page
3. Other primary source such as an investor relations page or prospectus
4. Secondary source only when clearly attributed
5. LinkedIn only as a fallback

## Refresh Workflow

1. Run `npm run founding:template`
2. Fill in rows in `research/founding-date-template.csv`
3. Move completed rows into `public/company_founding_dates.csv`
4. Rebuild the app

## Current Behavior In The App

- `Time to Exit (Years)` is off by default.
- Once you enter a min or max, the app filters only to deals with verified founding dates in `public/company_founding_dates.csv`.
- Coverage shown in the filter bar is based on the current non-time-filter scope.
