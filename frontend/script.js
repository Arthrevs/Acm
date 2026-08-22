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

// Elements
const themeToggle = document.getElementById('themeToggle');
let isDark = false;

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  if (isDark) {
    document.body.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i data-lucide="sun"></i>';
  } else {
    document.body.removeAttribute('data-theme');
    themeToggle.innerHTML = '<i data-lucide="moon"></i>';
  }
  lucide.createIcons();
});

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
      throw new Error(err.error || `Server error (${response.status})`);
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCascadingCarousel();
  lucide.createIcons();
});

// Fallback init in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    initCascadingCarousel();
    lucide.createIcons();
  }, 100);
}

