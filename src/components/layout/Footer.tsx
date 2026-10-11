import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock, BookOpen } from 'lucide-react';
import { PressedFlower } from '../scrapbook/PressedFlower';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-20 border-t border-[#E3D9CC] bg-[#F1E8DA]/80 py-12 px-4 sm:px-6 text-center overflow-hidden">
      <PressedFlower variant="wildflower" opacity={0.35} className="absolute -top-6 -left-3 scale-75" />
      <PressedFlower variant="fern" opacity={0.3} className="absolute -bottom-8 -right-4 scale-75" />

      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#EAD6D2]/80 border border-[#B77D7D]/30 flex items-center justify-center mb-3">
          <BookOpen className="w-5 h-5 text-[#B77D7D]" />
        </div>

        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#3D3028]">
          A Little Book of You
        </h3>

        <p className="font-hand text-2xl text-[#B77D7D] mt-1 max-w-md">
          “For all the little moments that became our big memories.”
        </p>

        <p className="text-xs text-[#7E6C5F] font-serif italic mt-3 max-w-md">
          A personal, digital birthday keepsake designed to celebrate another year of life, laughs, and timeless memories.
        </p>

        <div className="w-24 h-px bg-[#8C7765]/20 my-6" />

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-serif text-[#7E6C5F]">
          <Link to="/" className="hover:text-[#3D3028] transition-colors">The Cover</Link>
          <Link to="/intro" className="hover:text-[#3D3028] transition-colors">Dedication</Link>
          <Link to="/photos" className="hover:text-[#3D3028] transition-colors">Photo Scrapbook</Link>
          <Link to="/timeline" className="hover:text-[#3D3028] transition-colors">Timeline</Link>
          <Link to="/videos" className="hover:text-[#3D3028] transition-colors">Cinema</Link>
          <Link to="/wishes" className="hover:text-[#3D3028] transition-colors">Birthday Wishes</Link>
          <Link to="/letter" className="hover:text-[#3D3028] transition-colors">Personal Letter</Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-[#8C7765]/80">
          <span>Handmade with</span>
          <Heart className="w-3.5 h-3.5 text-[#B77D7D] fill-current" />
          <span>• The Friendship Edition</span>
          <span>•</span>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 hover:text-[#514137] underline decoration-[#B77D7D]/50 transition-colors"
          >
            <Lock className="w-3 h-3 text-[#B77D7D]" /> Owner Portal
          </Link>
        </div>
      </div>
    </footer>
  );
};
