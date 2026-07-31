#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateProfile } from './validate_bank_rwa_profile.mjs';

const supportedProviders = new Set([
  'mock-bank',
  'generic-rest',
  'increase',
  'plaid',
  'persona',
  'custody-holdings',
  'zktls-employer',
  'zktls-bank'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

function addUnique(items, value) {
  if (hasValue(value) && !items.includes(value)) items.push(value);
}

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hostFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function sourceProvider(source) {
  if (source.integrationMode === 'zktls') return source.zktls?.provider || 'zktls-bank';
  return source.adapter?.provider || 'generic-rest';
}

function providerConfig(provider) {
  return {
    provider,
    enabled: true,
    allowedHosts: [],
    quotaPerHour: 1000,
    mappingVersion: 'profile-v1',
    authProfiles: {},
    mtlsProfiles: {},
    failoverProviders: [],
    routingStrategy: provider === 'generic-rest' ? 'health-weighted' : 'ordered',
    routingWeight: 0
  };
}

function normalizeAuthProfile(adapter, sourceId, blockers) {
  const auth = adapter.auth;
  const profileName = adapter.authProfile;
  if (!auth) {
    blockers.push({
      code: 'auth_definition_required',
      sourceId,
      message: `${sourceId} declares authProfile ${profileName || '(missing)'} but no non-secret auth definition.`
    });
    return null;
  }
  if (!hasValue(profileName)) {
    blockers.push({
      code: 'auth_profile_name_required',
      sourceId,
      message: `${sourceId} has auth config but is missing adapter.authProfile.`
    });
    return null;
  }
  if (!isObject(auth) || !hasValue(auth.type)) {
    blockers.push({
      code: 'auth_definition_invalid',
      sourceId,
      message: `${sourceId} auth must declare a supported type.`
    });
    return null;
  }

  const lifecycle = isObject(auth.lifecycle) ? auth.lifecycle : undefined;
  if (auth.type === 'api-key' || auth.type === 'bearer') {
    if (!hasValue(auth.secretEnv)) {
      blockers.push({
        code: 'auth_secret_env_required',
        sourceId,
        message: `${sourceId} ${auth.type} auth must use secretEnv, never a raw credential.`
      });
      return null;
    }
    return {
      name: profileName,
      value: {
        type: auth.type,
        secretEnv: auth.secretEnv,
        ...(hasValue(auth.header) ? { header: auth.header } : {}),
        ...(hasValue(auth.prefix) ? { prefix: auth.prefix } : {}),
        ...(lifecycle ? { lifecycle } : {})
      }
    };
  }

  if (auth.type === 'oauth2-client-credentials') {
    if (!hasValue(auth.tokenUrl) || !hasValue(auth.clientIdEnv) || !hasValue(auth.clientSecretEnv)) {
      blockers.push({
        code: 'oauth2_fields_required',
        sourceId,
        message: `${sourceId} OAuth2 auth requires tokenUrl, clientIdEnv, and clientSecretEnv.`
      });
      return null;
    }
    return {
      name: profileName,
      value: {
        type: 'oauth2-client-credentials',
        tokenUrl: auth.tokenUrl,
        clientIdEnv: auth.clientIdEnv,
        clientSecretEnv: auth.clientSecretEnv,
        ...(hasValue(auth.mtlsProfile) ? { mtlsProfile: auth.mtlsProfile } : {}),
        ...(hasValue(auth.scope) ? { scope: auth.scope } : {}),
        ...(hasValue(auth.audience) ? { audience: auth.audience } : {}),
        ...(hasValue(auth.header) ? { header: auth.header } : {}),
        ...(hasValue(auth.prefix) ? { prefix: auth.prefix } : {}),
        ...(lifecycle ? { lifecycle } : {})
      }
    };
  }

  blockers.push({
    code: 'auth_type_unsupported',
    sourceId,
    message: `${sourceId} uses unsupported auth type ${String(auth.type)}.`
  });
  return null;
}

function normalizeMtlsProfile(adapter, sourceId, blockers) {
  const mtls = adapter.mtls;
  if (!mtls) return null;
  if (!isObject(mtls) || !hasValue(mtls.name) || !hasValue(mtls.certEnv) || !hasValue(mtls.keyEnv)) {
    blockers.push({
      code: 'mtls_definition_invalid',
      sourceId,
      message: `${sourceId} mTLS requires name, certEnv, and keyEnv.`
    });
    return null;
  }
  return {
    name: mtls.name,
    value: {
      certEnv: mtls.certEnv,
      keyEnv: mtls.keyEnv,
      ...(hasValue(mtls.caEnv) ? { caEnv: mtls.caEnv } : {}),
      ...(hasValue(mtls.passphraseEnv) ? { passphraseEnv: mtls.passphraseEnv } : {}),
      ...(hasValue(mtls.serverName) ? { serverName: mtls.serverName } : {}),
      ...(typeof mtls.rejectUnauthorized === 'boolean'
        ? { rejectUnauthorized: mtls.rejectUnauthorized }
        : {}),
      ...(isObject(mtls.lifecycle) ? { lifecycle: mtls.lifecycle } : {})
    }
  };
}

function createSourceTemplate(source, provider) {
  if (source.integrationMode === 'zktls') {
    return {
      sourceId: source.sourceId,
      provider,
      integrationMode: 'zktls',
      category: source.category,
      requiredFields: source.requiredFields,
      zktls: {
        httpsUrl: source.zktls?.httpsUrl || null,
        expectedServerName: source.zktls?.expectedServerName || null,
        disclosedFields: source.zktls?.disclosedFields || []
      }
    };
  }

  const adapter = source.adapter || {};
  return {
    sourceId: source.sourceId,
    provider,
    integrationMode: 'adapter',
    category: source.category,
    requiredFields: source.requiredFields,
    sourceRequest: {
      baseUrl: adapter.baseUrl || null,
      endpointPath: adapter.endpointPath || null,
      method: adapter.method || 'GET',
      authProfile: adapter.authProfile || null,
      mtlsProfile: adapter.mtls?.name || null,
      mappingVersion: adapter.mappingVersion || null,
      extract: adapter.extract || null
    }
  };
}

function assetBootstrapStep(profile, asset, assetClass, blockers) {
  if (!isObject(asset) || asset.enabled !== true) return null;
  const required = ['assetId', 'symbol', 'displayName', 'issuerId', 'jurisdiction', 'legalDocumentHash'];
  const missing = required.filter((field) => !hasValue(asset[field]));
  if (missing.length > 0) {
    blockers.push({
      code: 'asset_execution_fields_required',
      assetClass,
      message: `${assetClass} asset requires ${missing.join(', ')} before it can be registered.`
    });
    return null;
  }
  if (!Number.isInteger(asset.assetId)) {
    blockers.push({
      code: 'asset_id_invalid',
      assetClass,
      message: `${assetClass} assetId must be an integer.`
    });
    return null;
  }
  return {
    endpoint: '/api/v1/assets',
    body: {
      tenantId: profile.tenantId,
      assetId: asset.assetId,
      assetClass,
      symbol: asset.symbol,
      displayName: asset.displayName,
      issuerId: asset.issuerId,
      jurisdiction: asset.jurisdiction,
      identifiers: isObject(asset.identifiers) ? asset.identifiers : {},
      legalDocumentHash: asset.legalDocumentHash,
      serviceProviders: isObject(asset.serviceProviders) ? asset.serviceProviders : {},
      metadata: isObject(asset.metadata) ? asset.metadata : {}
    }
  };
}

export function compileBankRwaProfile(profile, profilePath) {
  const validation = validateProfile(profile);
  const blockers = [...validation.issues];
  const warnings = [...validation.warnings];
  const providerConfigs = new Map();
  const sourceTemplates = [];

  for (const source of profile.sources || []) {
    if (!isObject(source)) continue;
    const provider = sourceProvider(source);
    if (!supportedProviders.has(provider)) {
      blockers.push({
        code: 'provider_unsupported',
        sourceId: source.sourceId,
        message: `${source.sourceId} maps to unsupported TAP provider ${provider}.`
      });
      continue;
    }

    const config = providerConfigs.get(provider) || providerConfig(provider);
    providerConfigs.set(provider, config);
    sourceTemplates.push(createSourceTemplate(source, provider));

    if (source.integrationMode === 'adapter') {
      const adapter = isObject(source.adapter) ? source.adapter : {};
      for (const host of adapter.allowedHosts || []) addUnique(config.allowedHosts, host);
      addUnique(config.allowedHosts, hostFromUrl(adapter.baseUrl));
      config.quotaPerHour = Math.min(config.quotaPerHour, Number(adapter.quotaPerHour || 1000));
      config.routingStrategy = adapter.routingStrategy || config.routingStrategy;
      config.routingWeight = Math.max(config.routingWeight, Number(adapter.routingWeight || 0));

      const authProfile = normalizeAuthProfile(adapter, source.sourceId, blockers);
      if (authProfile) {
        const existing = config.authProfiles[authProfile.name];
        if (existing && !jsonEqual(existing, authProfile.value)) {
          blockers.push({
            code: 'auth_profile_conflict',
            sourceId: source.sourceId,
            message: `${source.sourceId} reuses auth profile ${authProfile.name} with a different definition.`
          });
        } else {
          config.authProfiles[authProfile.name] = authProfile.value;
        }
      }

      const mtlsProfile = normalizeMtlsProfile(adapter, source.sourceId, blockers);
      if (mtlsProfile) {
        const existing = config.mtlsProfiles[mtlsProfile.name];
        if (existing && !jsonEqual(existing, mtlsProfile.value)) {
          blockers.push({
            code: 'mtls_profile_conflict',
            sourceId: source.sourceId,
            message: `${source.sourceId} reuses mTLS profile ${mtlsProfile.name} with a different definition.`
          });
        } else {
          config.mtlsProfiles[mtlsProfile.name] = mtlsProfile.value;
        }
      }
    } else {
      const zktls = isObject(source.zktls) ? source.zktls : {};
      addUnique(config.allowedHosts, zktls.expectedServerName);
      addUnique(config.allowedHosts, hostFromUrl(zktls.httpsUrl));
    }
  }

  const policySteps = [];
  for (const policy of profile.policies || []) {
    if (!isObject(policy)) continue;
    if (!Number.isInteger(policy.version) || !hasValue(policy.effectiveAt) || !hasValue(policy.status)) {
      blockers.push({
        code: 'policy_execution_fields_required',
        policyId: policy.policyId,
        message: `Policy ${policy.policyId} requires version, effectiveAt, and status before it can be applied.`
      });
      continue;
    }
    policySteps.push({
      endpoint: '/api/v1/policy/upsert',
      body: {
        tenantId: profile.tenantId,
        policyId: policy.policyId,
        version: policy.version,
        jurisdiction: policy.jurisdiction,
        rules: {
          ...(isObject(policy.rules) ? policy.rules : {}),
          requiredSources: policy.requiredSources,
          purpose: policy.purpose
        },
        effectiveAt: policy.effectiveAt,
        status: policy.status
      }
    });
  }

  for (const config of providerConfigs.values()) {
    config.mappingVersion = `bank-profile-${profile.profileVersion || 'v1'}`;
    if (config.routingWeight === 0) config.routingWeight = 5;
  }

  const assetSteps = [
    assetBootstrapStep(profile, profile.assets?.stablecoin, 'stablecoin', blockers),
    assetBootstrapStep(profile, profile.assets?.tokenizedStock, 'equity', blockers)
  ].filter(Boolean);

  return {
    format: 'tap-bank-rwa-bootstrap-plan/v1',
    generatedAt: new Date().toISOString(),
    profilePath: profilePath || null,
    tenantId: profile.tenantId || null,
    institution: profile.institution?.legalName || null,
    readyToApply: blockers.length === 0,
    blockers,
    warnings,
    providerConfigSteps: [...providerConfigs.values()].map((config) => ({
      endpoint: `/api/v1/tenant/${profile.tenantId}/provider-config`,
      body: { tenantId: profile.tenantId, ...config }
    })),
    assetSteps,
    policySteps,
    sourceTemplates,
    issuerWorkflowPlan: (profile.operations || []).map((operation) => ({
      operation: operation.operation,
      policyId: operation.policyId,
      approvalRequired: operation.approvalRequired === true
    })),
    operatorRequirements: {
      bootstrapRole: 'CONSORTIUM_ADMIN',
      makerRole: 'ISSUER_MAKER',
      checkerRole: 'ISSUER_CHECKER',
      manualSetupRequired: [
        'Configure TAP_API_KEYS_JSON or the deployment-specific identity provider with tenant-scoped issuer roles.',
        'Set only the secret environment-variable names referenced by authProfiles and mtlsProfiles.',
        'Review source request templates before the first source collection.'
      ]
    },
    postApplyChecks: [
      'Fetch each tenant provider config and confirm allowed hosts and auth profile names.',
      'Review each draft asset record, then have an issuer checker transition it to approved and active when legal and operational controls are complete.',
      'Resolve each active policy and record its policy hash in the pilot evidence pack.',
      'Run one source collection per required source before issuing or allocating an asset.',
      'Run the dual-asset transcript with maker-checker approval enabled.'
    ]
  };
}

function parseArgs(argv) {
  const options = {
    profilePath: null,
    outputPath: null,
    apply: false,
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:7001'
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--apply') options.apply = true;
    else if (arg === '--out') options.outputPath = argv[++index] || null;
    else if (arg === '--api-base-url') options.apiBaseUrl = argv[++index] || options.apiBaseUrl;
    else if (!arg.startsWith('--') && !options.profilePath) options.profilePath = arg;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.profilePath) {
    throw new Error('usage: node scripts/compile_bank_rwa_profile.mjs <profile.json> [--out plan.json] [--apply] [--api-base-url URL]');
  }
  return options;
}

async function requestJson(url, body, adminApiKey) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body
      ? { authorization: `Bearer ${adminApiKey}`, 'content-type': 'application/json' }
      : { authorization: `Bearer ${adminApiKey}` },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`request failed ${response.status}: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

async function applyPlan(plan, apiBaseUrl) {
  if (!plan.readyToApply) {
    throw new Error('plan is not ready to apply; resolve plan.blockers first');
  }
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) throw new Error('ADMIN_API_KEY is required with --apply');
  const baseUrl = apiBaseUrl.replace(/\/+$/, '');
  await requestJson(`${baseUrl}/api/v1/health`, null, adminApiKey);

  const appliedProviders = [];
  for (const step of plan.providerConfigSteps) {
    const response = await requestJson(`${baseUrl}${step.endpoint}`, step.body, adminApiKey);
    appliedProviders.push(response.provider);
  }
  const appliedAssets = [];
  for (const step of plan.assetSteps) {
    const response = await requestJson(`${baseUrl}${step.endpoint}`, step.body, adminApiKey);
    appliedAssets.push({ assetId: response.assetId, symbol: response.symbol, status: response.status });
  }
  const appliedPolicies = [];
  for (const step of plan.policySteps) {
    const response = await requestJson(`${baseUrl}${step.endpoint}`, step.body, adminApiKey);
    appliedPolicies.push({ policyId: response.policyId, version: response.version, policyHash: response.policyHash });
  }
  return { apiBaseUrl: baseUrl, providers: appliedProviders, assets: appliedAssets, policies: appliedPolicies };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const resolvedProfilePath = path.resolve(process.cwd(), options.profilePath);
  const profile = JSON.parse(fs.readFileSync(resolvedProfilePath, 'utf8'));
  const plan = compileBankRwaProfile(profile, resolvedProfilePath);

  if (options.outputPath) {
    const resolvedOutputPath = path.resolve(process.cwd(), options.outputPath);
    fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  }

  if (options.apply) {
    const result = await applyPlan(plan, options.apiBaseUrl);
    process.stdout.write(`${JSON.stringify({ plan, applied: result }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  if (!plan.readyToApply) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
