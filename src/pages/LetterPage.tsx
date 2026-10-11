import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonalLetter } from '../types/scrapbook';
import { ArrowLeft, ArrowRight, Bookmark, Heart } from 'lucide-react';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { WashiTape } from '../components/scrapbook/WashiTape';
import { StampBadge } from '../components/scrapbook/StampBadge';
import { useBookRoute } from '../lib/routeContext';

interface LetterPageProps {
  letter: PersonalLetter;
}

export const LetterPage: React.FC<LetterPageProps> = ({ letter }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative flex flex-col justify-center">
      
      {/* Decorative botanical accents */}
      <PressedFlower variant="wildflower" opacity={0.35} className="absolute top-12 left-6 rotate-[-8deg]" />
      <PressedFlower variant="lavender" opacity={0.35} className="absolute bottom-16 right-6 rotate-[14deg]" />

      <div className="max-w-4xl mx-auto w-full">
        
        {/* Chapter Header */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8">
          <button
            onClick={() => navigate(toBookPath('/wishes'))}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Chapter
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 6: A Letter Just for You</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 06</span>
        </div>

        {/* Section Title */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="font-hand text-2xl md:text-3xl text-[#B77D7D] block mb-1">
            from my heart to yours
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#382C24]">
            A Letter Just for You
          </h2>
        </div>

        {/* The Stationery Paper Letter */}
        <div className="relative bg-[#FAF6EE] border border-[#E8DEC8] p-8 sm:p-14 md:p-16 rounded-xs shadow-scrapbook-lg max-w-3xl mx-auto">
          
          <WashiTape color="rose" position="top-center" rotation={-1.2} />

          {/* Top Postmark and Date stamp */}
          <div className="flex items-center justify-between border-b border-[#8C7765]/20 pb-4 mb-8">
            <span className="font-mono text-xs text-[#7E6C5F] tracking-widest uppercase">
              ★ AIR MAIL • SPECIAL DELIVERY
            </span>
            <span className="font-serif italic text-sm text-[#7E6C5F]">
              {letter.letter_date}
            </span>
          </div>

          {/* Greeting */}
          {letter.paragraphs.length > 0 ? (
            <>
              {letter.greeting && (
                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#382C24] mb-6">
                  {letter.greeting}
                </h3>
              )}

              <div className="space-y-6 font-body text-base sm:text-lg text-[#514137] leading-[1.8] relative">
                {letter.paragraphs.map((paragraph, index) => (
                  <p key={index} className="indent-6 sm:indent-8 text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>

              {(letter.sign_off || letter.sender_signature) && (
                <div className="mt-12 pt-6 border-t border-[#8C7765]/15 flex flex-col items-end">
                  {letter.sign_off && (
                    <p className="font-serif italic text-base text-[#7E6C5F] mb-1">
                      {letter.sign_off}
                    </p>
                  )}
                  {letter.sender_signature && (
                    <p className="font-hand text-4xl sm:text-5xl text-[#B77D7D] font-bold tracking-wide">
                      {letter.sender_signature}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="rounded-xs border border-dashed border-[#DECFBD] bg-[#FAF3DE] p-6 text-center font-hand text-2xl text-[#7E6C5F]">
              The owner’s personal letter will appear here when it is ready.
            </p>
          )}

          {/* Pressed flower on the stationery corner */}
          <PressedFlower
            variant="wildflower"
            opacity={0.7}
            className="absolute bottom-6 left-6 scale-90 pointer-events-none"
          />

          <StampBadge
            label="A LETTER"
            sublabel="JUST FOR YOU"
            rotation={-10}
            className="absolute -top-6 -right-6 hidden sm:flex"
          />
        </div>

        {/* Chapter Transition Footer */}
        <div className="mt-16 pt-8 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F] flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-[#B77D7D] fill-current" />
            Finishing the memory-book journey...
          </p>

          <button
            onClick={() => navigate(toBookPath('/closing'))}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>The Closing Page</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

    </div>
  );
};
