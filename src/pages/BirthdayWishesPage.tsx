import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthdayWish } from '../types/scrapbook';
import { submitPublicWish } from '../lib/dataService';
import { ArrowLeft, ArrowRight, Bookmark, Send, CheckCircle2, AlertCircle, Heart, MessageSquareHeart } from 'lucide-react';
import { PaperNote } from '../components/scrapbook/PaperNote';
import { PressedFlower } from '../components/scrapbook/PressedFlower';
import confetti from 'canvas-confetti';
import { isSupabaseConfigured } from '../lib/supabase';
import { useBookRoute } from '../lib/routeContext';

const isWishSubmissionConfigured = isSupabaseConfigured;

interface BirthdayWishesPageProps {
  wishes: BirthdayWish[];
  birthdayPageId: string;
  onWishSubmitted?: () => void;
}

export const BirthdayWishesPage: React.FC<BirthdayWishesPageProps> = ({ wishes, birthdayPageId, onWishSubmitted }) => {
  const navigate = useNavigate();
  const { toBookPath } = useBookRoute();

  // Form State
  const [senderName, setSenderName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [paperColor, setPaperColor] = useState<'cream' | 'blush' | 'sage' | 'ivory'>('cream');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWishSubmissionConfigured) return;
    if (!senderName.trim() || !message.trim()) {
      setSubmissionError('Please provide your name and a birthday message.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const res = await submitPublicWish({
        sender_name: senderName.trim(),
        relationship: relationship.trim() || undefined,
        message: message.trim(),
        paper_color: paperColor,
        birthday_page_id: birthdayPageId,
      });

      if (res.success) {
        setSubmissionSuccess(true);
        setSenderName('');
        setRelationship('');
        setMessage('');

        // Burst celebratory confetti
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#B77D7D', '#A7AD96', '#EAD6D2', '#FAF6EC']
        });

        if (onWishSubmitted) onWishSubmitted();
      } else {
        setSubmissionError(res.error || 'Failed to submit wish. Please try again.');
      }
    } catch {
      setSubmissionError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F4EC] relative">
      
      <PressedFlower variant="wildflower" opacity={0.3} className="absolute top-8 right-6 rotate-12" />
      <PressedFlower variant="fern" opacity={0.25} className="absolute bottom-16 left-6 -rotate-12" />

      <div className="max-w-6xl mx-auto">
        
        {/* Chapter Header */}
        <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-8">
          <button
            onClick={() => navigate(toBookPath('/videos'))}
            className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Chapter
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAD6D2]/60 rounded-full text-xs font-serif text-[#8C5E5E]">
            <Bookmark className="w-3.5 h-3.5 text-[#B77D7D]" />
            <span>Chapter 5: Words From Your People</span>
          </div>

          <span className="text-xs font-mono text-[#8C7765]">Page 05</span>
        </div>

        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-hand text-2xl md:text-3xl text-[#B77D7D] block mb-1">
            messages, wishes & love
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#382C24]">
            Words From Your People
          </h2>
          <p className="font-body text-[#7E6C5F] mt-3 text-base">
            Notes, postcards, and love sent from friends who cherish you.
          </p>
        </div>

        {/* Wishes Scrapbook Wall (Reference 2 Inspiration) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start mb-16">
          {wishes.length > 0 ? wishes.map((wish, index) => {
            const rotations = [-1.8, 1.5, -2.2, 2.0, -1.2, 1.8];
            const rotation = wish.rotation ?? rotations[index % rotations.length];
            const decorations: ('tape-rose' | 'tape-sage' | 'tape-cream' | 'clip')[] = [
              'tape-rose',
              'clip',
              'tape-sage',
              'tape-cream',
            ];
            const decoration = decorations[index % decorations.length];

            return (
              <div key={wish.id} className="w-full flex justify-center">
                <PaperNote
                  color={wish.paper_color || 'cream'}
                  rotation={rotation}
                  decoration={decoration}
                  author={wish.sender_name}
                  relationship={wish.relationship}
                  date={wish.created_at}
                  hasLinedPaper={index % 2 === 0}
                  className="w-full max-w-sm"
                >
                  <p className="font-hand text-2xl text-[#3D3028] leading-relaxed">
                    “{wish.message}”
                  </p>
                </PaperNote>
              </div>
            );
          }) : (
            <div className="md:col-span-2 lg:col-span-3 mx-auto max-w-lg rounded-sm border border-dashed border-[#DECFBD] bg-[#FAF7F2] p-10 text-center">
              <Heart className="mx-auto h-8 w-8 text-[#B77D7D]" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-2xl font-semibold text-[#382C24]">The guestbook is waiting</h3>
              <p className="mt-2 font-hand text-xl text-[#7E6C5F]">Birthday notes will appear here after the owner approves them.</p>
            </div>
          )}
        </div>

        {/* Interactive "Leave a Birthday Note" Form Card */}
        <div className="max-w-2xl mx-auto bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-8 md:p-10 rounded-xs shadow-scrapbook relative">
          
          <div className="flex items-center gap-2 mb-2 text-[#B77D7D]">
            <MessageSquareHeart className="w-5 h-5" />
            <span className="font-hand text-xl font-bold uppercase tracking-wider">
              Friendship Mailbox
            </span>
          </div>

          <h3 className="font-serif text-3xl font-bold text-[#382C24] mb-2">
            Leave a Birthday Note
          </h3>
          <p className="font-body text-sm text-[#7E6C5F] mb-6">
            Leave a birthday note for the owner to review before it appears on this wall.
          </p>
          {!isWishSubmissionConfigured && (
            <p className="mb-6 rounded-xs border border-[#DECFBD] bg-[#FAF3DE] p-3 font-body text-xs text-[#7E6C5F]">
              Wish submissions are paused until the owner configures the secure Supabase backend.
            </p>
          )}

          {/* Success Banner */}
          {submissionSuccess && (
            <div className="mb-6 p-4 rounded-xs bg-[#F0F3E8] border border-[#A7AD96] text-[#514137] flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-[#767D65] shrink-0 mt-0.5" />
              <div>
                <p className="font-serif font-semibold text-base">
                  Thank you! Your wish has been sent.
                </p>
                <p className="font-body text-xs text-[#7E6C5F] mt-1">
                  To keep the birthday surprise safe and organized, all notes are reviewed by the host before being pinned to the public wall.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submissionError && (
            <div className="mb-6 p-4 rounded-xs bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-sans">{submissionError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] focus:outline-none focus:ring-1 focus:ring-[#B77D7D] font-body text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Relationship or Nickname
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] focus:outline-none focus:ring-1 focus:ring-[#B77D7D] font-body text-sm"
                />
              </div>
            </div>

            {/* Note Paper Style Selection */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1.5">
                Choose Stationery Color
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'cream', name: 'Warm Cream', bg: 'bg-[#F9F5EC]' },
                  { id: 'blush', name: 'Pastel Blush', bg: 'bg-[#F8EBE8]' },
                  { id: 'sage', name: 'Muted Sage', bg: 'bg-[#F0F3E8]' },
                  { id: 'ivory', name: 'Crisp Ivory', bg: 'bg-[#FEFAF3]' },
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setPaperColor(color.id as any)}
                    className={`px-3 py-1.5 text-xs font-serif rounded-xs border transition-all ${color.bg} ${
                      paperColor === color.id
                        ? 'border-[#B77D7D] ring-2 ring-[#B77D7D]/30 font-bold'
                        : 'border-[#DECFBD] text-[#7E6C5F]'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                Your Birthday Wish or Message *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your heartfelt birthday wishes, inside joke, or favorite memory here..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] focus:outline-none focus:ring-1 focus:ring-[#B77D7D] font-hand text-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isWishSubmissionConfigured}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all cursor-pointer disabled:opacity-50"
            >
              {!isWishSubmissionConfigured ? (
                <span>Submissions unavailable</span>
              ) : isSubmitting ? (
                <span>Sending your letter...</span>
              ) : (
                <>
                  <span>Send Birthday Wish</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Chapter Transition Footer */}
        <div className="mt-16 pt-8 border-t border-[#E3D9CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-hand text-2xl text-[#7E6C5F] flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-[#B77D7D] fill-current" />
            Next: A personal letter written just for you...
          </p>

          <button
            onClick={() => navigate(toBookPath('/letter'))}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook hover:shadow-scrapbook-lift transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Read The Personal Letter</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

    </div>
  );
};
