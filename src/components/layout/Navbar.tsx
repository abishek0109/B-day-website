import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Volume2, VolumeX, Lock, Sparkles, Menu, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavbarProps {
  audioUrl?: string;
  onTriggerConfetti?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ audioUrl, onTriggerConfetti }) => {
  const location = useLocation();
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [failedAudioUrl, setFailedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const audioError = Boolean(audioUrl && failedAudioUrl === audioUrl);
  const isAudioPlaying = Boolean(audioUrl && isPlayingMusic && !audioError);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = 0.35;
    const handleError = () => {
      setFailedAudioUrl(audioUrl);
      setIsPlayingMusic(false);
    };
    const handlePlay = () => setIsPlayingMusic(true);
    const handlePause = () => setIsPlayingMusic(false);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    if (!audio.paused) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((e) => {
        console.warn('Background audio could not be played:', e);
        setFailedAudioUrl(audioUrl || null);
      });
    }
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.1 },
      colors: ['#B77D7D', '#A7AD96', '#EAD6D2', '#DEB887', '#F1E8DA']
    });
    if (onTriggerConfetti) onTriggerConfetti();
  };

  const navLinks = [
    { name: 'Cover', path: '/' },
    { name: 'Dedication', path: '/intro' },
    { name: 'Photo Scrapbook', path: '/photos' },
    { name: 'Timeline', path: '/timeline' },
    { name: 'Cinema', path: '/videos' },
    { name: 'Wishes', path: '/wishes' },
    { name: 'Personal Letter', path: '/letter' },
    { name: 'Closing', path: '/closing' },
  ];

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F4EC]/90 backdrop-blur-md border-b border-[#E3D9CC] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Title Logo */}
        <Link 
          to="/" 
          className="group flex items-center gap-2.5 text-[#514137] hover:text-[#3D3028] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#EAD6D2] border border-[#B77D7D]/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4 text-[#B77D7D]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg md:text-xl font-bold tracking-tight leading-none text-[#3D3028]">
              A Little Book of You
            </span>
            <span className="font-hand text-xs text-[#B77D7D] font-medium leading-none mt-0.5">
              birthday memory journal
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-3 py-1.5 text-xs font-serif tracking-wider uppercase transition-colors rounded-sm ${
                  isActive
                    ? 'text-[#B77D7D] font-bold bg-[#EAD6D2]/40'
                    : 'text-[#7E6C5F] hover:text-[#3D3028] hover:bg-[#FAF6EC]'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#B77D7D] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Confetti Sparkle */}
          <button
            onClick={handleConfetti}
            title="Make a birthday wish!"
            aria-label="Trigger celebratory confetti"
            className="p-2 rounded-full bg-[#FAF6EC] border border-[#E3D9CC] text-[#B77D7D] hover:bg-[#EAD6D2]/50 hover:scale-105 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Music Button */}
          <button
            onClick={toggleMusic}
            disabled={!audioUrl || audioError}
            title={!audioUrl ? 'No background music has been configured' : audioError ? 'Configured audio could not be loaded' : isAudioPlaying ? 'Mute background music' : 'Play background music'}
            aria-label={!audioUrl ? 'No background music configured' : audioError ? 'Background music unavailable' : 'Toggle background music'}
            className={`p-2 rounded-full border transition-all flex items-center gap-1.5 text-xs font-serif ${
              !audioUrl || audioError
                ? 'bg-[#FAF6EC] border-[#E3D9CC] text-[#7E6C5F] opacity-60 cursor-not-allowed'
                : isAudioPlaying
                ? 'bg-[#A7AD96]/30 border-[#A7AD96] text-[#514137]'
                : 'bg-[#FAF6EC] border-[#E3D9CC] text-[#7E6C5F] hover:text-[#514137]'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-4 h-4 text-[#7A8267] animate-pulse" />
                <span className="hidden sm:inline text-[11px] font-mono">Sound on</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 opacity-70" />
                <span className="hidden sm:inline text-[11px] font-mono">{audioUrl && !audioError ? 'Sound off' : 'No sound'}</span>
              </>
            )}
          </button>

          {/* Admin Portal Shortcut */}
          <Link
            to="/admin"
            title="Owner Dashboard"
            aria-label="Owner Admin Portal"
            className={`p-2 rounded-full border transition-all ${
              isAdminPage
                ? 'bg-[#B77D7D] text-white border-[#B77D7D]'
                : 'bg-[#FAF6EC] border-[#E3D9CC] text-[#7E6C5F] hover:text-[#B77D7D] hover:border-[#B77D7D]/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close mobile navigation menu' : 'Open mobile navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden p-2 rounded-md text-[#514137] hover:bg-[#FAF6EC]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="lg:hidden bg-[#FAF6EC] border-b border-[#E3D9CC] px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-sm font-serif rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#EAD6D2] text-[#B77D7D] font-bold'
                      : 'text-[#514137] hover:bg-[#F1E8DA]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          </nav>
      )}
    </header>
  );
};
