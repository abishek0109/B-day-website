import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

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
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const hasError = src !== undefined && src !== null && failedSource === src;

  if (!src || hasError) {
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
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailedSource(src || '')}
    />
  );
};
