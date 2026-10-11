import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoMemory } from '../types/scrapbook';
import { ArrowLeft, ArrowRight, Bookmark, Play, Film, Calendar, Clock } from 'lucide-react';
import { VideoModal } from '../components/scrapbook/VideoModal';
import { WashiTape } from '../components/scrapbook/WashiTape';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import { ScrapbookImage } from '../components/scrapbook/ScrapbookImage';
import { useBookRoute } from '../lib/routeContext';

interface VideoMemoriesPageProps {
  videos: VideoMemory[];
}

export const VideoMemoriesPage: React.FC<VideoMemoriesPageProps> = ({ videos }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();
  const [selectedVideo, setSelectedVideo] = useState<VideoMemory | null>(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative">
      
      <PressedFlower variant="wildflower" opacity={0.3} className="absolute top-10 left-6 -rotate-6" />
      <PressedFlower variant="fern" opacity={0.25} className="absolute bottom-12 right-6 rotate-12" />

      <div className="max-w-5xl mx-auto">
        
        {/* Chapter Header */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8">
          <button
            onClick={() => navigate(toBookPath('/timeline'))}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Chapter
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 4: Moments in Motion</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 04</span>
        </div>

        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-hand text-2xl md:text-3xl text-[#B77D7D] block mb-1">
            our little cinema reel
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#382C24]">
            Moments in Motion
          </h2>
          <p className="font-body text-[#7E6C5F] mt-3 text-base">
            Short clips, spontaneous laughter, and genuine living. Click on any reel to watch the video.
          </p>
        </div>

        {/* Video Reel Cards */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {videos.map((video, index) => {
              const rotation = index % 2 === 0 ? -1.5 : 1.5;

              return (
                <div
                  key={video.id}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  onClick={() => setSelectedVideo(video)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedVideo(video);
                    }
                  }}
                  className="group relative bg-[#2A231F] text-[#FAF6EC] p-4 sm:p-5 pb-6 rounded-xs shadow-scrapbook hover:shadow-scrapbook-lift transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <WashiTape color="sage" position="top-center" rotation={-rotation} />

                  {/* Top Vintage Sprocket Holes */}
                  <div className="flex justify-between items-center px-1 mb-2.5 opacity-40">
                    {[...Array(8)].map((_, i) => (
                      <span key={i} className="w-3 h-2 rounded-xs bg-[#FAF6EC]/40" />
                    ))}
                  </div>

                  {/* Video Thumbnail with Play Button Overlay */}
                  <div className="relative aspect-video bg-[#1B1613] rounded-xs overflow-hidden border border-[#514137]/60 group-hover:border-[#B77D7D]/60 transition-colors">
                    {video.thumbnail_url ? (
                      <ScrapbookImage
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        fallbackLabel="Video thumbnail unavailable"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1E1714]">
                        <Film className="w-12 h-12 text-[#7E6C5F]" />
                      </div>
                    )}

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-[#FAF6EC]/90 text-[#B77D7D] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#FAF6EC] transition-transform">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 rounded text-[11px] font-mono text-[#FAF6EC] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Bottom Vintage Sprocket Holes */}
                  <div className="flex justify-between items-center px-1 mt-2.5 mb-3 opacity-40">
                    {[...Array(8)].map((_, i) => (
                      <span key={i} className="w-3 h-2 rounded-xs bg-[#FAF6EC]/40" />
                    ))}
                  </div>

                  {/* Title & Description */}
                  <div className="mt-2 text-left">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF6EC] group-hover:text-[#EAD6D2] transition-colors">
                        {video.title}
                      </h3>
                      {video.date && (
                        <span className="text-xs font-serif italic text-[#C5BAA8] flex items-center gap-1">
                          <Calendar className="w-3 h-3 opacity-70" /> {video.date}
                        </span>
                      )}
                    </div>

                    <p className="font-hand text-xl text-[#DECFBD] mt-1.5 leading-snug">
                      {video.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] rounded-sm p-12 text-center max-w-md mx-auto">
            <Film className="w-12 h-12 text-[#B77D7D] mx-auto mb-3" />
            <h3 className="font-serif text-2xl font-semibold text-[#382C24]">
              No reels in the projector yet
            </h3>
            <p className="font-hand text-xl text-[#7E6C5F] mt-2">
              Video clips added in the owner dashboard will appear here!
            </p>
          </div>
        )}

        {/* Chapter Transition Footer */}
        <div className="mt-16 pt-8 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F]">
            Next: Hear what everyone wanted to say to you...
          </p>

          <button
            onClick={() => navigate(toBookPath('/wishes'))}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Read Birthday Wishes</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* Video Modal Player */}
      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

    </div>
  );
};
