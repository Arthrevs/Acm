const API_URL = '/api/scan';
const API_URL_IMAGE = '/api/scan-image';

// Elements
const smsInput = document.getElementById('smsInput');
const charCount = document.getElementById('charCount');
const btnScan = document.getElementById('btnScan');
const scanButtonText = document.getElementById('scanButtonText');
const btnClear = document.getElementById('btnClear');
const presetButtons = document.querySelectorAll('.btn-preset');

// Image Elements
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const uploadZoneContent = document.getElementById('uploadZoneContent');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const btnRemoveImage = document.getElementById('btnRemoveImage');

// Result Elements
const resultsEmptyState = document.getElementById('resultsEmptyState');
const resultsLoadingState = document.getElementById('resultsLoadingState');
const resultsContent = document.getElementById('resultsContent');
const steps = [
  document.getElementById('step1'),
  document.getElementById('step2'),
  document.getElementById('step3'),
  document.getElementById('step4')
];

let uploadedImageBase64 = null;
let uploadedImageMimeType = null;

// Character count
smsInput.addEventListener('input', () => {
  charCount.textContent = `${smsInput.value.length} characters`;
});

// Presets
presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    smsInput.value = btn.dataset.msg;
    charCount.textContent = `${smsInput.value.length} characters`;
    removeUploadedImage();
  });
});

// Clear
btnClear.addEventListener('click', () => {
  smsInput.value = '';
  charCount.textContent = '0 characters';
  removeUploadedImage();
  resultsEmptyState.style.display = 'flex';
  resultsLoadingState.style.display = 'none';
  resultsContent.style.display = 'none';
});

// Image Upload Logic
uploadZone.addEventListener('click', (e) => {
  if (e.target !== btnRemoveImage && !btnRemoveImage.contains(e.target)) {
    imageInput.click();
  }
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

imageInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (PNG, JPEG).');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    uploadedImageBase64 = dataUrl.split(',')[1];
    uploadedImageMimeType = file.type;

    previewImg.src = dataUrl;
    uploadPreview.style.display = 'flex';
    uploadZoneContent.style.display = 'none';
    smsInput.value = ''; // Clear text if image is uploaded
    charCount.textContent = '0 characters';
  };
  reader.readAsDataURL(file);
}

btnRemoveImage.addEventListener('click', (e) => {
  e.stopPropagation();
  removeUploadedImage();
});

function removeUploadedImage() {
  uploadedImageBase64 = null;
  uploadedImageMimeType = null;
  previewImg.src = '';
  uploadPreview.style.display = 'none';
  uploadZoneContent.style.display = 'flex';
  imageInput.value = '';
}

// Scan Logic
btnScan.addEventListener('click', async () => {
  const textMsg = smsInput.value.trim();
  
  if (!textMsg && !uploadedImageBase64) {
    alert("Please enter some text or upload a screenshot.");
    return;
  }

  btnScan.disabled = true;
  scanButtonText.textContent = 'Scanning...';
  
  resultsEmptyState.style.display = 'none';
  resultsContent.style.display = 'none';
  resultsLoadingState.style.display = 'flex';
  
  resetSteps();

  try {
    let url = API_URL;
    let body = JSON.stringify({ message: textMsg });

    if (uploadedImageBase64) {
      url = API_URL_IMAGE;
      body = JSON.stringify({
        image_base64: uploadedImageBase64,
        mime_type: uploadedImageMimeType
      });
    }

    // Simulate pipeline steps animation
    setTimeout(() => { steps[0].classList.add('done'); steps[1].classList.add('active'); }, 500);
    setTimeout(() => { steps[1].classList.add('done'); steps[2].classList.add('active'); }, 1200);
    setTimeout(() => { steps[2].classList.add('done'); steps[3].classList.add('active'); }, 2500);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    
    // Mark all done
    steps.forEach(s => {
      s.classList.remove('active');
      s.classList.add('done');
    });

    setTimeout(() => {
      resultsLoadingState.style.display = 'none';
      renderResults(data);
    }, 400);

  } catch (err) {
    resultsLoadingState.style.display = 'none';
    resultsContent.style.display = 'block';
    
    // Render Error cleanly
    document.getElementById('verdictLabel').textContent = 'ERROR';
    document.getElementById('verdictCategory').textContent = 'System Failure';
    document.getElementById('riskValue').textContent = 'N/A';
    document.getElementById('riskFill').style.width = '0%';
    document.getElementById('verdictBanner').className = 'verdict-banner scam';
    
    document.getElementById('normalizedText').innerHTML = `<span style="color:var(--accent-red)">${err.message}</span>`;
    
  } finally {
    btnScan.disabled = false;
    scanButtonText.textContent = 'Scan Message';
  }
});

function resetSteps() {
  steps.forEach((s, idx) => {
    s.classList.remove('active', 'done');
    if (idx === 0) s.classList.add('active');
  });
}

function renderResults(data) {
  resultsContent.style.display = 'flex';

  const c = data.classification;
  const verdict = (c.verdict || 'SAFE').toUpperCase();
  const score = c.risk_score || 0;
  
  // Banner
  const verdictBanner = document.getElementById('verdictBanner');
  verdictBanner.className = 'verdict-banner';
  if (verdict === 'SCAM') verdictBanner.classList.add('scam');
  else if (verdict === 'SUSPICIOUS') verdictBanner.classList.add('suspicious');
  else verdictBanner.classList.add('safe');

  document.getElementById('verdictLabel').textContent = verdict;
  document.getElementById('verdictCategory').textContent = c.threat_category || 'None';
  document.getElementById('riskValue').textContent = score;
  
  // Animate risk bar
  const riskFill = document.getElementById('riskFill');
  riskFill.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      riskFill.style.width = `${score}%`;
    });
  });

  // OCR Text Box
  const extractedTextBox = document.getElementById('extractedTextBox');
  const extractedTextContent = document.getElementById('extractedTextContent');
  if (data.extracted_text) {
    extractedTextContent.textContent = data.extracted_text;
    extractedTextBox.style.display = 'flex';
    extractedTextBox.style.flexDirection = 'column';
  } else {
    extractedTextBox.style.display = 'none';
  }

  // Normalized Text
  document.getElementById('normalizedText').textContent = data.normalized_message || '';

  // Entities
  const entitiesList = document.getElementById('entitiesList');
  entitiesList.innerHTML = '';
  const entities = data.extracted_entities || { urls: [], phones: [] };
  if (entities.urls.length === 0 && entities.phones.length === 0) {
    entitiesList.innerHTML = '<span class="no-entities">No entities detected</span>';
  } else {
    if (entities.urls.length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label">URLs</div>${entities.urls.map(u => `<span class="entity-item">${u}</span>`).join('')}</div>`;
    }
    if (entities.phones.length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label">Phones</div>${entities.phones.map(p => `<span class="entity-item">${p}</span>`).join('')}</div>`;
    }
  }

  // Spans
  const spansList = document.getElementById('spansList');
  spansList.innerHTML = '';
  const spans = c.highlighted_spans || [];
  if (spans.length === 0) {
    spansList.innerHTML = '<span class="no-entities">No threat spans detected</span>';
  } else {
    spans.forEach(s => {
      spansList.innerHTML += `
        <div class="span-item">
          <span class="span-text">"${s.text}"</span>
          <span class="span-reason">${s.reason}</span>
        </div>
      `;
    });
  }


  
  // Re-render lucide icons for dynamic content
  lucide.createIcons();
}
