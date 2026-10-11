import React from 'react';

interface StampBadgeProps {
  label?: string;
  sublabel?: string;
  rotation?: number;
  className?: string;
}

export const StampBadge: React.FC<StampBadgeProps> = ({
  label = "MEMORIES",
  sublabel = "SPECIAL EDITION",
  rotation = -8,
  className = "",
}) => {
  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`relative inline-flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#B77D7D]/70 rounded-full w-24 h-24 select-none opacity-85 hover:opacity-100 transition-opacity pointer-events-none ${className}`}
    >
      <div className="absolute inset-1 rounded-full border border-[#B77D7D]/40" />
      <span className="text-[9px] uppercase tracking-widest text-[#B77D7D] font-mono font-semibold">
        {label}
      </span>
      <span className="text-[12px] font-serif italic text-[#514137] my-0.5">
        ★ ★ ★
      </span>
      <span className="text-[8px] uppercase tracking-wider text-[#7E6C5F] font-mono">
        {sublabel}
      </span>
    </div>
  );
};
