import React from 'react';
import { WashiTape } from './WashiTape';
import { PaperClip } from './PaperClip';
import { MapPin, Calendar } from 'lucide-react';
import { ScrapbookImage } from './ScrapbookImage';

interface PolaroidPhotoProps {
  id?: string;
  image_url: string;
  caption?: string;
  title?: string;
  date?: string;
  location?: string;
  rotation?: number;
  tape_style?: 'sage' | 'rose' | 'cream' | 'none';
  useClip?: boolean;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  size?: 'normal' | 'large' | 'small';
}

export const PolaroidPhoto: React.FC<PolaroidPhotoProps> = ({
  image_url,
  caption,
  title,
  date,
  location,
  rotation = 0,
  tape_style = 'rose',
  useClip = false,
  className = '',
  onClick,
  size = 'normal',
}) => {
  const sizeClasses = {
    small: 'p-2.5 pb-6 max-w-[240px]',
    normal: 'p-3.5 pb-8 max-w-[320px] md:max-w-[350px]',
    large: 'p-4 md:p-5 pb-10 max-w-[420px] md:max-w-[460px]',
  };

  const imageAspectClasses = {
    small: 'h-48',
    normal: 'h-64 md:h-72',
    large: 'h-72 md:h-96',
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View photograph: ${title || caption || 'Memory photograph'}` : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      className={`relative group bg-[#FAF7F2] border border-[#E8DEC8] shadow-scrapbook transition-all duration-300 ease-out select-none rounded-xs ${onClick ? 'cursor-pointer hover:shadow-scrapbook-lift hover:scale-[1.02] hover:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77D7D]' : ''} ${sizeClasses[size]} ${className}`}
    >
      {/* Decorative Washi Tape or Paper Clip */}
      {!useClip && tape_style !== 'none' && (
        <WashiTape
          color={tape_style}
          position="top-center"
          rotation={rotation > 0 ? -1 : 1.5}
        />
      )}
      {useClip && <PaperClip color="bronze" className="-top-3 left-6" />}

      {/* Layered paper texture behind image */}
      <div className="relative overflow-hidden bg-[#EFE8DD] border border-[#E3D9CC]">
        <ScrapbookImage
          src={image_url}
          alt={title || caption || "Memory photograph"}
          className={`w-full ${imageAspectClasses[size]} object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] sepia-[0.05] contrast-[1.02]`}
          fallbackLabel="A photograph will be placed here"
        />

        {/* Vintage film matte overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#514137]/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Handwritten caption space */}
      {(title || caption || date || location) ? (
        <div className="pt-3.5 px-1 text-center flex flex-col items-center">
          {title && (
            <h4 className="font-serif text-lg md:text-xl font-semibold text-[#3D3028] leading-snug">
              {title}
            </h4>
          )}
          
          {caption && caption !== title && (
            <p className="font-hand text-xl md:text-2xl text-[#514137] leading-tight mt-1">
              {caption}
            </p>
          )}

          {/* Date and Location annotations */}
          {(date || location) && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[12px] text-[#7E6C5F] font-serif italic">
              {date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 opacity-60" />
                  {date}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 opacity-60" />
                  {location}
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Light corner crease effect */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-black/5 to-transparent pointer-events-none" />
    </div>
  );
};
