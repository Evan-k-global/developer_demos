# Bank RWA Integration Profile

The integration profile is the fastest way to turn a bank's RWA stack into a TAP pilot plan.

Instead of starting with scattered API notes, the bank team fills one JSON profile that describes:

- institution and tenant identity
- stablecoin and tokenized asset rails
- source systems for balances, KYC, reserves, holdings, and suitability
- whether each source should use adapter mode or zkTLS mode
- policy IDs and required source evidence
- lifecycle operations that require issuer approval

## Why this helps

Bank integrations usually fail slowly when requirements are implicit.

This profile makes the integration shape explicit before implementation starts:

- source ownership is clear
- required fields are clear
- auth and host allowlists are clear
- policy dependencies are clear
- first transcript targets are clear

## Example

Start from:

- [bank-rwa-integration-profile.example.json](examples/bank-rwa-integration-profile.example.json)

Validate it with:

```bash
node scripts/validate_bank_rwa_profile.mjs docs/examples/bank-rwa-integration-profile.example.json
```

Or use the package script:

```bash
pnpm validate:bank-profile
```

## Compile and apply

The profile can now compile into real TAP configuration payloads. The compiler does not store credentials: it only carries environment-variable references for API keys, OAuth client credentials, and optional mTLS material.

Compile the profile into a reviewable plan:

```bash
pnpm compile:bank-profile -- docs/examples/bank-rwa-integration-profile.example.json \
  --out output/bank-rwa-bootstrap-plan.json
```

The plan contains:

- tenant provider-config upserts, including allowed hosts and secret references
- draft asset-registry upserts for each enabled stablecoin or tokenized security
- active policy-version upserts with deterministic policy inputs
- source-collection request templates
- maker-checker role requirements and post-apply checks

Apply the provider, asset-registry, and policy configuration only after reviewing the plan:

```bash
API_BASE_URL=http://localhost:7001 \
ADMIN_API_KEY=your_admin_key \
pnpm apply:bank-profile -- docs/examples/bank-rwa-integration-profile.example.json
```

`--apply` is deliberately explicit. It never sets secret values, calls partner APIs, issues assets, activates assets, or changes issuer roles. It creates or updates draft asset master records, tenant provider configuration, and policy versions through the authenticated admin API.

For an adapter source to be applicable, its `adapter` block needs:

- `provider`: a supported TAP provider, usually `generic-rest` for a customer-owned API
- `authProfile`: a stable profile name used by source collection
- `auth`: a secret-reference definition, such as OAuth2 client credentials or an API-key environment variable
- `endpointPath`, `method`, and `extract`: a reviewable source collection template

For a policy to be applicable, it needs `version`, `effectiveAt`, and `status` in addition to its policy rules and required sources.

For an enabled asset rail to be applicable, it needs `assetId`, `symbol`, `displayName`, `issuerId`, `jurisdiction`, and `legalDocumentHash`. The registry preserves lifecycle state on later metadata updates. A checker must separately transition an asset from `draft` to `approved` and then `active`.

## Readiness output

The validator returns:

- `ok`: whether there are no blockers
- `readinessScore`: a simple 0-100 integration score
- `blockerCount`: issues that should stop pilot execution
- `warningCount`: items that should be fixed before a bank pilot
- `issues`: exact blocker list
- `warnings`: hardening list
- `integrationPlan`: normalized adapter configs, zkTLS profiles, policies, issuer workflows, and transcript targets
- `nextSteps`: recommended sequence

## Integration plan output

The `integrationPlan` is the practical handoff artifact for a bank engineering team.

It groups the profile into:

- `adapterProviderConfigs`: source APIs that should be configured through TAP adapters
- `zktlsProfiles`: HTTPS sources that should be proven through zkTLS disclosure
- `policySeedPlan`: policy IDs, purposes, jurisdictions, and required evidence sources
- `issuerWorkflowPlan`: mint, burn, issue, allocate, restrict, redeem, and transfer controls
- `transcriptTargets`: the first proof-of-control transcripts the bank should generate

This is intentionally vendor-neutral. A bank can replace the example URLs with Plaid, core banking, KYC, custody, transfer-agent, reserve, or internal ledger sandbox endpoints without changing the TAP control-plane shape.

## How to use with a bank team

1. Copy the example profile.
2. Replace sample URLs, source IDs, fields, assets, and policies with the bank's sandbox details.
3. Run the validator.
4. Resolve blockers.
5. Bootstrap provider configs and policies.
6. Generate the customer-owned dual-asset transcript.

The output should become the first implementation checklist for the bank pilot.

## Mapping to TAP

Adapter-mode sources map to:

- `packages/source-adapters`
- `scripts/bootstrap_customer_*_template.sh`
- `scripts/run_customer_*_template.sh`

zkTLS-mode sources map to:

- `packages/attestor-service`
- `external/zk-verify-poc`
- `zktls-bank` or customer-specific zkTLS profiles

Policies map to:

- `packages/policy-engine`
- settlement-time policy checks in `apps/api-gateway`

Operations map to:

- stablecoin `mint` and `burn`
- stock `issue`, `allocate`, `restrict`, and `redeem`
