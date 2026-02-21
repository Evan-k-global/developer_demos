# OpenClaw + ACP: Get Started

This guide shows the minimal integration path for OpenClaw-style orchestrators that want to call
ACP providers.

## 1) Discover provider capabilities

```bash
curl -s http://localhost:5173/.well-known/acp-capabilities.json
```

Pick a `serviceId` and `paymentMode`.

## 2) Create request intent

```bash
curl -s -X POST http://localhost:5173/acp/intent \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "alpha-signal",
    "prompt": "Rank tickers AAPL MSFT NVDA by relative momentum.",
    "paymentMode": "pay_per_request",
    "requester": "B62q..."
  }'
```

Response includes `requestId`, `accessToken`, and payment payload metadata.

## 3) Settle payment

- `pay_per_request`: build/sign/send via existing payment route (`/api/tx`) with wallet.
- `credits`: use `/api/credits/spend-intent` + `/api/credits-spend-submit`.

## 4) Fulfill and collect normalized output

```bash
curl -s -X POST http://localhost:5173/acp/fulfill \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ_ID_HERE",
    "txHash": "PAYMENT_TX_HASH",
    "accessToken": "ACCESS_TOKEN_HERE"
  }'
```

The response is an ACP result envelope with normalized actions:

- `positive`
- `negative`
- `neutral`

## 5) Optional attestation verification

Use the included output commitment fields (`outputHash`, `attestation`) to anchor trust and
downstream scoring.
