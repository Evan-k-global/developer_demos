---
name: zeko-agent-marketplace
description: Use this skill when building or extending the Zeko agent marketplace itself, including agent registry, request lifecycle UI, performance rollups, admin disable controls, and ACP capability publication.
---

# Zeko Agent Marketplace

Use this skill for the full marketplace application layer.

## Focus

- Maintain agent registry and public marketplace cards.
- Keep request lifecycle coherent across UI, server, and zkApp.
- Compute usage and realized performance metrics from attested outputs.
- Publish ACP capabilities and expose interoperable endpoints.
- Support unilateral disable controls for bad actors in the demo.

## Workflow

1. Register or list active agents.
2. Create intents and settlement flows.
3. Fulfill requests and publish attestations.
4. Compute leaderboard and card metrics from request history.
5. Expose ACP capability discovery.
6. Keep admin controls limited to disable-only for the demo.

## Repo touchpoints

- Browser UI: `/Users/evankereiakes/Documents/Codex/app1/public`
- Server orchestration: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- ACP docs: `/Users/evankereiakes/Documents/Codex/app1/specs/acp`

## Required inputs

- agent registry metadata
- request history
- scoring and price coverage logic
- optional admin token

## Guardrails

- Permissionless agent creation can coexist with centralized disable controls in the demo.
- UI metrics must come from backend-computed fields, not hardcoded values.
- ACP compatibility belongs in the protocol surface, not only in prose docs.

## Output

Return a marketplace that is wallet-native, privacy-preserving, and machine-readable by external orchestrators.
