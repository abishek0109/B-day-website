import React, { useEffect, useState } from 'react';
import { VideoMemory } from '../../types/scrapbook';
import { ScrapbookImage } from './ScrapbookImage';
import { Film } from 'lucide-react';
import { getSyncMediaUrl, resolveMediaUrl } from '../../lib/mediaStorage';

export function getVideoThumbnailUrl(video: VideoMemory): string | null {
  if (video.thumbnail_url && video.thumbnail_url.trim()) {
    return video.thumbnail_url.trim();
  }
  const url = video.video_url || '';
  try {
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v');
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://img.youtube.com/vi/${shortsMatch[1]}/hqdefault.jpg`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (url.includes('youtube.com/embed/')) {
      const id = url.split('youtube.com/embed/')[1]?.split('?')[0];
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
  } catch (e) {
    console.warn('Error parsing YouTube thumbnail URL:', e);
  }
  return null;
}

export const VideoThumbnail: React.FC<{
  video: VideoMemory;
  className?: string;
}> = ({ video, className = 'w-full h-full object-cover' }) => {
  const thumbUrl = getVideoThumbnailUrl(video);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>(() =>
    getSyncMediaUrl(video.video_url)
  );

  const isDirectVideo =
    video.video_url &&
    (video.video_url.startsWith('idb://') ||
      video.video_url.startsWith('blob:') ||
      video.video_url.startsWith('data:video/') ||
      /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(video.video_url));

  useEffect(() => {
    let isMounted = true;
    if (video.video_url && video.video_url.startsWith('idb://')) {
      void resolveMediaUrl(video.video_url).then((url) => {
        if (isMounted) setResolvedVideoSrc(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [video.video_url]);

  const activeVideoSrc =
    video.video_url && video.video_url.startsWith('idb://')
      ? resolvedVideoSrc
      : video.video_url || '';

  if (thumbUrl) {
    return (
      <ScrapbookImage
        src={thumbUrl}
        alt={video.title || 'Video thumbnail'}
        className={`${className} group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100`}
        fallbackLabel="Video thumbnail unavailable"
      />
    );
  }

  if (isDirectVideo && activeVideoSrc) {
    return (
      <video
        key={activeVideoSrc}
        src={activeVideoSrc}
        preload="metadata"
        muted
        playsInline
        className={`${className} pointer-events-none group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100`}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1E1714]">
      <Film className="w-12 h-12 text-[#7E6C5F]" />
    </div>
  );
};
