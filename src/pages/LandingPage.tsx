import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteSettings } from '../types/scrapbook';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';
import { PolaroidPhoto } from '../components/scrapbook/PolaroidPhoto';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { WashiTape } from '../components/scrapbook/WashiTape';
import { DoodleHeart } from '../components/scrapbook/DoodleHeart';
import { StampBadge } from '../components/scrapbook/StampBadge';
import { useBookRoute } from '../lib/routeContext';

interface LandingPageProps {
  settings: SiteSettings;
  firstSectionPath?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, firstSectionPath }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-10 overflow-hidden bg-[#F8F4EC]">
      
      {/* Decorative Scrapbook Elements in corners/background */}
      <PressedFlower
        variant="wildflower"
        opacity={0.4}
        className="absolute top-4 left-2 md:left-12 rotate-[-12deg] scale-90 md:scale-100"
      />
      <PressedFlower
        variant="fern"
        opacity={0.35}
        className="absolute bottom-6 right-2 md:right-10 rotate-[15deg] scale-90 md:scale-100"
      />
      <DoodleHeart
        size={36}
        color="#B77D7D"
        className="absolute top-24 right-1/4 opacity-60 hidden md:block"
      />

      <div className="max-w-6xl mx-auto w-full relative z-10">

        {/* Top Header Labels (as specified in Reference 5) */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-3 mb-8 md:mb-12">
          <span className="text-[11px] md:text-xs uppercase tracking-[0.25em] text-[#7E6C5F] font-mono font-medium">
            ★ THE FRIENDSHIP EDITION
          </span>
          <span className="font-hand text-lg md:text-xl text-[#B77D7D] font-medium tracking-wide">
            {settings.hero_note || "a little birthday something, just for you"}
          </span>
        </div>

        {/* Main Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Typography & Call to Action */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
            
            {/* Small uppercase label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E] text-xs font-mono tracking-widest uppercase mb-4">
              <Sparkles className="w-3 h-3 text-[#B77D7D]" />
              {settings.hero_tagline || "FOR MY FAVORITE PERSON"}
            </div>

            {/* Large Serif Title */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#382C24] leading-[1.05] mb-4">
              {settings.title || "A Little Book of You"}
            </h1>

            {/* Subtitle */}
            <p className="font-hand text-2xl sm:text-3xl text-[#B77D7D] leading-snug mb-6">
              {settings.subtitle || "For all the little moments that became our big memories."}
            </p>

            {/* Introductory Warm Paragraph */}
            <div className="relative pl-4 border-l-2 border-[#B77D7D]/40 mb-8 max-w-xl">
              <p className="font-body text-base sm:text-lg text-[#514137] leading-relaxed">
                {settings.hero_intro || 
                  "For all the little moments that became our big memories. Happy birthday to the friend who makes ordinary days feel a little more special. This little corner of the internet is filled with photographs, laughter, stories, and reminders of how much you mean to the people around you."
                }
              </p>
            </div>

            {/* CTA Button & Handwritten Caption */}
            <div className="flex flex-col items-start gap-3">
              <button
                onClick={() => navigate(firstSectionPath || toBookPath('/intro'))}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-lg tracking-wide rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <span>Open Your Memory Book</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                
                {/* Subtle paper tape highlight */}
                <div className="absolute -top-2 right-4 w-12 h-3 bg-[#FAF6EC]/30 rounded-xs pointer-events-none" />
              </button>

              {/* Handwritten caption below button */}
              <p className="font-hand text-xl text-[#7E6C5F] pl-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#B77D7D] fill-current opacity-70" />
                {settings.hero_button_caption || "A few pages. A thousand reasons I'm glad it's you."}
              </p>
            </div>

          </div>

          {/* Right Column: Layered Scrapbook Hero Composition */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end relative">
            
            {/* Background Layered Paper Sheet (Ref 1 & 5) */}
            <div className="absolute inset-0 max-w-md mx-auto lg:mr-4 h-full bg-[#F1E8DA] border border-[#DECFBD] shadow-sm transform -rotate-3 rounded-xs pointer-events-none translate-x-3 translate-y-3">
              <div className="w-full h-full p-4 opacity-40 bg-[repeating-linear-gradient(transparent,transparent_24px,#E5D9C7_25px)]" />
            </div>

            {/* Second Accent Layer (Blush) */}
            <div className="absolute inset-0 max-w-md mx-auto lg:mr-4 h-full bg-[#EAD6D2]/50 border border-[#DECFBD]/60 transform rotate-2 rounded-xs pointer-events-none -translate-x-2 -translate-y-2" />

            {/* Vintage Postmark Stamp badge */}
            <div className="absolute -top-6 -right-2 md:right-8 z-30 hidden sm:block">
              <StampBadge label="MEMORIES" sublabel="BIRTHDAY EDITION" rotation={12} />
            </div>

            {/* Main Featured Polaroid Photo */}
            <div className="relative z-20">
              <PolaroidPhoto
                image_url={settings.hero_photo_url}
                caption={settings.hero_photo_caption}
                date={settings.hero_photo_date}
                rotation={-2}
                tape_style="rose"
                size="large"
                className="max-w-[340px] sm:max-w-[420px] shadow-scrapbook-lg"
                onClick={() => navigate(toBookPath('/intro'))}
              />

              {/* Overlapping Handwritten Mini Sticky Note */}
              <div 
                style={{ transform: 'rotate(6deg)' }}
                className="absolute -bottom-6 -left-4 sm:-left-8 z-30 bg-[#FAF3DE] border border-[#EADBBD] p-3 sm:p-4 rounded-xs shadow-scrapbook max-w-[200px]"
              >
                <WashiTape color="sage" position="top-center" rotation={-2} className="w-16 h-3.5 -top-2" />
                <p className="font-hand text-lg text-[#514137] leading-tight">
                  A space for the moments, notes, and laughter you choose to keep.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
