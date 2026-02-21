# Auro Transaction Troubleshooting

Use this checklist for wallet transaction issues in the agent marketplace demo.

## `Invalid_signature`

- Usually key mismatch between env/deploy/account.
- Re-verify key pair and active `.env`.
- Confirm the intended fee payer key is the one signing.

## `Account_nonce_precondition_unsatisfied`

- Usually stale nonce or concurrent send.
- Refresh nonce from chain before building the transaction.
- Retry only after the previous transaction is included.

## `Cannot start new transaction within another transaction`

- Usually nested transaction context in code.
- Ensure each `Mina.transaction(...)` is isolated.
- Avoid creating a new transaction inside another transaction callback/path.

## UI stuck on wallet signature

- Usually transaction proving/build latency.
- Add timing logs for `/api/tx` and wallet send path.
- Compare local vs hosted machine tiers.

## `Authorization kind does not match` / `expected Proof got None_given`

- Method expects proof auth but transaction update was signed/unsigned incorrectly.
- Re-check contract method permissions and client transaction construction path.

## `Invalid proof`

- Transaction built against stale or mismatched contract verification key/deployment state.
- Recompile/redeploy contract and ensure server/client point to same zkApp key/network.

## `ZEKO_GRAPHQL env var not set` (or other missing env vars)

- Required server env is missing in runtime.
- Set env in local `.env` and host environment panel.
- Restart service after env updates.

## `Request not found` after Step 1/Step 2 flows

- Request store not persisted or wrong instance/path.
- Verify persistent data directory setup on host.
- Ensure API calls hit the same environment/service instance.
