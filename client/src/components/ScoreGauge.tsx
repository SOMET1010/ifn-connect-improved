import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number; // Taille en pixels
  strokeWidth?: number;
}

/**
 * Jauge circulaire animée pour afficher le Score SUTA
 */
export function ScoreGauge({ score, size = 200, strokeWidth = 20 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Animation du score
  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1500; // 1.5 secondes
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      setAnimatedScore(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [score]);
  
  // Calculer les couleurs selon le score
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', glow: '#10b981' }; // Vert (Platine)
    if (score >= 60) return { stroke: '#f59e0b', glow: '#f59e0b' }; // Orange (Or)
    if (score >= 40) return { stroke: '#6b7280', glow: '#6b7280' }; // Gris (Argent)
    return { stroke: '#cd7f32', glow: '#cd7f32' }; // Bronze
  };
  
  const colors = getColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Cercle de progression avec glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>
      
      {/* Score au centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color: colors.stroke }}>
          {Math.round(animatedScore)}
        </span>
        <span className="text-lg text-gray-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}
