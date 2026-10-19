import React, { useState } from 'react';
import { X, Film, Plus, Sparkles, Upload, FileVideo, CheckCircle2 } from 'lucide-react';
import { VideoMemory } from '../../types/scrapbook';

interface BulkAddVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideos: (newVideos: Partial<VideoMemory>[]) => Promise<void> | void;
  onUploadFiles?: (files: FileList) => Promise<void> | void;
  birthdayPageId: string;
}

export const BulkAddVideosModal: React.FC<BulkAddVideosModalProps> = ({
  isOpen,
  onClose,
  onAddVideos,
  onUploadFiles,
  birthdayPageId,
}) => {
  const [activeMode, setActiveMode] = useState<'files' | 'urls' | 'slots'>('files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urlsText, setUrlsText] = useState('');
  const [slotsCount, setSlotsCount] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleStartFileUpload = async () => {
    if (!selectedFiles.length || !onUploadFiles) return;
    setIsSubmitting(true);
    try {
      // Create a DataTransfer to generate a FileList
      const dt = new DataTransfer();
      selectedFiles.forEach((f) => dt.items.add(f));
      await onUploadFiles(dt.files);
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error('Bulk upload error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseAndAddUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlsText.trim()) return;

    setIsSubmitting(true);
    const lines = urlsText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedVideos: Partial<VideoMemory>[] = [];

    for (const line of lines) {
      // Supports formats:
      // 1) URL
      // 2) URL | Title
      // 3) URL | Title | Description
      const parts = line.split('|').map((p) => p.trim());
      const url = parts[0] || '';
      const title = parts[1] || '';
      const description = parts[2] || '';

      if (url) {
        parsedVideos.push({
          id: crypto.randomUUID(),
          birthday_page_id: birthdayPageId,
          video_url: url,
          title,
          description,
          is_published: true,
        });
      }
    }

    if (parsedVideos.length > 0) {
      await onAddVideos(parsedVideos);
      setUrlsText('');
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleAddBlankSlots = async () => {
    setIsSubmitting(true);
    const count = Math.max(1, Math.min(20, slotsCount));
    const newVideos: Partial<VideoMemory>[] = [];

    for (let i = 0; i < count; i++) {
      newVideos.push({
        id: crypto.randomUUID(),
        birthday_page_id: birthdayPageId,
        video_url: '',
        title: '',
        description: '',
        is_published: true,
      });
    }

    await onAddVideos(newVideos);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#382C24]/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative max-w-xl w-full bg-[#FAF7F2] p-6 border border-[#E8DEC8] rounded-xs shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DECFBD] pb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#B77D7D]" />
            <h3 className="font-serif text-xl font-bold text-[#382C24]">
              Add Multiple Videos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#7E6C5F] hover:text-[#382C24] hover:bg-[#EFE8DD] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#DECFBD] gap-3 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setActiveMode('files')}
            className={`pb-2.5 px-1 text-xs font-serif uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeMode === 'files'
                ? 'border-b-2 border-[#B77D7D] font-bold text-[#382C24]'
                : 'text-[#7E6C5F] hover:text-[#382C24]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1 text-[#B77D7D]" />
            Upload Video Files
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('urls')}
            className={`pb-2.5 px-1 text-xs font-serif uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeMode === 'urls'
                ? 'border-b-2 border-[#B77D7D] font-bold text-[#382C24]'
                : 'text-[#7E6C5F] hover:text-[#382C24]'
            }`}
          >
            <Film className="w-3.5 h-3.5 inline mr-1 text-[#B77D7D]" />
            Paste Video URLs
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('slots')}
            className={`pb-2.5 px-1 text-xs font-serif uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
              activeMode === 'slots'
                ? 'border-b-2 border-[#B77D7D] font-bold text-[#382C24]'
                : 'text-[#7E6C5F] hover:text-[#382C24]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-[#B77D7D]" />
            Quick Add Empty Cards
          </button>
        </div>

        {/* MODE 1: Upload Multiple Video Files */}
        {activeMode === 'files' && (
          <div className="space-y-4">
            <p className="text-xs text-[#514137] font-body leading-relaxed">
              Select multiple MP4, MOV, WebM, or other video files from your device. Each video will be stored securely with optional title and caption:
            </p>

            <label className="border-2 border-dashed border-[#DECFBD] hover:border-[#B77D7D] rounded-xs p-6 flex flex-col items-center justify-center text-center bg-[#FAF6EC] hover:bg-[#FAF3E8] transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 text-[#B77D7D] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-serif text-sm font-bold text-[#382C24]">
                Click to browse & select multiple video files
              </span>
              <span className="font-sans text-xs text-[#7E6C5F] mt-1">
                Supports MP4, MOV, WebM, MKV, AVI, etc. (up to 250MB per video)
              </span>
              <input
                type="file"
                multiple
                accept="video/*,video/mp4,video/quicktime,video/webm,video/x-m4v,video/ogg,.mp4,.mov,.webm,.m4v,.mkv,.avi"
                className="hidden"
                onChange={handleFilesChosen}
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className="bg-[#F1E8DA]/60 border border-[#DECFBD] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-[#382C24]">
                  <span>Selected Videos ({selectedFiles.length}):</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[#8C3A3A] hover:underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-xs font-mono text-[#514137] bg-[#FAF6EC] px-2.5 py-1.5 rounded-xs border border-[#DECFBD]/60"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileVideo className="w-3.5 h-3.5 text-[#B77D7D] shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <span className="text-[11px] text-[#7E6C5F] shrink-0">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DECFBD]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#DECFBD] text-[#7E6C5F] text-xs font-serif rounded-xs hover:bg-[#F3EAD8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || selectedFiles.length === 0}
                onClick={handleStartFileUpload}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] disabled:opacity-50 text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmitting
                  ? `Uploading ${selectedFiles.length} video(s)...`
                  : `Upload ${selectedFiles.length} Video${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Paste Multiple Video URLs */}
        {activeMode === 'urls' && (
          <form onSubmit={handleParseAndAddUrls} className="space-y-4">
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1.5">
                Paste Multiple Video Links (One Per Line)
              </label>
              <textarea
                rows={6}
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={`https://www.youtube.com/watch?v=...\nhttps://youtu.be/... | Sunset Roadtrip | Best memories\nhttps://example.com/birthday.mp4 | Cake Cutting\nhttps://drive.google.com/file/d/... | Special Memory\nhttps://vimeo.com/...`}
                className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono text-[#382C24] focus:outline-hidden focus:ring-1 focus:ring-[#B77D7D] leading-relaxed"
                required
              />
              <p className="text-[11px] text-[#7E6C5F] mt-1.5 font-sans leading-normal">
                Format: <code className="bg-[#FAF6EC] px-1 py-0.5 rounded-xs border border-[#DECFBD]">URL</code> or <code className="bg-[#FAF6EC] px-1 py-0.5 rounded-xs border border-[#DECFBD]">URL | Title | Description</code>.
                Supports YouTube, YouTube Shorts, Vimeo, direct MP4, Google Drive, or any video link.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#DECFBD] text-[#7E6C5F] text-xs font-serif rounded-xs hover:bg-[#F3EAD8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !urlsText.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] disabled:opacity-50 text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSubmitting ? 'Adding...' : 'Add Videos'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Quick Add Empty Cards */}
        {activeMode === 'slots' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-[#514137] font-body mb-3">
                Quickly add multiple blank video cards to your list so you can fill them out easily:
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {[2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSlotsCount(num)}
                    className={`px-3 py-1.5 text-xs font-serif rounded-xs border transition-colors cursor-pointer ${
                      slotsCount === num
                        ? 'bg-[#B77D7D] text-[#FAF6EC] border-[#B77D7D]'
                        : 'bg-[#FAF6EC] text-[#514137] border-[#DECFBD] hover:bg-[#F1E8DA]'
                    }`}
                  >
                    + {num} Videos
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Custom Number of Videos to Add:
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={slotsCount}
                  onChange={(e) => setSlotsCount(parseInt(e.target.value) || 1)}
                  className="w-28 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DECFBD]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#DECFBD] text-[#7E6C5F] text-xs font-serif rounded-xs hover:bg-[#F3EAD8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBlankSlots}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] disabled:opacity-50 text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating...' : `Add ${slotsCount} Blank Video Cards`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
