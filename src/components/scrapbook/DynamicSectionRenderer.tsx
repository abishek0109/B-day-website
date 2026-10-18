import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BirthdaySection,
  BirthdaySiteData,
  BirthdayWish,
  MemoryCategory,
  PhotoMemory,
  TimelineMemory,
  VideoMemory,
} from '../../types/scrapbook';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  Clock,
  Film,
  Filter,
  Heart,
  Image as ImageIcon,
  MapPin,
  Play,
  Quote,
  Send,
  Sparkles,
  Tag,
} from 'lucide-react';
import { PolaroidPhoto } from './PolaroidPhoto';
import { PhotoLightbox } from './PhotoLightbox';
import { PaperNote } from './PaperNote';
import { PressedFlower } from './PressedFlower';
import { WashiTape } from './WashiTape';
import { StampBadge } from './StampBadge';
import { VideoModal } from './VideoModal';
import { ScrapbookImage } from './ScrapbookImage';
import {
  mergeBirthdayWishes,
  mergePhotoMemories,
  mergeTimelineMemories,
  mergeVideoMemories,
  submitPublicWish,
} from '../../lib/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import confetti from 'canvas-confetti';

interface DynamicSectionRendererProps {
  section: BirthdaySection;
  chapterNumber: number;
  totalChapters: number;
  previousPath: string;
  previousLabel?: string;
  nextPath: string;
  nextLabel?: string;
  siteData: BirthdaySiteData;
  onReload?: () => void;
  isPreview?: boolean;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  section,
  chapterNumber,
  totalChapters,
  previousPath,
  previousLabel = 'Previous Chapter',
  nextPath,
  nextLabel = 'Turn the Page',
  siteData,
  onReload,
  isPreview = false,
}) => {
  const navigate = useNavigate();

  // Photo gallery state
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<MemoryCategory>('All');
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState<number | null>(null);

  // Video memories state
  const [selectedVideo, setSelectedVideo] = useState<VideoMemory | null>(null);

  // Birthday wish form state
  const [senderName, setSenderName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [paperColor, setPaperColor] = useState<'cream' | 'blush' | 'sage' | 'ivory'>('cream');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [wishError, setWishError] = useState<string | null>(null);

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    if (!isSupabaseConfigured) {
      setWishError('Wish submissions require Supabase to be configured.');
      return;
    }
    if (!senderName.trim() || !message.trim()) {
      setWishError('Please provide your name and a birthday message.');
      return;
    }
    setIsSubmittingWish(true);
    setWishError(null);
    try {
      const res = await submitPublicWish({
        sender_name: senderName.trim(),
        relationship: relationship.trim() || undefined,
        message: message.trim(),
        paper_color: paperColor,
        birthday_page_id: siteData.page.id,
      });
      if (res.success) {
        setWishSuccess(true);
        setSenderName('');
        setRelationship('');
        setMessage('');
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#B77D7D', '#A7AD96', '#EAD6D2', '#FAF6EC'],
        });
        if (onReload) onReload();
      } else {
        setWishError(res.error || 'Failed to submit wish. Please try again.');
      }
    } catch {
      setWishError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const handleNavClick = (path: string) => {
    if (isPreview) return;
    navigate(path);
  };

  const content = section.content || {};

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative flex flex-col justify-center">
      {/* Decorative Accents */}
      <PressedFlower variant="wildflower" opacity={0.3} className="absolute top-8 right-6 rotate-12 pointer-events-none" />
      <PressedFlower variant="fern" opacity={0.25} className="absolute bottom-10 left-6 -rotate-12 pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full">
        {/* Book Header / Chapter Indicator */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8 sm:mb-10">
          <button
            onClick={() => handleNavClick(previousPath)}
            disabled={isPreview}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {previousLabel}
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter {chapterNumber}: {section.title || 'Untitled Section'}</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">
            Page {String(chapterNumber).padStart(2, '0')} / {String(totalChapters).padStart(2, '0')}
          </span>
        </div>

        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          {section.subtitle && (
            <span className="font-hand text-2xl sm:text-3xl text-[#B77D7D] block mb-1">
              {section.subtitle}
            </span>
          )}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#382C24]">
            {section.title}
          </h2>
          {content.description && (
            <p className="font-body text-[#7E6C5F] mt-3 text-base sm:text-lg">
              {content.description}
            </p>
          )}
        </div>

        {/* =========================================================================
            SECTION TYPE: TEXT / DEDICATION
           ========================================================================= */}
        {section.section_type === 'dedication' && (
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-10 md:p-12 shadow-scrapbook-lg rounded-xs relative">
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#514137]/4 to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-6">
                <span className="font-hand text-2xl text-[#B77D7D] font-medium mb-1">
                  {content.recipient_name || siteData.page.recipient_name
                    ? `For ${content.recipient_name || siteData.page.recipient_name}, on your birthday`
                    : 'A birthday dedication'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#382C24] leading-tight mb-4">
                  {content.dedication_title || siteData.page.intro_dedication || 'A page dedicated to you'}
                </h3>
                <div className="w-16 h-0.5 bg-[#B77D7D]/40 mb-6" />
                <p className="font-body text-base sm:text-lg text-[#514137] leading-relaxed mb-6 whitespace-pre-line">
                  {content.message || siteData.page.intro_message || 'A special dedication gathered for your birthday.'}
                </p>
                {(content.note || siteData.page.intro_note) && (
                  <PaperNote color="cream" rotation={-1.5} decoration="tape-sage" className="w-full mt-2">
                    <p className="font-hand text-2xl text-[#514137] leading-snug">
                      {content.note || siteData.page.intro_note}
                    </p>
                  </PaperNote>
                )}
              </div>
              <div className="lg:col-span-6 flex flex-col items-center justify-center pl-0 lg:pl-6 relative">
                <div className="relative">
                  <PolaroidPhoto
                    image_url={content.photo_url || siteData.page.intro_photo_url || siteData.page.hero_photo_url}
                    caption={content.photo_caption || siteData.page.intro_dedication || 'With love'}
                    rotation={2}
                    tape_style="rose"
                    size="normal"
                    className="max-w-[320px] sm:max-w-[360px]"
                  />
                  <StampBadge label="BIRTHDAY" sublabel="CELEBRATION" rotation={-15} className="absolute -bottom-6 -right-4 z-30" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION TYPE: PHOTO GALLERY
           ========================================================================= */}
        {section.section_type === 'photos' && (() => {
          const galleryPhotos: PhotoMemory[] = mergePhotoMemories(content.photos, siteData.photos);
          const filtered = selectedPhotoCategory === 'All'
            ? galleryPhotos
            : galleryPhotos.filter((p) => p.category === selectedPhotoCategory);
          const categories: MemoryCategory[] = ['All', 'Little Moments', 'Adventures', 'Celebrations', 'Everyday Chaos'];

          return (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <div className="inline-flex items-center gap-1 mr-2 text-xs font-serif text-[#7E6C5F] uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" /> Category:
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPhotoCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs md:text-sm font-serif rounded-full transition-all duration-200 cursor-pointer ${
                      selectedPhotoCategory === cat
                        ? 'bg-[#B77D7D] text-[#FAF6EC] shadow-xs scale-105'
                        : 'bg-[#F1E8DA] text-[#514137] hover:bg-[#EAD6D2]/70 border border-[#DECFBD]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 items-center justify-items-center">
                  {filtered.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      onClick={() => setPhotoLightboxIndex(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPhotoLightboxIndex(idx);
                        }
                      }}
                      className="cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#B77D7D] rounded-xs"
                    >
                      <PolaroidPhoto
                        image_url={photo.image_url}
                        title={photo.title}
                        caption={photo.caption}
                        date={photo.date}
                        location={photo.location}
                        rotation={photo.rotation || (idx % 2 === 0 ? -1.5 : 1.5)}
                        tape_style={photo.tape_style || (idx % 2 === 0 ? 'rose' : 'sage')}
                        size="normal"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] p-12 text-center rounded-xs">
                  <ImageIcon className="mx-auto w-10 h-10 text-[#B77D7D] mb-3" />
                  <p className="font-hand text-2xl text-[#7E6C5F]">No photos in this category yet.</p>
                </div>
              )}

              {photoLightboxIndex !== null && filtered[photoLightboxIndex] && (
                <PhotoLightbox
                  photos={filtered}
                  currentIndex={photoLightboxIndex}
                  onClose={() => setPhotoLightboxIndex(null)}
                  onNext={() => setPhotoLightboxIndex((photoLightboxIndex + 1) % filtered.length)}
                  onPrev={() => setPhotoLightboxIndex((photoLightboxIndex - 1 + filtered.length) % filtered.length)}
                />
              )}
            </div>
          );
        })()}

        {/* =========================================================================
            SECTION TYPE: TIMELINE
           ========================================================================= */}
        {section.section_type === 'timeline' && (() => {
          const events = mergeTimelineMemories(content.events, siteData.timeline);
          return (
            <div className="relative">
              <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-[#8C7765]/30 z-0" />
              {events.length > 0 ? (
                <div className="space-y-12 sm:space-y-16 relative z-10">
                  {events.map((entry: TimelineMemory, idx: number) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <div
                        key={entry.id || idx}
                        className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-10 ${
                          isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                        }`}
                      >
                        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FAF7F2] border-2 border-[#B77D7D] items-center justify-center shadow-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#B77D7D]" />
                        </div>
                        <div className={`w-full sm:w-1/2 ${isEven ? 'sm:pr-6' : 'sm:pl-6'}`}>
                          <PaperNote
                            color={idx % 2 === 0 ? 'cream' : 'blush'}
                            rotation={isEven ? -1.5 : 1.5}
                            decoration={idx % 2 === 0 ? 'tape-rose' : 'tape-sage'}
                            className="w-full"
                          >
                            {entry.tag && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E] text-xs font-mono uppercase tracking-wider mb-2">
                                <Tag className="w-3 h-3" />
                                {entry.tag}
                              </div>
                            )}
                            <h3 className="font-serif text-2xl font-bold text-[#382C24] leading-snug">
                              {entry.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7E6C5F] my-2">
                              {entry.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[#B77D7D]" />
                                  {entry.date}
                                </span>
                              )}
                              {entry.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#A7AD96]" />
                                  {entry.location}
                                </span>
                              )}
                            </div>
                            <p className="font-body text-sm sm:text-base text-[#514137] leading-relaxed mt-3 whitespace-pre-line">
                              {entry.story}
                            </p>
                            {entry.image_url && (
                              <div className="mt-4 pt-3 border-t border-[#8C7765]/20">
                                <ScrapbookImage
                                  src={entry.image_url}
                                  alt={entry.title}
                                  className="w-full h-44 object-cover rounded-xs border border-[#DECFBD]"
                                />
                              </div>
                            )}
                          </PaperNote>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] p-12 text-center rounded-xs">
                  <Bookmark className="mx-auto w-10 h-10 text-[#B77D7D] mb-3" />
                  <p className="font-hand text-2xl text-[#7E6C5F]">No timeline stories added yet.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* =========================================================================
            SECTION TYPE: VIDEO MEMORIES
           ========================================================================= */}
        {section.section_type === 'videos' && (() => {
          const videos = mergeVideoMemories(content.videos, siteData.videos);
          return (
            <div>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                  {videos.map((video: VideoMemory, idx: number) => {
                    const rotation = idx % 2 === 0 ? -1.5 : 1.5;
                    return (
                      <div
                        key={video.id || idx}
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
                        <div className="flex justify-between items-center px-1 mb-2.5 opacity-40">
                          {[...Array(8)].map((_, i) => (
                            <span key={i} className="w-3 h-2 rounded-xs bg-[#FAF6EC]/40" />
                          ))}
                        </div>
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
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-[#B77D7D]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current translate-x-0.5" />
                            </div>
                          </div>
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-xs bg-black/70 text-[11px] font-mono text-[#FAF6EC]">
                              {video.duration}
                            </span>
                          )}
                        </div>
                        <div className="mt-4">
                          <h3 className="font-serif text-xl font-bold text-[#FAF6EC] group-hover:text-[#EAD6D2] transition-colors">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs font-mono text-[#A7AD96] mt-1 mb-2">
                            {video.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {video.date}
                              </span>
                            )}
                            {video.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {video.duration}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-sm text-[#DECFBD] line-clamp-2">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] p-12 text-center rounded-xs">
                  <Film className="mx-auto w-10 h-10 text-[#B77D7D] mb-3" />
                  <p className="font-hand text-2xl text-[#7E6C5F]">No video reels uploaded yet.</p>
                </div>
              )}

              {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
              )}
            </div>
          );
        })()}

        {/* =========================================================================
            SECTION TYPE: BIRTHDAY WISHES
           ========================================================================= */}
        {section.section_type === 'wishes' && (() => {
          const wishes = mergeBirthdayWishes(content.wishes, siteData.wishes);
          return (
            <div className="space-y-12">
              {/* Wishes Bulletin Board */}
              <div className="relative bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-10 rounded-xs shadow-scrapbook-lg">
                <WashiTape color="sage" position="top-left" rotation={-2} />
                <WashiTape color="rose" position="top-right" rotation={2} />
                <h3 className="font-serif text-2xl font-bold text-[#382C24] text-center mb-8">
                  Notes from Friends & Family
                </h3>
                {wishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {wishes.map((wish: BirthdayWish, idx: number) => (
                      <PaperNote
                        key={wish.id || idx}
                        color={wish.paper_color || 'cream'}
                        rotation={wish.rotation || (idx % 2 === 0 ? -1.5 : 1.5)}
                        decoration={idx % 2 === 0 ? 'tape-rose' : 'tape-sage'}
                        className="w-full"
                      >
                        <p className="font-hand text-xl sm:text-2xl text-[#382C24] leading-snug mb-3">
                          "{wish.message}"
                        </p>
                        <div className="border-t border-[#8C7765]/20 pt-2 flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#514137]">
                            — {wish.sender_name}
                          </span>
                          {wish.relationship && (
                            <span className="text-[11px] font-mono text-[#7E6C5F]">
                              {wish.relationship}
                            </span>
                          )}
                        </div>
                      </PaperNote>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="font-hand text-2xl text-[#7E6C5F]">
                      Be the first to leave a birthday message below!
                    </p>
                  </div>
                )}
              </div>

              {/* Public Submission Form */}
              {!isPreview && content.allow_submissions !== false && (
                <div className="max-w-xl mx-auto bg-[#FAF6EE] border border-[#E8DEC8] p-6 sm:p-8 rounded-xs shadow-scrapbook relative">
                  <WashiTape color="cream" position="top-center" rotation={1} />
                  <div className="text-center mb-6">
                    <h3 className="font-serif text-2xl font-bold text-[#382C24] flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#B77D7D]" />
                      Leave a Birthday Wish
                    </h3>
                    <p className="font-body text-xs text-[#7E6C5F] mt-1">
                      Write a warm message to be added to this memory book.
                    </p>
                  </div>

                  {wishSuccess ? (
                    <div className="p-6 bg-[#F0F3E8] border border-[#A7AD96] rounded-xs text-center space-y-2">
                      <p className="font-serif text-lg font-bold text-[#514137]">Thank you for your warm wish!</p>
                      <p className="font-body text-xs text-[#7E6C5F]">Your birthday note was submitted for the owner's review.</p>
                      <button
                        type="button"
                        onClick={() => setWishSuccess(false)}
                        className="mt-3 px-4 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs cursor-pointer"
                      >
                        Write another wish
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleWishSubmit} className="space-y-4">
                      {wishError && (
                        <div className="p-3 bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] text-xs rounded-xs">
                          {wishError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">Your Name *</span>
                          <input
                            required
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="e.g. Maya"
                            className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-body"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">Relationship</span>
                          <input
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            placeholder="e.g. Best Friend / Sister"
                            className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-body"
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">Your Birthday Message *</span>
                        <textarea
                          required
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write something heartfelt, funny, or nostalgic..."
                          className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-body"
                        />
                      </label>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-serif text-[#7E6C5F]">Paper color:</span>
                          {(['cream', 'blush', 'sage', 'ivory'] as const).map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setPaperColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                                color === 'cream' ? 'bg-[#FAF6EE]' : color === 'blush' ? 'bg-[#F2DFDE]' : color === 'sage' ? 'bg-[#E3E8DE]' : 'bg-[#FFFFF0]'
                              } ${paperColor === color ? 'border-[#B77D7D] scale-110 shadow-xs' : 'border-[#DECFBD]'}`}
                            />
                          ))}
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingWish}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-sm rounded-xs shadow-scrapbook cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isSubmittingWish ? 'Sending...' : 'Send Wish'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* =========================================================================
            SECTION TYPE: LETTER
           ========================================================================= */}
        {section.section_type === 'letter' && (() => {
          const letterData = content.paragraphs ? content : siteData.letter;
          return (
            <div className="relative bg-[#FAF6EE] border border-[#E8DEC8] p-8 sm:p-14 md:p-16 rounded-xs shadow-scrapbook-lg max-w-3xl mx-auto">
              <WashiTape color="rose" position="top-center" rotation={-1.2} />
              <div className="flex items-center justify-between border-b border-[#8C7765]/20 pb-4 mb-8">
                <span className="font-mono text-xs text-[#7E6C5F] tracking-widest uppercase">
                  ★ AIR MAIL • SPECIAL DELIVERY
                </span>
                <span className="font-serif italic text-sm text-[#7E6C5F]">
                  {letterData.letter_date || 'A Special Birthday'}
                </span>
              </div>
              {letterData.paragraphs && letterData.paragraphs.length > 0 ? (
                <>
                  {letterData.greeting && (
                    <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#382C24] mb-6">
                      {letterData.greeting}
                    </h3>
                  )}
                  <div className="space-y-6 font-body text-base sm:text-lg text-[#514137] leading-[1.8] relative">
                    {letterData.paragraphs.map((p: string, idx: number) => (
                      <p key={idx} className="indent-6 sm:indent-8 text-justify">
                        {p}
                      </p>
                    ))}
                  </div>
                  {(letterData.sign_off || letterData.sender_signature) && (
                    <div className="mt-12 pt-6 border-t border-[#8C7765]/15 flex flex-col items-end">
                      {letterData.sign_off && (
                        <p className="font-serif italic text-base text-[#7E6C5F] mb-1">
                          {letterData.sign_off}
                        </p>
                      )}
                      {letterData.sender_signature && (
                        <p className="font-hand text-4xl sm:text-5xl text-[#B77D7D] font-bold tracking-wide">
                          {letterData.sender_signature}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="rounded-xs border border-dashed border-[#DECFBD] bg-[#FAF3DE] p-6 text-center font-hand text-2xl text-[#7E6C5F]">
                  A personal letter will appear here when it is ready.
                </p>
              )}
              <PressedFlower variant="wildflower" opacity={0.7} className="absolute bottom-6 left-6 scale-90 pointer-events-none" />
              <StampBadge label="A LETTER" sublabel="JUST FOR YOU" rotation={-10} className="absolute -top-6 -right-6 hidden sm:flex" />
            </div>
          );
        })()}

        {/* =========================================================================
            SECTION TYPE: CUSTOM CONTENT
           ========================================================================= */}
        {section.section_type === 'custom' && (
          <div className="space-y-10">
            {/* Story / Description container */}
            <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-10 md:p-12 rounded-xs shadow-scrapbook relative">
              <WashiTape color="sage" position="top-left" rotation={-1.5} />
              <WashiTape color="cream" position="top-right" rotation={2} />

              {content.body_paragraphs && content.body_paragraphs.length > 0 && (
                <div className="space-y-4 font-body text-base sm:text-lg text-[#514137] leading-relaxed max-w-3xl mx-auto">
                  {content.body_paragraphs.map((para: string, idx: number) => (
                    <p key={idx} className="text-justify indent-4 sm:indent-6">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Featured Quote */}
              {content.quote && (
                <div className="my-8 max-w-2xl mx-auto p-6 bg-[#FAF6EE] border-l-4 border-[#B77D7D] rounded-xs relative">
                  <Quote className="w-8 h-8 text-[#B77D7D]/30 absolute top-3 right-3" />
                  <p className="font-serif italic text-lg sm:text-xl text-[#382C24] leading-relaxed">
                    "{content.quote}"
                  </p>
                  {content.quote_author && (
                    <p className="font-hand text-2xl text-[#B77D7D] text-right mt-3">
                      — {content.quote_author}
                    </p>
                  )}
                </div>
              )}

              {/* Items / Cards Grid */}
              {content.items && content.items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10 pt-6 border-t border-[#E3D9CC]">
                  {content.items.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="bg-[#FAF6EC] border border-[#DECFBD] p-4 rounded-xs shadow-xs relative flex flex-col justify-between"
                      style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
                    >
                      <div>
                        {item.image_url && (
                          <div className="aspect-4/3 rounded-xs overflow-hidden border border-[#DECFBD] mb-3">
                            <ScrapbookImage
                              src={item.image_url}
                              alt={item.title || 'Scrapbook memory'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {item.tag && (
                          <span className="inline-block px-2 py-0.5 rounded-xs bg-[#EAD6D2]/60 text-[#8C5E5E] text-[10px] font-mono uppercase tracking-wider mb-1.5">
                            {item.tag}
                          </span>
                        )}
                        {item.title && (
                          <h4 className="font-serif text-lg font-bold text-[#382C24] mb-1">
                            {item.title}
                          </h4>
                        )}
                        {item.text && (
                          <p className="font-body text-xs sm:text-sm text-[#7E6C5F] leading-relaxed">
                            {item.text}
                          </p>
                        )}
                      </div>
                      {item.caption && (
                        <p className="font-hand text-lg text-[#B77D7D] mt-3 pt-2 border-t border-[#DECFBD]/60">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Page Navigation / Transition */}
        <div className="mt-12 sm:mt-16 pt-6 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F] flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-[#B77D7D] fill-current" />
            <span>Next chapter: {nextLabel}</span>
          </p>

          <button
            onClick={() => handleNavClick(nextPath)}
            disabled={isPreview}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-60"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
