const form = document.getElementById('analyze-form');
const urlInput = document.getElementById('url-input');
const imageList = document.getElementById('image-list');
const verdictEl = document.getElementById('verdict');
const confidenceEl = document.getElementById('confidence');
const methodEl = document.getElementById('method');
const proofEl = document.getElementById('proof');
const analyzeSelectedButton = document.getElementById('analyze-selected');
const retryButton = document.getElementById('retry-analyze');
const sendWithAuroToggle = document.getElementById('send-with-auro');
const signButton = document.getElementById('sign-proof');
const submitButton = document.getElementById('submit-zeko');
const txHashEl = document.getElementById('tx-hash');
const txStatusEl = document.getElementById('tx-status');
const chainNonceEl = document.getElementById('chain-nonce');
const checkNonceButton = document.getElementById('check-nonce');
const checkMempoolButton = document.getElementById('check-mempool');
const checkStatusButton = document.getElementById('check-status');
const skipSvgToggle = document.getElementById('skip-svg');

let lastProof = null;
let lastTxHash = null;
let lastImages = [];
let selectedImageUrl = null;
let lastAnalyzePayload = null;

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
    imageList.className = 'image-list empty';
    return;
  }

  imageList.className = 'image-list';
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

function renderProof(proof) {
  if (!proof) {
    proofEl.textContent = 'Run an analysis to see the proof JSON.';
    return;
  }
  proofEl.textContent = JSON.stringify(proof, null, 2);
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

  verdictEl.textContent = 'Fetching images...';
  confidenceEl.textContent = '';
  methodEl.textContent = '';
  signButton.disabled = true;
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
  lastAnalyzePayload = { url, imageUrl: selectedImageUrl };

  verdictEl.textContent = 'Analyzing selected image...';
  confidenceEl.textContent = '';
  methodEl.textContent = '';
  signButton.disabled = true;
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
    signButton.disabled = !window.mina || !lastProof;
    submitButton.disabled = !lastProof;
    retryButton.disabled = false;
  } catch (err) {
    verdictEl.textContent = err.message;
    verdictEl.className = 'verdict neutral';
    renderProof(null);
    lastProof = null;
    submitButton.disabled = true;
    signButton.disabled = true;
    retryButton.disabled = false;
  }
}

analyzeSelectedButton.addEventListener('click', runAnalysis);
retryButton.addEventListener('click', () => {
  if (lastAnalyzePayload) {
    runAnalysis();
  }
});

signButton.addEventListener('click', async () => {
  if (!window.mina || !lastProof) return;
  const payload = JSON.stringify(lastProof);
  try {
    await window.mina.requestAccounts();
    const signature = await window.mina.signMessage({ message: payload });
    alert(`Signed!\n\n${JSON.stringify(signature, null, 2)}`);
  } catch (err) {
    alert(err.message || 'Signing failed');
  }
});

submitButton.addEventListener('click', async () => {
  if (!lastProof) return;
  if (!lastProof.imageHash || !lastProof.oraclePublicKey || !lastProof.signature) {
    alert('Missing proof payload fields. Please re-run Analyze Selected.');
    return;
  }
  try {
    submitButton.disabled = true;
    const useAuro = Boolean(sendWithAuroToggle?.checked && window.mina);
    if (useAuro) {
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
      alert('Submitted to Zeko testnet via Auro.');
    } else {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: lastProof })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }

      const result = await response.json();
      lastTxHash = result.hash || null;
      txHashEl.textContent = lastTxHash || 'Submitted (hash not returned).';
      txStatusEl.textContent = 'Pending';
      checkStatusButton.disabled = !lastTxHash;
      alert('Submitted to Zeko testnet (server-side signer).');
    }
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
