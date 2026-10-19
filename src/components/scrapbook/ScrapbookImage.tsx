import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveMediaUrl, getSyncMediaUrl } from '../../lib/mediaStorage';

interface ScrapbookImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ScrapbookImage: React.FC<ScrapbookImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel = 'Photograph not available',
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => getSyncMediaUrl(src || ''));
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (src && src.startsWith('idb://')) {
      void resolveMediaUrl(src).then((url) => {
        if (isMounted) setResolvedSrc(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [src]);

  const activeSrc = src && src.startsWith('idb://') ? resolvedSrc : src || '';
  const hasError = activeSrc && failedSource === activeSrc;

  if (!activeSrc || hasError) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel}
        className={`flex flex-col items-center justify-center gap-2 bg-[#EFE8DD] px-4 py-6 text-center text-[#8C7765] ${className}`}
      >
        <ImageOff className="h-7 w-7 opacity-70" aria-hidden="true" />
        <span className="font-hand text-lg leading-tight">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailedSource(activeSrc)}
    />
  );
};
