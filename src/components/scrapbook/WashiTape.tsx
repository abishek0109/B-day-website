import React from 'react';

interface WashiTapeProps {
  color?: 'rose' | 'sage' | 'cream' | 'blush';
  position?: 'top-center' | 'top-left' | 'top-right';
  className?: string;
  rotation?: number;
}

export const WashiTape: React.FC<WashiTapeProps> = ({
  color = 'rose',
  position = 'top-center',
  className = '',
  rotation = 0,
}) => {
  const colorStyles = {
    rose: 'bg-[#B77D7D]/75 border-t border-b border-[#9E6565]/30',
    sage: 'bg-[#A7AD96]/75 border-t border-b border-[#8C937B]/30',
    cream: 'bg-[#F1E8DA]/85 border-t border-b border-[#D8CAA8]/40',
    blush: 'bg-[#EAD6D2]/80 border-t border-b border-[#D1B8B3]/40',
  };

  const positionStyles = {
    'top-center': '-top-3 left-1/2 -translate-x-1/2',
    'top-left': '-top-3 left-6',
    'top-right': '-top-3 right-6',
  };

  return (
    <div
      aria-hidden="true"
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      className={`absolute z-20 h-5 w-20 md:w-24 shadow-sm backdrop-blur-[1px] pointer-events-none transition-transform ${colorStyles[color]} ${positionStyles[position]} ${className}`}
      // jagged torn washi ends
      style-clip="polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)"
    >
      <div className="w-full h-full opacity-30 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px]" />
    </div>
  );
};
