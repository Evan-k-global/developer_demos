---
name: zeko-credits-ledger
description: Use this skill when implementing prepaid credits on Zeko, including deposit intents, spend intents, balance tracking, nullifier enforcement, and double-spend slashing logic.
---

# Zeko Credits Ledger

Use this skill for deposit-once, spend-many UX.

## Focus

- Track protocol credits balances off-chain with auditable state transitions.
- Gate spend intents on available balance.
- Prevent double spends with nullifiers.
- Support later on-chain confirmation and relayed execution.

## Workflow

1. Create a deposit intent and pending ledger entry.
2. Confirm the deposit from chain state or tx status.
3. Build a spend intent against a request.
4. Write a nullifier before spend submission.
5. Update the credits root and nullifier root.
6. Slash if a nullifier collision shows malicious reuse.

## Repo touchpoints

- Credits ledger and nullifier paths: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`

## Required inputs

- `ownerPublicKey`
- deposit or spend amount
- request id for spends

## Guardrails

- A spend without balance is a protocol error.
- A repeated nullifier is slashable behavior.
- Request status should track the credits flow explicitly.

## Output

Return deposit and spend payloads, updated balances, and clear ledger-side status changes.
