---
name: zeko-escrow-acp
description: Use this skill when implementing Agent Coordination Protocol request lifecycles on Zeko, especially paid request flows with credits, escrow semantics, relayed execution, and request settlement.
---

# Zeko Escrow ACP

Use this skill for ACP request settlement on Zeko.

## Focus

- Create ACP request intents.
- Lock or reserve payment.
- Fulfill off-chain work.
- Publish compact on-chain or signed attestations.
- Support both `pay_per_request` and `credits`.

## Workflow

1. Discover provider capabilities from `/.well-known/acp-capabilities.json`.
2. Create an ACP intent at `/acp/intent`.
3. Choose payment mode.
4. Confirm payment or credits spend.
5. Fulfill via `/acp/fulfill`.
6. Return the ACP result envelope plus attestation metadata.

## Repo touchpoints

- ACP docs: `/Users/evankereiakes/Documents/Codex/app1/specs/acp`
- ACP endpoints: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`

## Required inputs

- provider `serviceId`
- payment mode
- requester identity or credits owner
- normalized output schema

## Guardrails

- Do not fulfill unpaid requests when demo mode is off.
- Keep public protocol state compact and deterministic.
- Keep private outputs off-chain or encrypted.

## Output

Return ACP-compatible intent, fulfill, and attestation objects that another agent runtime can consume deterministically.
