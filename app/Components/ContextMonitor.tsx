import React, { memo } from 'react';

interface ContextMonitorProps {
  context: number; 
}

export const ContextMonitor: React.FC<ContextMonitorProps> = memo(({ context }) => {
  const clampedUsage = Math.min(Math.max(context/8192, 0), 1);

  const size = 50; 
  const strokeWidth = 4; 
  const color = `hsl(${100 - (clampedUsage * 100)}, 100%, 56%)`; 
  const center = 50 / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  const strokeDashoffset = circumference - clampedUsage * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke="#18181b"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  )
});