'use client';

import React, { useState, useEffect } from 'react';

interface ConstellationBackgroundProps {
  opacity?: number;
  showShootingStars?: boolean;
  showGradientOrbs?: boolean;
  className?: string;
}

export default function ConstellationBackground({ 
  opacity = 0.4, 
  showShootingStars = true,
  showGradientOrbs = true,
  className = ''
}: ConstellationBackgroundProps) {
  // Generate random stars on mount
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none overflow-hidden ${className}`}>
      {/* Grid background */}
      <div className="bg-grid" style={{ opacity }}></div>
      
      {/* Gradient orbs - like feeds page */}
      {showGradientOrbs && (
        <>
          <div 
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow mix-blend-screen" 
            style={{ opacity: 0.4 }}
          />
          <div 
            className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow mix-blend-screen" 
            style={{ opacity: 0.4, animationDelay: '2s' }}
          />
        </>
      )}
      
      {/* Stars container */}
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              '--duration': star.duration,
              '--opacity': star.opacity
            } as React.CSSProperties}
          />
        ))}
        
        {/* Shooting stars */}
        {showShootingStars && (
          <>
            <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
            <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
            <div className="shooting-star" style={{ top: '40%', left: '50%', animationDelay: '4s' }} />
          </>
        )}
      </div>
    </div>
  );
}
