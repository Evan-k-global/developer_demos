# Zeko Developer Demos

A collection of production-minded demos for building zero-knowledge apps and agent systems on Zeko.

## What this repo includes

- End-to-end ZK app demos (frontend + backend + contract flows)
- Wallet-connected transaction flows (Auro + optional MetaMask Snap paths)
- CI checks for build health
- Practical examples of request/payment/attestation patterns for agent systems

## Prerequisites

- Node.js 20+
- npm 10+
- Git
- Auro Wallet extension
- Zeko testnet funds (faucet)

## Core docs and links

### Zeko Docs
- Zeko Docs: [https://docs.zeko.io/](https://docs.zeko.io/)
- o1js / o1Labs docs: [https://docs.o1labs.org/](https://docs.o1labs.org/)
- Mina Docs: [https://docs.minaprotocol.com/](https://docs.minaprotocol.com/)

### Wallets + testnet funds
- Auro Wallet site: [https://www.aurowallet.com/](https://www.aurowallet.com/)
- Zeko faucet: [https://faucet.zeko.io/](https://faucet.zeko.io/)  

## o1js MCP (optional)

If you use AI-assisted development for o1js, configure the o1js MCP package/server from the official source and verify it responds before coding contract changes.

Recommended docs to include:
- Official o1js MCP package link
- Install command
- Local run command
- Quick health-check command

## Auro transaction troubleshooting

- `Invalid_signature`
  - Usually key mismatch between env/deploy/account
  - Re-verify key pair and active `.env`
  - Confirm the intended fee payer key is the one signing

- `Account_nonce_precondition_unsatisfied`
  - Usually stale nonce or concurrent send
  - Refresh nonce from chain before building tx
  - Retry only after previous tx is included

- `Cannot start new transaction within another transaction`
  - Usually nested transaction context in code
  - Ensure each `Mina.transaction(...)` is isolated
  - Avoid creating a new tx inside another tx callback/path

- `Authorization kind does not match` / `expected Proof got None_given`
  - Method expects proof auth, but tx/account update is signed or unsigned incorrectly
  - Re-check contract method permissions and client tx construction path

- UI stuck on wallet signature
  - Usually tx proving/build latency
  - Add timing logs for `/api/tx` and wallet send
  - Compare local vs hosted CPU tier, and precompile where possible

- `Invalid proof`
  - Tx built against stale/mismatched contract verification key or deployment state
  - Recompile/redeploy contract and ensure server/client point to same zkApp key/network

- `ZEKO_GRAPHQL env var not set` (or other missing env vars)
  - Required server env is missing in runtime
  - Set env in local `.env` and hosting provider env panel
  - Restart service after env updates

- `Request not found` after Step 1/Step 2 flows
  - Request store not persisted or wrong instance/path
  - Verify persistent data directory setup on host
  - Ensure API calls hit same environment/service

