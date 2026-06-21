import React from 'react';

// Reusable SVG wrapper
const SvgWrapper = ({ className, children, viewBox = "0 0 100 100" }) => (
  <svg viewBox={viewBox} className={`pointer-events-none ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const BananaTree = ({ className }) => (
  <SvgWrapper className={className}>
    {/* Trunk */}
    <path d="M45,90 Q45,60 50,30 Q55,60 55,90 Z" fill="currentColor" opacity="0.2"/>
    <path d="M45,90 Q45,60 50,30" />
    <path d="M55,90 Q55,60 50,30" />
    {/* Leaves */}
    <path d="M50,30 Q30,10 10,30 Q30,25 50,30 Z" />
    <path d="M50,30 Q70,10 90,30 Q70,25 50,30 Z" />
    <path d="M50,30 Q20,30 15,50 Q30,40 50,30 Z" />
    <path d="M50,30 Q80,30 85,50 Q70,40 50,30 Z" />
    <path d="M50,30 Q40,0 50,5 Q60,0 50,30 Z" />
    {/* Veins */}
    <path d="M30,20 L35,25 M70,20 L65,25 M32,40 L40,35 M68,40 L60,35" strokeWidth="0.5" />
  </SvgWrapper>
);

export const VillageHouse = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 120 100">
    {/* Roof */}
    <path d="M10,60 L60,20 L110,60" />
    <path d="M15,60 L60,25 L105,60" />
    {/* Roof thatch lines */}
    <path d="M30,45 L35,55 M50,30 L50,45 M80,40 L75,50 M60,20 L60,30" strokeWidth="0.5"/>
    {/* Walls */}
    <path d="M25,60 L25,90 L95,90 L95,60" />
    {/* Door */}
    <path d="M50,90 L50,70 L70,70 L70,90" />
    <path d="M55,70 Q60,65 65,70" />
  </SvgWrapper>
);

export const TempleGopuram = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 100 120">
    <path d="M20,110 L80,110 L75,90 L25,90 Z" />
    <path d="M25,90 L75,90 L70,70 L30,70 Z" />
    <path d="M30,70 L70,70 L65,50 L35,50 Z" />
    <path d="M35,50 L65,50 L60,30 L40,30 Z" />
    <path d="M40,30 L60,30 L55,15 L45,15 Z" />
    <path d="M45,15 L50,5 L55,15" />
    {/* Details */}
    <path d="M45,100 L55,100 L55,90 L45,90 Z" />
    <path d="M45,80 L55,80 L55,70 L45,70 Z" />
    <path d="M48,60 L52,60 M48,40 L52,40" strokeWidth="0.5"/>
  </SvgWrapper>
);

export const CoconutTree = ({ className }) => (
  <SvgWrapper className={className}>
    <path d="M45,95 Q55,60 50,20" strokeWidth="2" />
    <path d="M52,95 Q62,60 55,20" />
    {/* Fronds */}
    <path d="M50,20 Q20,10 10,40" />
    <path d="M50,20 Q80,10 90,40" />
    <path d="M50,20 Q20,30 25,60" />
    <path d="M50,20 Q80,30 75,60" />
    <path d="M50,20 Q30,-10 50,-5" />
    <path d="M50,20 Q70,-10 50,-5" />
    <circle cx="48" cy="25" r="3" />
    <circle cx="55" cy="23" r="2.5" />
  </SvgWrapper>
);

export const KolamPattern = ({ className }) => (
  <SvgWrapper className={className}>
    <circle cx="50" cy="50" r="40" strokeDasharray="2 4" />
    <path d="M50,10 C70,10 70,50 90,50 C70,50 70,90 50,90 C30,90 30,50 10,50 C30,50 30,10 50,10 Z" />
    <path d="M22,22 L78,78 M22,78 L78,22" />
    <circle cx="50" cy="50" r="5" />
    <circle cx="50" cy="20" r="2" fill="currentColor"/>
    <circle cx="50" cy="80" r="2" fill="currentColor"/>
    <circle cx="20" cy="50" r="2" fill="currentColor"/>
    <circle cx="80" cy="50" r="2" fill="currentColor"/>
  </SvgWrapper>
);

export const PalmLeafManuscript = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 120 60">
    <path d="M10,20 L110,20 L115,30 L110,40 L10,40 L5,30 Z" />
    <path d="M15,25 L105,25 M15,30 L105,30 M15,35 L105,35" strokeWidth="0.5" strokeDasharray="3 2" />
    <circle cx="20" cy="30" r="2" />
    <circle cx="100" cy="30" r="2" />
    <path d="M20,30 Q30,10 40,5 M100,30 Q90,50 80,55" strokeWidth="0.5"/> {/* Binding cord */}
  </SvgWrapper>
);

export const BullockCart = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 120 80">
    {/* Wheels */}
    <circle cx="35" cy="60" r="15" />
    <circle cx="35" cy="60" r="2" />
    <path d="M20,60 L50,60 M35,45 L35,75 M25,50 L45,70 M25,70 L45,50" strokeWidth="0.5" />
    <circle cx="85" cy="60" r="10" strokeWidth="0.5" opacity="0.5" /> {/* Far wheel */}
    {/* Cart Body */}
    <path d="M20,45 L70,45 L85,25 L15,25 Z" />
    {/* Cover/Hood */}
    <path d="M15,25 Q45,0 85,25" />
    {/* Shaft */}
    <path d="M70,45 L110,50" />
    {/* Bullock (abstract) */}
    <path d="M100,45 Q110,35 115,45 L115,65" />
    <path d="M105,45 L105,65" />
    <path d="M102,40 Q105,35 105,30" /> {/* Horn */}
  </SvgWrapper>
);

export const EarthenPot = ({ className }) => (
  <SvgWrapper className={className}>
    <path d="M35,20 L65,20 L60,30 L40,30 Z" />
    <path d="M40,30 Q10,50 30,80 Q50,90 70,80 Q90,50 60,30" />
    <path d="M35,20 Q50,15 65,20" />
    <path d="M25,55 Q50,65 75,55" strokeWidth="0.5" />
    <path d="M30,65 Q50,75 70,65" strokeWidth="0.5" />
    {/* Kolam design on pot */}
    <circle cx="50" cy="55" r="5" strokeWidth="0.5" />
  </SvgWrapper>
);

export const BananaLeafLarge = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 200 100">
    <path d="M10,50 C10,10 80,0 180,40 C190,45 195,50 190,55 C150,90 50,100 10,50 Z" fill="currentColor" opacity="0.05"/>
    <path d="M10,50 C10,10 80,0 180,40 C190,45 195,50 190,55 C150,90 50,100 10,50 Z" />
    <path d="M10,50 C60,40 120,40 180,40" />
    {/* Veins */}
    <path d="M40,46 Q35,30 25,25 M60,45 Q55,20 40,15 M80,44 Q75,15 60,10 M100,44 Q95,15 80,10" strokeWidth="0.5" opacity="0.5"/>
    <path d="M40,46 Q35,70 25,75 M60,45 Q55,80 40,85 M80,44 Q75,85 60,90 M100,44 Q95,85 80,90" strokeWidth="0.5" opacity="0.5"/>
  </SvgWrapper>
);

export const LedgerSeal = ({ className }) => (
  <SvgWrapper className={className}>
    <circle cx="50" cy="50" r="40" strokeWidth="2" strokeDasharray="4 2"/>
    <circle cx="50" cy="50" r="32" strokeWidth="1"/>
    <path d="M35,50 L65,50 M50,35 L50,65" strokeWidth="0.5"/>
    <text x="50" y="55" fontSize="12" textAnchor="middle" fill="currentColor" stroke="none" className="font-serif font-bold tracking-widest">MOI</text>
    <path d="M30,70 Q50,90 70,70" strokeWidth="1" />
  </SvgWrapper>
);

export const LedgerRuler = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 200 40">
    <rect x="10" y="10" width="180" height="20" />
    <path d="M20,10 L20,15 M30,10 L30,15 M40,10 L40,18 M50,10 L50,15 M60,10 L60,15 M70,10 L70,18" strokeWidth="0.5" />
    <path d="M80,10 L80,15 M90,10 L90,15 M100,10 L100,18 M110,10 L110,15 M120,10 L120,15 M130,10 L130,18" strokeWidth="0.5" />
  </SvgWrapper>
);

export const FountainPen = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 100 100">
    <path d="M80,20 L20,80" strokeWidth="3" />
    <path d="M20,80 L10,90 L15,75 Z" />
    <path d="M20,80 L25,75 M15,85 L25,85" strokeWidth="0.5" />
    <path d="M70,30 L85,15 Q90,10 90,20 L75,35 Z" strokeWidth="2"/>
    {/* Ink drop */}
    <circle cx="8" cy="92" r="1.5" fill="currentColor" />
  </SvgWrapper>
);

export const StackedNotebooks = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 120 100">
    {/* Bottom Book */}
    <path d="M10,80 L90,80 L100,70 L20,70 Z" fill="currentColor" opacity="0.1"/>
    <path d="M10,80 L90,80 L100,70 L20,70 Z" />
    <path d="M10,80 L10,90 L90,90 L90,80" />
    <path d="M90,90 L100,80 L100,70" />
    {/* Middle Book (Angled) */}
    <path d="M15,65 L85,60 L105,50 L35,55 Z" fill="currentColor" opacity="0.1"/>
    <path d="M15,65 L85,60 L105,50 L35,55 Z" />
    <path d="M15,65 L15,75 L85,70 L85,60" />
    <path d="M85,70 L105,60 L105,50" />
    {/* Top Book */}
    <path d="M25,50 L105,50 L110,40 L30,40 Z" fill="currentColor" opacity="0.1"/>
    <path d="M25,50 L105,50 L110,40 L30,40 Z" />
    <path d="M25,50 L25,55 L105,55 L105,50" />
    <path d="M105,55 L110,45 L110,40" />
    {/* Binder rope */}
    <path d="M40,40 L35,50 L25,65 L20,80" strokeWidth="0.5" strokeDasharray="2 1"/>
  </SvgWrapper>
);

export const TempleBell = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 60 80">
    <path d="M30,10 L30,20" />
    <path d="M25,10 Q30,5 35,10" />
    <path d="M20,20 Q30,10 40,20 L45,50 Q45,60 50,60 L10,60 Q15,60 15,50 Z" />
    <circle cx="30" cy="65" r="5" />
    <path d="M15,45 Q30,55 45,45" strokeWidth="0.5"/>
    <path d="M18,35 Q30,45 42,35" strokeWidth="0.5"/>
  </SvgWrapper>
);

export const OilLamp = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 60 100">
    {/* Base */}
    <path d="M15,90 L45,90 Q40,80 30,80 Q20,80 15,90 Z" />
    {/* Stem */}
    <path d="M28,80 L28,40 M32,80 L32,40" />
    <path d="M25,60 L35,60 M26,50 L34,50" strokeWidth="0.5"/>
    {/* Top bowl */}
    <path d="M10,30 Q30,50 50,30 Q30,40 10,30 Z" />
    {/* Flame */}
    <path d="M30,25 Q25,15 30,5 Q35,15 30,25 Z" fill="currentColor" opacity="0.3"/>
  </SvgWrapper>
);

export const CornerMark = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 40 40">
    <path d="M10,10 L30,10 L30,30" strokeWidth="2" />
    <circle cx="10" cy="10" r="2" fill="currentColor"/>
    <circle cx="30" cy="30" r="2" fill="currentColor"/>
  </SvgWrapper>
);

export const VanakkamHands = ({ className }) => (
  <SvgWrapper className={className} viewBox="0 0 100 100">
    {/* Base shape with fill */}
    <path d="M40,90 Q50,95 60,90 L62,60 Q65,40 55,20 Q50,15 45,20 Q35,40 38,60 Z" fill="currentColor" opacity="0.1"/>
    
    {/* Left hand outline */}
    <path d="M40,90 L38,60 Q35,40 45,20 Q50,15 50,20 L50,90" />
    
    {/* Right hand outline */}
    <path d="M60,90 L62,60 Q65,40 55,20 Q50,15 50,20" />
    
    {/* Fingers lines to simulate folded hands */}
    <path d="M47,30 L47,55 M53,30 L53,55 M44,35 L44,55 M56,35 L56,55" strokeWidth="0.5"/>
    
    {/* Thumbs crossed / folded over */}
    <path d="M38,55 Q45,50 55,60" />
    <path d="M62,55 Q55,50 45,60" />
    
    {/* Wrist folding lines */}
    <path d="M39,80 Q50,85 61,80" strokeWidth="0.5" />
    <path d="M40,85 Q50,90 60,85" strokeWidth="0.5" />
  </SvgWrapper>
);
