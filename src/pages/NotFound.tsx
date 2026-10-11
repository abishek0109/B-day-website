import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { PressedFlower } from '../components/scrapbook/PressedFlower';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-16 px-4 text-center bg-[#F8F4EC] relative">
      <PressedFlower variant="wildflower" opacity={0.4} className="absolute top-10 left-10 rotate-12" />
      <div className="max-w-md bg-[#FAF7F2] border border-[#E8DEC8] p-8 sm:p-10 rounded-xs shadow-scrapbook">
        <div className="w-12 h-12 rounded-full bg-[#EAD6D2] mx-auto flex items-center justify-center text-[#B77D7D] mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#7E6C5F]">
          Error 404 • Lost Page
        </span>
        <h2 className="font-serif text-3xl font-bold text-[#382C24] mt-2 mb-3">
          Page Drifted Away
        </h2>
        <p className="font-hand text-2xl text-[#7E6C5F] mb-6">
          This page isn't in the memory book. Let's head back to the cover!
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] text-[#FAF6EC] font-serif rounded-xs shadow-xs hover:bg-[#A36B6B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Memory Book</span>
        </button>
      </div>
    </div>
  );
};
