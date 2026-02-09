import crypto from 'node:crypto';
import { fetch } from 'undici';
function classifyHeuristic(imageUrl) {
    const lowered = imageUrl.toLowerCase();
    const aiHints = ['ai', 'generated', 'stable-diffusion', 'midjourney', 'dalle', 'sdxl'];
    const hit = aiHints.some((token) => lowered.includes(token));
    return { verdict: hit, confidence: hit ? 0.62 : 0.4, method: 'heuristic' };
}
async function detectWithDetectAiImage(image, apiKey, contentType) {
    const FormDataCtor = globalThis.FormData;
    const BlobCtor = globalThis.Blob;
    if (!FormDataCtor || !BlobCtor) {
        throw new Error('FormData/Blob not available. Please use Node 18+.');
    }
    const form = new FormDataCtor();
    const blob = new BlobCtor([image], { type: contentType || 'image/jpeg' });
    const ext = (contentType || 'image/jpeg').split('/')[1] || 'jpg';
    form.append('file', blob, `image-${crypto.randomUUID()}.${ext}`);
    const res = await fetch('https://api.detectaiimage.com/detect', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body: form
    });
    const text = await res.text();
    console.log('[detect] detector status:', res.status);
    console.log('[detect] detector body:', text.slice(0, 500));
    let json = null;
    try {
        json = JSON.parse(text);
    }
    catch {
        // ignore parse errors, show raw text
    }
    if (!res.ok) {
        const detail = json?.error || json?.message || text || res.status;
        throw new Error(`Detector error: ${detail}`);
    }
    const verdict = Boolean(json?.is_ai ?? json?.ai_generated);
    const confidence = Number(json?.confidence ?? json?.score ?? 0.5);
    return {
        verdict,
        confidence: Number.isFinite(confidence) ? confidence : 0.5,
        method: 'detectaiimage',
        raw: json
    };
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
    if (!res.ok) {
        const detail = json?.error || json?.message || text || res.status;
        throw new Error(`Detector error: ${detail}`);
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
export async function detectAiImage(image, imageUrl, contentType) {
    const provider = (process.env.AI_DETECTOR_PROVIDER || 'sightengine').toLowerCase();
    const apiKey = process.env.AI_DETECTOR_KEY;
    const apiUser = process.env.AI_DETECTOR_USER;
    const apiSecret = process.env.AI_DETECTOR_SECRET;
    if (provider === 'sightengine') {
        if (!apiUser || !apiSecret) {
            return classifyHeuristic(imageUrl);
        }
        return detectWithSightengine(imageUrl, apiUser, apiSecret);
    }
    if (!apiKey) {
        return classifyHeuristic(imageUrl);
    }
    if (provider === 'detectaiimage') {
        return detectWithDetectAiImage(image, apiKey, contentType);
    }
    throw new Error(`Unsupported AI detector provider: ${provider}`);
}
