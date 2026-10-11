import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteSettings } from '../types/scrapbook';
import { RotateCcw, Heart, Sparkles } from 'lucide-react';
import { PolaroidPhoto } from '../components/scrapbook/PolaroidPhoto';
import { DoodleHeart } from '../components/scrapbook/DoodleHeart';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { StampBadge } from '../components/scrapbook/StampBadge';
import confetti from 'canvas-confetti';
import { useBookRoute } from '../lib/routeContext';

interface ClosingPageProps {
  settings: SiteSettings;
}

export const ClosingPage: React.FC<ClosingPageProps> = ({ settings }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  const handleBurstConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#B77D7D', '#A7AD96', '#EAD6D2', '#DEB887', '#F1E8DA']
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative flex flex-col items-center justify-center text-center">
      
      {/* Decorative Accents */}
      <PressedFlower variant="wildflower" opacity={0.35} className="absolute top-8 left-8 rotate-[-15deg]" />
      <PressedFlower variant="fern" opacity={0.3} className="absolute bottom-10 right-8 rotate-[20deg]" />
      <DoodleHeart size={44} color="#B77D7D" className="absolute top-20 right-16 opacity-50 hidden sm:block" />

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center">
        
        {/* Subtle Epilogue Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E] text-xs font-mono uppercase tracking-widest mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#B77D7D]" />
          <span>Epilogue • With Sincere Love</span>
        </div>

        {/* Closing Title */}
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#382C24] leading-tight mb-4">
          Here's to Many More Memories
        </h2>

        <div className="relative max-w-2xl mx-auto my-6 px-4">
          <p className="font-body text-lg sm:text-xl text-[#514137] leading-relaxed italic">
            {settings.closing_message || 'Here’s to the memories still waiting to be made.'}
          </p>
          <p className="font-hand text-3xl sm:text-4xl text-[#B77D7D] font-bold mt-4">
            {settings.recipient_name ? `Happy Birthday, ${settings.recipient_name}!` : 'Happy Birthday!'} 🎂✨
          </p>
        </div>

        {/* Final Polaroid Collage */}
        <div className="relative my-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <PolaroidPhoto
            image_url={settings.hero_photo_url}
            caption={settings.hero_photo_caption}
            rotation={-3}
            tape_style="rose"
            size="small"
          />

          <StampBadge
            label="FOREVER"
            sublabel="BEST FRIENDS"
            rotation={10}
            className="absolute -bottom-6 -right-2 sm:right-10 z-30"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          
          {/* Confetti Trigger */}
          <button
            onClick={handleBurstConfetti}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FAF6EC] hover:bg-[#F1E8DA] border border-[#DECFBD] text-[#514137] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#B77D7D]" />
            <span>Celebrate with Confetti!</span>
          </button>

          {/* Revisit Journey */}
          <button
            onClick={() => navigate(toBookPath('/'))}
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-105 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90" />
            <span>Revisit The Memory Book</span>
          </button>
        </div>

        {/* Small dedication signoff */}
        <p className="font-hand text-xl text-[#7E6C5F] mt-10 flex items-center gap-1.5">
          {settings.sender_name && (
            <>
              <span>Crafted for you by {settings.sender_name}</span>
              <Heart className="w-3.5 h-3.5 text-[#B77D7D] fill-current" />
            </>
          )}
        </p>

      </div>

    </div>
  );
};
