import React, { useEffect } from 'react';
import { VideoMemory } from '../../types/scrapbook';
import { X, Film, Calendar, Clock } from 'lucide-react';
import { WashiTape } from './WashiTape';

interface VideoModalProps {
  video: VideoMemory | null;
  onClose: () => void;
}

const NativeVideoPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#1E1714] p-6 text-center text-[#FAF6EC]" role="status">
        <Film className="h-8 w-8 text-[#B77D7D]" aria-hidden="true" />
        <p className="font-serif">This video could not be loaded.</p>
        <p className="break-all text-xs text-[#C5BAA8]">Check the video URL or upload a supported video file.</p>
      </div>
    );
  }

  return (
    <video
      src={src}
      controls
      playsInline
      className="h-full w-full object-contain"
      onError={() => setHasError(true)}
    >
      Your browser does not support HTML5 video playback.
    </video>
  );
};

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  useEffect(() => {
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [video, onClose]);

  if (!video) return null;

  // Check if YouTube or Vimeo URL
  const getEmbedUrl = (url: string): string | null => {
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtu.be/')
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : new URL(url).searchParams.get('v');
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0` : null;
      }
      if (url.includes('vimeo.com/')) {
        const id = url.split('vimeo.com/')[1]?.split('?')[0];
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
      }
    } catch (e) {
      console.warn('Could not parse video URL for embed:', e);
    }
    return null;
  };

  const embedUrl = getEmbedUrl(video.video_url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#382C24]/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close Video Player"
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-[#FAF6EC]/90 text-[#514137] hover:bg-[#FAF6EC] hover:scale-105 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#B77D7D]"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="relative max-w-3xl w-full bg-[#FAF7F2] p-4 sm:p-6 pb-6 border border-[#E8DEC8] rounded-xs shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <WashiTape color="sage" position="top-center" rotation={1} />

        {/* Vintage Film Border Header */}
        <div className="w-full flex items-center justify-between px-2 mb-3 border-b border-[#8C7765]/20 pb-2 text-xs font-mono text-[#7E6C5F]">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Film className="w-3.5 h-3.5 text-[#B77D7D]" /> Vintage Reel No. {video.id}
          </span>
          {video.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {video.duration}
            </span>
          )}
        </div>

        {/* Video Player Display */}
        <div className="relative w-full aspect-video bg-black rounded-xs overflow-hidden shadow-inner border border-[#4A3B31]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <NativeVideoPlayer key={video.video_url} src={video.video_url} />
          )}
        </div>

        {/* Title and Handwritten Notes */}
        <div className="w-full mt-4 px-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#3D3028]">
              {video.title}
            </h3>
            {video.date && (
              <span className="flex items-center gap-1 text-xs font-serif italic text-[#7E6C5F]">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                {video.date}
              </span>
            )}
          </div>

          <p className="font-hand text-xl md:text-2xl text-[#514137] mt-2 leading-snug">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
};
