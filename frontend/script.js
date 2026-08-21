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

  // Pipeline breakdown
  renderPipeline(data.pipeline);

  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPipeline(pipeline) {
  const container = document.getElementById('pipelineBreakdown');
  if (!pipeline) {
    container.innerHTML = '<div class="no-entities">Pipeline data not available</div>';
    return;
  }

  const l1 = pipeline.layer1_context || {};
  const l2 = pipeline.layer2_heuristics || {};
  const l3 = pipeline.layer3_llm || {};
  const l4 = pipeline.layer4_verification || {};

  let html = '<div class="pipeline-layers">';

  // Layer 1
  html += `
    <div class="pipeline-layer">
      <div class="layer-badge layer-1">L1</div>
      <div class="layer-info">
        <div class="layer-name">Context Normalizer</div>
        <div class="layer-detail">${l1.originalLines || 0} lines → ${l1.filteredLines || 0} after filler strip (${l1.fillerStripped || 0} removed) · ${l1.highRiskChunks || 0} high-risk chunk(s)</div>
      </div>
    </div>`;

  // Layer 2
  const scoreClass = l2.exceedsThreshold ? 'score-high' : 'score-low';
  html += `
    <div class="pipeline-layer">
      <div class="layer-badge layer-2">L2</div>
      <div class="layer-info">
        <div class="layer-name">Heuristic Scorer <span class="layer-score ${scoreClass}">${l2.totalScore || 0} pts</span></div>
        <div class="layer-detail">${l2.exceedsThreshold ? '⚠️ Exceeds threshold (' + l2.threshold + ')' : '✅ Below threshold (' + l2.threshold + ')'}</div>
        ${(l2.breakdown || []).map(b =>
          `<div class="layer-rule">+${b.points} — ${escapeHtml(b.rule)}: <span class="rule-match">"${escapeHtml(b.match)}"</span></div>`
        ).join('')}
      </div>
    </div>`;

  // Layer 3
  html += `
    <div class="pipeline-layer">
      <div class="layer-badge layer-3">L3</div>
      <div class="layer-info">
        <div class="layer-name">LLM Gateway <span class="layer-tag">${l3.invoked ? '🔥 Invoked' : '⏭️ Skipped'}</span></div>
        <div class="layer-detail">${l3.invoked ? 'High-risk chunks sent to Gemini for semantic analysis' : 'Heuristic score too low — LLM call skipped for speed'}</div>
      </div>
    </div>`;

  // Layer 4
  html += `
    <div class="pipeline-layer">
      <div class="layer-badge layer-4">L4</div>
      <div class="layer-info">
        <div class="layer-name">Verification Gate <span class="layer-tag">${l4.totalFindings || 0} finding(s)</span></div>
        ${(l4.findings || []).length > 0
          ? (l4.findings || []).map(f =>
              `<div class="layer-rule verification-finding">🚩 [${escapeHtml(f.severity)}] ${escapeHtml(f.reason)}: <span class="rule-match">${escapeHtml(f.domain)}</span></div>`
            ).join('')
          : '<div class="layer-detail">✅ No blacklisted domains or typosquatting detected</div>'
        }
      </div>
    </div>`;

  // Processing time
  if (pipeline.processingTimeMs) {
    html += `<div class="pipeline-time">⚡ Pipeline completed in ${pipeline.processingTimeMs}ms</div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
