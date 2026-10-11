import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteSettings } from '../types/scrapbook';
import { ArrowRight, ArrowLeft, Bookmark } from 'lucide-react';
import { PolaroidPhoto } from '../components/scrapbook/PolaroidPhoto';
import { PaperNote } from '../components/scrapbook/PaperNote';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { StampBadge } from '../components/scrapbook/StampBadge';
import { useBookRoute } from '../lib/routeContext';

interface IntroductionPageProps {
  settings: SiteSettings;
}

export const IntroductionPage: React.FC<IntroductionPageProps> = ({ settings }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative flex flex-col justify-center">
      
      {/* Background Scrapbook Accents */}
      <PressedFlower variant="lavender" opacity={0.4} className="absolute top-8 right-6 rotate-12" />
      <PressedFlower variant="fern" opacity={0.3} className="absolute bottom-10 left-6 -rotate-12" />

      <div className="max-w-5xl mx-auto w-full">
        
        {/* Book Page Header with Chapter Indicator */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-10">
          <button
            onClick={() => navigate(toBookPath('/'))}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cover
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 1: The Dedication</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 01</span>
        </div>

        {/* Double-page Journal Composition */}
        <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-10 md:p-12 shadow-scrapbook-lg rounded-xs relative">
          
          {/* Subtle Spine shadow down the middle on wide screens */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#514137]/4 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Page: Dedication & Emotional Introduction */}
            <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-6">
              
              <span className="font-hand text-2xl text-[#B77D7D] font-medium mb-1">
                {settings.recipient_name ? `For ${settings.recipient_name}, on your birthday` : 'A birthday dedication'}
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#382C24] leading-tight mb-4">
                {settings.intro_dedication || 'A page dedicated to you'}
              </h2>

              <div className="w-16 h-0.5 bg-[#B77D7D]/40 mb-6" />

              <p className="font-body text-base sm:text-lg text-[#514137] leading-relaxed mb-6">
                {settings.intro_message || 'This page is ready for a dedication from the owner.'}
              </p>

              {/* Handwritten Note Pin */}
              {settings.intro_note && (
                <PaperNote
                  color="cream"
                  rotation={-1.5}
                  decoration="tape-sage"
                  className="w-full mt-2"
                >
                  <p className="font-hand text-2xl text-[#514137] leading-snug">
                    {settings.intro_note}
                  </p>
                </PaperNote>
              )}

            </div>

            {/* Right Page: Featured Photograph and Stamp */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center pl-0 lg:pl-6 relative">
              
              <div className="relative">
                <PolaroidPhoto
                  image_url={settings.intro_photo_url}
                  rotation={2}
                  tape_style="rose"
                  size="normal"
                  className="max-w-[320px] sm:max-w-[360px]"
                />

                <StampBadge
                  label="BIRTHDAY"
                  sublabel="CELEBRATION"
                  rotation={-15}
                  className="absolute -bottom-6 -right-4 z-30"
                />
              </div>

            </div>

          </div>

          {/* Bottom Navigation */}
          <div className="mt-12 pt-6 border-t border-[#E3D9CC] flex items-center justify-between">
            <span className="font-hand text-xl text-[#7E6C5F]">
              Next up: Our favourite photographs...
            </span>

            <button
              onClick={() => navigate(toBookPath('/photos'))}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Turn the Page</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
