---
name: zeko-storage-hardening
description: Use this skill when operating mutable JSON-backed protocol state on Render or similar hosting, including atomic writes, sidecar payload storage, temp and backup pruning, ENOSPC recovery, and persistent disk hygiene.
---

# Zeko Storage Hardening

Use this skill for persistent state under disk pressure.

## Focus

- Keep hot metadata files small.
- Move bulky payloads into sidecar files.
- Use atomic writes with temp files.
- Prune stale temp and backup files automatically.
- Recover once internally from `ENOSPC` before surfacing a failure.

## Workflow

1. Keep request metadata and bulky payloads in separate files.
2. Write through temp files and rename atomically.
3. Limit backup creation for large hot files.
4. Prune stale `*.tmp.*` and `*.bak.*` files.
5. Retry once after emergency prune on `ENOSPC`.
6. Verify persistent disk mount and `DATA_DIR`.

## Repo touchpoints

- Storage layer: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`

## Required inputs

- `DATA_DIR`
- persistent disk on the host
- retention settings such as `DATA_BACKUP_KEEP_COUNT`

## Guardrails

- Never let a large mutable index grow by accumulating full payload blobs.
- Do not rely on startup-only cleanup.
- Treat disk saturation as an expected operational failure mode.

## Output

Return compact on-disk state, predictable cleanup behavior, and a write path that survives moderate disk pressure.
