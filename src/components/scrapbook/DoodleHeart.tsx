import React from 'react';

interface DoodleHeartProps {
  className?: string;
  color?: string;
  size?: number;
}

export const DoodleHeart: React.FC<DoodleHeartProps> = ({
  className = '',
  color = '#B77D7D',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M16 27C16 27 3.5 19 3.5 10.5C3.5 5.5 7.5 2.5 12 3.5C14.5 4.1 16 6.5 16 6.5C16 6.5 17.5 4.1 20 3.5C24.5 2.5 28.5 5.5 28.5 10.5C28.5 19 16 27 16 27Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 0.2"
      />
      {/* Loose doodle inner echo */}
      <path
        d="M16 24C16 24 6 17 6 10.5C6 7 8.5 5 11.5 5.5C13.5 6 15 8 16 8.5"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};
