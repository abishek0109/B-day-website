import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { BirthdaySiteData } from './types/scrapbook';
import { getDefaultPublishedBirthdayPage, getPublicBirthdaySite } from './lib/dataService';
import { BirthdayRouteProvider, useBookRoute } from './lib/routeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { ClosingPage } from './pages/ClosingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFound } from './pages/NotFound';
import { DynamicSectionRenderer } from './components/scrapbook/DynamicSectionRenderer';
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

function SiteUnavailable() {
  return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center p-6">
      <div role="alert" className="max-w-lg rounded-xs border border-[#DECFBD] bg-[#FAF7F2] p-8 text-center shadow-scrapbook">
        <BookOpen className="mx-auto h-10 w-10 text-[#B77D7D]" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#382C24]">This memory book is temporarily unavailable</h1>
        <p className="mt-2 font-body text-sm text-[#7E6C5F]">Please try again later or contact the owner.</p>
      </div>
    </div>
  );
}

function BirthdayBookRoutes({ site, onReload }: { site: BirthdaySiteData; onReload: () => void }) {
  const { toBookPath } = useBookRoute();
  const visibleSections = useMemo(
    () => (site.sections || []).filter((s) => s.is_visible !== false),
    [site.sections]
  );
  const firstSectionPath = visibleSections[0] ? toBookPath(`/${visibleSections[0].slug}`) : undefined;

  return (
    <Routes>
      <Route index element={<LandingPage settings={site.settings} firstSectionPath={firstSectionPath} />} />
      {visibleSections.map((section, index) => {
        const chapterNumber = index + 1;
        const totalChapters = visibleSections.length;
        const prevSection = index > 0 ? visibleSections[index - 1] : null;
        const nextSection = index < visibleSections.length - 1 ? visibleSections[index + 1] : null;

        const prevPath = prevSection ? toBookPath(`/${prevSection.slug}`) : toBookPath('/');
        const prevLabel = prevSection ? `Chapter ${index}: ${prevSection.title}` : 'Back to Cover';
        const nextPath = nextSection ? toBookPath(`/${nextSection.slug}`) : toBookPath('/closing');
        const nextLabel = nextSection ? `Chapter ${index + 2}: ${nextSection.title}` : 'The Closing Page';

        return (
          <Route
            key={section.id}
            path={section.slug}
            element={
              <DynamicSectionRenderer
                section={section}
                chapterNumber={chapterNumber}
                totalChapters={totalChapters}
                previousPath={prevPath}
                previousLabel={prevLabel}
                nextPath={nextPath}
                nextLabel={nextLabel}
                siteData={site}
                onReload={onReload}
              />
            }
          />
        );
      })}
      <Route path="closing" element={<ClosingPage settings={site.settings} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function BirthdaySite() {
  const { slug = '' } = useParams();
  const [site, setSite] = useState<BirthdaySiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSite = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setSite(await getPublicBirthdaySite(slug));
    } catch (error) {
      console.error('Failed to load birthday website:', error);
      setSite(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadSite();
  }, [loadSite]);

  if (loading) return <LoadingBook />;
  if (loadError) return <SiteUnavailable />;
  if (!site) return <NotFound />;

  const basePath = `/birthday/${site.page.slug}`;
  return (
    <BirthdayRouteProvider basePath={basePath}>
      <div className="min-h-screen flex flex-col bg-[#F8F4EC] text-[#514137]">
        <ScrollToTop />
        <Navbar audioUrl={site.settings.background_audio_url} sections={site.sections} />
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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isActive = true;
    getDefaultPublishedBirthdayPage().then((page) => {
      if (isActive) setTargetSlug(page?.slug || '');
    }).catch((error: unknown) => {
      console.error('Failed to find the default birthday website:', error);
      if (isActive) setLoadError(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  if (loadError) return <SiteUnavailable />;
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
