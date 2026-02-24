import 'dotenv/config';
import { fetch } from 'undici';
import { Mina, PrivateKey } from 'o1js';
const apiBase = process.env.MARKETPLACE_API || 'http://localhost:5173';
async function post(path, body) {
    const res = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({})));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return (await res.json());
}
async function get(path) {
    const res = await fetch(`${apiBase}${path}`);
    if (!res.ok)
        throw new Error(`Request failed: ${res.status}`);
    return (await res.json());
}
function usage() {
    console.log(`Usage:
  node dist/scripts/agent-cli.js register --name "Agent" --tagline "edge" --price 0.1 --desc "..." --treasury B62q... --endpoint https://... --auth token
  node dist/scripts/agent-cli.js request --agent alpha-signal --prompt "AAPL momentum"
  node dist/scripts/agent-cli.js attest --request <requestId>
  node dist/scripts/agent-cli.js leaderboard
  node dist/scripts/agent-cli.js proofs

Env:
  MARKETPLACE_API=http://localhost:5173
  AGENT_PRIVATE_KEY (local signing key)
`);
}
function parseArgs() {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const map = {};
    for (let i = 1; i < args.length; i += 2) {
        const key = args[i];
        const val = args[i + 1];
        if (!key || !val)
            break;
        map[key.replace(/^--/, '')] = val;
    }
    return { cmd, map };
}
async function signAndSendTx(txJson) {
    const priv = process.env.AGENT_PRIVATE_KEY;
    if (!priv)
        throw new Error('AGENT_PRIVATE_KEY not set');
    const feePayer = PrivateKey.fromBase58(priv);
    const tx = Mina.Transaction.fromJSON(txJson);
    await tx.sign([feePayer]);
    const sent = await tx.send();
    const hash = sent?.hash?.toString?.() ??
        sent?.hash ??
        sent?.transactionHash ??
        null;
    return hash;
}
async function main() {
    const { cmd, map } = parseArgs();
    if (!cmd) {
        usage();
        return;
    }
    if (cmd === 'register') {
        const name = map.name;
        const tagline = map.tagline;
        const price = map.price ? Number(map.price) : 0.1;
        const desc = map.desc || '';
        if (!name || !tagline)
            throw new Error('Missing --name or --tagline');
        const priv = process.env.AGENT_PRIVATE_KEY;
        if (!priv)
            throw new Error('AGENT_PRIVATE_KEY not set');
        const ownerPublicKey = PrivateKey.fromBase58(priv).toPublicKey().toBase58();
        const intent = await post('/api/agent-intent', {
            name,
            tagline,
            priceMina: price,
            description: desc,
            ownerPublicKey,
            treasuryPublicKey: map.treasury || ownerPublicKey,
            modelEndpoint: map.endpoint || null,
            modelAuth: map.auth || null
        });
        const txData = await post('/api/agent-stake-tx', {
            payload: intent.payload,
            feePayer: ownerPublicKey
        });
        const hash = await signAndSendTx(txData.tx);
        console.log('Stake submitted:', hash || 'submitted');
        return;
    }
    if (cmd === 'request') {
        const agent = map.agent;
        const prompt = map.prompt;
        if (!agent || !prompt)
            throw new Error('Missing --agent or --prompt');
        const priv = process.env.AGENT_PRIVATE_KEY;
        if (!priv)
            throw new Error('AGENT_PRIVATE_KEY not set');
        const requesterPublicKey = PrivateKey.fromBase58(priv).toPublicKey().toBase58();
        const intent = await post('/api/intent', { agentId: agent, prompt, requester: requesterPublicKey });
        const txData = await post('/api/tx', { payload: intent.payload, feePayer: requesterPublicKey });
        const hash = await signAndSendTx(txData.tx);
        console.log('Request tx submitted:', hash || 'submitted');
        const fulfilled = await post('/api/fulfill', {
            requestId: intent.requestId,
            txHash: hash || 'submitted'
        });
        console.log('Output:', fulfilled.output);
        return;
    }
    if (cmd === 'attest') {
        const requestId = map.request;
        if (!requestId)
            throw new Error('Missing --request');
        const priv = process.env.AGENT_PRIVATE_KEY;
        if (!priv)
            throw new Error('AGENT_PRIVATE_KEY not set');
        const feePayer = PrivateKey.fromBase58(priv).toPublicKey().toBase58();
        const req = await get(`/api/requests/${requestId}`);
        if (!req.outputProof)
            throw new Error('No output proof available');
        const txData = await post('/api/output-tx', { payload: req.outputProof, feePayer });
        const hash = await signAndSendTx(txData.tx);
        console.log('Output attestation submitted:', hash || 'submitted');
        return;
    }
    if (cmd === 'leaderboard') {
        const data = await get('/api/leaderboard');
        console.log(JSON.stringify(data, null, 2));
        return;
    }
    if (cmd === 'proofs') {
        const data = await get('/api/proofs');
        console.log(JSON.stringify(data, null, 2));
        return;
    }
    usage();
}
main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
