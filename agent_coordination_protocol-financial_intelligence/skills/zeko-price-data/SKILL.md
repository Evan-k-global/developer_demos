---
name: zeko-price-data
description: Use this skill when fetching or evaluating market price data for agent scoring on Zeko, especially cache-first daily data mode, flatfile fallbacks, rate-limit handling, and coverage diagnostics.
---

# Zeko Price Data

Use this skill for scoring and performance calculations.

## Focus

- Prefer stable daily data over fragile live-rate paths.
- Use cache and flatfiles first.
- Fall back carefully when vendor APIs are rate-limited.
- Measure pricing coverage explicitly.

## Workflow

1. Read `PRICE_FETCH_MODE`.
2. Try local cache or flatfiles first.
3. Only hit remote vendors when necessary.
4. Normalize equity and crypto symbols before lookup.
5. Compute coverage and missing-symbol diagnostics.
6. Keep scoring logic resilient when some symbols are unpriced.

## Repo touchpoints

- Price fetch logic: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- Cached data: `/Users/evankereiakes/Documents/Codex/app1/data`

## Required inputs

- vendor keys when live mode is used
- local cache or flatfiles when daily mode is used

## Guardrails

- Rate limits are expected operational conditions, not exceptional edge cases.
- Coverage should be visible in API responses and UI metrics.
- Missing symbols should not corrupt the entire performance calculation.

## Output

Return normalized price series or a clear coverage/missing-data diagnostic for downstream scoring.
