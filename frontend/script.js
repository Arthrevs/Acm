const API_URL = '/api/scan';

// Hardware Console Elements
const samplerChassis = document.getElementById('samplerChassis');
const statusLed = document.getElementById('statusLed');
const unitStatusText = document.getElementById('unitStatusText');
const btnAudioToggle = document.getElementById('btnAudioToggle');

// Left Column Inputs
const screenBox = document.getElementById('screenBox');
const smsInput = document.getElementById('smsInput');
const charCount = document.getElementById('charCount');
const presetLabel = document.getElementById('presetLabel');
const btnUpload = document.getElementById('btnUpload');
const btnClear = document.getElementById('btnClear');
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const btnRemoveImage = document.getElementById('btnRemoveImage');

const promptStatus = document.getElementById('promptStatus');
const btnScan = document.getElementById('btnScan');
const scanButtonText = document.getElementById('scanButtonText');

// Right Column Modular Security Pads
const pad1 = document.getElementById('pad1');
const pad2 = document.getElementById('pad2');
const pad3 = document.getElementById('pad3');
const pad4 = document.getElementById('pad4');
const pad5 = document.getElementById('pad5');
const pad6 = document.getElementById('pad6');
const pad7 = document.getElementById('pad7');
const pad8 = document.getElementById('pad8');

const matrixP1 = document.getElementById('matrixP1');
const matrixP2 = document.getElementById('matrixP2');
const matrixP3 = document.getElementById('matrixP3');
const matrixP5 = document.getElementById('matrixP5');
const matrixP6 = document.getElementById('matrixP6');
const matrixP7 = document.getElementById('matrixP7');
const matrixP8 = document.getElementById('matrixP8');

const valP1 = document.getElementById('valP1');
const valP2 = document.getElementById('valP2');
const valP3 = document.getElementById('valP3');

const verdictLabel = document.getElementById('verdictLabel');
const verdictCategory = document.getElementById('verdictCategory');

const pad4Led = document.getElementById('pad4Led');
const pad4Name = document.getElementById('pad4Name');
const pad5Led = document.getElementById('pad5Led');
const pad6Led = document.getElementById('pad6Led');
const pad7Led = document.getElementById('pad7Led');
const pad8Led = document.getElementById('pad8Led');

// Slider & Transport
const riskSlider = document.getElementById('riskSlider');
const sliderValueText = document.getElementById('sliderValueText');
const btnResetSlider = document.getElementById('btnResetSlider');
const btnPlay = document.getElementById('btnPlay');
const btnInspectToggle = document.getElementById('btnInspectToggle');
const ledSequencer = document.getElementById('ledSequencer');
const ledSteps = document.querySelectorAll('.led-step');

// Sensitivity Threshold Controls
const btnThresholdMinus = document.getElementById('btnThresholdMinus');
const btnThresholdPlus = document.getElementById('btnThresholdPlus');
const thresholdText = document.getElementById('thresholdText');
let currentThreshold = 30;

// Inspector Drawer
const inspectorDrawer = document.getElementById('inspectorDrawer');
const drawerTitle = document.getElementById('drawerTitle');
const drawerContent = document.getElementById('drawerContent');
const drawerClose = document.getElementById('drawerClose');
const btnCopyReport = document.getElementById('btnCopyReport');
const btnCopyJson = document.getElementById('btnCopyJson');

let currentImageData = null;
let currentImageMimeType = null;
let scanAnimationInterval = null;
let latestScanData = null;
let audioEnabled = true;

// ============================================
// Web Audio API Synthesizer (Hardware Sound FX)
// ============================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx && typeof window.AudioContext !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthTone(freq = 440, type = 'sine', duration = 0.06, gainLevel = 0.05) {
  if (!audioEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context fallback
  }
}

function playScanStartSound() {
  playSynthTone(520, 'triangle', 0.08, 0.06);
  setTimeout(() => playSynthTone(780, 'triangle', 0.1, 0.06), 90);
}

function playScanDoneSound(isScam) {
  if (isScam) {
    playSynthTone(280, 'sawtooth', 0.15, 0.08);
    setTimeout(() => playSynthTone(220, 'sawtooth', 0.25, 0.08), 120);
  } else {
    playSynthTone(600, 'sine', 0.1, 0.06);
    setTimeout(() => playSynthTone(880, 'sine', 0.15, 0.06), 100);
  }
}

// Audio Toggle Button
btnAudioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  btnAudioToggle.textContent = audioEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
  btnAudioToggle.classList.toggle('muted', !audioEnabled);
  if (audioEnabled) playSynthTone(800, 'sine', 0.05);
});

// ============================================
// Event Listeners & Hardware Controls
// ============================================

// Character & Token estimation counter
smsInput.addEventListener('input', updateCharCount);

function updateCharCount() {
  const len = smsInput.value.length;
  const tokens = Math.ceil(len / 4);
  charCount.textContent = `${len} chars · ~${tokens} tokens`;
}

// Preset Buttons (KYC, Lottery, Utility, Safe, OLX)
const presetButtons = document.querySelectorAll('.color-dot');
presetButtons.forEach((dot, idx) => {
  dot.addEventListener('click', () => {
    selectPreset(dot);
  });
});

function selectPreset(dot) {
  playSynthTone(400 + Math.random() * 200, 'sine', 0.05);
  presetButtons.forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  
  smsInput.value = dot.dataset.msg;
  presetLabel.textContent = dot.dataset.preset || 'PRESET LOADED';
  updateCharCount();
  
  promptStatus.innerHTML = `
    PAYLOAD LOADED: ${escapeHtml(dot.dataset.preset)}<br>
    READY: CLICK [SCAN SMS] OR PRESS [⌘+↵]
  `;
  smsInput.focus();
}

// Clear Button
btnClear.addEventListener('click', () => {
  playSynthTone(300, 'sine', 0.05);
  resetConsole();
});

// Fader Reset Button
btnResetSlider.addEventListener('click', () => {
  playSynthTone(350, 'sine', 0.05);
  riskSlider.value = 0;
  sliderValueText.textContent = '0%';
  riskSlider.className = 'hardware-fader';
});

// Risk Slider Drag interaction
riskSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  sliderValueText.textContent = `${val}%`;
  playSynthTone(200 + val * 5, 'sine', 0.02, 0.02);
  if (val >= 60) {
    riskSlider.className = 'hardware-fader scam';
  } else if (val >= 30) {
    riskSlider.className = 'hardware-fader';
  } else {
    riskSlider.className = 'hardware-fader safe';
  }
});

// Threshold Stepper (- / +)
btnThresholdMinus.addEventListener('click', () => {
  if (currentThreshold > 10) {
    currentThreshold -= 5;
    thresholdText.innerHTML = `${currentThreshold} <small>PTS</small>`;
    playSynthTone(400, 'triangle', 0.04);
  }
});

btnThresholdPlus.addEventListener('click', () => {
  if (currentThreshold < 80) {
    currentThreshold += 5;
    thresholdText.innerHTML = `${currentThreshold} <small>PTS</small>`;
    playSynthTone(600, 'triangle', 0.04);
  }
});

// Play / Scan button triggers
btnScan.addEventListener('click', handleScan);
btnPlay.addEventListener('click', handleScan);

// Toggle Inspector Button
btnInspectToggle.addEventListener('click', () => {
  playSynthTone(500, 'sine', 0.04);
  if (inspectorDrawer.classList.contains('open')) {
    inspectorDrawer.classList.remove('open');
  } else {
    openPadInspector('4');
  }
});

// ============================================
// Drag & Drop Screenshot Handling
// ============================================

screenBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  screenBox.classList.add('drag-over');
});

screenBox.addEventListener('dragleave', () => {
  screenBox.classList.remove('drag-over');
});

screenBox.addEventListener('drop', (e) => {
  e.preventDefault();
  screenBox.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files && files[0] && files[0].type.startsWith('image/')) {
    processImageFile(files[0]);
  }
});

// Screenshot upload button
btnUpload.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processImageFile(file);
});

function processImageFile(file) {
  playSynthTone(550, 'sine', 0.06);
  currentImageMimeType = file.type;
  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;
    imagePreview.src = dataUrl;
    imagePreviewContainer.style.display = 'inline-block';
    currentImageData = dataUrl.split(',')[1];
    promptStatus.innerHTML = `
      SCREENSHOT ATTACHED: OCR READY<br>
      CLICK [SCAN SMS] TO RUN MULTI-AGENT PIPELINE
    `;
  };
  reader.readAsDataURL(file);
}

btnRemoveImage.addEventListener('click', clearImage);

function clearImage() {
  imageInput.value = '';
  currentImageData = null;
  currentImageMimeType = null;
  imagePreviewContainer.style.display = 'none';
  imagePreview.src = '';
}

// Drawer close
drawerClose.addEventListener('click', () => {
  inspectorDrawer.classList.remove('open');
});

// Pad Clicks -> Open detailed inspector for that specific security layer
document.querySelectorAll('.sampler-pad').forEach(pad => {
  pad.addEventListener('click', () => {
    playSynthTone(650, 'sine', 0.05);
    const padNum = pad.dataset.pad;
    openPadInspector(padNum);
  });
});

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to scan
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    handleScan();
    return;
  }

  // Escape to close inspector or clear image
  if (e.key === 'Escape') {
    if (inspectorDrawer.classList.contains('open')) {
      inspectorDrawer.classList.remove('open');
    } else if (currentImageData) {
      clearImage();
    }
    return;
  }

  // Number keys 1-5 for quick preset selection (when not typing in textarea)
  if (document.activeElement !== smsInput && ['1', '2', '3', '4', '5'].includes(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    if (presetButtons[idx]) {
      selectPreset(presetButtons[idx]);
    }
  }
});

// ============================================
// Scan Execution & Multi-Layer Animation
// ============================================

async function handleScan() {
  const message = smsInput.value.trim();
  if (!message && !currentImageData) {
    smsInput.focus();
    return;
  }

  playScanStartSound();
  btnScan.disabled = true;
  btnPlay.disabled = true;
  btnScan.classList.add('scanning');
  scanButtonText.textContent = 'SCANNING...';
  
  // Start LED sequencer running sweep animation
  startSequencerAnimation();
  
  // Update Prompt Status Readout with live multi-stage telemetry
  promptStatus.innerHTML = `
    STAGE 1-2: CONTEXT NORMALIZATION & HEURISTICS...<br>
    STAGE 3-4: PARALLEL AGENTS & VERIFICATION GATE...
  `;

  try {
    const payload = { 
      message,
      threshold: currentThreshold
    };
    if (currentImageData) {
      payload.image = {
        data: currentImageData,
        mimeType: currentImageMimeType
      };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    latestScanData = data;

    // Stop scan animation and apply results
    stopSequencerAnimation();
    renderHardwareResults(data);

    const isScam = (data.classification?.verdict || '').toUpperCase() === 'SCAM';
    playScanDoneSound(isScam);

  } catch (err) {
    stopSequencerAnimation();
    alert(`Scan error: ${err.message}`);
    promptStatus.innerHTML = `<span style="color:var(--accent-red)">ERROR: ${escapeHtml(err.message)}</span>`;
  } finally {
    btnScan.disabled = false;
    btnPlay.disabled = false;
    btnScan.classList.remove('scanning');
  }
}

// Sequencer Running Light Animation across all 16 security check vectors
function startSequencerAnimation() {
  let step = 0;
  clearInterval(scanAnimationInterval);
  ledSteps.forEach(s => s.className = 'led-step');
  
  scanAnimationInterval = setInterval(() => {
    ledSteps.forEach((s, idx) => {
      s.classList.toggle('active', idx === step);
    });
    step = (step + 1) % 16;
  }, 45);
}

function stopSequencerAnimation() {
  clearInterval(scanAnimationInterval);
  ledSteps.forEach(s => s.className = 'led-step');
}

// ============================================
// Render Results onto Hardware Console
// ============================================

function renderHardwareResults(data) {
  const c = data.classification || {};
  const verdict = (c.verdict || 'SAFE').toUpperCase();
  const score = c.risk_score || 0;
  const category = c.threat_category || 'Legitimate Message';
  const pipeline = data.pipeline || {};

  const isScam = verdict === 'SCAM' || verdict === 'SUSPICIOUS';

  // 1. Update Hardware Chassis & Status LED
  samplerChassis.className = 'sampler-chassis ' + (isScam ? 'scam' : 'safe');
  statusLed.className = 'status-led ' + (isScam ? 'scam' : 'safe');
  unitStatusText.textContent = isScam ? `THREAT DETECTED [${score}% RISK]` : `CLEARED SAFE [0% RISK]`;

  // 2. Update Generate Button State
  btnScan.className = 'btn-generate ' + (isScam ? 'scam' : 'safe');
  scanButtonText.textContent = isScam ? 'SCAM' : 'SAFE';

  // 3. Update Master Verdict Pad (P4)
  pad4.className = 'sampler-pad pad-p4 pad-active ' + (isScam ? 'scam' : 'safe');
  verdictLabel.textContent = verdict;
  verdictCategory.textContent = category;
  pad4Led.textContent = '■ VERDICT';
  pad4Name.textContent = `${score}% RISK`;

  // 4. Update Hardware Risk Fader
  riskSlider.className = 'hardware-fader ' + (isScam ? 'scam' : 'safe');
  riskSlider.value = score;
  sliderValueText.textContent = `${score}%`;

  // 5. Update 16 Security Check Vector LEDs
  const activeLedsCount = isScam 
    ? Math.max(8, Math.round((score / 100) * 16))
    : Math.max(2, Math.round((score / 100) * 16));

  ledSteps.forEach((stepEl, idx) => {
    stepEl.className = 'led-step';
    if (idx < activeLedsCount) {
      stepEl.classList.add(isScam ? 'scam' : 'safe');
    }
  });

  // 6. Update Modular Security Pads Data
  // Pad 1: Context & Normalization (L1)
  const l1 = pipeline.layer1_context || {};
  valP1.textContent = `${l1.filteredLines || 1} LNS · ${l1.fillerStripped || 0} CLR`;
  
  // Pad 2: Heuristics (L2)
  const l2 = pipeline.layer2_heuristics || {};
  valP2.textContent = `${l2.totalScore || 0} / ${l2.threshold || currentThreshold} PTS`;

  // Pad 3: Multi-Agent Consensus Debate (L3)
  const l3 = pipeline.layer3_consensus || {};
  valP3.textContent = l3.invoked ? '3 AGENTS VOTED' : 'HEUR SKIPPED';

  // Pad 5: Agent 1 - The Paranoiac (Threat Extractor)
  const a1 = l3.agent1_paranoiac;
  const a1Count = a1 ? (a1.threats_found || 0) : 0;
  matrixP5.innerHTML = `
    <div class="matrix-dots"><span>● ● ◌ ●</span></div>
    <div class="matrix-val" style="color:${a1Count > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${a1Count} THREATS</div>
    <div class="matrix-val-sub">PARANOIAC</div>
  `;
  pad5Led.textContent = '■ P5';
  pad5Led.className = 'pad-led ' + (a1Count > 0 ? 'led-red' : 'led-green');

  // Pad 6: Agent 2 - Context Arbiter (Social Analyst)
  const a2 = l3.agent2_arbiter;
  const pressure = a2 ? (a2.social_pressure_level || 'LOW').toUpperCase() : 'NORMAL';
  matrixP6.innerHTML = `
    <div class="matrix-dots"><span>◌ ● ● ◌</span></div>
    <div class="matrix-val" style="color:${pressure === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-cyan)'}">${pressure} PRESSURE</div>
    <div class="matrix-val-sub">ARBITER</div>
  `;
  pad6Led.textContent = '■ P6';
  pad6Led.className = 'pad-led ' + (pressure === 'HIGH' ? 'led-red' : 'led-cyan');

  // Pad 7: Verification Gate (L4)
  const l4 = pipeline.layer4_verification || {};
  const findingsCount = l4.totalFindings || 0;
  matrixP7.innerHTML = `
    <div class="matrix-dots"><span>● ◌ ◌ ●</span></div>
    <div class="matrix-val" style="color:${findingsCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${findingsCount > 0 ? findingsCount + ' DOMAIN FLAGS' : 'GATE VERIFIED'}</div>
    <div class="matrix-val-sub">L4 GATE</div>
  `;
  pad7Led.textContent = '■ P7';
  pad7Led.className = 'pad-led ' + (findingsCount > 0 ? 'led-red' : 'led-green');

  // Pad 8: Highlighted Threat Spans
  const spans = c.highlighted_spans || [];
  matrixP8.innerHTML = `
    <div class="matrix-dots"><span>● ● ● ●</span></div>
    <div class="matrix-val">${spans.length} SPANS</div>
    <div class="matrix-val-sub">LATENCY ${pipeline.processingTimeMs || 0}ms</div>
  `;
  pad8Led.textContent = '■ P8';
  pad8Led.className = 'pad-led led-white';

  // 7. Update Prompt Readout Box
  const latency = pipeline.processingTimeMs || 0;
  promptStatus.innerHTML = `
    VERDICT: ${verdict} (${score}% RISK) · ${category}<br>
    LATENCY: ${latency}ms · MULTI-AGENT CONSENSUS RESOLVED
  `;
}

// ============================================
// Reset Console to Idle
// ============================================

function resetConsole() {
  smsInput.value = '';
  updateCharCount();
  clearImage();
  presetLabel.textContent = 'SELECT PRESET';
  presetButtons.forEach(d => d.classList.remove('active'));

  samplerChassis.className = 'sampler-chassis';
  statusLed.className = 'status-led';
  unitStatusText.textContent = 'PIPELINE·ONLINE [4-LAYER]';

  btnScan.className = 'btn-generate';
  scanButtonText.textContent = 'SCAN SMS';

  pad4.className = 'sampler-pad pad-p4 pad-active';
  verdictLabel.textContent = 'READY';
  verdictCategory.textContent = 'STANDBY';
  pad4Led.textContent = '■ P4';
  pad4Name.textContent = 'VERDICT';

  riskSlider.className = 'hardware-fader';
  riskSlider.value = 0;
  sliderValueText.textContent = '0%';

  valP1.textContent = '0 FILTERED';
  valP2.textContent = '0 PTS';
  valP3.textContent = '3 AGENTS';

  matrixP5.innerHTML = '<div class="matrix-empty">AGENT 1</div><div class="matrix-val-sub">PARANOIAC</div>';
  matrixP6.innerHTML = '<div class="matrix-empty">AGENT 2</div><div class="matrix-val-sub">ARBITER</div>';
  matrixP7.innerHTML = '<div class="matrix-empty">LAYER 4</div><div class="matrix-val-sub">GATE</div>';
  matrixP8.innerHTML = '<div class="matrix-empty">SPANS</div><div class="matrix-val-sub">0 DETECTED</div>';

  pad5Led.className = 'pad-led led-gray';
  pad6Led.className = 'pad-led led-gray';
  pad7Led.className = 'pad-led led-gray';
  pad8Led.className = 'pad-led led-gray';

  ledSteps.forEach(s => s.className = 'led-step');

  promptStatus.innerHTML = `
    ENGINE: 3-AGENT CONSENSUS (GEMINI)<br>
    PIPELINE: L1 NORM → L2 HEUR → L3 AGENTS → L4 GATE
  `;

  inspectorDrawer.classList.remove('open');
  latestScanData = null;
}

// ============================================
// Detailed Inspector for Modular Security Pads
// ============================================

function openPadInspector(padNum) {
  if (!latestScanData) {
    drawerTitle.textContent = `PAD P${padNum} — SECURITY TELEMETRY INSPECTOR`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-body">Awaiting scan execution. Select a preset [1-5] or type a message, then click <strong>SCAN SMS</strong> to inspect live multi-agent layer telemetry.</div>
      </div>
    `;
    inspectorDrawer.classList.add('open');
    return;
  }

  const d = latestScanData;
  const c = d.classification || {};
  const p = d.pipeline || {};
  const verdict = (c.verdict || 'SAFE').toUpperCase();

  if (padNum === '1') {
    // Layer 1: Context & Normalization
    const l1 = p.layer1_context || {};
    drawerTitle.textContent = `PAD P1 — LAYER 1: CONTEXT NORMALIZATION & DE-OBFUSCATION`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading"><span>NORMALIZED VERNACULAR PAYLOAD</span><span>${l1.timeMs || 0}ms</span></div>
        <div class="card-body">
          <p><strong>De-obfuscated Text:</strong> <em>"${escapeHtml(d.normalized_message || 'N/A')}"</em></p>
          <p style="margin-top:8px;"><strong>Chat Filtration:</strong> Filtered ${l1.fillerStripped || 0} conversational filler line(s) · Extracted ${l1.highRiskChunks || 0} high-risk actionable chunk(s).</p>
        </div>
      </div>
    `;
  } else if (padNum === '2') {
    // Layer 2: Deterministic Heuristics
    const l2 = p.layer2_heuristics || {};
    const rules = (l2.breakdown || []).map(b => `
      <div style="margin-top:6px; padding:4px 8px; background:#181920; border-radius:4px;">
        <strong>+${b.points} pts</strong> — ${escapeHtml(b.rule)}: <span style="color:var(--accent-cyan);">"${escapeHtml(b.match)}"</span>
      </div>
    `).join('');
    drawerTitle.textContent = `PAD P2 — LAYER 2: DETERMINISTIC HEURISTIC SCORER`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading"><span>HEURISTIC SCORE BREAKDOWN</span><span>${l2.totalScore || 0} / ${l2.threshold || currentThreshold} PTS</span></div>
        <div class="card-body">
          <p>Exceeds Trigger Threshold: <strong>${l2.exceedsThreshold ? 'YES (Multi-Agent Debate Invoked)' : 'NO (Fast Path)'}</strong></p>
          <div style="margin-top:8px;">${rules || 'No heuristic threat triggers matched.'}</div>
        </div>
      </div>
    `;
  } else if (padNum === '3') {
    // Layer 3: Multi-Agent Consensus Overview
    const l3 = p.layer3_consensus || {};
    const badgeClass = verdict === 'SCAM' ? 'consensus-strike' : (verdict === 'SUSPICIOUS' ? 'consensus-caution' : 'consensus-cleared');
    const badgeIcon = verdict === 'SCAM' ? '⚔️' : (verdict === 'SUSPICIOUS' ? '⚖️' : '🛡️');
    drawerTitle.textContent = `PAD P3 — LAYER 3: MULTI-AGENT CONSENSUS DEBATE`;
    drawerContent.innerHTML = `
      <div class="consensus-card-banner ${badgeClass}">
        <div class="consensus-icon">${badgeIcon}</div>
        <div>
          <div class="consensus-title">${verdict === 'SCAM' ? 'Confirmed by Consensus' : (verdict === 'SUSPICIOUS' ? 'Split Consensus' : 'Cleared by Consensus')}</div>
          <div class="consensus-reason">${escapeHtml(c.consensus_reasoning || 'Unanimous evaluation.')}</div>
          ${c.overruled_agent ? `<div style="margin-top:6px; font-size:0.7rem; color:var(--accent-amber);">Overruled Agent: <strong>${escapeHtml(c.overruled_agent === 'paranoiac' ? 'The Paranoiac (Threat Extractor)' : 'The Context Arbiter')}</strong></div>` : ''}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="card-heading"><span>MULTI-AGENT EXECUTION TRACE</span><span>${(l3.phase1TimeMs || 0) + (l3.phase2TimeMs || 0)}ms</span></div>
        <div class="card-body">
          <p><strong>Phase 1 (Parallel Investigation):</strong> ${l3.phase1TimeMs || 0}ms · Agent 1 (Paranoiac) + Agent 2 (Arbiter)</p>
          <p style="margin-top:4px;"><strong>Phase 2 (Serial Adjudication):</strong> ${l3.phase2TimeMs || 0}ms · Agent 3 (Chief Judge)</p>
        </div>
      </div>
    `;
  } else if (padNum === '4') {
    // Master Verdict
    const badgeClass = verdict === 'SCAM' ? 'consensus-strike' : (verdict === 'SUSPICIOUS' ? 'consensus-caution' : 'consensus-cleared');
    drawerTitle.textContent = `PAD P4 — MASTER VERDICT & RISK METRIC`;
    drawerContent.innerHTML = `
      <div class="consensus-card-banner ${badgeClass}">
        <div class="consensus-icon">${verdict === 'SCAM' ? '🚨' : '✅'}</div>
        <div>
          <div class="consensus-title">${verdict} (${c.risk_score || 0}% RISK) — ${escapeHtml(c.threat_category || 'Legitimate')}</div>
          <div class="consensus-reason">${escapeHtml(c.consensus_reasoning || 'Verified.')}</div>
        </div>
      </div>
    `;
  } else if (padNum === '5') {
    // Agent 1: The Paranoiac
    const l3 = p.layer3_consensus || {};
    const a1 = l3.agent1_paranoiac || {};
    const threats = (a1.threat_entities || []).map(t => `
      <div style="margin-top:6px; padding:4px 8px; background:#181920; border-radius:4px;">
        <span class="highlight-tag">[${escapeHtml(t.severity)}]</span> <strong>${escapeHtml(t.category)}:</strong> "${escapeHtml(t.text)}"
      </div>
    `).join('') || 'No threat entities found by Paranoiac.';
    drawerTitle.textContent = `PAD P5 — AGENT 1: THE PARANOIAC (THREAT EXTRACTOR)`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading"><span>PARANOIAC SCAN REPORT</span><span>${a1.threats_found || 0} THREATS</span></div>
        <div class="card-body">
          <p>Extracts raw exploit vectors, suspicious links, and credential-harvesting hooks without social context.</p>
          <div style="margin-top:8px;">${threats}</div>
        </div>
      </div>
    `;
  } else if (padNum === '6') {
    // Agent 2: Context Arbiter
    const l3 = p.layer3_consensus || {};
    const a2 = l3.agent2_arbiter || {};
    drawerTitle.textContent = `PAD P6 — AGENT 2: CONTEXT ARBITER (SOCIAL DYNAMICS)`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading">SOCIAL ENGINEERING & CONTEXT ANALYSIS</div>
        <div class="card-body">
          <p><strong>Scenario:</strong> ${escapeHtml(a2.scenario || 'Benign communication')}</p>
          <p style="margin-top:6px;"><strong>Power Dynamic:</strong> ${escapeHtml(a2.power_dynamic || 'Equitable')}</p>
          <p style="margin-top:6px;"><strong>Trust Pattern:</strong> ${escapeHtml(a2.trust_pattern || 'Natural')}</p>
          <p style="margin-top:6px;"><strong>Social Pressure Level:</strong> <span style="color:${(a2.social_pressure_level || '').toLowerCase() === 'high' ? 'var(--accent-red)' : 'var(--accent-green)'}; font-weight:700;">${escapeHtml(a2.social_pressure_level || 'Low')}</span></p>
        </div>
      </div>
    `;
  } else if (padNum === '7') {
    // Layer 4: Verification Gate
    const l4 = p.layer4_verification || {};
    const ent = d.extracted_entities || { urls: [], phones: [] };
    const urls = (ent.urls || []).map(u => `<span class="entity-badge">${escapeHtml(u)}</span>`).join('') || 'None';
    const phones = (ent.phones || []).map(ph => `<span class="entity-badge">${escapeHtml(ph)}</span>`).join('') || 'None';
    drawerTitle.textContent = `PAD P7 — LAYER 4: VERIFICATION GATE (DOMAIN & ENTITY CHECKS)`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading"><span>DOMAIN & ENTITY VERIFICATION</span><span>${l4.timeMs || 0}ms</span></div>
        <div class="card-body">
          <p><strong>Extracted URLs:</strong> ${urls}</p>
          <p style="margin-top:6px;"><strong>Extracted Phone Numbers:</strong> ${phones}</p>
          <p style="margin-top:8px;"><strong>Domain Findings:</strong> ${l4.totalFindings || 0} suspicious / blacklisted finding(s).</p>
        </div>
      </div>
    `;
  } else if (padNum === '8') {
    // Vernacular Threat Spans
    const spans = c.highlighted_spans || [];
    const spansList = spans.map(s => `
      <div style="margin-top:6px; padding:6px 8px; background:#181920; border-radius:4px;">
        <span class="highlight-tag">"${escapeHtml(s.text)}"</span>
        <div style="color:var(--text-secondary); font-size:0.72rem; margin-top:4px;">${escapeHtml(s.reason)}</div>
      </div>
    `).join('') || 'No vernacular threat spans flagged in this message.';
    drawerTitle.textContent = `PAD P8 — VERNACULAR THREAT SPANS & EXPLANATIONS`;
    drawerContent.innerHTML = `
      <div class="telemetry-card">
        <div class="card-heading"><span>HIGHLIGHTED DECEPTIVE SPANS</span><span>${spans.length} DETECTED</span></div>
        <div class="card-body">${spansList}</div>
      </div>
    `;
  }

  inspectorDrawer.classList.add('open');
}

// ============================================
// Copy Report & Copy JSON Actions
// ============================================

btnCopyReport.addEventListener('click', () => {
  if (!latestScanData) {
    alert('No scan data available yet. Please run a scan first.');
    return;
  }
  const d = latestScanData;
  const c = d.classification || {};
  const p = d.pipeline || {};

  const report = `# ShieldSMS Classification Report
- **Verdict:** ${c.verdict || 'SAFE'} (${c.risk_score || 0}% Risk)
- **Threat Category:** ${c.threat_category || 'None'}
- **Original Message:** "${d.original_message || ''}"
- **De-obfuscated Message:** "${d.normalized_message || ''}"
- **Consensus Reasoning:** ${c.consensus_reasoning || 'N/A'}
- **Overruled Agent:** ${c.overruled_agent || 'None'}
- **Execution Time:** ${p.processingTimeMs || 0}ms
`;

  navigator.clipboard.writeText(report).then(() => {
    btnCopyReport.textContent = 'COPIED!';
    playSynthTone(750, 'sine', 0.05);
    setTimeout(() => { btnCopyReport.textContent = '📋 REPORT'; }, 1500);
  });
});

btnCopyJson.addEventListener('click', () => {
  if (!latestScanData) {
    alert('No scan data available yet. Please run a scan first.');
    return;
  }
  navigator.clipboard.writeText(JSON.stringify(latestScanData, null, 2)).then(() => {
    btnCopyJson.textContent = 'COPIED!';
    playSynthTone(750, 'sine', 0.05);
    setTimeout(() => { btnCopyJson.textContent = '💾 JSON'; }, 1500);
  });
});

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
