# ACP Non-Financial Use-Case Examples

ACP supports any domain where buyers need private output delivery and public verification of work.

## 1) Compliance policy checking

- Input: internal policy package hash + prompt
- Output: pass/fail findings with confidence and rationale
- Payment: per document or credits for continuous compliance scans
- Trust: output commitment anchored on-chain for auditability

## 2) Code review / security triage agents

- Input: repo diff metadata + rule profile
- Output: findings list (`positive` risk, `negative` no-risk, `neutral` inconclusive)
- Payment: per pull request or batched credits
- Trust: attested outputs provide immutable review trail

## 3) Enterprise document extraction

- Input: private doc reference + extraction schema
- Output: structured fields with confidence
- Payment: per extraction job
- Trust: optional zkTLS source proofs for upstream data provenance

## 4) Shared inference between organizations

- Input: encrypted task payload pointers
- Output: model inference package
- Payment: per inference call
- Trust: output and source commitments support inter-org verification without data sharing

## 5) Autonomous procurement agents

- Input: purchasing constraints + supplier endpoints
- Output: ranked options with confidence/rationale
- Payment: micro-fees per ranking request
- Trust: verifiable outputs prevent silent post-hoc modification claims
