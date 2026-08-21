const API_URL = '/api/scan';

const smsInput = document.getElementById('smsInput');
const charCount = document.getElementById('charCount');
const btnScan = document.getElementById('btnScan');
const btnClear = document.getElementById('btnClear');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsSection = document.getElementById('resultsSection');

// Verdict elements
const verdictBanner = document.getElementById('verdictBanner');
const verdictIcon = document.getElementById('verdictIcon');
const verdictLabel = document.getElementById('verdictLabel');
const verdictCategory = document.getElementById('verdictCategory');
const riskValue = document.getElementById('riskValue');
const riskFill = document.getElementById('riskFill');

// Detail elements
const normalizedText = document.getElementById('normalizedText');
const entitiesList = document.getElementById('entitiesList');
const highlightsList = document.getElementById('highlightsList');

// Loading steps
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

// Character counter
smsInput.addEventListener('input', () => {
  charCount.textContent = `${smsInput.value.length} chars`;
});

// Clear button
btnClear.addEventListener('click', () => {
  smsInput.value = '';
  charCount.textContent = '0 chars';
  resultsSection.style.display = 'none';
  loadingOverlay.classList.remove('active');
});

// Sample chips
document.querySelectorAll('.sample-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    smsInput.value = chip.dataset.msg;
    charCount.textContent = `${smsInput.value.length} chars`;
    smsInput.focus();
  });
});

// Scan button
btnScan.addEventListener('click', handleScan);

// Allow Ctrl+Enter to scan
smsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    handleScan();
  }
});

async function handleScan() {
  const message = smsInput.value.trim();
  if (!message) {
    smsInput.focus();
    return;
  }

  btnScan.disabled = true;
  resultsSection.style.display = 'none';

  // Show loading
  loadingOverlay.classList.add('active');
  resetSteps();

  // Animate steps
  setTimeout(() => markStepDone(step1, step2), 400);
  setTimeout(() => markStepDone(step2, step3), 900);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();

    // Mark final step done
    markStepDone(step3, null);

    // Small delay for visual polish
    setTimeout(() => {
      loadingOverlay.classList.remove('active');
      renderResults(data);
    }, 500);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    alert(`Scan failed: ${err.message}`);
  } finally {
    btnScan.disabled = false;
  }
}

function resetSteps() {
  [step1, step2, step3].forEach(s => {
    s.classList.remove('done');
    s.classList.remove('active');
  });
  step1.classList.add('active');
}

function markStepDone(current, next) {
  current.classList.remove('active');
  current.classList.add('done');
  if (next) next.classList.add('active');
}

function renderResults(data) {
  const c = data.classification;
  const verdict = (c.verdict || 'SAFE').toUpperCase();
  const score = c.risk_score || 0;
  const category = c.threat_category || 'None';
  const spans = c.highlighted_spans || [];

  // Verdict banner class
  verdictBanner.className = 'verdict-banner';
  if (verdict === 'SCAM') {
    verdictBanner.classList.add('scam');
    verdictIcon.textContent = '🚨';
  } else if (verdict === 'SUSPICIOUS') {
    verdictBanner.classList.add('suspicious');
    verdictIcon.textContent = '⚠️';
  } else {
    verdictBanner.classList.add('safe');
    verdictIcon.textContent = '✅';
  }

  verdictLabel.textContent = verdict;
  verdictCategory.textContent = category;
  riskValue.textContent = score;

  // Animate risk bar
  riskFill.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      riskFill.style.width = `${score}%`;
    });
  });

  // Normalized text
  normalizedText.textContent = data.normalized_message || '';

  // Entities
  const entities = data.extracted_entities || { urls: [], phones: [] };
  entitiesList.innerHTML = '';

  if (entities.urls.length === 0 && entities.phones.length === 0) {
    entitiesList.innerHTML = '<div class="no-entities">No URLs or phone numbers detected</div>';
  } else {
    if (entities.urls.length > 0) {
      const label = document.createElement('div');
      label.className = 'entity-group-label';
      label.textContent = 'URLs';
      entitiesList.appendChild(label);
      entities.urls.forEach(u => {
        const el = document.createElement('div');
        el.className = 'entity-item';
        el.textContent = u;
        entitiesList.appendChild(el);
      });
    }

    if (entities.phones.length > 0) {
      const label = document.createElement('div');
      label.className = 'entity-group-label';
      label.textContent = 'Phone Numbers';
      entitiesList.appendChild(label);
      entities.phones.forEach(p => {
        const el = document.createElement('div');
        el.className = 'entity-item phone';
        el.textContent = p;
        entitiesList.appendChild(el);
      });
    }
  }

  // Highlights
  highlightsList.innerHTML = '';
  if (spans.length === 0) {
    highlightsList.innerHTML = '<div class="no-highlights">No specific threat indicators found</div>';
  } else {
    spans.forEach(s => {
      const item = document.createElement('div');
      item.className = 'highlight-item';
      item.innerHTML = `
        <div>
          <div class="highlight-text">"${escapeHtml(s.text)}"</div>
          <div class="highlight-reason">${escapeHtml(s.reason)}</div>
        </div>
      `;
      highlightsList.appendChild(item);
    });
  }

  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
