import React, { useRef, useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  ShieldCheck, 
  HeartHandshake, 
  Zap, 
  Lock, 
  ExternalLink,
  Radio,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const SCAM_INTEL_CARDS = [
  {
    id: 'c1',
    category: 'LIVE ALERT',
    type: 'alert',
    windowId: 'THREAT://01',
    statusBadge: 'CRITICAL',
    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/25',
    icon: Zap,
    title: 'Electricity Disconnection Trap',
    snippet: 'Urgent SMS: "Power cut tonight at 9:30 PM due to unpaid bill. Call officer immediately."',
    actionTip: 'DISCOMs never share 10-digit private mobile numbers or request QuickSupport APK installs.',
    tag: 'Trending in MH, DL, UP',
    actionText: 'Report to 1930',
    link: 'https://cybercrime.gov.in'
  },
  {
    id: 'c2',
    category: 'EMERGENCY 24x7',
    type: 'helpline',
    windowId: 'HOTLINE://1930',
    statusBadge: '24x7 ACTIVE',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    icon: PhoneCall,
    title: 'Dial 1930 — National Cyber Helpline',
    snippet: 'Report financial cyber fraud within the "Golden Hour" for highest chance of freezing stolen funds.',
    actionTip: 'Operated by Indian Cyber Crime Coordination Centre (I4C), MHA.',
    tag: 'Govt. of India Hotline',
    actionText: 'Call 1930 Helpline',
    link: 'tel:1930'
  },
  {
    id: 'c3',
    category: 'TRENDING MODUS',
    type: 'modus',
    windowId: 'MODUS://03',
    statusBadge: 'HIGH ALERT',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon: AlertTriangle,
    title: 'Digital Arrest / Video Call Extortion',
    snippet: 'Scammers pose as CBI/ED/Customs via Skype video backgrounds demanding secret "verification" deposits.',
    actionTip: 'Police and Courts NEVER conduct "Digital Arrest" or demand bank transfers on camera.',
    tag: 'MHA Advisory Active',
    actionText: 'Learn Modus',
    link: 'https://cybercrime.gov.in'
  },
  {
    id: 'c4',
    category: 'FEEL-GOOD SUPPORT',
    type: 'support',
    windowId: 'SUPPORT://HAVEN',
    statusBadge: 'SAFE SPACE',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    icon: HeartHandshake,
    title: 'Zero-Shame Safe Space',
    snippet: 'Scammers exploit psychological fear & artificial urgency. If you were targeted, remember it is NOT your fault.',
    actionTip: 'Take a breath, preserve chat/payment screenshots, freeze your cards, and reach out for assistance.',
    tag: 'Victim Support Alliance',
    actionText: 'Get Guided Steps',
    link: 'https://cybercrime.gov.in'
  },
  {
    id: 'c5',
    category: 'TASK FRAUD',
    type: 'alert',
    windowId: 'TRAP://TELEGRAM',
    statusBadge: 'HIGH RISK',
    badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    icon: Zap,
    title: 'Telegram "Like & Review" Part-Time Jobs',
    snippet: 'Starts with ₹150 Google reviews payout, lures victims into depositing lakhs for "Prepaid Crypto Tasks".',
    actionTip: 'Legitimate employers never ask you to pay deposits to withdraw your hard-earned wages.',
    tag: 'High Financial Loss',
    actionText: 'Block & Report',
    link: 'https://sancharsaathi.gov.in'
  },
  {
    id: 'c6',
    category: 'PROACTIVE SHIELD',
    type: 'shield',
    windowId: 'DEFENSE://AEPS',
    statusBadge: '1-MIN LOCK',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    icon: Lock,
    title: 'Lock Aadhaar Biometrics (AePS Defense)',
    snippet: 'Prevent rogue micro-ATM and biometric withdrawal scams by locking fingerprints via the mAadhaar app.',
    actionTip: 'Unlocks instantly in 5 seconds only when you actually need biometric authentication.',
    tag: '1-Minute Cyber Hygiene',
    actionText: 'UIDAI Portal',
    link: 'https://myaadhaar.uidai.gov.in'
  },
  {
    id: 'c7',
    category: 'DO-T CITIZEN TOOL',
    type: 'helpline',
    windowId: 'PORTAL://CHAKSHU',
    statusBadge: 'VERIFIED',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    icon: ShieldCheck,
    title: 'Chakshu Portal — Sanchar Saathi',
    snippet: 'Report suspicious WhatsApp numbers, fraudulent SMS sender IDs, and verify all SIM cards in your name.',
    actionTip: 'Telecom operators blacklist numbers within hours of verification.',
    tag: 'Govt. Telecom Shield',
    actionText: 'Open Chakshu',
    link: 'https://sancharsaathi.gov.in'
  }
];

export default function SkewedCarousel({ 
  cards = SCAM_INTEL_CARDS, 
  className = '' 
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const scrollPosRef = useRef(0);
  const rafRef = useRef(null);

  // Triple set for smooth infinite loop
  const displayCards = [...cards, ...cards, ...cards];

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let singleSetWidth = 360 * cards.length;

    const updateTransforms = () => {
      if (!isHovered && !isDraggingRef.current) {
        scrollPosRef.current += 0.8;
      }

      if (scrollPosRef.current >= singleSetWidth) {
        scrollPosRef.current -= singleSetWidth;
      } else if (scrollPosRef.current < 0) {
        scrollPosRef.current += singleSetWidth;
      }

      track.style.transform = `translateX(${-scrollPosRef.current}px)`;

      const vpRect = viewport.getBoundingClientRect();
      const vpCenter = vpRect.left + vpRect.width / 2;
      const halfVp = vpRect.width / 2 || 400;

      const cardEls = track.querySelectorAll('.react-skew-card');
      cardEls.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = (cardCenter - vpCenter) / halfVp;
        const clampedDist = Math.max(-2, Math.min(2, dist));
        const absDist = Math.abs(clampedDist);

        const rotY = clampedDist * -28;
        const scale = 1.05 - Math.min(0.24, absDist * 0.14);
        const transZ = (1 - Math.min(1, absDist)) * 30;
        const opacity = 1 - Math.min(0.45, absDist * 0.22);
        const zIndex = Math.round(100 - absDist * 25);

        card.style.transform = `rotateY(${rotY}deg) scale(${scale}) translateZ(${transZ}px)`;
        card.style.opacity = opacity.toFixed(2);
        card.style.zIndex = zIndex;
      });

      rafRef.current = requestAnimationFrame(updateTransforms);
    };

    rafRef.current = requestAnimationFrame(updateTransforms);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHovered, cards.length]);

  const handlePrev = () => {
    scrollPosRef.current -= 360;
  };

  const handleNext = () => {
    scrollPosRef.current += 360;
  };

  return (
    <div className={`relative w-full overflow-hidden py-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex items-center justify-between px-6 mb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200 flex items-center gap-2">
            <span>LIVE THREAT RADAR & HELPLINES</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-normal">// 3D CASCADING FEED</span>
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              title="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              title="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 font-mono pl-2 border-l border-white/10">
            <span className="flex items-center gap-1"><Radio size={12} className="text-emerald-400 animate-pulse" /> Live Stream</span>
            <span className="text-zinc-600">•</span>
            <span>Hover to Pause</span>
          </div>
        </div>
      </div>

      {/* 3D Viewport with generous top/bottom padding to prevent clipping */}
      <div 
        ref={viewportRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full overflow-hidden select-none py-10"
        style={{
          perspective: '1100px',
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'
        }}
      >
        <div 
          ref={trackRef}
          className="flex w-max gap-6 transition-transform duration-75 ease-out"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {displayCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={`${card.id}-${idx}`}
                className="react-skew-card group relative w-[330px] sm:w-[350px] shrink-0 rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
              >
                {/* macOS Window Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider">{card.windowId}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{card.statusBadge}</span>
                </div>

                {/* Card Inner Content */}
                <div className="p-5 flex flex-col gap-3">
                  {/* Card Top Pill & Region */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${card.badgeColor}`}>
                      <Icon size={12} strokeWidth={2.5} />
                      {card.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {card.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {card.title}
                  </h4>

                  {/* Snippet */}
                  <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 font-sans">
                    {card.snippet}
                  </p>

                  {/* Shield Advice */}
                  <div className="rounded-xl bg-black/50 border border-white/5 p-2.5 text-[11px] text-zinc-400 leading-normal">
                    <span className="text-zinc-200 font-semibold">Shield Tip: </span>
                    {card.actionTip}
                  </div>

                  {/* Card Footer Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                    <a
                      href={card.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white font-bold transition-colors group-hover:underline"
                    >
                      <span>{card.actionText}</span>
                      <ExternalLink size={11} className="opacity-70 group-hover:opacity-100" />
                    </a>
                    <span className="text-[10px] text-zinc-600 uppercase">Verified Alert</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
