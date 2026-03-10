---
name: zeko-relayer
description: Use this skill when building or operating relayer-backed transaction flows on Zeko, especially sponsored credits flows where the server builds, signs, or submits protocol transactions on behalf of a user.
---

# Zeko Relayer

Use this skill for sponsored transaction paths.

## Focus

- Separate user authorization from fee payment.
- Build unsigned protocol payloads server-side.
- Sign relayer transactions with `SPONSOR_PRIVATE_KEY`.
- Preserve privacy and UX by reducing repeated wallet prompts.

## Workflow

1. Create an intent or spend payload.
2. Verify the request has enough context to be relayed.
3. Build the unsigned transaction against the zkApp.
4. Sign and submit with the relayer key.
5. Return a hash and keep request state synchronized.

## Repo touchpoints

- Relayer helpers: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- zkApp methods: `/Users/evankereiakes/Documents/Codex/app1/src/zk/agentContract.ts`

## Required inputs

- `SPONSOR_PRIVATE_KEY`
- `ZKAPP_PUBLIC_KEY`
- `ZKAPP_PRIVATE_KEY`
- `ZEKO_GRAPHQL`

## Guardrails

- Never relay without explicit protocol authorization.
- Log tx timing and submission failures.
- Treat nonce drift and nested transaction mistakes as server-side bugs, not user mistakes.

## Output

Return a relayed transaction hash, an updated request status, or a submission failure with the failing contract step.
