import React from 'react';

const TalkieLogo = ({ size = 120 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
      {/* Logo Icon */}
      <svg 
        width={size} 
        height={size * 0.8} 
        viewBox="0 0 200 160" 
        style={{ marginBottom: '10px' }}
      >
        {/* Sparkles */}
        <circle cx="30" cy="20" r="3" fill="white" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="15" r="2.5" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="170" cy="25" r="3" fill="white" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="20" r="2.5" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Larger speech bubble (purple-pink gradient) */}
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Main speech bubble */}
        <path
          d="M 20 40 Q 20 20 40 20 L 120 20 Q 140 20 140 40 L 140 100 Q 140 120 120 120 L 60 120 L 40 140 L 40 120 Q 20 120 20 100 Z"
          fill="url(#purpleGradient)"
          stroke="none"
        />
        
        {/* Smaller overlapping speech bubble */}
        <path
          d="M 130 50 Q 130 40 140 40 L 170 40 Q 180 40 180 50 L 180 80 Q 180 90 170 90 L 150 90 L 140 100 L 140 90 Q 130 90 130 80 Z"
          fill="url(#blueGradient)"
          stroke="none"
        />
        
        {/* Microphone icon inside main bubble */}
        <g transform="translate(80, 60)">
          {/* Microphone stand */}
          <rect x="38" y="20" width="4" height="15" fill="white" rx="2" />
          {/* Microphone body */}
          <ellipse cx="40" cy="20" rx="12" ry="8" fill="none" stroke="white" strokeWidth="2.5" />
          {/* Microphone grille lines */}
          <line x1="32" y1="18" x2="48" y2="18" stroke="white" strokeWidth="1.5" />
          <line x1="32" y1="20" x2="48" y2="20" stroke="white" strokeWidth="1.5" />
          <line x1="32" y1="22" x2="48" y2="22" stroke="white" strokeWidth="1.5" />
        </g>
      </svg>
      
      {/* Text "Talkie" */}
      <h1 style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#6B21A8',
        margin: 0,
        letterSpacing: '1px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Talkie
      </h1>
    </div>
  );
};

export default TalkieLogo;
