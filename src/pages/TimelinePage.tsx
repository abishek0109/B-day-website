import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TimelineMemory } from '../types/scrapbook';
import { ArrowLeft, ArrowRight, Bookmark, Calendar, MapPin, Tag } from 'lucide-react';
import { PaperNote } from '../components/scrapbook/PaperNote';
import { WashiTape } from '../components/scrapbook/WashiTape';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { ScrapbookImage } from '../components/scrapbook/ScrapbookImage';
import { useBookRoute } from '../lib/routeContext';

interface TimelinePageProps {
  timeline: TimelineMemory[];
}

export const TimelinePage: React.FC<TimelinePageProps> = ({ timeline }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative">
      
      {/* Decorative Accents */}
      <PressedFlower variant="fern" opacity={0.3} className="absolute top-12 left-4 rotate-12" />
      <PressedFlower variant="lavender" opacity={0.3} className="absolute bottom-16 right-4 -rotate-12" />

      <div className="max-w-4xl mx-auto">
        
        {/* Chapter Header */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8">
          <button
            onClick={() => navigate(toBookPath('/photos'))}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Chapter
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 3: The Timeline</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 03</span>
        </div>

        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-hand text-2xl md:text-3xl text-[#B77D7D] block mb-1">
            stepping through the years
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#382C24]">
            Little Moments, Big Memories
          </h2>
          <p className="font-body text-[#7E6C5F] mt-3 text-base">
            From the very first hello to the adventures that defined us, here is how our story unfolded.
          </p>
        </div>

        {/* Chronological Timeline Journal */}
        <div className="relative">
          
          {/* Vertical Twine / Scrapbook String Line */}
          <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-[#8C7765]/30 z-0" />

          {timeline.length > 0 ? (
            <div className="space-y-12 sm:space-y-16 relative z-10">
              {timeline.map((entry, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={entry.id}
                  className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-10 ${
                    isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  
                  {/* Timeline Node Stamp */}
                  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FAF7F2] border-2 border-[#B77D7D] items-center justify-center shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B77D7D]" />
                  </div>

                  {/* Left or Right Content Card */}
                  <div className={`w-full sm:w-1/2 ${isEven ? 'sm:pr-6' : 'sm:pl-6'}`}>
                    <PaperNote
                      color={index % 2 === 0 ? 'cream' : 'blush'}
                      rotation={isEven ? -1.5 : 1.5}
                      decoration={index % 2 === 0 ? 'tape-rose' : 'tape-sage'}
                      className="w-full"
                    >
                      {/* Entry Tag / Chapter milestone */}
                      {entry.tag && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E] text-xs font-mono uppercase tracking-wider mb-2">
                          <Tag className="w-3 h-3" />
                          {entry.tag}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-serif text-2xl font-bold text-[#382C24] leading-snug">
                        {entry.title}
                      </h3>

                      {/* Date & Location */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-serif italic text-[#7E6C5F] my-2">
                        {entry.date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            {entry.date}
                          </span>
                        )}
                        {entry.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                            {entry.location}
                          </span>
                        )}
                      </div>

                      {/* Story Text */}
                      <p className="font-body text-[#514137] text-sm md:text-base leading-relaxed mt-3">
                        {entry.story}
                      </p>
                    </PaperNote>
                  </div>

                  {/* Opposite Side: Pinned Polaroid or Scrapbook Vignette */}
                  <div className={`w-full sm:w-1/2 ${isEven ? 'sm:pl-6' : 'sm:pr-6'} flex justify-center`}>
                    {entry.image_url ? (
                      <div
                        style={{ transform: `rotate(${isEven ? 2 : -2}deg)` }}
                        className="relative bg-[#FAF7F2] p-3 pb-6 border border-[#E8DEC8] shadow-scrapbook rounded-xs max-w-[280px] w-full"
                      >
                        <WashiTape color="cream" position="top-center" rotation={isEven ? -1 : 1} />
                        <div className="h-44 overflow-hidden rounded-xs bg-[#EFE8DD] border border-[#E3D9CC]">
                          <ScrapbookImage
                            src={entry.image_url}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                            fallbackLabel="Photograph unavailable"
                          />
                        </div>
                        <p className="font-hand text-xl text-center text-[#514137] mt-2">
                          {entry.title}
                        </p>
                      </div>
                    ) : (
                      <div className="hidden sm:block text-center font-hand text-2xl text-[#8C7765]/60 italic">
                        “One of those days you never forget”
                      </div>
                    )}
                  </div>

                </div>
              );
              })}
            </div>
          ) : (
            <div className="relative z-10 mx-auto max-w-lg rounded-sm border border-dashed border-[#DECFBD] bg-[#FAF7F2] p-10 text-center">
              <h3 className="font-serif text-2xl font-semibold text-[#382C24]">The timeline is ready for your memories</h3>
              <p className="font-hand mt-2 text-xl text-[#7E6C5F]">Entries added by the owner will be gathered here in order.</p>
            </div>
          )}

        </div>

        {/* Chapter Transition Footer */}
        <div className="mt-16 pt-8 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F]">
            Every milestone built the bond we celebrate today.
          </p>

          <button
            onClick={() => navigate(toBookPath('/videos'))}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Watch Moments in Motion</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

    </div>
  );
};
