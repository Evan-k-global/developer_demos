/**
 * Minimal ACP adapter for OpenClaw-style orchestrators.
 * This is intentionally dependency-light and can be embedded as a provider plugin.
 */
export type AcpPaymentMode = 'pay_per_request' | 'credits';

export interface AcpIntentResponse {
  protocol: 'acp';
  version: string;
  requestId: string;
  serviceId: string;
  paymentMode: AcpPaymentMode;
  accessToken: string;
  payment: {
    amountMina: number;
    payload: Record<string, unknown>;
  };
}

export interface AcpFulfillResponse {
  protocol: 'acp';
  version: string;
  requestId: string;
  serviceId: string | null;
  status: 'completed' | 'failed';
  outputHash: string | null;
  output: {
    outputs: Array<{
      symbol: string;
      action: 'positive' | 'negative' | 'neutral';
      confidence: number;
      rationale: string[];
    }>;
  };
}

export async function createAcpIntent(baseUrl: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/acp/intent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`ACP intent failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as AcpIntentResponse;
}

export async function fulfillAcpRequest(baseUrl: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/acp/fulfill`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`ACP fulfill failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as AcpFulfillResponse;
}
