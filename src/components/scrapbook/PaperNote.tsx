import React from 'react';
import { WashiTape } from './WashiTape';
import { PaperClip } from './PaperClip';

interface PaperNoteProps {
  children: React.ReactNode;
  color?: 'cream' | 'blush' | 'sage' | 'ivory';
  rotation?: number;
  hasLinedPaper?: boolean;
  decoration?: 'tape-rose' | 'tape-sage' | 'tape-cream' | 'clip' | 'none';
  className?: string;
  author?: string;
  relationship?: string;
  date?: string;
}

export const PaperNote: React.FC<PaperNoteProps> = ({
  children,
  color = 'cream',
  rotation = 0,
  hasLinedPaper = false,
  decoration = 'tape-rose',
  className = '',
  author,
  relationship,
  date,
}) => {
  const bgStyles = {
    cream: 'bg-[#F9F5EC] border-[#E8DEC8]',
    blush: 'bg-[#F8EBE8] border-[#E8D1CB]',
    sage: 'bg-[#F0F3E8] border-[#D9DEC9]',
    ivory: 'bg-[#FEFAF3] border-[#EBE3D3]',
  };

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`relative p-5 md:p-6 shadow-scrapbook hover:shadow-scrapbook-lift transition-all duration-300 border rounded-xs ${bgStyles[color]} ${className}`}
    >
      {/* Decorative Washi Tape or Paper Clip */}
      {decoration === 'tape-rose' && <WashiTape color="rose" position="top-center" rotation={-1} />}
      {decoration === 'tape-sage' && <WashiTape color="sage" position="top-center" rotation={1.5} />}
      {decoration === 'tape-cream' && <WashiTape color="cream" position="top-center" rotation={-0.5} />}
      {decoration === 'clip' && <PaperClip color="bronze" className="-top-3 left-4" />}

      {/* Optional Lined Paper Background */}
      <div className={hasLinedPaper ? 'bg-lined-paper -mx-2 px-2' : ''}>
        {children}
      </div>

      {/* Note Author & Date signature */}
      {(author || date) && (
        <div className="mt-4 pt-3 border-t border-[#8C7765]/15 flex items-baseline justify-between gap-2">
          {author && (
            <div>
              <span className="font-hand text-xl md:text-2xl text-[#3D3028] font-bold block leading-none">
                ~ {author}
              </span>
              {relationship && (
                <span className="text-[12px] font-serif italic text-[#7E6C5F] block mt-0.5">
                  {relationship}
                </span>
              )}
            </div>
          )}
          {date && (
            <span className="text-[11px] font-mono text-[#8C7765] opacity-75">
              {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      )}

      {/* Subtle paper fold bottom corner */}
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-gradient-to-tl from-black/8 to-transparent pointer-events-none" />
    </div>
  );
};
