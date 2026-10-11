import React from 'react';

interface PressedFlowerProps {
  className?: string;
  variant?: 'wildflower' | 'fern' | 'lavender';
  opacity?: number;
}

export const PressedFlower: React.FC<PressedFlowerProps> = ({
  className = '',
  variant = 'wildflower',
  opacity = 0.9,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={`pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(81,65,55,0.15)] ${className}`}
    >
      {variant === 'wildflower' && (
        <svg width="64" height="96" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 md:w-16 h-auto">
          {/* Main Stem */}
          <path d="M32 94C31 65 30 35 32 18" stroke="#7E846D" strokeWidth="1.8" strokeLinecap="round" />
          {/* Leaves */}
          <path d="M31 68C22 66 18 56 19 48C25 51 30 58 31 68Z" fill="#A7AD96" fillOpacity="0.8" stroke="#8A9178" strokeWidth="0.8" />
          <path d="M31 52C40 50 44 40 43 32C37 35 32 42 31 52Z" fill="#A7AD96" fillOpacity="0.8" stroke="#8A9178" strokeWidth="0.8" />
          {/* Small side leaf */}
          <path d="M31 38C24 35 22 28 23 23C27 25 30 31 31 38Z" fill="#B3B9A3" fillOpacity="0.85" stroke="#8A9178" strokeWidth="0.8" />
          {/* Pressed Petals */}
          <ellipse cx="32" cy="18" rx="8" ry="12" fill="#B77D7D" fillOpacity="0.8" transform="rotate(-15 32 18)" />
          <ellipse cx="32" cy="18" rx="7" ry="11" fill="#C98F8F" fillOpacity="0.8" transform="rotate(35 32 18)" />
          <ellipse cx="32" cy="18" rx="7" ry="12" fill="#D49E9E" fillOpacity="0.75" transform="rotate(80 32 18)" />
          <ellipse cx="32" cy="18" rx="6" ry="10" fill="#B77D7D" fillOpacity="0.75" transform="rotate(-65 32 18)" />
          {/* Flower Center */}
          <circle cx="32" cy="18" r="3.5" fill="#DEB887" stroke="#8B5A2B" strokeWidth="0.7" />
        </svg>
      )}

      {variant === 'lavender' && (
        <svg width="48" height="96" viewBox="0 0 48 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 md:w-12 h-auto">
          <path d="M24 92C23 60 24 30 24 10" stroke="#767D65" strokeWidth="1.5" strokeLinecap="round" />
          {/* Buds */}
          <circle cx="21" cy="40" r="3" fill="#A77E8F" fillOpacity="0.85" />
          <circle cx="27" cy="38" r="3.2" fill="#B48E9F" fillOpacity="0.85" />
          <circle cx="20" cy="32" r="3.5" fill="#A77E8F" fillOpacity="0.85" />
          <circle cx="28" cy="30" r="3.5" fill="#C29DB0" fillOpacity="0.85" />
          <circle cx="22" cy="24" r="3.5" fill="#A77E8F" fillOpacity="0.85" />
          <circle cx="26" cy="22" r="3.2" fill="#B48E9F" fillOpacity="0.85" />
          <circle cx="24" cy="15" r="3" fill="#C29DB0" fillOpacity="0.9" />
          <circle cx="24" cy="9" r="2.5" fill="#DEB887" />
        </svg>
      )}

      {variant === 'fern' && (
        <svg width="56" height="84" viewBox="0 0 56 84" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 md:w-14 h-auto">
          <path d="M28 82C27 50 28 20 28 4" stroke="#686F58" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M28 65C18 63 12 55 14 48C20 50 25 56 28 65Z" fill="#989F88" fillOpacity="0.8" />
          <path d="M28 60C38 58 44 50 42 43C36 45 31 51 28 60Z" fill="#989F88" fillOpacity="0.8" />
          <path d="M28 48C19 46 14 39 16 33C21 35 26 40 28 48Z" fill="#A7AD96" fillOpacity="0.8" />
          <path d="M28 44C37 42 42 35 40 29C35 31 30 36 28 44Z" fill="#A7AD96" fillOpacity="0.8" />
          <path d="M28 32C21 30 17 24 19 19C23 21 27 25 28 32Z" fill="#B3B9A3" fillOpacity="0.85" />
          <path d="M28 28C35 26 39 20 37 15C33 17 29 21 28 28Z" fill="#B3B9A3" fillOpacity="0.85" />
        </svg>
      )}
    </div>
  );
};
