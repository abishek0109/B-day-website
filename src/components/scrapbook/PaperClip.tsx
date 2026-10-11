import React from 'react';

interface PaperClipProps {
  color?: 'bronze' | 'gold' | 'silver';
  className?: string;
}

export const PaperClip: React.FC<PaperClipProps> = ({
  color = 'bronze',
  className = '',
}) => {
  const strokeColor = color === 'gold' ? '#B8860B' : color === 'silver' ? '#71717A' : '#8C6747';

  return (
    <div className={`absolute z-20 pointer-events-none drop-shadow-[1px_2px_2px_rgba(81,65,55,0.25)] ${className}`}>
      <svg
        width="28"
        height="56"
        viewBox="0 0 28 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 md:w-6 h-auto"
      >
        {/* Outer loop */}
        <path
          d="M8 16V40C8 46.6274 13.3726 52 20 52C26.6274 52 32 46.6274 32 40V12C32 5.37258 26.6274 0 20 0C13.3726 0 8 5.37258 8 12V36C8 39.3137 10.6863 42 14 42C17.3137 42 20 39.3137 20 36V14"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(-6, 2) scale(0.85)"
        />
        {/* Shading highlight */}
        <path
          d="M8 16V40C8 46.6274 13.3726 52 20 52C26.6274 52 32 46.6274 32 40V12C32 5.37258 26.6274 0 20 0C13.3726 0 8 5.37258 8 12V36"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform="translate(-6, 2) scale(0.85)"
        />
      </svg>
    </div>
  );
};
