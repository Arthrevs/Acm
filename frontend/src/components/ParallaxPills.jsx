import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { 
  AlertTriangle, 
  PhoneCall, 
  Zap, 
  Lock, 
  Smartphone, 
  FileWarning, 
  CreditCard,
  Sparkles
} from 'lucide-react';

const DEFAULT_PILLS = [
  {
    id: 'p1',
    label: 'KYC Suspension',
    icon: Lock,
    category: 'banking',
    depth: 1.4,
    x: '8%',
    y: '22%',
    color: '#ff4d4f',
    bg: 'rgba(255, 77, 79, 0.12)',
    border: 'rgba(255, 77, 79, 0.3)',
    sampleText: 'Dear SBI User, your netbanking will be BLOCKED today. Update PAN on: http://sbi-kyc-update.co.in'
  },
  {
    id: 'p2',
    label: '⚡ Electricity Cut',
    icon: Zap,
    category: 'utility',
    depth: 0.9,
    x: '42%',
    y: '14%',
    color: '#faad14',
    bg: 'rgba(250, 173, 20, 0.12)',
    border: 'rgba(250, 173, 20, 0.3)',
    sampleText: 'Mahavitaran Alert: Power disconnect at 9:30 PM tonight due to unpaid bill. Call officer: 9876543210'
  },
  {
    id: 'p3',
    label: '📞 Dial 1930 Helpline',
    icon: PhoneCall,
    category: 'hotline',
    depth: 1.6,
    x: '75%',
    y: '28%',
    color: '#52c41a',
    bg: 'rgba(82, 196, 26, 0.14)',
    border: 'rgba(82, 196, 26, 0.35)',
    sampleText: 'I4C National Cyber Crime Reporting Portal helpline active 24x7.'
  },
  {
    id: 'p4',
    label: 'Digital Arrest Scam',
    icon: AlertTriangle,
    category: 'extortion',
    depth: 1.2,
    x: '18%',
    y: '65%',
    color: '#ff7875',
    bg: 'rgba(255, 120, 117, 0.12)',
    border: 'rgba(255, 120, 117, 0.3)',
    sampleText: 'CBI NOTICE: Your Aadhaar linked to narcotics courier seized in Mumbai. Join Skype interrogation urgently.'
  },
  {
    id: 'p5',
    label: '🛡️ I4C Legal Dossier',
    icon: FileWarning,
    category: 'protocol',
    depth: 1.8,
    x: '52%',
    y: '72%',
    color: '#13c2c2',
    bg: 'rgba(19, 194, 194, 0.12)',
    border: 'rgba(19, 194, 194, 0.35)',
    sampleText: 'Automated evidentiary threat dossier formatted for state cyber cell filing.'
  },
  {
    id: 'p6',
    label: 'TRAI SIM Port Fraud',
    icon: Smartphone,
    category: 'telecom',
    depth: 1.0,
    x: '80%',
    y: '68%',
    color: '#f759ab',
    bg: 'rgba(247, 89, 171, 0.12)',
    border: 'rgba(247, 89, 171, 0.3)',
    sampleText: 'TRAI Alert: Your SIM will be blocked in 2 hrs. Send PORT 9876543210 to 1900 to retain services.'
  },
  {
    id: 'p7',
    label: 'Fake OTP Interceptor',
    icon: CreditCard,
    category: 'credential',
    depth: 0.7,
    x: '34%',
    y: '42%',
    color: '#9254de',
    bg: 'rgba(146, 84, 222, 0.12)',
    border: 'rgba(146, 84, 222, 0.3)',
    sampleText: 'Your Swiggy login OTP is 549210. Never share this code with anyone.'
  }
];

const DEFAULT_BG_PILLS = [
  { id: 'bg1', x: '5%', y: '10%', width: '110px', height: '32px', depth: 0.4, opacity: 0.25 },
  { id: 'bg2', x: '88%', y: '12%', width: '130px', height: '36px', depth: 0.5, opacity: 0.2 },
  { id: 'bg3', x: '25%', y: '82%', width: '90px', height: '28px', depth: 0.35, opacity: 0.2 },
  { id: 'bg4', x: '68%', y: '86%', width: '120px', height: '34px', depth: 0.45, opacity: 0.25 },
  { id: 'bg5', x: '60%', y: '4%', width: '80px', height: '26px', depth: 0.3, opacity: 0.15 }
];

function ParallaxPillItem({ pill, index, smoothMouseX, smoothMouseY, parallaxStrength, hingeAngle, entryStiffness, entryDamping, onPillClick }) {
  const IconComponent = pill.icon || AlertTriangle;
  const xOffset = useTransform(smoothMouseX, (val) => val * parallaxStrength * pill.depth);
  const yOffset = useTransform(smoothMouseY, (val) => val * parallaxStrength * pill.depth);
  const tiltOffset = useTransform(smoothMouseX, (val) => val * (hingeAngle * pill.depth * 0.4));

  return (
    <motion.button
      onClick={() => onPillClick(pill)}
      style={{
        left: pill.x,
        top: pill.y,
        x: xOffset,
        y: yOffset,
        rotate: tiltOffset,
        backgroundColor: pill.bg || 'rgba(255,255,255,0.06)',
        borderColor: pill.border || 'rgba(255,255,255,0.15)',
        color: pill.color || '#ffffff'
      }}
      initial={{ 
        opacity: 0, 
        y: 35, 
        scale: 0.85, 
        rotate: (index % 2 === 0 ? -1 : 1) * hingeAngle 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        rotate: 0 
      }}
      transition={{
        type: 'spring',
        stiffness: entryStiffness,
        damping: entryDamping,
        delay: index * 0.07
      }}
      whileHover={{
        scale: 1.08,
        boxShadow: `0 8px 24px -4px ${pill.color}40`,
        zIndex: 30
      }}
      whileTap={{
        scale: 0.94
      }}
      className="absolute z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide backdrop-blur-md cursor-pointer transition-colors shadow-lg group focus:outline-none focus:ring-2 focus:ring-[#FF6347]/50"
    >
      {IconComponent && (
        <IconComponent 
          className="w-3.5 h-3.5 transition-transform group-hover:scale-110" 
          style={{ color: pill.color }}
        />
      )}
      <span className="font-sans font-medium text-zinc-100 group-hover:text-white transition-colors">
        {pill.label}
      </span>
    </motion.button>
  );
}

function ParallaxBgPillItem({ bgPill, index, smoothMouseX, smoothMouseY, parallaxStrength }) {
  const xOffset = useTransform(smoothMouseX, (val) => val * parallaxStrength * bgPill.depth * -0.6);
  const yOffset = useTransform(smoothMouseY, (val) => val * parallaxStrength * bgPill.depth * -0.6);

  return (
    <motion.div
      style={{
        left: bgPill.x,
        top: bgPill.y,
        width: bgPill.width,
        height: bgPill.height,
        x: xOffset,
        y: yOffset,
        opacity: bgPill.opacity
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: bgPill.opacity, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.08 }}
      className="absolute rounded-full border border-white/10 bg-white/[0.04] pointer-events-none filter blur-[0.5px]"
    />
  );
}

/**
 * ParallaxPills Component — React Bits Pro Spec
 * Bouncy labeled pills drifting with cursor physics and spring damping.
 */
export default function ParallaxPills({
  pills = DEFAULT_PILLS,
  backgroundPills = DEFAULT_BG_PILLS,
  parallaxStrength = 36,
  parallaxStiffness = 120,
  parallaxDamping = 18,
  entryStiffness = 140,
  entryDamping = 14,
  hingeAngle = 12,
  onPillClick = () => {},
  className = ''
}) {
  const containerRef = useRef(null);

  // Mouse coords normalized (-1 to 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for fluid cursor tracking
  const springConfig = { stiffness: parallaxStiffness, damping: parallaxDamping };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.08] backdrop-blur-md select-none transition-all duration-300 ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* Background Decorative Depth Pills */}
      {backgroundPills.map((bgPill, i) => (
        <ParallaxBgPillItem
          key={bgPill.id || i}
          bgPill={bgPill}
          index={i}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          parallaxStrength={parallaxStrength}
        />
      ))}

      {/* Floating Center Intel Banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[0.72rem] text-zinc-400 font-mono tracking-wider uppercase mb-1">
          <Sparkles className="w-3 h-3 text-[#FF6347] animate-pulse" />
          <span>Threat Vector Stream // React Bits Pro</span>
        </div>
        <p className="text-xs text-zinc-500 font-medium">Hover to drift · Tap pill to analyze sample</p>
      </div>

      {/* Foreground Interactive Labeled Pills */}
      {pills.map((pill, index) => (
        <ParallaxPillItem
          key={pill.id}
          pill={pill}
          index={index}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          parallaxStrength={parallaxStrength}
          hingeAngle={hingeAngle}
          entryStiffness={entryStiffness}
          entryDamping={entryDamping}
          onPillClick={onPillClick}
        />
      ))}
    </div>
  );
}
