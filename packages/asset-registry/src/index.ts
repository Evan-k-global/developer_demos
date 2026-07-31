import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type {
  AssetLifecycleEvent,
  AssetLifecycleStatus,
  AssetRegistryRecord,
  TransitionAssetLifecycleRequest,
  UpsertAssetRegistryRequest
} from '@tap/shared-types';

interface AssetRegistryStore {
  assets: AssetRegistryRecord[];
  events: AssetLifecycleEvent[];
}

interface AssetRegistryRepository {
  upsert(input: UpsertAssetRegistryRequest, actorKeyId: string): Promise<AssetRegistryRecord>;
  get(tenantId: string, assetId: number): Promise<AssetRegistryRecord | null>;
  list(tenantId: string): Promise<AssetRegistryRecord[]>;
  transition(
    tenantId: string,
    assetId: number,
    input: TransitionAssetLifecycleRequest,
    actorKeyId: string
  ): Promise<{ asset: AssetRegistryRecord; event: AssetLifecycleEvent }>;
  listEvents(tenantId: string, assetId: number): Promise<AssetLifecycleEvent[]>;
  reset(): Promise<void>;
}

const allowedTransitions: Record<AssetLifecycleStatus, AssetLifecycleStatus[]> = {
  draft: ['approved', 'retired'],
  approved: ['active', 'restricted', 'retired'],
  active: ['restricted', 'suspended', 'redeemed', 'retired'],
  restricted: ['active', 'suspended', 'redeemed', 'retired'],
  suspended: ['active', 'restricted', 'redeemed', 'retired'],
  redeemed: ['retired'],
  retired: []
};

function nowIso() {
  return new Date().toISOString();
}

function dataDir() {
  return process.env.TAP_DATA_DIR || path.join(process.cwd(), 'output');
}

function storeFile() {
  return path.join(dataDir(), 'asset-registry.json');
}

function eventId() {
  return `asset_evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function assertTransition(fromStatus: AssetLifecycleStatus, toStatus: AssetLifecycleStatus) {
  if (fromStatus === toStatus) return;
  if (!allowedTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`asset_transition_not_permitted:${fromStatus}->${toStatus}`);
  }
}

async function ensureStore() {
  await fs.mkdir(dataDir(), { recursive: true });
  try {
    await fs.access(storeFile());
  } catch {
    await fs.writeFile(storeFile(), JSON.stringify({ assets: [], events: [] }, null, 2), 'utf8');
  }
}

async function readStore(): Promise<AssetRegistryStore> {
  await ensureStore();
  return JSON.parse(await fs.readFile(storeFile(), 'utf8')) as AssetRegistryStore;
}

async function writeStore(store: AssetRegistryStore) {
  await fs.writeFile(storeFile(), JSON.stringify(store, null, 2), 'utf8');
}

function lifecycleEvent(
  asset: AssetRegistryRecord,
  fromStatus: AssetLifecycleStatus | undefined,
  input: TransitionAssetLifecycleRequest,
  actorKeyId: string
): AssetLifecycleEvent {
  return {
    eventId: eventId(),
    tenantId: asset.tenantId,
    assetId: asset.assetId,
    ...(fromStatus ? { fromStatus } : {}),
    toStatus: input.status,
    reason: input.reason,
    actorKeyId,
    ...(input.policyId !== undefined ? { policyId: input.policyId } : {}),
    ...(input.policyHash ? { policyHash: input.policyHash } : {}),
    ...(input.issuerRequestId ? { issuerRequestId: input.issuerRequestId } : {}),
    createdAt: nowIso()
  };
}

class FileAssetRegistryRepository implements AssetRegistryRepository {
  async upsert(input: UpsertAssetRegistryRequest, actorKeyId: string): Promise<AssetRegistryRecord> {
    const store = await readStore();
    const index = store.assets.findIndex(
      (asset) => asset.tenantId === input.tenantId && asset.assetId === input.assetId
    );
    const updatedAt = nowIso();
    if (index >= 0) {
      const existing = store.assets[index];
      const updated: AssetRegistryRecord = {
        ...input,
        status: existing.status,
        createdAt: existing.createdAt,
        updatedAt
      };
      store.assets[index] = updated;
      await writeStore(store);
      return updated;
    }

    const asset: AssetRegistryRecord = {
      ...input,
      status: 'draft',
      createdAt: updatedAt,
      updatedAt
    };
    store.assets.unshift(asset);
    store.events.unshift(
      lifecycleEvent(asset, undefined, { status: 'draft', reason: 'asset_registry_created' }, actorKeyId)
    );
    await writeStore(store);
    return asset;
  }

  async get(tenantId: string, assetId: number): Promise<AssetRegistryRecord | null> {
    const store = await readStore();
    return store.assets.find((asset) => asset.tenantId === tenantId && asset.assetId === assetId) || null;
  }

  async list(tenantId: string): Promise<AssetRegistryRecord[]> {
    const store = await readStore();
    return store.assets.filter((asset) => asset.tenantId === tenantId);
  }

  async transition(
    tenantId: string,
    assetId: number,
    input: TransitionAssetLifecycleRequest,
    actorKeyId: string
  ): Promise<{ asset: AssetRegistryRecord; event: AssetLifecycleEvent }> {
    const store = await readStore();
    const index = store.assets.findIndex((asset) => asset.tenantId === tenantId && asset.assetId === assetId);
    if (index < 0) throw new Error('asset_not_found');
    const existing = store.assets[index];
    assertTransition(existing.status, input.status);
    const asset: AssetRegistryRecord = {
      ...existing,
      status: input.status,
      updatedAt: nowIso()
    };
    const event = lifecycleEvent(asset, existing.status, input, actorKeyId);
    store.assets[index] = asset;
    store.events.unshift(event);
    await writeStore(store);
    return { asset, event };
  }

  async listEvents(tenantId: string, assetId: number): Promise<AssetLifecycleEvent[]> {
    const store = await readStore();
    return store.events.filter((event) => event.tenantId === tenantId && event.assetId === assetId);
  }

  async reset(): Promise<void> {
    await ensureStore();
    await writeStore({ assets: [], events: [] });
  }
}

class PostgresAssetRegistryRepository implements AssetRegistryRepository {
  constructor(private readonly pool: any) {}

  private async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tap_assets (
        tenant_id TEXT NOT NULL,
        asset_id INTEGER NOT NULL,
        asset_class TEXT NOT NULL,
        symbol TEXT NOT NULL,
        display_name TEXT NOT NULL,
        issuer_id TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        identifiers JSONB NOT NULL,
        legal_document_hash TEXT,
        service_providers JSONB NOT NULL,
        metadata JSONB NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (tenant_id, asset_id)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tap_asset_lifecycle_events (
        event_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        asset_id INTEGER NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        reason TEXT NOT NULL,
        actor_key_id TEXT NOT NULL,
        policy_id INTEGER,
        policy_hash TEXT,
        issuer_request_id TEXT,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
  }

  private toAsset(row: any): AssetRegistryRecord {
    return {
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      assetClass: row.asset_class,
      symbol: row.symbol,
      displayName: row.display_name,
      issuerId: row.issuer_id,
      jurisdiction: row.jurisdiction,
      identifiers: row.identifiers || {},
      ...(row.legal_document_hash ? { legalDocumentHash: row.legal_document_hash } : {}),
      serviceProviders: row.service_providers || {},
      metadata: row.metadata || {},
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    } as AssetRegistryRecord;
  }

  private toEvent(row: any): AssetLifecycleEvent {
    return {
      eventId: row.event_id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      ...(row.from_status ? { fromStatus: row.from_status } : {}),
      toStatus: row.to_status,
      reason: row.reason,
      actorKeyId: row.actor_key_id,
      ...(row.policy_id !== null && row.policy_id !== undefined ? { policyId: row.policy_id } : {}),
      ...(row.policy_hash ? { policyHash: row.policy_hash } : {}),
      ...(row.issuer_request_id ? { issuerRequestId: row.issuer_request_id } : {}),
      createdAt: new Date(row.created_at).toISOString()
    } as AssetLifecycleEvent;
  }

  async upsert(input: UpsertAssetRegistryRequest, actorKeyId: string): Promise<AssetRegistryRecord> {
    await this.init();
    const existing = await this.get(input.tenantId, input.assetId);
    const timestamp = nowIso();
    const { rows } = await this.pool.query(
      `
        INSERT INTO tap_assets (
          tenant_id, asset_id, asset_class, symbol, display_name, issuer_id, jurisdiction,
          identifiers, legal_document_hash, service_providers, metadata, status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11::jsonb,$12,$13,$14)
        ON CONFLICT (tenant_id, asset_id) DO UPDATE SET
          asset_class = EXCLUDED.asset_class,
          symbol = EXCLUDED.symbol,
          display_name = EXCLUDED.display_name,
          issuer_id = EXCLUDED.issuer_id,
          jurisdiction = EXCLUDED.jurisdiction,
          identifiers = EXCLUDED.identifiers,
          legal_document_hash = EXCLUDED.legal_document_hash,
          service_providers = EXCLUDED.service_providers,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `,
      [
        input.tenantId,
        input.assetId,
        input.assetClass,
        input.symbol,
        input.displayName,
        input.issuerId,
        input.jurisdiction,
        JSON.stringify(input.identifiers),
        input.legalDocumentHash || null,
        JSON.stringify(input.serviceProviders),
        JSON.stringify(input.metadata),
        existing?.status || 'draft',
        existing?.createdAt || timestamp,
        timestamp
      ]
    );
    const asset = this.toAsset(rows[0]);
    if (!existing) {
      const event = lifecycleEvent(asset, undefined, { status: 'draft', reason: 'asset_registry_created' }, actorKeyId);
      await this.insertEvent(event);
    }
    return asset;
  }

  async get(tenantId: string, assetId: number): Promise<AssetRegistryRecord | null> {
    await this.init();
    const { rows } = await this.pool.query(
      `SELECT * FROM tap_assets WHERE tenant_id = $1 AND asset_id = $2`,
      [tenantId, assetId]
    );
    return rows.length > 0 ? this.toAsset(rows[0]) : null;
  }

  async list(tenantId: string): Promise<AssetRegistryRecord[]> {
    await this.init();
    const { rows } = await this.pool.query(
      `SELECT * FROM tap_assets WHERE tenant_id = $1 ORDER BY updated_at DESC`,
      [tenantId]
    );
    return rows.map((row: any) => this.toAsset(row));
  }

  private async insertEvent(event: AssetLifecycleEvent) {
    await this.pool.query(
      `
        INSERT INTO tap_asset_lifecycle_events (
          event_id, tenant_id, asset_id, from_status, to_status, reason, actor_key_id,
          policy_id, policy_hash, issuer_request_id, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        event.eventId,
        event.tenantId,
        event.assetId,
        event.fromStatus || null,
        event.toStatus,
        event.reason,
        event.actorKeyId,
        event.policyId ?? null,
        event.policyHash || null,
        event.issuerRequestId || null,
        event.createdAt
      ]
    );
  }

  async transition(
    tenantId: string,
    assetId: number,
    input: TransitionAssetLifecycleRequest,
    actorKeyId: string
  ): Promise<{ asset: AssetRegistryRecord; event: AssetLifecycleEvent }> {
    const existing = await this.get(tenantId, assetId);
    if (!existing) throw new Error('asset_not_found');
    assertTransition(existing.status, input.status);
    const timestamp = nowIso();
    const { rows } = await this.pool.query(
      `UPDATE tap_assets SET status = $3, updated_at = $4 WHERE tenant_id = $1 AND asset_id = $2 RETURNING *`,
      [tenantId, assetId, input.status, timestamp]
    );
    const asset = this.toAsset(rows[0]);
    const event = lifecycleEvent(asset, existing.status, input, actorKeyId);
    await this.insertEvent(event);
    return { asset, event };
  }

  async listEvents(tenantId: string, assetId: number): Promise<AssetLifecycleEvent[]> {
    await this.init();
    const { rows } = await this.pool.query(
      `SELECT * FROM tap_asset_lifecycle_events WHERE tenant_id = $1 AND asset_id = $2 ORDER BY created_at DESC`,
      [tenantId, assetId]
    );
    return rows.map((row: any) => this.toEvent(row));
  }

  async reset(): Promise<void> {
    await this.init();
    await this.pool.query('DELETE FROM tap_asset_lifecycle_events');
    await this.pool.query('DELETE FROM tap_assets');
  }
}

let repository: AssetRegistryRepository | null = null;

async function resolveRepository(): Promise<AssetRegistryRepository> {
  if (repository) return repository;
  const databaseUrl = process.env.TAP_DATABASE_URL;
  if (!databaseUrl) {
    repository = new FileAssetRegistryRepository();
    return repository;
  }
  try {
    const importer = new Function('m', 'return import(m)') as (moduleName: string) => Promise<any>;
    const pg = await importer('pg');
    repository = new PostgresAssetRegistryRepository(new pg.Pool({ connectionString: databaseUrl }));
    return repository;
  } catch (error) {
    throw new Error(
      `TAP_DATABASE_URL is set but Postgres driver is unavailable. Install 'pg' or unset TAP_DATABASE_URL. ${String(error)}`
    );
  }
}

export async function upsertAsset(
  input: UpsertAssetRegistryRequest,
  actorKeyId: string
): Promise<AssetRegistryRecord> {
  return (await resolveRepository()).upsert(input, actorKeyId);
}

export async function getAsset(tenantId: string, assetId: number): Promise<AssetRegistryRecord | null> {
  return (await resolveRepository()).get(tenantId, assetId);
}

export async function listAssets(tenantId: string): Promise<AssetRegistryRecord[]> {
  return (await resolveRepository()).list(tenantId);
}

export async function transitionAsset(
  tenantId: string,
  assetId: number,
  input: TransitionAssetLifecycleRequest,
  actorKeyId: string
): Promise<{ asset: AssetRegistryRecord; event: AssetLifecycleEvent }> {
  return (await resolveRepository()).transition(tenantId, assetId, input, actorKeyId);
}

export async function listAssetLifecycleEvents(
  tenantId: string,
  assetId: number
): Promise<AssetLifecycleEvent[]> {
  return (await resolveRepository()).listEvents(tenantId, assetId);
}

export async function resetAssetRegistry(): Promise<void> {
  await (await resolveRepository()).reset();
}
