---
name: zeko-model-adapter
description: Use this skill when integrating an external model or agent endpoint into the marketplace, including pricing quotes, auth headers, request normalization, output validation, and deterministic response shaping.
---

# Zeko Model Adapter

Use this skill for external model integration.

## Focus

- Normalize requests sent to external models.
- Support optional price quoting before fulfillment.
- Validate response shape before it enters attestations or UI state.
- Convert model-specific labels into protocol labels.

## Workflow

1. Accept a provider endpoint and optional bearer auth.
2. Send a `price` mode request when dynamic pricing is enabled.
3. Send the fulfillment request with request id, prompt, and hashes.
4. Validate the response schema.
5. Normalize actions into protocol vocabulary.
6. Fall back to simulated behavior only when intended.

## Repo touchpoints

- External model call path: `/Users/evankereiakes/Documents/Codex/app1/src/server.ts`
- ACP output schema: `/Users/evankereiakes/Documents/Codex/app1/specs/acp/schemas/output.json`

## Required inputs

- provider endpoint
- provider auth, if required
- normalized request payload

## Guardrails

- Reject malformed responses early.
- Keep action vocabulary stable.
- Separate provider failures from protocol failures in error messages.

## Output

Return a validated, normalized model output and an optional price quote that the protocol can consume safely.
