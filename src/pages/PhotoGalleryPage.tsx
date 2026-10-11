import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoMemory, MemoryCategory } from '../types/scrapbook';
import { ArrowLeft, ArrowRight, Bookmark, Image as ImageIcon, Filter, Sparkles } from 'lucide-react';
import { PolaroidPhoto } from '../components/scrapbook/PolaroidPhoto';
import { PhotoLightbox } from '../components/scrapbook/PhotoLightbox';
import { PressedFlower } from '../components/scrapbook/PressedFlower';

interface PhotoGalleryPageProps {
  photos: PhotoMemory[];
}

export const PhotoGalleryPage: React.FC<PhotoGalleryPageProps> = ({ photos }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories: MemoryCategory[] = [
    'All',
    'Little Moments',
    'Adventures',
    'Celebrations',
    'Everyday Chaos',
  ];

  const filteredPhotos = selectedCategory === 'All'
    ? photos
    : photos.filter((p) => p.category === selectedCategory);

  const handleNext = () => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative">
      
      {/* Decorative foliage accents */}
      <PressedFlower variant="wildflower" opacity={0.3} className="absolute top-10 right-4 rotate-12" />
      <PressedFlower variant="fern" opacity={0.25} className="absolute bottom-12 left-4 -rotate-6" />

      <div className="max-w-6xl mx-auto">
        
        {/* Chapter Header */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8">
          <button
            onClick={() => navigate('/intro')}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Chapter
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 2: Photo Scrapbook</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 02</span>
        </div>

        {/* Section Title and Introductory Text */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-hand text-2xl md:text-3xl text-[#B77D7D] block mb-1">
            caught on camera & held close to heart
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#382C24]">
            Our Favourite Memories
          </h2>
          <p className="font-body text-[#7E6C5F] mt-3 text-base">
            Click any photograph to step closer and relive the moment in full view.
          </p>
        </div>

        {/* Category Tabs / Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <div className="inline-flex items-center gap-1 mr-2 text-xs font-serif text-[#7E6C5F] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Category:
          </div>
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-serif rounded-full transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#B77D7D] text-[#FAF6EC] shadow-xs scale-105'
                    : 'bg-[#F1E8DA] text-[#514137] hover:bg-[#EAD6D2]/70 border border-[#DECFBD]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Photo Gallery Grid / Scrapbook Collage */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center">
            {filteredPhotos.map((photo, index) => {
              // Alternate subtle natural rotations
              const rotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.5];
              const rotation = photo.rotation ?? rotations[index % rotations.length];
              const tapes: ('rose' | 'sage' | 'cream')[] = ['rose', 'sage', 'cream'];
              const tape = photo.tape_style === 'none' ? 'none' : (photo.tape_style || tapes[index % tapes.length]);

              return (
                <div key={photo.id} className="w-full flex justify-center">
                  <PolaroidPhoto
                    image_url={photo.image_url}
                    title={photo.title}
                    caption={photo.caption}
                    date={photo.date}
                    location={photo.location}
                    rotation={rotation}
                    tape_style={tape as 'rose' | 'sage' | 'cream' | 'none'}
                    onClick={() => setLightboxIndex(index)}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Graceful Empty State */
          <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] rounded-sm p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-[#EAD6D2]/60 mx-auto flex items-center justify-center mb-3 text-[#B77D7D]">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#382C24]">
            {photos.length === 0 ? 'No photographs uploaded yet' : 'No memories in this category yet'}
            </h3>
            <p className="font-hand text-xl text-[#7E6C5F] mt-2">
            {photos.length === 0
              ? 'Real photographs added by the owner will appear here.'
              : 'Try another category or return to the full photo collection.'}
            </p>
            {photos.length > 0 && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="mt-4 px-4 py-2 bg-[#B77D7D] text-[#FAF6EC] font-serif text-xs rounded-sm hover:bg-[#A36B6B] transition-colors"
            >
              Show All Photos
            </button>
            )}
          </div>
        )}

        {/* Chapter Transition Footer */}
        <div className="mt-16 pt-8 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B77D7D]" />
            “Photographs are tickets to a moment otherwise gone.”
          </p>

          <button
            onClick={() => navigate('/timeline')}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Read The Timeline</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* Lightbox Modal */}
      <PhotoLightbox
        photos={filteredPhotos}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />

    </div>
  );
};
