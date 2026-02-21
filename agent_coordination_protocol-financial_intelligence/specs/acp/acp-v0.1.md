# Agent Coordination Protocol (ACP) v0.1

## 1) Scope

ACP defines how requesters and providers coordinate paid agent work with four guarantees:

- Privacy-preserving execution
- On-chain payment settlement
- Tamper-evident output commitments
- Machine-readable interoperability for autonomous callers

ACP is domain-agnostic. Financial inference is one profile, not a protocol limitation.

## 2) Core lifecycle

1. `CreateIntent`
- requester submits task intent, service target, and payment mode
- provider returns request metadata + payment payloads

2. `SettlePayment`
- requester settles directly (`pay_per_request`) or through credits flow (`credits`)

3. `ExecuteOffchain`
- provider computes privately and stores encrypted output for requester retrieval

4. `AttestOutput` (recommended)
- provider anchors output commitment (and optionally source commitment) on-chain

5. `VerifyOrScore`
- third parties verify commitments and compute performance against public rubric/data

## 3) Transport and discovery

### 3.1 Capability discovery

Providers expose:

- `/.well-known/acp-capabilities.json` (or equivalent documented path)

This manifest is the primary integration surface for orchestration systems (OpenClaw, custom
agents, enterprise schedulers).

### 3.2 Canonical action vocabulary

Protocol-level action labels:

- `positive`
- `negative`
- `neutral`

Domain-specific wording is allowed in human UI, but protocol payloads should map to this set.

## 4) Minimal objects

Reference schemas:

- `schemas/input.json`
- `schemas/output.json`
- `schemas/result-envelope.json`

Required concept fields:

- `requestId`
- `serviceId`
- `outputHash`
- `status`
- `outputs[]` with `symbol` (or target key), `action`, `confidence`

## 5) Payment modes

### 5.1 Pay per request

- one on-chain payment per request
- direct user signature path
- simplest settlement, strongest per-call explicitness

### 5.2 Credits

- deposit once, spend many
- relayer can sponsor submission to reduce per-call UX and improve unlinkability
- suitable for high-frequency autonomous traffic

## 6) Attestation model

ACP does not require exposing plaintext outputs on-chain. It requires commitment integrity:

- request commitment
- output commitment
- optional source commitment (for provenance)

Attestation data should include:

- chain id
- contract address
- tx hash
- commitment hash(es)

## 7) Optional zkTLS enhancement

When services depend on external web/API data, providers may attach zkTLS-derived source
commitments:

- `sourceProofHash`
- `sourceTimestamp`
- `sourceOrigin` (optional, redacted/pseudonymous if needed)

This upgrades trust from "output was not altered" to "output was computed from verifiable source
data."

## 8) Security model (MVP assumptions)

- off-chain compute remains private
- outputs are encrypted at rest for requester retrieval
- attestation anchors are public and immutable
- authorization is service-defined (wallet signature, token, or both)

## 9) Non-financial use-case profiles

ACP is suitable for:

- compliance checks: private policy evaluation + verifiable completion
- software QA agents: private test artifacts + attested result hash
- enterprise data extraction: paid private extraction + public settlement proof
- document intelligence: off-chain parsing/classification + attested output integrity
- shared inference markets: provider competition with verifiable history

## 10) OpenClaw compatibility

OpenClaw-style agents can integrate ACP by:

- reading provider capabilities manifest
- selecting provider by cost/privacy/SLA
- following ACP lifecycle for request/payment/result/attestation

No UI coupling is required.

## 11) Mapping to current implementation

Current API routes can be mapped directly:

- `POST /api/intent` -> `CreateIntent`
- `POST /api/tx` or `POST /api/credits/spend-intent` -> `SettlePayment` prep
- `POST /api/fulfill` -> `ExecuteOffchain`
- `POST /api/output-attest-submit` -> `AttestOutput`
- `GET /api/requests/:id` -> `Result retrieval`

This preserves backward compatibility while adding a standardized ACP surface.
