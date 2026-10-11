import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { BirthdaySiteData } from './types/scrapbook';
import { getDefaultPublishedBirthdayPage, getPublicBirthdaySite } from './lib/dataService';
import { BirthdayRouteProvider } from './lib/routeContext';
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function LoadingBook() {
  return (
    <div className="min-h-screen bg-[#F8F4EC] flex flex-col items-center justify-center p-4">
      <div className="w-14 h-14 rounded-full bg-[#EAD6D2] border border-[#B77D7D]/30 flex items-center justify-center animate-bounce shadow-md">
        <BookOpen className="w-7 h-7 text-[#B77D7D]" />
      </div>
      <p className="font-serif text-xl font-bold text-[#382C24] mt-4">Opening this memory book...</p>
      <p className="font-hand text-2xl text-[#B77D7D] mt-1">gathering photographs and memories</p>
    </div>
  );
}

function BirthdayBookRoutes({ site, onReload }: { site: BirthdaySiteData; onReload: () => void }) {
  return (
    <Routes>
      <Route index element={<LandingPage settings={site.settings} />} />
      <Route path="intro" element={<IntroductionPage settings={site.settings} />} />
      <Route path="photos" element={<PhotoGalleryPage photos={site.photos} />} />
      <Route path="timeline" element={<TimelinePage timeline={site.timeline} />} />
      <Route path="videos" element={<VideoMemoriesPage videos={site.videos} />} />
      <Route path="wishes" element={<BirthdayWishesPage wishes={site.wishes} birthdayPageId={site.page.id} onWishSubmitted={onReload} />} />
      <Route path="letter" element={<LetterPage letter={site.letter} />} />
      <Route path="closing" element={<ClosingPage settings={site.settings} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function BirthdaySite() {
  const { slug = '' } = useParams();
  const [site, setSite] = useState<BirthdaySiteData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSite = async () => {
    setLoading(true);
    try {
      setSite(await getPublicBirthdaySite(slug));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSite();
  }, [slug]);

  if (loading) return <LoadingBook />;
  if (!site) return <NotFound />;

  const basePath = `/birthday/${site.page.slug}`;
  return (
    <BirthdayRouteProvider basePath={basePath}>
      <div className="min-h-screen flex flex-col bg-[#F8F4EC] text-[#514137]">
        <ScrollToTop />
        <Navbar audioUrl={site.settings.background_audio_url} />
        <main className="flex-1">
          <BirthdayBookRoutes site={site} onReload={loadSite} />
        </main>
        <Footer />
      </div>
    </BirthdayRouteProvider>
  );
}

function LegacyBirthdayRedirect() {
  const location = useLocation();
  const [targetSlug, setTargetSlug] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    getDefaultPublishedBirthdayPage().then((page) => {
      if (isActive) setTargetSlug(page?.slug || '');
    });
    return () => {
      isActive = false;
    };
  }, []);

  if (targetSlug === null) return <LoadingBook />;
  if (!targetSlug) return <Navigate to="/" replace />;
  return <Navigate to={`/birthday/${targetSlug}${location.pathname === '/' ? '' : location.pathname}`} replace />;
}

export function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/birthday/:slug/*" element={<BirthdaySite />} />
        <Route path="/intro" element={<LegacyBirthdayRedirect />} />
        <Route path="/photos" element={<LegacyBirthdayRedirect />} />
        <Route path="/timeline" element={<LegacyBirthdayRedirect />} />
        <Route path="/videos" element={<LegacyBirthdayRedirect />} />
        <Route path="/wishes" element={<LegacyBirthdayRedirect />} />
        <Route path="/letter" element={<LegacyBirthdayRedirect />} />
        <Route path="/closing" element={<LegacyBirthdayRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}
