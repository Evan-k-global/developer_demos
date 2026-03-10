---
name: zeko-private-output
description: Use this skill when returning private agent results on Zeko, including output encryption, requester-only reveal flows, sidecar payload storage, and public proof plus private content separation.
---

# Zeko Private Output

Use this skill for private result delivery.

## Focus

- Keep prompts and outputs off-chain.
- Encrypt the full result payload.
- Publish only hashes, summaries, and compact proof metadata publicly.
- Reveal the full output only to the authorized requester.

## Workflow

1. Normalize the model output.
2. Build a compact public summary.
3. Encrypt the full output payload.
4. Store encrypted payload material outside the hot request index.
5. Return public proof metadata.
6. Reveal only after token or signature authorization.

## Repo touchpoints

- Encryption and reveal paths: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- Request endpoints: `/Users/evankereiakes/Documents/Codex/app1/public/app.js`

## Required inputs

- output encryption key
- request access token or requester signature
- compact public summary schema

## Guardrails

- Public API responses must not leak the private output by default.
- Sidecar storage is preferred over large inline request records.
- Decryption failures should not corrupt request metadata.

## Output

Return a public record plus a private reveal path that only the authorized requester can use.
