import React, { useEffect } from 'react';
import { PhotoMemory } from '../../types/scrapbook';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Heart } from 'lucide-react';
import { WashiTape } from './WashiTape';
import { ScrapbookImage } from './ScrapbookImage';

interface PhotoLightboxProps {
  photos: PhotoMemory[];
  currentIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    if (currentIndex === null || !photos[currentIndex]) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [currentIndex, photos, onClose, onNext, onPrev]);

  if (currentIndex === null || !photos[currentIndex]) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#382C24]/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close Lightbox"
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-[#FAF6EC]/90 text-[#514137] hover:bg-[#FAF6EC] hover:scale-105 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#B77D7D]"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev Button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous photo"
          className="absolute left-2 sm:left-6 z-40 p-3 rounded-full bg-[#FAF6EC]/85 text-[#514137] hover:bg-[#FAF6EC] hover:scale-110 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B77D7D]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next Button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next photo"
          className="absolute right-2 sm:right-6 z-40 p-3 rounded-full bg-[#FAF6EC]/85 text-[#514137] hover:bg-[#FAF6EC] hover:scale-110 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B77D7D]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Enlarged Scrapbook Polaroid Card */}
      <div 
        className="relative max-w-2xl w-full bg-[#FAF7F2] p-4 sm:p-6 pb-8 border border-[#E8DEC8] rounded-xs shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <WashiTape color="rose" position="top-center" rotation={-1} />

        {/* Image Container */}
        <div className="relative w-full max-h-[65vh] flex items-center justify-center overflow-hidden bg-[#ECE3D5] rounded-xs border border-[#DFD3BE]">
          <ScrapbookImage
            src={currentPhoto.image_url}
            alt={currentPhoto.title || currentPhoto.caption}
            className="w-full h-auto max-h-[65vh] object-contain"
            fallbackLabel="This photograph could not be loaded"
          />
        </div>

        {/* Captions & Annotations */}
        {(currentPhoto.title || currentPhoto.caption || currentPhoto.category || currentPhoto.date || currentPhoto.location) && (
          <div className="w-full text-center mt-4 px-2">
            {currentPhoto.title && (
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#3D3028]">
                {currentPhoto.title}
              </h3>
            )}

            {currentPhoto.caption && currentPhoto.caption !== currentPhoto.title && (
              <p className="font-hand text-2xl md:text-3xl text-[#514137] mt-1.5 leading-snug">
                {currentPhoto.caption}
              </p>
            )}

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm text-[#7E6C5F] font-serif italic">
            {currentPhoto.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E] text-xs font-sans tracking-wide">
                {currentPhoto.category}
              </span>
            )}
            {currentPhoto.date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                {currentPhoto.date}
              </span>
            )}
            {currentPhoto.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 opacity-60" />
                {currentPhoto.location}
              </span>
            )}
          </div>

          {/* Photo Counter */}
          <div className="mt-4 pt-3 border-t border-[#8C7765]/15 flex items-center justify-between text-xs font-mono text-[#8C7765]">
            <span className="flex items-center gap-1 text-[#B77D7D]">
              <Heart className="w-3 h-3 fill-current" /> Memory {currentIndex + 1} of {photos.length}
            </span>
            <span>Use ← → keys to browse</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
