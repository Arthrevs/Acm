const API_URL = '/api/scan';
const API_URL_IMAGE = '/api/scan-image';

/**
 * Highlights threat spans inline within the message text.
 * Matches span.text (case-insensitive) and wraps it in a <mark> with a tooltip.
 */
function highlightSpans(message, spans) {
  if (!spans || spans.length === 0) return escapeHtml(message);

  // Build a list of { start, end, reason } by finding each span.text in the message
  const regions = [];
  for (const span of spans) {
    if (!span.text) continue;
    const idx = message.toLowerCase().indexOf(span.text.toLowerCase());
    if (idx !== -1) {
      regions.push({ start: idx, end: idx + span.text.length, reason: span.reason || '' });
    }
  }

  // Sort by start position, remove overlaps (keep earliest)
  regions.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of regions) {
    if (merged.length === 0 || r.start >= merged[merged.length - 1].end) {
      merged.push(r);
    }
  }

  // Build the HTML string
  let html = '';
  let cursor = 0;
  for (const r of merged) {
    html += escapeHtml(message.slice(cursor, r.start));
    const highlightedText = escapeHtml(message.slice(r.start, r.end));
    html += `<mark class="threat-highlight" title="${escapeHtml(r.reason)}">${highlightedText}</mark>`;
    cursor = r.end;
  }
  html += escapeHtml(message.slice(cursor));
  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Permanent Dark Mode Enforcement
document.documentElement.setAttribute('data-theme', 'dark');
document.body.setAttribute('data-theme', 'dark');

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
  resultsEmptyState.classList.remove('hidden');
  resultsLoadingState.classList.add('hidden');
  resultsContent.classList.add('hidden');
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
    uploadPreview.classList.remove('hidden');
    uploadZoneContent.classList.add('hidden');
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
  uploadPreview.classList.add('hidden');
  uploadZoneContent.classList.remove('hidden');
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
  
  resultsEmptyState.classList.add('hidden');
  resultsContent.classList.add('hidden');
  resultsLoadingState.classList.remove('hidden');
  
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

    // Step 1: UI Delay
    await new Promise(r => setTimeout(r, 400));
    steps[0].classList.add('done'); steps[1].classList.add('active');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    
    // Step 2 & 3: UI Delay for agent consensus
    if (data.pipeline?.layer3_consensus?.invoked) {
      await new Promise(r => setTimeout(r, 800));
      steps[1].classList.add('done'); steps[2].classList.add('active');
      await new Promise(r => setTimeout(r, 1200));
      steps[2].classList.add('done'); steps[3].classList.add('active');
      await new Promise(r => setTimeout(r, 400));
    }

    // Mark all done
    steps.forEach(s => {
      s.classList.remove('active');
      s.classList.add('done');
    });

    resultsLoadingState.classList.add('hidden');
    renderResults(data);

  } catch (err) {
    resultsLoadingState.classList.add('hidden');
    resultsContent.classList.remove('hidden');
    
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
  resultsContent.classList.remove('hidden');
  resultsContent.style.display = '';

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
    extractedTextBox.classList.remove('hidden');
  } else {
    extractedTextBox.classList.add('hidden');
  }

  // Normalized Text — with inline threat highlighting
  const normalizedEl = document.getElementById('normalizedText');
  const rawMsg = data.normalized_message || '';
  const spans = c.highlighted_spans || [];
  
  if (spans.length > 0 && rawMsg) {
    normalizedEl.innerHTML = highlightSpans(rawMsg, spans);
  } else {
    normalizedEl.textContent = rawMsg;
  }

  // Entities
  const entitiesList = document.getElementById('entitiesList');
  entitiesList.innerHTML = '';
  const entities = data.extracted_entities || { urls: [], phones: [], upis: [] };
  const logos = data.logo_detections || [];
  if (entities.urls.length === 0 && entities.phones.length === 0 && (entities.upis || []).length === 0 && logos.length === 0) {
    entitiesList.innerHTML = '<span class="no-entities">No entities detected</span>';
  } else {
    if (logos.length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label" style="color: var(--accent-red)">Visual Impersonation</div>${logos.map(l => `<span class="entity-item" style="border-color: var(--accent-red)">${l.brand} Logo (Match: ${l.confidence}%)</span>`).join('')}</div>`;
    }
    if (entities.urls.length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label">URLs</div>${entities.urls.map(u => `<span class="entity-item">${u}</span>`).join('')}</div>`;
    }
    if (entities.phones.length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label">Phones</div>${entities.phones.map(p => `<span class="entity-item">${p}</span>`).join('')}</div>`;
    }
    if ((entities.upis || []).length > 0) {
      entitiesList.innerHTML += `<div class="entity-group"><div class="entity-label">UPI IDs</div>${entities.upis.map(u => `<span class="entity-item">${u}</span>`).join('')}</div>`;
    }
  }

  // Spans (reuse spans from above)
  const spansList = document.getElementById('spansList');
  spansList.innerHTML = '';
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

  // ═══ I4C Kill-Switch Dossier ═══
  const dossierCard = document.getElementById('dossierCard');
  const dossierContent = document.getElementById('dossierContent');

  if (verdict === 'SCAM' || verdict === 'SUSPICIOUS') {
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    let dossier = `═══════════════════════════════════════════════
  I4C THREAT DOSSIER — VaaniGuard Automated Report
═══════════════════════════════════════════════
Generated:     ${timestamp}
Verdict:       ${verdict}
Risk Score:    ${score}/100
Threat Type:   ${c.threat_category || 'Unknown'}
═══════════════════════════════════════════════

SUSPECT IDENTIFIERS
───────────────────`;

    if ((entities.phones || []).length > 0) {
      dossier += `\nPhone(s):      ${entities.phones.join(', ')}`;
    }
    if ((entities.upis || []).length > 0) {
      dossier += `\nUPI ID(s):     ${entities.upis.join(', ')}`;
    }
    if ((entities.urls || []).length > 0) {
      dossier += `\nURL(s):        ${entities.urls.join(', ')}`;
    }
    if ((entities.phones || []).length === 0 && (entities.upis || []).length === 0 && (entities.urls || []).length === 0) {
      dossier += `\n(No identifiers extracted)`;
    }

    dossier += `\n
RAW MESSAGE
───────────────────
${data.normalized_message || rawText || '(not available)'}

THREAT INDICATORS
───────────────────`;
    if (spans.length > 0) {
      spans.forEach(s => {
        dossier += `\n• "${s.text}" — ${s.reason}`;
      });
    } else {
      dossier += `\n(No specific spans flagged)`;
    }

    dossier += `\n
═══════════════════════════════════════════════
ACTION: File at 1930 or https://cybercrime.gov.in
═══════════════════════════════════════════════`;

    dossierContent.textContent = dossier;
    dossierCard.classList.remove('hidden');
    dossierCard.style.display = 'flex';
    dossierCard.style.flexDirection = 'column';

    // Wire up copy button
    const btnCopy = document.getElementById('btnCopyDossier');
    const copyText = document.getElementById('copyBtnText');
    
    // Remove old listeners by cloning
    const newBtn = btnCopy.cloneNode(true);
    btnCopy.parentNode.replaceChild(newBtn, btnCopy);
    
    newBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dossier);
        newBtn.classList.add('copied');
        newBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          newBtn.classList.remove('copied');
          newBtn.querySelector('span').textContent = 'Copy Dossier';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = dossier;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        newBtn.classList.add('copied');
        newBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          newBtn.classList.remove('copied');
          newBtn.querySelector('span').textContent = 'Copy Dossier';
        }, 2000);
      }
    });
  } else {
    dossierCard.classList.add('hidden');
    dossierCard.style.display = 'none';
  }

  // Re-render lucide icons for dynamic content
  lucide.createIcons();
}

// ═════════════════════════════════════════════════════════════
// 3D Cascading Coverflow Carousel Engine (Indian Context Intel)
// ═════════════════════════════════════════════════════════════
function initCascadingCarousel() {
  const viewport = document.getElementById('skewedViewport');
  const track = document.getElementById('skewedTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const filterBtns = document.querySelectorAll('.carousel-filter-btn');

  if (!viewport || !track) return;

  // Duplicate cards for seamless infinite marquee loop
  const originalCards = Array.from(track.children);
  originalCards.forEach(c => {
    const clone = c.cloneNode(true);
    track.appendChild(clone);
  });

  let allCards = Array.from(track.querySelectorAll('.skewed-card'));
  let scrollPos = 0;
  let isHovered = false;
  let isDragging = false;
  let lastX = 0;
  let velocity = 0;
  let singleSetWidth = 0;
  let activeFilter = 'all';

  function calculateSetWidth() {
    let width = 0;
    const visibleOriginals = originalCards.filter(c => {
      if (activeFilter === 'all') return true;
      return c.dataset.category === activeFilter;
    });
    visibleOriginals.forEach(c => {
      width += (c.offsetWidth || 350) + 24;
    });
    singleSetWidth = width || 3740;
  }

  calculateSetWidth();
  window.addEventListener('resize', calculateSetWidth);

  // Category Filtering
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;

      allCards.forEach(card => {
        if (activeFilter === 'all' || card.dataset.category === activeFilter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      calculateSetWidth();
      scrollPos = 0;
      lucide.createIcons();
    });
  });

  // Hover detection
  viewport.addEventListener('mouseenter', () => { isHovered = true; });
  viewport.addEventListener('mouseleave', () => { isHovered = false; isDragging = false; });

  // Mouse Drag / Touch Drag with momentum
  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.pageX;
    velocity = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.pageX - lastX;
    scrollPos -= delta;
    velocity = delta;
    lastX = e.pageX;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch support
  viewport.addEventListener('touchstart', (e) => {
    isDragging = true;
    lastX = e.touches[0].pageX;
    velocity = 0;
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].pageX - lastX;
    scrollPos -= delta;
    velocity = delta;
    lastX = e.touches[0].pageX;
  }, { passive: true });

  viewport.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Prev / Next Navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollPos -= 374;
      if (scrollPos < 0) scrollPos += singleSetWidth;
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollPos += 374;
    });
  }

  // Animation Loop (rAF)
  function renderFrame() {
    if (!isHovered && !isDragging) {
      scrollPos += 0.75; // Smooth auto-scroll speed
    } else if (isDragging) {
      // Direct drag
    } else if (Math.abs(velocity) > 0.1) {
      // Momentum decay
      scrollPos -= velocity;
      velocity *= 0.92;
    }

    // Wrap around for infinite loop
    if (singleSetWidth > 0) {
      if (scrollPos >= singleSetWidth) {
        scrollPos -= singleSetWidth;
      } else if (scrollPos < 0) {
        scrollPos += singleSetWidth;
      }
    }

    track.style.transform = `translateX(${-scrollPos}px)`;

    // Calculate 3D Cascading perspective per card
    const vpRect = viewport.getBoundingClientRect();
    const vpCenter = vpRect.left + vpRect.width / 2;
    const halfVp = vpRect.width / 2 || 400;

    const visibleCards = allCards.filter(c => c.style.display !== 'none');

    visibleCards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      
      // Normalized distance from center (-1 left, 0 center, +1 right)
      const dist = (cardCenter - vpCenter) / halfVp;
      const clampedDist = Math.max(-2, Math.min(2, dist));
      const absDist = Math.abs(clampedDist);

      // Cascading 3D transforms
      const rotY = clampedDist * -28; // Cards on left angle right, cards on right angle left
      const scale = 1.05 - Math.min(0.24, absDist * 0.14);
      const transZ = (1 - Math.min(1, absDist)) * 32;
      const opacity = 1 - Math.min(0.45, absDist * 0.22);
      const zIndex = Math.round(100 - absDist * 25);

      card.style.transform = `rotateY(${rotY}deg) scale(${scale}) translateZ(${transZ}px)`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = zIndex;
    });

    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
}

// ═════════════════════════════════════════════════════════════
// Top Action Deck (Interactive Fan-out Controls)
// ═════════════════════════════════════════════════════════════
function initTopActionDeck() {
  const touchLeft = document.getElementById('touchLeft');
  const touchMiddle = document.getElementById('touchMiddle');
  const touchRight = document.getElementById('touchRight');
  const btnSample = document.getElementById('btnQuickSample');
  const btnRadar = document.getElementById('btnRadarTop');
  const btnHelpline = document.getElementById('btnHelplineTop');
  const smsInput = document.getElementById('smsInput');

  const SAMPLE_SCAMS = [
    'Dear SBI customer, your YONO NetBanking account has been suspended due to pending KYC. Click http://sbi-kyc-pan.co.in to update PAN now.',
    'MAHAVITARAN ALERT: Dear consumer your electricity power will be disconnected tonight at 9:30 PM from power house. Please contact our officer 9876543210.',
    'CBI NOTICE: Your Aadhaar has been linked to a FedEx courier seized in Mumbai Customs containing illegal narcotics. Join Skype interrogation urgently.',
    'TRAI Alert: Your SIM card will be deactivated in 2 hours. Send PORT 9876543210 to 1900 to retain services.'
  ];
  let sampleIndex = 0;

  function triggerSample() {
    if (!smsInput) return;
    smsInput.value = SAMPLE_SCAMS[sampleIndex % SAMPLE_SCAMS.length];
    sampleIndex++;
    smsInput.focus();
    smsInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const countEl = document.getElementById('charCount');
    if (countEl) countEl.textContent = `${smsInput.value.length} chars`;
  }

  function triggerRadar() {
    const radar = document.querySelector('.skewed-carousel-section');
    if (radar) {
      radar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function triggerHelpline() {
    window.open('https://cybercrime.gov.in', '_blank');
  }

  if (touchLeft) touchLeft.addEventListener('click', triggerSample);
  if (btnSample) btnSample.addEventListener('click', triggerSample);

  if (touchMiddle) touchMiddle.addEventListener('click', triggerRadar);
  if (btnRadar) btnRadar.addEventListener('click', triggerRadar);

  if (touchRight) touchRight.addEventListener('click', triggerHelpline);
  if (btnHelpline) btnHelpline.addEventListener('click', triggerHelpline);
}

// ═════════════════════════════════════════════════════════════
// Hyper-Optimized Interactive Dot Distortion Shader Engine
// ═════════════════════════════════════════════════════════════
function initDotDistortionShader() {
  const canvas = document.getElementById('dotDistortionCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dots = [];
  const GAP = 46; // Optimized spacing: ~75% fewer particles for high performance

  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    radius: 120,
    strength: 32,
    active: false
  };

  let animFrameId = null;
  let isRunning = false;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    createDots();
    wakeUp();
  }

  function createDots() {
    dots = [];
    const cols = Math.ceil(width / GAP) + 1;
    const rows = Math.ceil(height / GAP) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = c * GAP;
        const oy = r * GAP;
        dots.push({
          ox: ox,
          oy: oy,
          x: ox,
          y: oy,
          vx: 0,
          vy: 0,
          radius: 1.25,
          alpha: 0.22,
          phase: (ox + oy) * 0.005
        });
      }
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  function wakeUp() {
    if (!isRunning && !document.hidden) {
      isRunning = true;
      animFrameId = requestAnimationFrame(renderShader);
    }
  }

  // Mouse & Touch Tracking
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
    wakeUp();
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = -1000;
    mouse.targetY = -1000;
    mouse.active = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.active = true;
      wakeUp();
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.targetX = -1000;
    mouse.targetY = -1000;
    mouse.active = false;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    } else {
      wakeUp();
    }
  });

  let time = 0;

  function renderShader() {
    time += 0.02;

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.18;
    mouse.y += (mouse.targetY - mouse.y) * 0.18;

    ctx.clearRect(0, 0, width, height);

    let maxVelocity = 0;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      // Lightweight wave motion
      const waveX = Math.sin(time + dot.phase) * 2;
      const waveY = Math.cos(time + dot.phase * 0.8) * 2;
      const targetX = dot.ox + waveX;
      const targetY = dot.oy + waveY;

      // Spatial check: only compute repulsion for dots near cursor
      const dx = mouse.x - dot.x;
      const dy = mouse.y - dot.y;

      if (Math.abs(dx) < mouse.radius && Math.abs(dy) < mouse.radius) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && dist > 0) {
          const factor = (1 - dist / mouse.radius);
          const force = factor * mouse.strength;
          dot.vx -= (dx / dist) * force;
          dot.vy -= (dy / dist) * force;
          dot.radius = 1.25 + factor * 1.8;
          dot.alpha = Math.min(0.9, 0.22 + factor * 0.65);
        }
      } else {
        dot.radius += (1.25 - dot.radius) * 0.1;
        dot.alpha += (0.22 - dot.alpha) * 0.08;
      }

      // Spring physics
      dot.vx += (targetX - dot.x) * 0.08;
      dot.vy += (targetY - dot.y) * 0.08;
      dot.vx *= 0.85;
      dot.vy *= 0.85;
      dot.x += dot.vx;
      dot.y += dot.vy;

      const vel = Math.abs(dot.vx) + Math.abs(dot.vy);
      if (vel > maxVelocity) maxVelocity = vel;

      // Render dot
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);

      if (dot.alpha > 0.4) {
        ctx.fillStyle = `rgba(0, 229, 255, ${dot.alpha})`;
      } else {
        ctx.fillStyle = `rgba(130, 160, 220, ${dot.alpha})`;
      }

      ctx.fill();
    }

    // Auto-sleep if idle to save 100% CPU/GPU
    if (!mouse.active && maxVelocity < 0.04) {
      isRunning = false;
      return;
    }

    animFrameId = requestAnimationFrame(renderShader);
  }

  wakeUp();
}

// ═════════════════════════════════════════════════════════════
// Magnetic Parallax on Main Scan Button & Quick Test Preset Pills
// ═════════════════════════════════════════════════════════════
function initInteractiveParallaxElements() {
  const bentoGrid = document.querySelector('.bento-grid');
  const scanBtn = document.getElementById('btnScan');
  const clearBtn = document.getElementById('btnClear');
  const presetButtons = document.querySelectorAll('.btn-preset');
  const cards = document.querySelectorAll('.bento-card');

  if (!bentoGrid) return;

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let isHovering = false;

  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = (e.clientX - cx) / cx; // -1 to 1
    targetY = (e.clientY - cy) / cy; // -1 to 1
    isHovering = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    isHovering = false;
  }, { passive: true });

  // Direct magnetic hover on Scan & Clear Buttons
  if (scanBtn) {
    scanBtn.addEventListener('mousemove', (e) => {
      const rect = scanBtn.getBoundingClientRect();
      const bx = (e.clientX - rect.left - rect.width / 2) * 0.22;
      const by = (e.clientY - rect.top - rect.height / 2) * 0.22;
      scanBtn.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) scale(1.02)`;
    });

    scanBtn.addEventListener('mouseleave', () => {
      scanBtn.style.transform = '';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('mousemove', (e) => {
      const rect = clearBtn.getBoundingClientRect();
      const bx = (e.clientX - rect.left - rect.width / 2) * 0.18;
      const by = (e.clientY - rect.top - rect.height / 2) * 0.18;
      clearBtn.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;
    });

    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.transform = '';
    });
  }

  // Direct magnetic hover on Preset Pills
  presetButtons.forEach((pill) => {
    pill.addEventListener('mousemove', (e) => {
      const rect = pill.getBoundingClientRect();
      const bx = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const by = (e.clientY - rect.top - rect.height / 2) * 0.25;
      pill.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) scale(1.06)`;
    });

    pill.addEventListener('mouseleave', () => {
      pill.style.transform = '';
    });
  });

  // Global subtle 3D card tilt
  function renderParallaxElements() {
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;

    if (isHovering && Math.abs(mouseX) > 0.01) {
      cards.forEach((card, i) => {
        const depth = (i % 2 === 0) ? 4 : 6;
        const tiltX = (mouseY * -depth).toFixed(2);
        const tiltY = (mouseX * depth).toFixed(2);
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });
    }

    requestAnimationFrame(renderParallaxElements);
  }

  requestAnimationFrame(renderParallaxElements);
}

// ═════════════════════════════════════════════════════════════
// Uiverse 3D Card Interactive Quick Action Listeners
// ═════════════════════════════════════════════════════════════
function initUiverseCardActions() {
  const heroSample = document.getElementById('btnHeroQuickSample');
  const heroHelpline = document.getElementById('btnHeroHelpline');
  const heroRadar = document.getElementById('btnHeroRadar');
  const bottomHelpline = document.getElementById('btnBottomHelpline');
  const bottomGov = document.getElementById('btnBottomGov');

  if (heroSample && smsInput) {
    heroSample.addEventListener('click', () => {
      smsInput.value = 'Dear SBI User, your netbanking will be BLOCKED today. Please update PAN immediately on: http://sbi-kyc-update.co.in';
      if (charCount) charCount.textContent = `${smsInput.value.length} characters`;
      smsInput.focus();
      smsInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (heroHelpline) {
    heroHelpline.addEventListener('click', () => {
      window.open('tel:1930', '_self');
    });
  }

  if (heroRadar) {
    heroRadar.addEventListener('click', () => {
      const radarSection = document.querySelector('.skewed-carousel-section');
      if (radarSection) radarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (bottomHelpline) {
    bottomHelpline.addEventListener('click', () => {
      window.open('tel:1930', '_self');
    });
  }

  if (bottomGov) {
    bottomGov.addEventListener('click', () => {
      window.open('https://cybercrime.gov.in', '_blank', 'noopener');
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCascadingCarousel();
  initTopActionDeck();
  initDotDistortionShader();
  initInteractiveParallaxElements();
  initUiverseCardActions();
  lucide.createIcons();
});

// Fallback init in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    initCascadingCarousel();
    initTopActionDeck();
    initDotDistortionShader();
    initInteractiveParallaxElements();
    initUiverseCardActions();
    lucide.createIcons();
  }, 100);
}

