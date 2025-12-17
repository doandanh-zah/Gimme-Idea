'use client';

import React from 'react';

// Enhanced constellation with more stars
const CONSTELLATION_STARS = [
  // Top area
  { x: 8, y: 8, size: 2 },
  { x: 18, y: 12, size: 1.5 },
  { x: 32, y: 6, size: 2.5 },
  { x: 45, y: 14, size: 1.5 },
  { x: 58, y: 8, size: 2 },
  { x: 72, y: 12, size: 1.5 },
  { x: 85, y: 6, size: 2 },
  { x: 95, y: 15, size: 1.5 },
  
  // Upper middle
  { x: 12, y: 25, size: 2 },
  { x: 25, y: 30, size: 1.5 },
  { x: 38, y: 22, size: 2.5 },
  { x: 52, y: 28, size: 1.5 },
  { x: 65, y: 24, size: 2 },
  { x: 78, y: 32, size: 1.5 },
  { x: 92, y: 26, size: 2 },
  
  // Middle
  { x: 5, y: 45, size: 2 },
  { x: 18, y: 48, size: 1.5 },
  { x: 30, y: 42, size: 2.5 },
  { x: 42, y: 50, size: 1.5 },
  { x: 55, y: 44, size: 2 },
  { x: 68, y: 52, size: 1.5 },
  { x: 82, y: 46, size: 2 },
  { x: 94, y: 50, size: 1.5 },
  
  // Lower middle
  { x: 10, y: 65, size: 2 },
  { x: 22, y: 70, size: 1.5 },
  { x: 35, y: 62, size: 2.5 },
  { x: 48, y: 68, size: 1.5 },
  { x: 62, y: 72, size: 2 },
  { x: 75, y: 66, size: 1.5 },
  { x: 88, y: 70, size: 2 },
  
  // Bottom area
  { x: 6, y: 85, size: 2 },
  { x: 20, y: 88, size: 1.5 },
  { x: 34, y: 82, size: 2.5 },
  { x: 50, y: 90, size: 1.5 },
  { x: 65, y: 84, size: 2 },
  { x: 80, y: 92, size: 1.5 },
  { x: 92, y: 86, size: 2 },
];

// Connect stars to form constellations
const CONSTELLATION_LINES = [
  // Top constellation
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  // Upper diagonal connections
  [1, 8], [2, 10], [4, 12], [6, 14],
  // Upper middle constellation
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  // Middle connections
  [8, 15], [9, 16], [10, 17], [12, 19], [14, 21],
  // Middle constellation
  [15, 16], [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22],
  // Lower connections
  [15, 23], [17, 25], [19, 27], [21, 29],
  // Lower middle constellation
  [23, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 29],
  // Bottom connections
  [23, 30], [25, 32], [27, 34], [29, 36],
  // Bottom constellation
  [30, 31], [31, 32], [32, 33], [33, 34], [34, 35], [35, 36],
];

interface ConstellationBackgroundProps {
  opacity?: number;
  showShootingStars?: boolean;
  showGradientOrbs?: boolean;
  className?: string;
}

export default function ConstellationBackground({ 
  opacity = 0.25, 
  showShootingStars = true,
  showGradientOrbs = true,
  className = ''
}: ConstellationBackgroundProps) {
  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none overflow-hidden ${className}`}>
      {/* Grid background */}
      <div className="bg-grid opacity-30"></div>
      
      {/* Gradient orbs */}
      {showGradientOrbs && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] opacity-40" />
          <div className="absolute top-[40%] right-[-15%] w-[400px] h-[400px] bg-[#14F195]/10 rounded-full blur-[100px] opacity-30" />
        </>
      )}
      
      {/* Constellation SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity }}>
        <defs>
          {/* Glow filter for stars */}
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient for lines */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="50%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Constellation lines */}
        {CONSTELLATION_LINES.map(([from, to], i) => (
          <line
            key={`line-${i}`}
            x1={`${CONSTELLATION_STARS[from].x}%`}
            y1={`${CONSTELLATION_STARS[from].y}%`}
            x2={`${CONSTELLATION_STARS[to].x}%`}
            y2={`${CONSTELLATION_STARS[to].y}%`}
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Constellation stars with glow */}
        {CONSTELLATION_STARS.map((star, i) => (
          <circle
            key={`star-${i}`}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="white"
            fillOpacity="0.8"
            filter="url(#starGlow)"
          />
        ))}
      </svg>
      
      {/* Shooting stars */}
      {showShootingStars && (
        <>
          <div className="shooting-star" style={{ top: '8%', left: '92%' }} />
          <div className="shooting-star" style={{ top: '25%', left: '5%', animationDelay: '3s' }} />
          <div className="shooting-star" style={{ top: '45%', left: '88%', animationDelay: '6s' }} />
          <div className="shooting-star" style={{ top: '65%', left: '12%', animationDelay: '9s' }} />
          <div className="shooting-star" style={{ top: '80%', left: '75%', animationDelay: '12s' }} />
        </>
      )}
    </div>
  );
}
