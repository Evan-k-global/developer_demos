const form = document.getElementById('analyze-form');
const urlInput = document.getElementById('url-input');
const imageList = document.getElementById('image-list');
const verdictEl = document.getElementById('verdict');
const confidenceEl = document.getElementById('confidence');
const methodEl = document.getElementById('method');
const proofEl = document.getElementById('proof');
const analyzeSelectedButton = document.getElementById('analyze-selected');
const retryButton = document.getElementById('retry-analyze');
const submitButton = document.getElementById('submit-zeko');
const txHashEl = document.getElementById('tx-hash');
const txStatusEl = document.getElementById('tx-status');
const chainNonceEl = document.getElementById('chain-nonce');
const checkNonceButton = document.getElementById('check-nonce');
const checkMempoolButton = document.getElementById('check-mempool');
const checkStatusButton = document.getElementById('check-status');
const skipSvgToggle = document.getElementById('skip-svg');
const sightengineUser = document.getElementById('sightengine-user');
const sightengineSecret = document.getElementById('sightengine-secret');
const verifyUrlInput = document.getElementById('verify-url');
const verifyImagesButton = document.getElementById('verify-images-btn');
const verifyUrlButton = document.getElementById('verify-url-btn');
const verifyResultEl = document.getElementById('verify-result');
const verifyBadgeEl = document.getElementById('verify-badge');
const exportProofButton = document.getElementById('export-proof');
const verifyImageList = document.getElementById('verify-image-list');
const imagesPrevButton = document.getElementById('images-prev');
const imagesNextButton = document.getElementById('images-next');
const verifyPrevButton = document.getElementById('verify-prev');
const verifyNextButton = document.getElementById('verify-next');
const verifyProofJson = document.getElementById('verify-proof-json');
const verifyProofButton = document.getElementById('verify-proof-btn');
const verifyProofFile = document.getElementById('verify-proof-file');
const verifyProofFileButton = document.getElementById('verify-proof-file-btn');
const proofResultEl = document.getElementById('proof-result');
const proofBadgeEl = document.getElementById('proof-badge');
const proofPreviewEl = document.getElementById('proof-preview');
const verifyPreviewEl = document.getElementById('verify-preview');
const demoRemainingEl = document.getElementById('demo-remaining');

let lastProof = null;
let lastTxHash = null;
let lastImages = [];
let selectedImageUrl = null;
let lastAnalyzePayload = null;
let verifyImages = [];
let selectedVerifyImageUrl = null;
let captchaToken = null;
let hcaptchaSiteKey = null;

async function loadConfig() {
  try {
    const res = await fetch('/config');
    if (!res.ok) return;
    const data = await res.json();
    hcaptchaSiteKey = data.hcaptchaSiteKey;
    if (demoRemainingEl && data.demoDailyLimit) {
      demoRemainingEl.textContent = `Demo remaining: ${data.demoDailyLimit} / ${data.demoDailyLimit}`;
    }
    if (hcaptchaSiteKey) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.hcaptcha) {
          const container = document.createElement('div');
          container.style.display = 'none';
          document.body.appendChild(container);
          window.hcaptcha.render(container, {
            sitekey: hcaptchaSiteKey,
            callback: (token) => {
              captchaToken = token;
            },
            'expired-callback': () => {
              captchaToken = null;
            }
          });
        }
      };
      document.head.appendChild(script);
    }
  } catch {
    // ignore config errors
  }
}

loadByok();
loadConfig();

function loadByok() {
  if (sightengineUser) sightengineUser.value = localStorage.getItem('sightengineUser') || '';
  if (sightengineSecret) sightengineSecret.value = localStorage.getItem('sightengineSecret') || '';
}

function saveByok() {
  if (sightengineUser) localStorage.setItem('sightengineUser', sightengineUser.value.trim());
  if (sightengineSecret) localStorage.setItem('sightengineSecret', sightengineSecret.value.trim());
}

function setVerdict({ verdict, confidence, method }) {
  if (verdict === null || verdict === undefined) {
    verdictEl.textContent = 'No images detected.';
    verdictEl.className = 'verdict neutral';
    confidenceEl.textContent = '';
    methodEl.textContent = '';
    return;
  }

  verdictEl.textContent = verdict ? 'Likely AI-generated' : 'Likely not AI-generated';
  verdictEl.className = verdict ? 'verdict danger' : 'verdict success';
  confidenceEl.textContent = `Confidence: ${(confidence * 100).toFixed(1)}%`;
  methodEl.textContent = `Method: ${method}`;
}

function renderImages(images) {
  if (!images || images.length === 0) {
    imageList.textContent = 'No images yet.';
    imageList.className = 'image-list horizontal empty';
    return;
  }

  imageList.className = 'image-list horizontal';
  imageList.innerHTML = '';
  const currentSelection = selectedImageUrl && images.includes(selectedImageUrl)
    ? selectedImageUrl
    : images[0];
  images.forEach((url, index) => {
    const card = document.createElement('div');
    card.className = 'image-card';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'image-select';
    input.value = url;
    input.checked = url === currentSelection;
    input.addEventListener('change', () => {
      selectedImageUrl = url;
      updateSelection();
    });
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Extracted image';
    const caption = document.createElement('p');
    caption.textContent = url;
    card.append(input, img, caption);
    imageList.append(card);
  });
  selectedImageUrl = currentSelection;
  updateSelection();
}

function renderVerifyImages(images) {
  if (!images || images.length === 0) {
    verifyImageList.textContent = 'No images loaded.';
    verifyImageList.className = 'image-list horizontal empty';
    return;
  }
  verifyImageList.className = 'image-list horizontal';
  verifyImageList.innerHTML = '';
  const currentSelection =
    selectedVerifyImageUrl && images.includes(selectedVerifyImageUrl)
      ? selectedVerifyImageUrl
      : images[0];
  images.forEach((url) => {
    const card = document.createElement('div');
    card.className = 'image-card';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'verify-image';
    input.value = url;
    input.checked = url === currentSelection;
    input.addEventListener('change', () => {
      selectedVerifyImageUrl = url;
      updateSelectedVerifyCard();
    });
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Verify image';
    const label = document.createElement('p');
    label.textContent = url;
    card.appendChild(input);
    card.appendChild(img);
    card.appendChild(label);
    verifyImageList.appendChild(card);
  });
  selectedVerifyImageUrl = currentSelection;
  updateSelectedVerifyCard();
}

function scrollCarousel(listEl, direction) {
  if (!listEl) return;
  const amount = listEl.clientWidth * 0.8;
  listEl.scrollBy({ left: direction * amount, behavior: 'smooth' });
}

function updateSelectedVerifyCard() {
  const cards = verifyImageList.querySelectorAll('.image-card');
  cards.forEach((card) => {
    const input = card.querySelector('input');
    const selected = input && input.checked;
    card.classList.toggle('selected', Boolean(selected));
  });
}

function renderProof(proof) {
  if (!proof) {
    proofEl.textContent = 'Run an analysis to see the proof JSON.';
    if (proofPreviewEl) {
      proofPreviewEl.textContent = 'Run an analysis to see the proof JSON.';
    }
    return;
  }
  const formatted = JSON.stringify(proof, null, 2);
  proofEl.textContent = formatted;
  if (proofPreviewEl) {
    const preview = formatted.split('\n').slice(0, 4).join(' ');
    proofPreviewEl.textContent = preview;
  }
}

function renderVerifyPreview(text) {
  if (!verifyPreviewEl) return;
  const preview = text.split('\n').slice(0, 4).join(' ');
  verifyPreviewEl.textContent = preview || 'No verification yet.';
}

function updateSelection() {
  const cards = imageList.querySelectorAll('.image-card');
  cards.forEach((card) => {
    const input = card.querySelector('input');
    const selected = input && input.checked;
    card.classList.toggle('selected', Boolean(selected));
  });
  analyzeSelectedButton.disabled = !selectedImageUrl;
  retryButton.disabled = !lastAnalyzePayload;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;
  saveByok();

  verdictEl.textContent = 'Fetching images...';
  confidenceEl.textContent = '';
  methodEl.textContent = '';
  submitButton.disabled = true;
  analyzeSelectedButton.disabled = true;

  try {
    const response = await fetch('/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, skipSvg: skipSvgToggle?.checked ?? true })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();
    if (demoRemainingEl && data.demo?.remaining !== undefined) {
      const remaining = data.demo.remaining;
      const limit = data.demo.limit ?? remaining;
      demoRemainingEl.textContent = `Demo remaining: ${Math.max(remaining, 0)} / ${limit}`;
    }
    lastImages = data.images || [];
    renderImages(lastImages);
    verdictEl.textContent = 'Select an image, then analyze.';
    verdictEl.className = 'verdict neutral';
    renderProof(null);
    lastProof = null;
    lastAnalyzePayload = null;
    lastTxHash = null;
    txHashEl.textContent = 'Not submitted yet.';
    txStatusEl.textContent = '—';
    checkStatusButton.disabled = true;
    retryButton.disabled = true;
  } catch (err) {
    verdictEl.textContent = err.message;
    verdictEl.className = 'verdict neutral';
    renderImages([]);
    renderProof(null);
  }
});

async function runAnalysis() {
  const url = urlInput.value.trim();
  if (!url || !selectedImageUrl) return;
  const apiPayload = {
    provider: 'sightengine',
    apiUser: sightengineUser?.value.trim() || undefined,
    apiSecret: sightengineSecret?.value.trim() || undefined
  };
  lastAnalyzePayload = { url, imageUrl: selectedImageUrl, ...apiPayload, captchaToken };

  verdictEl.textContent = 'Analyzing selected image...';
  confidenceEl.textContent = '';
  methodEl.textContent = '';
  submitButton.disabled = true;
  lastProof = null;
  retryButton.disabled = true;

  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastAnalyzePayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();
    renderImages(data.images);
    setVerdict({ verdict: data.verdict, confidence: data.confidence, method: data.method });
    renderProof(data.zk);
    if (!data.zk?.imageHash || !data.zk?.oraclePublicKey || !data.zk?.signature) {
      throw new Error('Server did not return a complete proof payload.');
    }
    lastProof = data.zk;
    submitButton.disabled = !lastProof;
    retryButton.disabled = false;
  } catch (err) {
    verdictEl.textContent = err.message;
    verdictEl.className = 'verdict neutral';
    renderProof(null);
    lastProof = null;
    submitButton.disabled = true;
    retryButton.disabled = false;
  }
}

analyzeSelectedButton.addEventListener('click', runAnalysis);
retryButton.addEventListener('click', () => {
  if (lastAnalyzePayload) {
    runAnalysis();
  }
});

sightengineUser?.addEventListener('input', saveByok);
sightengineSecret?.addEventListener('input', saveByok);

submitButton.addEventListener('click', async () => {
  if (!lastProof) return;
  if (!lastProof.imageHash || !lastProof.oraclePublicKey || !lastProof.signature) {
    alert('Missing proof payload fields. Please re-run Analyze Selected.');
    return;
  }
  try {
    submitButton.disabled = true;
    if (!window.mina) {
      throw new Error('Auro Wallet not available.');
    }
    await window.mina.requestAccounts();
    const [publicKey] = await window.mina.getAccounts();
    const response = await fetch('/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: lastProof, feePayer: publicKey })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Transaction build failed');
    }

    const data = await response.json();
    const txPayload = data.tx;
    const fee = data.fee;
    const sent = await window.mina.sendTransaction({
      transaction: txPayload,
      feePayer: { fee }
    });
    lastTxHash = sent?.hash || null;
    txHashEl.textContent = lastTxHash || 'Submitted (hash not returned).';
    txStatusEl.textContent = 'Pending';
    checkStatusButton.disabled = !lastTxHash;
    try {
      const commitResponse = await fetch('/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: lastProof })
      });
      if (!commitResponse.ok) {
        const error = await commitResponse.json();
        txStatusEl.textContent = `Pending (commit warning: ${error.error || 'failed'})`;
      }
    } catch (err) {
      txStatusEl.textContent = `Pending (commit warning: ${err.message || 'failed'})`;
    }
    alert('Submitted to Zeko testnet via Auro.');
  } catch (err) {
    alert(err.message || 'Submission failed');
  } finally {
    submitButton.disabled = false;
  }
});

checkNonceButton.addEventListener('click', async () => {
  try {
    if (!window.mina) {
      chainNonceEl.textContent = 'Auro not available';
      return;
    }
    await window.mina.requestAccounts();
    const [publicKey] = await window.mina.getAccounts();
    const response = await fetch('/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Nonce check failed');
    }
    const data = await response.json();
    chainNonceEl.textContent = data.nonce;
  } catch (err) {
    chainNonceEl.textContent = err.message || 'Nonce check failed';
  }
});

checkMempoolButton.addEventListener('click', async () => {
  try {
    if (!window.mina) {
      alert('Auro not available');
      return;
    }
    await window.mina.requestAccounts();
    const [publicKey] = await window.mina.getAccounts();
    const response = await fetch('/mempool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Mempool check failed');
    }
    const data = await response.json();
    alert(`Pending txs: ${data.count}\nzkApp: ${data.pendingZk?.length || 0}\nUser: ${data.pendingUser?.length || 0}`);
  } catch (err) {
    alert(err.message || 'Mempool check failed');
  }
});

checkStatusButton.addEventListener('click', async () => {
  if (!lastTxHash) return;
  try {
    checkStatusButton.disabled = true;
    const response = await fetch('/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: lastTxHash })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Status check failed');
    }
    const data = await response.json();
    txStatusEl.textContent = data.status?.status || JSON.stringify(data.status);
  } catch (err) {
    txStatusEl.textContent = err.message || 'Status check failed';
  } finally {
    checkStatusButton.disabled = false;
  }
});

imagesPrevButton?.addEventListener('click', () => scrollCarousel(imageList, -1));
imagesNextButton?.addEventListener('click', () => scrollCarousel(imageList, 1));
verifyPrevButton?.addEventListener('click', () => scrollCarousel(verifyImageList, -1));
verifyNextButton?.addEventListener('click', () => scrollCarousel(verifyImageList, 1));

verifyImagesButton.addEventListener('click', async () => {
  const url = verifyUrlInput.value.trim();
  if (!url) return;
  verifyImageList.textContent = 'Loading images...';
  verifyImageList.className = 'image-list horizontal empty';
  try {
    const response = await fetch('/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load images');
    }
    const data = await response.json();
    verifyImages = data.images || [];
    selectedVerifyImageUrl = verifyImages[0] || null;
    renderVerifyImages(verifyImages);
  } catch (err) {
    verifyImageList.textContent = err.message || 'Failed to load images';
    verifyImageList.className = 'image-list horizontal empty';
  }
});

verifyUrlButton.addEventListener('click', async () => {
  const url = verifyUrlInput.value.trim();
  if (!url) return;
  verifyResultEl.textContent = 'Verifying URL...';
  renderVerifyPreview(verifyResultEl.textContent);
  verifyBadgeEl.textContent = 'Checking...';
  verifyBadgeEl.className = 'badge neutral';
  try {
    const imageUrl = selectedVerifyImageUrl || null;
    const response = await fetch('/verify-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, imageUrl })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verify failed');
    }
    const data = await response.json();
    verifyResultEl.textContent = JSON.stringify(data, null, 2);
    renderVerifyPreview(verifyResultEl.textContent);
    const isVerified = data.verified ?? data.matches;
    if (isVerified) {
      const suffix = data.anchored === false ? ' (historical)' : '';
      verifyBadgeEl.textContent = `Verified${suffix}: ${data.verdict ? 'AI-generated' : 'Not AI-generated'}`;
      verifyBadgeEl.className = 'badge verified';
      exportProofButton.disabled = false;
      exportProofButton.dataset.proof = JSON.stringify(data, null, 2);
    } else {
      verifyBadgeEl.textContent = 'Not verified';
      verifyBadgeEl.className = 'badge unverified';
      exportProofButton.disabled = true;
      exportProofButton.dataset.proof = '';
    }
  } catch (err) {
    verifyResultEl.textContent = err.message || 'Verify failed';
    renderVerifyPreview(verifyResultEl.textContent);
    verifyBadgeEl.textContent = 'Error';
    verifyBadgeEl.className = 'badge unverified';
    exportProofButton.disabled = true;
    exportProofButton.dataset.proof = '';
  }
});

async function runProofVerification(proofPayload) {
  proofResultEl.textContent = 'Verifying proof...';
  proofBadgeEl.textContent = 'Checking...';
  proofBadgeEl.className = 'badge neutral';
  try {
    const response = await fetch('/verify-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: proofPayload })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verify proof failed');
    }
    const data = await response.json();
    proofResultEl.textContent = JSON.stringify(data, null, 2);
    const isVerified = data.verified ?? data.matches;
    if (isVerified) {
      const suffix = data.anchored === false ? ' (historical)' : '';
      proofBadgeEl.textContent = `Verified${suffix}: ${data.verdict ? 'AI-generated' : 'Not AI-generated'}`;
      proofBadgeEl.className = 'badge verified';
    } else {
      proofBadgeEl.textContent = 'Not verified';
      proofBadgeEl.className = 'badge unverified';
    }
  } catch (err) {
    proofResultEl.textContent = err.message || 'Verify proof failed';
    proofBadgeEl.textContent = 'Error';
    proofBadgeEl.className = 'badge unverified';
  }
}

verifyProofButton.addEventListener('click', async () => {
  const raw = verifyProofJson.value.trim();
  if (!raw) return;
  let parsed = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // allow raw JSON string
  }
  runProofVerification(parsed);
});

verifyProofFileButton.addEventListener('click', async () => {
  const file = verifyProofFile.files?.[0];
  if (!file) return;
  const raw = await file.text();
  let parsed = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // allow raw JSON string
  }
  runProofVerification(parsed);
});

exportProofButton.addEventListener('click', () => {
  const proof = exportProofButton.dataset.proof;
  if (!proof) return;
  const blob = new Blob([proof], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'merkle-proof.json';
  a.click();
  URL.revokeObjectURL(url);
});
