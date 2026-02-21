# Zeko Developer Demos

<<<<<<< HEAD
A collection of production-minded demos for building zero-knowledge apps and agent systems on Zeko.
=======
A collection of practical demos for building zero-knowledge apps and agent systems on Zeko/Mina.
>>>>>>> 9925edf (Align root README and move Auro troubleshooting to demo docs)

## What this repo includes

- End-to-end ZK app demos (frontend + backend + contract flows)
- Wallet-connected transaction flows (Auro + optional MetaMask Snap paths)
<<<<<<< HEAD
- CI checks for build health
- Practical examples of request/payment/attestation patterns for agent systems

## Prerequisites

- Node.js 20+
- npm 10+
- Git
- Auro Wallet extension (for humans)
- Zeko testnet funds via faucet and bridge

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

For more information, refer to this repository: 
- o1js MCP server: [Usage with Claude Desktop](https://github.com/o1-labs/mcp-o1js/tree/main/packages/mcp-server-o1js#usage-with-claude-desktop)
=======
- Practical request/payment/attestation patterns for agent systems

## Featured demos

- `agent_coordination_protocol-financial_intelligence`
  - Privacy-preserving agent marketplace
  - On-chain request/payment/attestation flow
  - Credits + relayer path for better UX/privacy
  - Verifiable performance metrics and proofs feed

- `proof_over_hype_ai_image_provenance`
  - Provenance-oriented AI image workflow
  - Verifiable metadata/claims pattern for generated media

## Core docs and links

### Zeko + Mina
- Zeko Docs: https://docs.zeko.io/
- Mina Docs: https://docs.minaprotocol.com/
- o1Labs / o1js Docs: https://docs.o1labs.org/
- Mina zkApps overview: https://minaprotocol.com/zkapps

### Wallet + faucet
- Auro Wallet: https://www.aurowallet.com/
- Auro Wallet download: https://www.aurowallet.com/download/
- Zeko faucet: https://faucet.zeko.io/

### MetaMask Snap references
- MetaMask Snaps Quickstart: https://docs.metamask.io/snaps/get-started/quickstart
- Mina Portal Snap: https://snaps.metamask.io/snap/npm/mina-portal/
- Mina Snap wiki: https://github.com/sotatek-dev/mina-snap/wiki
- Mina Snap repo: https://github.com/sotatek-dev/mina-snap
- Mina + MetaMask announcement: https://minaprotocol.com/blog/metamask-snaps-integrates-mina-protocol-enabling-metamasks-millions-of-users-to-manage-mina-transactions

### MCP / AI-assisted dev
- OpenAI docs on MCP: https://platform.openai.com/docs/docs-mcp
- MCP server URL: `https://developers.openai.com/mcp`
- Codex MCP setup:
  ```bash
  codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
  codex mcp list
  ```

## Quick start (generic)

```bash
git clone <repo-url>
cd developer_demos/<demo-folder>
npm install
cp .env.example .env
npm run build
npm run dev
```

## Environment setup notes

Each demo has its own `.env.example`.

- Set required RPC/GraphQL endpoints
- Set zkApp public key(s)
- Set relayer/sponsor values if used
- Set optional market data API keys if used

Never commit private keys or secrets.
>>>>>>> 9925edf (Align root README and move Auro troubleshooting to demo docs)

## Auro transaction troubleshooting

- `Invalid_signature`
  - Usually key mismatch between env/deploy/account
  - Re-verify key pair and active `.env`
<<<<<<< HEAD
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

=======

- `Account_nonce_precondition_unsatisfied`
  - Usually stale nonce or concurrent send
  - Refresh nonce and retry after previous tx inclusion

- `Cannot start new transaction within another transaction`
  - Usually nested tx context in code
  - Ensure each `Mina.transaction(...)` runs in an isolated flow

- UI stuck on wallet signature
  - Usually tx proving/build latency
  - Add timing logs and compare local vs hosted machine tier
>>>>>>> 9925edf (Align root README and move Auro troubleshooting to demo docs)
