import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { 
  SiteSettings, 
  PhotoMemory, 
  TimelineMemory, 
  VideoMemory, 
  BirthdayWish, 
  PersonalLetter 
} from './types/scrapbook';
import { 
  getSiteSettings, 
  getPhotos, 
  getTimelineMemories, 
  getVideos, 
  getWishes, 
  getPersonalLetter 
} from './lib/dataService';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { IntroductionPage } from './pages/IntroductionPage';
import { PhotoGalleryPage } from './pages/PhotoGalleryPage';
import { TimelinePage } from './pages/TimelinePage';
import { VideoMemoriesPage } from './pages/VideoMemoriesPage';
import { BirthdayWishesPage } from './pages/BirthdayWishesPage';
import { LetterPage } from './pages/LetterPage';
import { ClosingPage } from './pages/ClosingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFound } from './pages/NotFound';
import { BookOpen } from 'lucide-react';

// Scroll to top helper on page route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [photos, setPhotos] = useState<PhotoMemory[]>([]);
  const [timeline, setTimeline] = useState<TimelineMemory[]>([]);
  const [videos, setVideos] = useState<VideoMemory[]>([]);
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [letter, setLetter] = useState<PersonalLetter | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sData, pData, tData, vData, wData, lData] = await Promise.all([
        getSiteSettings(),
        getPhotos(true), // published only for public site
        getTimelineMemories(true),
        getVideos(true),
        getWishes(false), // approved only for public site
        getPersonalLetter(),
      ]);

      setSettings(sData);
      setPhotos(pData);
      setTimeline(tData);
      setVideos(vData);
      setWishes(wData);
      setLetter(lData);
    } catch (err) {
      console.error('Error loading app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !settings || !letter) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-full bg-[#EAD6D2] border border-[#B77D7D]/30 flex items-center justify-center animate-bounce shadow-md">
          <BookOpen className="w-7 h-7 text-[#B77D7D]" />
        </div>
        <p className="font-serif text-xl font-bold text-[#382C24] mt-4">
          Opening Your Memory Book...
        </p>
        <p className="font-hand text-2xl text-[#B77D7D] mt-1">
          gathering photographs & memories ✨
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4EC] text-[#514137]">
      <ScrollToTop />
      {!isAdminRoute && <Navbar audioUrl={settings.background_audio_url} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage settings={settings} />} />
          <Route path="/intro" element={<IntroductionPage settings={settings} />} />
          <Route path="/photos" element={<PhotoGalleryPage photos={photos} />} />
          <Route path="/timeline" element={<TimelinePage timeline={timeline} />} />
          <Route path="/videos" element={<VideoMemoriesPage videos={videos} />} />
          <Route path="/wishes" element={<BirthdayWishesPage wishes={wishes} onWishSubmitted={loadData} />} />
          <Route path="/letter" element={<LetterPage letter={letter} />} />
          <Route path="/closing" element={<ClosingPage settings={settings} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}
