import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

process.env.TAP_DATA_DIR = path.join(os.tmpdir(), `tap-asset-registry-test-${crypto.randomUUID()}`);

const registry = await import('./index.js');

const assetInput = {
  tenantId: 'tenant-a',
  assetId: 1,
  assetClass: 'stablecoin' as const,
  symbol: 'TESTUSD',
  displayName: 'Test Dollar',
  issuerId: 'issuer-test',
  jurisdiction: 'US',
  identifiers: { internalAssetCode: 'TESTUSD-1' },
  legalDocumentHash: 'sha256:test-document-set',
  serviceProviders: { reserveAttestorId: 'test-reserve-attestor' },
  metadata: { reserveModel: 'fiat-backed' }
};

test('asset registry enforces governed lifecycle and supports reset', async () => {
  await registry.resetAssetRegistry();
  const created = await registry.upsertAsset(assetInput, 'admin_key');
  assert.equal(created.status, 'draft');

  await assert.rejects(
    registry.transitionAsset('tenant-a', 1, { status: 'active', reason: 'invalid shortcut' }, 'checker_key'),
    /asset_transition_not_permitted:draft->active/
  );

  const approved = await registry.transitionAsset(
    'tenant-a',
    1,
    { status: 'approved', reason: 'offering documents approved' },
    'checker_key'
  );
  assert.equal(approved.asset.status, 'approved');

  const active = await registry.transitionAsset(
    'tenant-a',
    1,
    { status: 'active', reason: 'asset activated', policyId: 1, policyHash: 'policy_hash_1' },
    'checker_key'
  );
  assert.equal(active.asset.status, 'active');

  const events = await registry.listAssetLifecycleEvents('tenant-a', 1);
  assert.equal(events.length, 3);
  assert.equal(events[0].toStatus, 'active');

  await registry.resetAssetRegistry();
  assert.equal(await registry.getAsset('tenant-a', 1), null);
});
