#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
SERVICE_ID="${2:-alpha-signal}"
REQUESTER="${3:-B62qExampleRequesterPublicKey}"

echo "== ACP capabilities =="
curl -s "${BASE_URL}/.well-known/acp-capabilities.json" | python3 -m json.tool | head -n 60

echo
echo "== ACP intent =="
INTENT_JSON="$(curl -s -X POST "${BASE_URL}/acp/intent" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceId\":\"${SERVICE_ID}\",
    \"prompt\":\"Rank AAPL MSFT NVDA using public data\",
    \"paymentMode\":\"pay_per_request\",
    \"requester\":\"${REQUESTER}\"
  }")"
echo "${INTENT_JSON}" | python3 -m json.tool

REQUEST_ID="$(echo "${INTENT_JSON}" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("requestId",""))')"
ACCESS_TOKEN="$(echo "${INTENT_JSON}" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("accessToken",""))')"

if [[ -z "${REQUEST_ID}" ]]; then
  echo "No requestId returned; stopping."
  exit 1
fi

echo
echo "== ACP fulfill (demo mode expected unless payment txHash provided) =="
curl -s -X POST "${BASE_URL}/acp/fulfill" \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\":\"${REQUEST_ID}\",
    \"txHash\":\"mock\",
    \"accessToken\":\"${ACCESS_TOKEN}\"
  }" | python3 -m json.tool
