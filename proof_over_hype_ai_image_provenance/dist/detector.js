import { fetch } from 'undici';
function classifyHeuristic(imageUrl) {
    const lowered = imageUrl.toLowerCase();
    const aiHints = ['ai', 'generated', 'stable-diffusion', 'midjourney', 'dalle', 'sdxl'];
    const hit = aiHints.some((token) => lowered.includes(token));
    return { verdict: hit, confidence: hit ? 0.62 : 0.4, method: 'heuristic' };
}
async function detectWithSightengine(imageUrl, apiUser, apiSecret) {
    const endpoint = new URL('https://api.sightengine.com/1.0/check.json');
    endpoint.search = new URLSearchParams({
        models: 'genai',
        api_user: apiUser,
        api_secret: apiSecret,
        url: imageUrl
    }).toString();
    const res = await fetch(endpoint.toString());
    const text = await res.text();
    let json = null;
    try {
        json = JSON.parse(text);
    }
    catch {
        // ignore parse errors
    }
    const errorDetail = json?.error
        ? typeof json.error === 'string'
            ? json.error
            : JSON.stringify(json.error)
        : json?.message
            ? json.message
            : text || res.status;
    if (!res.ok || json?.status === 'failure') {
        throw new Error(`Detector error: ${errorDetail}`);
    }
    const rawScore = json?.type?.ai_generated ?? json?.type?.genai;
    let score = Number(rawScore ?? 0.5);
    if (Number.isFinite(score) && score > 1)
        score = score / 100;
    if (!Number.isFinite(score))
        score = 0.5;
    return {
        verdict: score >= 0.5,
        confidence: score,
        method: 'sightengine',
        raw: json
    };
}
export async function detectAiImage(image, imageUrl, contentType, override) {
    const provider = (override?.provider || process.env.AI_DETECTOR_PROVIDER || 'sightengine').toLowerCase();
    const apiUser = override?.apiUser || process.env.AI_DETECTOR_USER;
    const apiSecret = override?.apiSecret || process.env.AI_DETECTOR_SECRET;
    if (provider === 'sightengine') {
        if (!apiUser || !apiSecret) {
            return classifyHeuristic(imageUrl);
        }
        return detectWithSightengine(imageUrl, apiUser, apiSecret);
    }
    throw new Error(`Unsupported AI detector provider: ${provider}`);
}
