# Data Models

## Tenant Provider Config

Defines runtime behavior for partner data sources:
- `tenantId`, `provider`
- `allowedHosts`
- `quotaPerHour`
- `authProfiles` (`api-key`, `bearer`, `oauth2-client-credentials`)
- `mtlsProfiles` (`certEnv`, `keyEnv`, optional `caEnv`)

Credential lifecycle metadata:
- `keyVersion`, `owner`
- `lastRotatedAt`, `rotateBy`, `expiresAt`

## Policy Version

Deterministic policy records:
- `tenantId`, `policyId`, `version`
- `jurisdiction`
- `rules` (risk/compliance parameters)
- `effectiveAt`, `status`
- `policyHash`

## Asset Registry Record

Defines the legal and operational identity of an asset before issuance activity begins:

- `tenantId`, numeric `assetId`, `assetClass`, `symbol`, `displayName`, `issuerId`, `jurisdiction`
- identifiers such as ISIN, CUSIP, or customer-owned internal codes
- `legalDocumentHash` for the governing document set
- service providers: custodian, transfer agent, reserve attestor, administrator
- lifecycle status: `draft`, `approved`, `active`, `restricted`, `suspended`, `redeemed`, `retired`
- immutable lifecycle events recording the actor, transition reason, and optional policy or issuer-request linkage

Asset master state is intentionally separate from individual issuer requests. Creating or updating an asset never activates it; `ISSUER_CHECKER` or a consortium admin must advance the lifecycle explicitly.

## Proof Envelope

- `id`, `circuitId`, `mode`
- `publicInput`
- `proof`, `proofHash`
- `verifiedLocal`, `createdAt`

Required policy linkage in public input/metadata:
- `tenantId`
- `policyId`
- `policyVersion`
- `policyHash`

## Settlement Record

- `settlementId`, `status`, `anchored`
- `proofHash`, `txHash`, `eventId`
- `metadata` includes policy and workflow linkage:
  - `policySnapshotHash`
  - `policyEffectiveAt`
  - maker-checker identifiers for issuance paths

## Issuer Workflow Record

- `requestId`, `kind` (`mint`/`burn`/`issue`/`allocate`/`restrict`/`redeem`)
- `status` (`requested`, `approved`, `rejected`, `settled`)
- maker identity + checker approval payload
- payload fields vary by lifecycle step:
  - stablecoin: `recipientCommitment`, `holderCommitment`, `amountCents`
  - tokenized stock: `investorCommitment`, `holderCommitment`, `quantityUnits`, `notionalCents`, `securityId`, `issuanceType`, `restrictionCode`, `redemptionType`
