---
name: zeko-attestations
description: Use this skill when hashing agent requests or outputs, signing attestations with an oracle key, committing Merkle leaves, or returning verifiable proof envelopes for public consumption.
---

# Zeko Attestations

Use this skill for request and output integrity proofs.

## Focus

- Hash request and output payloads deterministically.
- Sign protocol state transitions with `ORACLE_PRIVATE_KEY`.
- Commit leaves into protocol Merkle roots.
- Return proof envelopes that can be checked independently of the private output.

## Workflow

1. Normalize the request or output object.
2. Hash the normalized value.
3. Compute the appropriate leaf.
4. Commit the leaf and capture the new root.
5. Sign the root transition.
6. Return the proof envelope and any public summary fields.

## Repo touchpoints

- Merkle helpers and proof generation: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- zkApp contract checks: `/Users/evankereiakes/Documents/Codex/app1/src/zk/agentContract.ts`

## Required inputs

- `ORACLE_PRIVATE_KEY`
- stable serialization
- current Merkle state

## Guardrails

- Never sign unnormalized payloads.
- Keep public proof payloads compact.
- Store large proof details outside the hot request index when possible.

## Output

Return request hash, output hash, oracle public key, root, index, and any witness data required by the client flow.
