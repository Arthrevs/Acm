import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Shield, AlertTriangle, CheckCircle2, ChevronRight, Copy, Search, ScanLine, X, FileText, Smartphone, Image as ImageIcon, Check } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PRESETS = [
  { label: 'KYC SCAM', text: 'Dear SBI User, your netbanking will be BLOCKED today. Please update PAN immediately on: http://sbi-kyc-update.co.in', color: 'bg-orange-500' },
  { label: 'ELEC SCAM', text: 'Dear customer, your electricity power will be disconnected at 9.30 PM today due to unpaid bill. Call our officer urgently: +91-8877665544', color: 'bg-blue-500' },
  { label: 'FEDEX SCAM', text: 'FedEx: Your parcel #893475 is detained by customs due to illegal items. Press 1 to speak with Narcotics Bureau or click http://fedex-customs-india.in', color: 'bg-cyan-500' },
  { label: 'SAFE CHAT', text: 'Maa, main ghar pahunch gaya. Khana kha liya hai. Chinta mat karna.', color: 'bg-green-500' },
  { label: 'SAFE OTP', text: 'Your Swiggy OTP for login is 549210. Do not share this with anyone. Swiggy employees will never ask for your OTP.', color: 'bg-pink-500' }
];

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [text, setText] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedPad, setSelectedPad] = useState(null);
  const [image, setImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Audio Context (cached)
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current && window.AudioContext) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playClick = (freq = 800, duration = 0.05) => {
    if (!audioEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  };

  const playScanDone = (isScam) => {
    if (isScam) {
      playClick(280, 0.15);
      setTimeout(() => playClick(220, 0.25), 120);
    } else {
      playClick(600, 0.1);
      setTimeout(() => playClick(880, 0.15), 100);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPad(null);
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleScan();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, image]);

  const handleScan = async () => {
    if (!text.trim() && !image) return;
    playClick(520, 0.08);
    setTimeout(() => playClick(780, 0.1), 90);
    
    setIsScanning(true);
    setScanResult(null);
    setSelectedPad(null);

    try {
      const payload = { message: text, threshold: 30 };
      if (image) {
        payload.image = { data: image.data.split(',')[1], mimeType: image.type };
      }
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setScanResult(data);
      playScanDone(data.classification?.verdict === 'SCAM');
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0] || e.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      playClick(550, 0.06);
      const reader = new FileReader();
      reader.onload = (ev) => setImage({ data: ev.target.result, type: file.type });
      reader.readAsDataURL(file);
    }
  };

  const isScam = scanResult?.classification?.verdict === 'SCAM';
  const isSuspicious = scanResult?.classification?.verdict === 'SUSPICIOUS';
  const riskScore = scanResult?.classification?.risk_score || 0;

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-mono text-zinc-300 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000",
        isScam ? "bg-red-500" : scanResult ? "bg-emerald-500" : "bg-zinc-800"
      )} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative w-full max-w-6xl glass-panel rounded-[20px] overflow-hidden flex flex-col shadow-2xl transition-all duration-700",
          isScam ? "border-red-500/30" : scanResult ? "border-emerald-500/30" : "border-white/10"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-colors duration-500",
              isScam ? "bg-red-500 shadow-red-500" : scanResult ? "bg-emerald-500 shadow-emerald-500" : "bg-zinc-500"
            )} />
            <div className="flex flex-col">
              <h1 className="font-display font-bold tracking-widest text-white text-sm">SHIELDSMS</h1>
              <span className="text-[10px] tracking-widest text-zinc-500">KOKONUT·ENGINE [V2]</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setAudioEnabled(!audioEnabled); playClick(); }}
              className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full bg-white/5"
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{audioEnabled ? 'SFX ON' : 'SFX OFF'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          
          {/* Left Column (Input & Action) */}
          <div className="w-full lg:w-[45%] flex flex-col border-r border-white/5 bg-black/20 z-10">
            
            <div 
              className={cn(
                "flex-1 relative p-6 flex flex-col transition-colors",
                isDragging && "bg-cyan-900/20"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
            >
              
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest mb-4">
                <span>Vernacular Payload</span>
                <span>{text.length} chars</span>
              </div>
              
              <div className="relative flex-1 flex flex-col group">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste SMS payload here or drop a screenshot..."
                  className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600 leading-relaxed font-mono z-10"
                />
                
                <AnimatePresence>
                  {image && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-4 relative rounded-lg overflow-hidden border border-white/10 bg-black/50 p-1 self-start group"
                    >
                      <img src={image.data} alt="Screenshot" className="h-32 object-contain rounded" />
                      <button 
                        onClick={() => { playClick(); setImage(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-500/80 rounded-md text-white backdrop-blur-md transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Drag Overlay */}
                <AnimatePresence>
                  {isDragging && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-cyan-500/50 rounded-xl bg-cyan-950/20 backdrop-blur-sm"
                    >
                      <span className="text-cyan-400 font-bold tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full">DROP IMAGE FOR OCR</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Presets */}
              <div className="mt-6 flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { playClick(); setText(p.text); setImage(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white transition-all"
                  >
                    <span className={cn("w-2 h-2 rounded-full", p.color)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-white/5 bg-black/40">
              <button
                onClick={handleScan}
                disabled={isScanning || (!text.trim() && !image)}
                className={cn(
                  "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold tracking-widest transition-all duration-500 overflow-hidden relative group",
                  isScanning ? "bg-cyan-950 text-cyan-400 border border-cyan-500/30" : 
                  isScam ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]" :
                  scanResult ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]" :
                  "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {isScanning ? <ScanLine className="animate-pulse" size={18} /> : <Search size={18} />}
                <span>{isScanning ? 'ANALYZING PIPELINE...' : 'RUN PIPELINE'}</span>
                
                {!isScanning && !scanResult && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
              </button>
            </div>
          </div>

          {/* Right Column (Telemetry & Pads) */}
          <div className="w-full lg:w-[55%] flex flex-col relative bg-black/10">
            
            {/* Risk Meter Header */}
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-end mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 tracking-widest font-bold">MASTER CLASSIFICATION</span>
                  <span className={cn(
                    "text-xl font-display font-bold tracking-widest mt-1 transition-colors duration-500",
                    isScam ? "text-red-500" : scanResult ? "text-emerald-500" : "text-white"
                  )}>
                    {scanResult?.classification?.verdict || "READY"}
                  </span>
                </div>
                <span className="text-3xl font-display font-bold text-white/90">
                  {riskScore}<span className="text-lg text-zinc-500">%</span>
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${riskScore}%` }}
                  transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                  className={cn(
                    "h-full rounded-full",
                    isScam ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" : "bg-emerald-500"
                  )}
                />
              </div>
            </div>

            {/* Matrix Grid or Inspector */}
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedPad ? (
                  <InspectorView 
                    key="inspector" 
                    pad={selectedPad} 
                    data={scanResult} 
                    onClose={() => { playClick(); setSelectedPad(null); }} 
                  />
                ) : (
                  <MatrixGrid 
                    key="grid" 
                    data={scanResult} 
                    onSelect={(pad) => { playClick(); setSelectedPad(pad); }} 
                  />
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </motion.div>
    </main>
  );
}

// -------------------------------------------------------------
// Security Matrix Grid View
// -------------------------------------------------------------
function MatrixGrid({ data, onSelect }) {
  const c = data?.classification;
  const p = data?.pipeline;
  const l1 = p?.layer1_context;
  const l2 = p?.layer2_heuristics;
  const l3 = p?.layer3_consensus;
  const l4 = p?.layer4_verification;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 p-6 grid grid-cols-2 gap-3 content-start overflow-y-auto"
    >
      <PadCard 
        id="L1" label="CONTEXT NORM" 
        value={data ? `${l1?.filteredLines} LNS · ${l1?.highRiskChunks} RISK` : "STANDBY"}
        icon={FileText} onClick={() => onSelect('L1')} active={!!data}
      />
      <PadCard 
        id="L2" label="HEURISTICS" 
        value={data ? `${l2?.totalScore} / ${l2?.threshold} PTS` : "STANDBY"}
        icon={AlertTriangle} onClick={() => onSelect('L2')} active={!!data}
      />
      <PadCard 
        id="L3" label="CONSENSUS DEBATE" 
        value={data ? (l3?.invoked ? "3 AGENTS VOTED" : "SKIPPED") : "STANDBY"}
        icon={Shield} onClick={() => onSelect('L3')} active={!!data}
      />
      <PadCard 
        id="A1" label="AGENT: PARANOIAC" 
        value={data ? `${l3?.agent1_paranoiac?.threats_found || 0} THREATS` : "STANDBY"}
        alert={l3?.agent1_paranoiac?.threats_found > 0}
        icon={Search} onClick={() => onSelect('A1')} active={!!data}
      />
      <PadCard 
        id="A2" label="AGENT: ARBITER" 
        value={data ? `${l3?.agent2_arbiter?.social_pressure_level || "LOW"} PRESSURE` : "STANDBY"}
        alert={l3?.agent2_arbiter?.social_pressure_level === 'HIGH'}
        icon={Smartphone} onClick={() => onSelect('A2')} active={!!data}
      />
      <PadCard 
        id="L4" label="VERIFICATION GATE" 
        value={data ? `${l4?.totalFindings || 0} DOMAIN FLAGS` : "STANDBY"}
        alert={l4?.totalFindings > 0}
        icon={CheckCircle2} onClick={() => onSelect('L4')} active={!!data}
      />
    </motion.div>
  );
}

function PadCard({ id, label, value, active, alert, icon: Icon, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.04)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col justify-between p-4 rounded-xl border text-left transition-colors relative overflow-hidden h-[120px]",
        alert ? "border-red-500/40 bg-red-500/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" : 
        active ? "border-white/10 bg-white/5" : "border-white/5 bg-transparent"
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 p-3 opacity-20 transition-colors",
        alert ? "text-red-500" : active ? "text-white" : "text-zinc-600"
      )}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1 z-10">
        <span className="text-[10px] text-zinc-500 tracking-widest font-bold">{label}</span>
        <span className={cn(
          "text-sm font-bold tracking-wider",
          alert ? "text-red-400" : active ? "text-white" : "text-zinc-500"
        )}>
          {value}
        </span>
      </div>
      <div className="flex items-center justify-between w-full mt-auto text-[9px] text-zinc-600 tracking-widest font-bold">
        <span>PAD {id}</span>
        <ChevronRight size={12} />
      </div>
    </motion.button>
  );
}

// -------------------------------------------------------------
// Detailed Inspector View
// -------------------------------------------------------------
function InspectorView({ pad, data, onClose }) {
  const [copied, setCopied] = useState(false);
  
  if (!data) {
    return (
      <div className="absolute inset-0 p-6 flex items-center justify-center">
        <span className="text-zinc-500 text-sm">NO DATA. RUN SCAN FIRST.</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const c = data.classification;
  const p = data.pipeline;

  let title = '';
  let content = null;

  switch(pad) {
    case 'L1':
      title = 'LAYER 1: CONTEXT NORMALIZATION';
      content = (
        <div className="flex flex-col gap-4 text-sm text-zinc-400">
          <div className="p-4 rounded-lg bg-black/40 border border-white/5">
            <span className="block text-[10px] text-zinc-500 mb-2 tracking-widest">DE-OBFUSCATED PAYLOAD</span>
            <span className="text-white">"{data.normalized_message}"</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="block text-[10px] text-zinc-500 mb-1">FILTERED LINES</span>
              <span className="text-white text-lg">{p.layer1_context.filteredLines}</span>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-black/20 border border-white/5">
              <span className="block text-[10px] text-zinc-500 mb-1">LATENCY</span>
              <span className="text-white text-lg">{p.layer1_context.timeMs}ms</span>
            </div>
          </div>
        </div>
      );
      break;
    case 'L2':
      title = 'LAYER 2: HEURISTICS';
      content = (
        <div className="flex flex-col gap-4 text-sm text-zinc-400">
          <div className="flex gap-4 items-center p-4 rounded-lg bg-black/20 border border-white/5">
            <span className="text-2xl font-display text-white">{p.layer2_heuristics.totalScore}</span>
            <span className="text-zinc-500">/ {p.layer2_heuristics.threshold} PTS</span>
          </div>
          <div className="flex flex-col gap-2">
            {p.layer2_heuristics.breakdown?.length > 0 ? p.layer2_heuristics.breakdown.map((b, i) => (
              <div key={i} className="p-3 rounded-md bg-black/40 border border-white/5 flex justify-between">
                <span>{b.rule}</span>
                <span className="text-cyan-400">+{b.points}</span>
              </div>
            )) : <span className="p-3">No deterministic heuristics triggered.</span>}
          </div>
        </div>
      );
      break;
    case 'L3':
      title = 'LAYER 3: CONSENSUS DEBATE';
      const verdictScam = c.verdict === 'SCAM';
      content = (
        <div className="flex flex-col gap-4 text-sm">
          <div className={cn(
            "p-4 rounded-lg border",
            verdictScam ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"
          )}>
            <span className={cn("font-bold", verdictScam ? "text-red-400" : "text-emerald-400")}>
              {verdictScam ? "Confirmed by Consensus" : "Cleared by Consensus"}
            </span>
            <p className="mt-2 text-zinc-300 leading-relaxed">{c.consensus_reasoning}</p>
            {c.overruled_agent && (
              <span className="block mt-3 text-xs text-orange-400">Overruled: {c.overruled_agent}</span>
            )}
          </div>
        </div>
      );
      break;
    case 'A1':
      title = 'AGENT 1: PARANOIAC';
      content = (
        <div className="flex flex-col gap-3 text-sm">
          {p.layer3_consensus.agent1_paranoiac?.threat_entities?.map((t, i) => (
            <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5">
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs mr-2">{t.severity}</span>
              <span className="text-white font-bold">{t.category}: </span>
              <span className="text-zinc-400">"{t.text}"</span>
            </div>
          )) || <span className="text-zinc-500">No threat entities extracted.</span>}
        </div>
      );
      break;
    case 'A2':
      title = 'AGENT 2: ARBITER';
      const a2 = p.layer3_consensus.agent2_arbiter;
      content = a2 ? (
        <div className="flex flex-col gap-3 text-sm text-zinc-300">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><span className="text-zinc-500 block text-xs">Scenario:</span> {a2.scenario}</div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><span className="text-zinc-500 block text-xs">Power Dynamic:</span> {a2.power_dynamic}</div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <span className="text-zinc-500 block text-xs">Social Pressure:</span> 
            <span className={a2.social_pressure_level === 'HIGH' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{a2.social_pressure_level}</span>
          </div>
        </div>
      ) : <span className="text-zinc-500">Arbiter skipped.</span>;
      break;
    case 'L4':
      title = 'LAYER 4: VERIFICATION GATE';
      content = (
        <div className="flex flex-col gap-3 text-sm">
          {p.layer4_verification.findings?.map((f, i) => (
             <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
               {f.finding}
             </div>
          )) || <span className="text-zinc-500">Gate verified clean. No domain red flags.</span>}
        </div>
      );
      break;
    default:
      content = <div>Select a pad for telemetry details.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col z-30"
    >
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3 text-zinc-300">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={18} className="rotate-180" /></button>
          <span className="font-bold tracking-widest text-xs">{title}</span>
        </div>
        <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white" title="Copy JSON">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {content}
      </div>
    </motion.div>
  );
}
