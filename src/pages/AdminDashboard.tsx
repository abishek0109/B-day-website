import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Copy,
  Database,
  Edit2,
  Eye,
  Film,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BirthdayPage,
  BirthdayWish,
  MemoryCategory,
  PersonalLetter,
  PhotoMemory,
  SiteSettings,
  TimelineMemory,
  VideoMemory,
} from '../types/scrapbook';
import {
  createBirthdayPage,
  deleteBirthdayPage,
  deletePhoto,
  deleteTimelineMemory,
  deleteVideo,
  deleteWish,
  getAvailableSlug,
  getBirthdayPages,
  getPersonalLetter,
  getPhotos,
  getSiteSettings,
  getTimelineMemories,
  getVideos,
  getWishes,
  saveBirthdayPage,
  savePhoto,
  saveTimelineMemory,
  saveVideo,
  saveWish,
  slugify,
  updatePersonalLetter,
  updateSiteSettings,
  updateWishStatus,
  uploadMediaFile,
} from '../lib/dataService';
import { AuthState, checkAuthState, loginOwner, logoutOwner } from '../lib/authService';
import { getSupabaseConfigStatus } from '../lib/supabase';

type AdminTab = 'content' | 'photos' | 'timeline' | 'videos' | 'wishes' | 'letter';

const categories: MemoryCategory[] = ['Little Moments', 'Adventures', 'Celebrations', 'Everyday Chaos'];
const emptyAuth: AuthState = { isAuthenticated: false, isOwner: false, userEmail: null, isDemoMode: true };

function publicLink(slug: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}birthday/${slug}`;
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const AdminDashboard: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(emptyAuth);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [pages, setPages] = useState<BirthdayPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [query, setQuery] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [currentTab, setCurrentTab] = useState<AdminTab>('content');

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [photos, setPhotos] = useState<PhotoMemory[]>([]);
  const [timeline, setTimeline] = useState<TimelineMemory[]>([]);
  const [videos, setVideos] = useState<VideoMemory[]>([]);
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [letter, setLetter] = useState<PersonalLetter | null>(null);
  const [uploading, setUploading] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();
  const selectedPage = pages.find((page) => page.id === selectedPageId) || null;

  const filteredPages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return pages;
    return pages.filter((page) => [page.recipient_name, page.slug, page.title].some((value) => value.toLowerCase().includes(needle)));
  }, [pages, query]);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4500);
  };

  const loadPages = async () => {
    const loaded = await getBirthdayPages();
    setPages(loaded);
    setSelectedPageId((current) => current || loaded[0]?.id || '');
  };

  const loadSelectedPageData = async (pageId: string) => {
    setIsLoading(true);
    try {
      const [pageSettings, pagePhotos, pageTimeline, pageVideos, pageWishes, pageLetter] = await Promise.all([
        getSiteSettings(pageId),
        getPhotos(false, pageId),
        getTimelineMemories(false, pageId),
        getVideos(false, pageId),
        getWishes(true, pageId),
        getPersonalLetter(pageId),
      ]);
      setSettings(pageSettings);
      setPhotos(pagePhotos);
      setTimeline(pageTimeline);
      setVideos(pageVideos);
      setWishes(pageWishes);
      setLetter(pageLetter);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    const auth = await checkAuthState();
    setAuthState(auth);
    if (auth.isAuthenticated) await loadPages();
    else setIsLoading(false);
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated && selectedPageId) {
      loadSelectedPageData(selectedPageId);
    }
  }, [authState.isAuthenticated, selectedPageId]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    const res = await loginOwner(loginEmail, loginPassword);
    if (res.success) await refreshAuth();
    else setLoginError(res.error || 'Login failed.');
    setIsLoggingIn(false);
  };

  const handleCreatePage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newFriendName.trim()) return;
    const res = await createBirthdayPage(newFriendName);
    if (!res.success || !res.data) {
      notify('error', res.error || 'Could not create birthday website.');
      return;
    }
    setNewFriendName('');
    await loadPages();
    setSelectedPageId(res.data.id);
    notify('success', `${res.data.recipient_name}'s birthday website was created as a draft.`);
  };

  const handleSavePageBasics = async () => {
    if (!selectedPage) return;
    const slug = await getAvailableSlug(selectedPage.slug, selectedPage.id);
    const res = await saveBirthdayPage({ ...selectedPage, slug });
    if (!res.success) {
      notify('error', res.error || 'Could not save page details.');
      return;
    }
    await loadPages();
    notify('success', 'Birthday website details saved.');
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings || !selectedPageId) return;
    const res = await updateSiteSettings(settings, selectedPageId);
    if (res.success) {
      await loadPages();
      notify('success', 'Content saved for the selected birthday website.');
    } else {
      notify('error', res.error || 'Could not save content.');
    }
  };

  const handleDeletePage = async (page: BirthdayPage) => {
    if (!window.confirm(`Delete ${page.recipient_name}'s birthday website and its scoped content?`)) return;
    const res = await deleteBirthdayPage(page.id);
    if (!res.success) {
      notify('error', res.error || 'Could not delete birthday website.');
      return;
    }
    setSelectedPageId('');
    await loadPages();
    notify('success', 'Birthday website deleted.');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, folder: string) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPageId) return;
    setUploading(true);
    const res = await uploadMediaFile(file, folder, selectedPageId);
    setUploading(false);
    if (res.success && res.url) {
      callback(res.url);
      notify('success', 'Media uploaded and attached to this birthday website.');
    } else {
      notify('error', res.error || 'Upload failed.');
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#F8F4EC]">
        <div className="max-w-md w-full bg-[#FAF7F2] border border-[#E8DEC8] p-8 rounded-xs shadow-scrapbook">
          <div className="w-12 h-12 rounded-full bg-[#EAD6D2] border border-[#B77D7D]/30 flex items-center justify-center mx-auto mb-4 text-[#B77D7D]">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-center text-[#382C24]">Owner Dashboard</h1>
          <p className="font-hand text-xl text-center text-[#B77D7D] mt-1 mb-6">manage every birthday website</p>
          <div className="mb-6 p-3 rounded-xs bg-[#FAF6EC] border border-[#DECFBD] text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[#7E6C5F]">
              <Database className="w-3.5 h-3.5 text-[#B77D7D]" />
              <span>{supabaseStatus.isConfigured ? 'Supabase connected' : 'Supabase not configured'}</span>
            </div>
            {!supabaseStatus.isConfigured && (
              <p className="font-serif text-[#8C7765] mt-1">Owner editing is disabled until Supabase Auth and RLS are configured.</p>
            )}
          </div>
          {loginError && (
            <div className="mb-4 p-3 rounded-xs bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          {supabaseStatus.isConfigured ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Owner email" className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm" />
              <input type="password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Password" className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm" />
              <button type="submit" disabled={isLoggingIn} className="w-full py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook disabled:opacity-50">
                {isLoggingIn ? 'Verifying...' : 'Log In'}
              </button>
            </form>
          ) : (
            <div className="rounded-xs border border-[#DECFBD] bg-[#FAF3DE] p-4 font-body text-xs leading-relaxed text-[#7E6C5F]">
              Configure Supabase first, then sign in with the owner account listed in the README.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC] pb-14">
      <header className="bg-[#FAF7F2] border-b border-[#E3D9CC] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#B77D7D] text-[#FAF6EC] flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#382C24] leading-none">Birthday Website Manager</h1>
              <span className="text-[11px] font-mono text-[#7E6C5F]">{authState.userEmail || 'Owner session'}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              await logoutOwner();
              await refreshAuth();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] text-[#7E6C5F] text-xs font-serif rounded-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {notice && (
        <div className={`fixed top-18 right-4 z-50 p-4 rounded-xs border shadow-lg max-w-sm flex items-center gap-2.5 ${notice.type === 'success' ? 'bg-[#F0F3E8] border-[#A7AD96] text-[#514137]' : 'bg-[#FDF2F2] border-[#E8A5A5] text-[#8C3A3A]'}`}>
          {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-serif font-medium">{notice.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <form onSubmit={handleCreatePage} className="bg-[#FAF7F2] border border-[#E8DEC8] p-4 rounded-xs shadow-scrapbook">
            <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-2">Create Friend Website</label>
            <div className="flex gap-2">
              <input value={newFriendName} onChange={(event) => setNewFriendName(event.target.value)} placeholder="Friend's name" className="min-w-0 flex-1 px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm" />
              <button className="inline-flex items-center justify-center w-10 rounded-xs bg-[#B77D7D] text-[#FAF6EC]" aria-label="Create birthday website">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-4 rounded-xs shadow-scrapbook">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7765]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search websites" className="w-full pl-9 pr-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm" />
            </div>
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {filteredPages.map((page) => (
                <button key={page.id} onClick={() => setSelectedPageId(page.id)} className={`w-full text-left p-3 rounded-xs border transition-colors ${selectedPageId === page.id ? 'bg-[#F1E8DA] border-[#B77D7D]/50' : 'bg-[#FAF6EC] border-[#DECFBD] hover:bg-[#F1E8DA]'}`}>
                  <div className="flex gap-3">
                    <img src={page.hero_photo_url} alt="" className="h-14 w-14 rounded-xs object-cover border border-[#DECFBD] bg-[#EFE8DD]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-bold text-[#382C24]">{page.recipient_name || 'Unnamed friend'}</p>
                      <p className="truncate text-[11px] font-mono text-[#7E6C5F]">/birthday/{page.slug}</p>
                      <span className={`mt-1 inline-flex text-[10px] uppercase tracking-wider font-mono ${page.is_published ? 'text-[#636C52]' : 'text-[#8C7765]'}`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredPages.length === 0 && <p className="p-4 text-center font-hand text-xl text-[#7E6C5F]">No birthday websites found.</p>}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          {!selectedPage || !settings || !letter ? (
            <div className="bg-[#FAF7F2] border border-dashed border-[#DECFBD] p-10 rounded-xs text-center">
              <BookOpen className="mx-auto w-9 h-9 text-[#B77D7D]" />
              <p className="mt-3 font-serif text-2xl text-[#382C24]">{isLoading ? 'Loading selected website...' : 'Create or select a birthday website.'}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-4 sm:p-5 rounded-xs shadow-scrapbook">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[#7E6C5F]">Selected website</p>
                    <h2 className="font-serif text-3xl font-bold text-[#382C24]">{selectedPage.recipient_name}</h2>
                    <p className="font-mono text-xs text-[#7E6C5F] mt-1">{publicLink(selectedPage.slug)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={publicLink(selectedPage.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] text-xs font-serif rounded-xs">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(publicLink(selectedPage.slug)); notify('success', 'Link copied.'); }} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] text-xs font-serif rounded-xs">
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </button>
                    <button onClick={() => handleDeletePage(selectedPage)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] text-xs font-serif rounded-xs">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <TextField label="Friend Name" value={selectedPage.recipient_name} onChange={(value) => setPages((current) => current.map((page) => page.id === selectedPage.id ? { ...page, recipient_name: value } : page))} />
                  <TextField label="Slug" value={selectedPage.slug} onChange={(value) => setPages((current) => current.map((page) => page.id === selectedPage.id ? { ...page, slug: slugify(value) } : page))} />
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif">
                      <input type="checkbox" checked={selectedPage.is_published} onChange={(event) => setPages((current) => current.map((page) => page.id === selectedPage.id ? { ...page, is_published: event.target.checked } : page))} className="accent-[#B77D7D]" />
                      Published
                    </label>
                    <button onClick={handleSavePageBasics} className="px-4 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs">Save</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {([
                  ['content', Edit2, 'Content'],
                  ['photos', ImageIcon, `Photos (${photos.length})`],
                  ['timeline', BookOpen, `Timeline (${timeline.length})`],
                  ['videos', Film, `Videos (${videos.length})`],
                  ['wishes', MessageSquare, `Wishes (${wishes.length})`],
                  ['letter', Edit2, 'Letter'],
                ] as const).map(([tab, Icon, label]) => (
                  <button key={tab} onClick={() => setCurrentTab(tab)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xs text-xs font-serif uppercase tracking-wider border shrink-0 ${currentTab === tab ? 'bg-[#B77D7D] text-[#FAF6EC] border-[#B77D7D]' : 'bg-[#FAF7F2] text-[#7E6C5F] border-[#DECFBD]'}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              {currentTab === 'content' && (
                <form onSubmit={handleSaveSettings} className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-scrapbook space-y-4">
                  <h3 className="font-serif text-2xl font-bold text-[#382C24]">Birthday Website Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Title" value={settings.title} onChange={(value) => setSettings({ ...settings, title: value })} />
                    <TextField label="Subtitle" value={settings.subtitle} onChange={(value) => setSettings({ ...settings, subtitle: value })} />
                    <TextField label="Sender Name" value={settings.sender_name} onChange={(value) => setSettings({ ...settings, sender_name: value })} />
                    <TextField label="Hero Tagline" value={settings.hero_tagline} onChange={(value) => setSettings({ ...settings, hero_tagline: value })} />
                    <TextField label="Hero Photo URL" value={settings.hero_photo_url} onChange={(value) => setSettings({ ...settings, hero_photo_url: value })} />
                    <TextField label="Hero Photo Caption" value={settings.hero_photo_caption} onChange={(value) => setSettings({ ...settings, hero_photo_caption: value })} />
                    <TextField label="Intro Photo URL" value={settings.intro_photo_url} onChange={(value) => setSettings({ ...settings, intro_photo_url: value })} />
                    <TextField label="Background Audio URL" value={settings.background_audio_url} onChange={(value) => setSettings({ ...settings, background_audio_url: value })} />
                  </div>
                  <TextArea label="Hero Intro" value={settings.hero_intro} onChange={(value) => setSettings({ ...settings, hero_intro: value })} />
                  <TextArea label="Intro Dedication" value={settings.intro_dedication} onChange={(value) => setSettings({ ...settings, intro_dedication: value })} />
                  <TextArea label="Intro Message" value={settings.intro_message} onChange={(value) => setSettings({ ...settings, intro_message: value })} />
                  <TextArea label="Intro Note" value={settings.intro_note} onChange={(value) => setSettings({ ...settings, intro_note: value })} />
                  <TextArea label="Closing Message" value={settings.closing_message} onChange={(value) => setSettings({ ...settings, closing_message: value })} />
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-[#B77D7D]" /> {uploading ? 'Uploading...' : 'Upload Hero Photo'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => handleFileUpload(event, (url) => setSettings({ ...settings, hero_photo_url: url }), 'hero')} />
                  </label>
                  <button className="block px-5 py-2.5 bg-[#B77D7D] text-[#FAF6EC] text-sm font-serif rounded-xs">Save Content</button>
                </form>
              )}

              {currentTab === 'photos' && (
                <CollectionEditor title="Photos" items={photos} onAdd={() => setPhotos((items) => [...items, { id: newId('photo'), birthday_page_id: selectedPageId, title: '', caption: '', image_url: '', category: 'Little Moments', sort_order: items.length + 1, is_published: false }])} render={(photo) => (
                  <PhotoEditor photo={photo} onChange={(updated) => setPhotos((items) => items.map((item) => item.id === updated.id ? updated : item))} onSave={async () => { const res = await savePhoto(photo, selectedPageId); if (res.success) notify('success', 'Photo saved.'); else notify('error', res.error || 'Could not save photo.'); await loadSelectedPageData(selectedPageId); }} onDelete={async () => { await deletePhoto(photo.id, selectedPageId); await loadSelectedPageData(selectedPageId); }} onUpload={(event) => handleFileUpload(event, (url) => setPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, image_url: url } : item)), 'photos')} />
                )} />
              )}

              {currentTab === 'timeline' && (
                <CollectionEditor title="Timeline Stories" items={timeline} onAdd={() => setTimeline((items) => [...items, { id: newId('timeline'), birthday_page_id: selectedPageId, title: '', date: '', story: '', sort_order: items.length + 1, is_published: false }])} render={(entry) => (
                  <TimelineEditor entry={entry} onChange={(updated) => setTimeline((items) => items.map((item) => item.id === updated.id ? updated : item))} onSave={async () => { const res = await saveTimelineMemory(entry, selectedPageId); if (res.success) notify('success', 'Timeline story saved.'); else notify('error', res.error || 'Could not save story.'); await loadSelectedPageData(selectedPageId); }} onDelete={async () => { await deleteTimelineMemory(entry.id, selectedPageId); await loadSelectedPageData(selectedPageId); }} />
                )} />
              )}

              {currentTab === 'videos' && (
                <CollectionEditor title="Videos" items={videos} onAdd={() => setVideos((items) => [...items, { id: newId('video'), birthday_page_id: selectedPageId, title: '', description: '', video_url: '', sort_order: items.length + 1, is_published: false }])} render={(video) => (
                  <VideoEditor video={video} onChange={(updated) => setVideos((items) => items.map((item) => item.id === updated.id ? updated : item))} onSave={async () => { const res = await saveVideo(video, selectedPageId); if (res.success) notify('success', 'Video saved.'); else notify('error', res.error || 'Could not save video.'); await loadSelectedPageData(selectedPageId); }} onDelete={async () => { await deleteVideo(video.id, selectedPageId); await loadSelectedPageData(selectedPageId); }} onUpload={(event) => handleFileUpload(event, (url) => setVideos((items) => items.map((item) => item.id === video.id ? { ...item, video_url: url } : item)), 'videos')} />
                )} />
              )}

              {currentTab === 'wishes' && (
                <CollectionEditor title="Wishes" items={wishes} onAdd={() => setWishes((items) => [{ id: newId('wish'), birthday_page_id: selectedPageId, sender_name: '', message: '', paper_color: 'cream', status: 'approved', created_at: new Date().toISOString() }, ...items])} render={(wish) => (
                  <WishEditor wish={wish} onChange={(updated) => setWishes((items) => items.map((item) => item.id === updated.id ? updated : item))} onSave={async () => { const res = await saveWish(wish, selectedPageId); if (res.success) notify('success', 'Wish saved.'); else notify('error', res.error || 'Could not save wish.'); await loadSelectedPageData(selectedPageId); }} onDelete={async () => { await deleteWish(wish.id, selectedPageId); await loadSelectedPageData(selectedPageId); }} onStatus={async (status) => { await updateWishStatus(wish.id, status, selectedPageId); await loadSelectedPageData(selectedPageId); }} />
                )} />
              )}

              {currentTab === 'letter' && (
                <form onSubmit={async (event) => { event.preventDefault(); if (!letter) return; const res = await updatePersonalLetter(letter, selectedPageId); if (res.success) notify('success', 'Letter saved.'); else notify('error', res.error || 'Could not save letter.'); }} className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-scrapbook space-y-4">
                  <h3 className="font-serif text-2xl font-bold text-[#382C24]">Personal Letter</h3>
                  <TextField label="Greeting" value={letter.greeting} onChange={(value) => setLetter({ ...letter, greeting: value })} />
                  <TextField label="Letter Date" value={letter.letter_date} onChange={(value) => setLetter({ ...letter, letter_date: value })} />
                  {letter.paragraphs.map((paragraph, index) => <TextArea key={index} label={`Paragraph ${index + 1}`} value={paragraph} onChange={(value) => { const paragraphs = [...letter.paragraphs]; paragraphs[index] = value; setLetter({ ...letter, paragraphs }); }} />)}
                  <button type="button" onClick={() => setLetter({ ...letter, paragraphs: [...letter.paragraphs, ''] })} className="px-3 py-2 border border-[#DECFBD] text-xs font-serif rounded-xs">Add Paragraph</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Sign Off" value={letter.sign_off} onChange={(value) => setLetter({ ...letter, sign_off: value })} />
                    <TextField label="Signature" value={letter.sender_signature} onChange={(value) => setLetter({ ...letter, sender_signature: value })} />
                  </div>
                  <button className="px-5 py-2.5 bg-[#B77D7D] text-[#FAF6EC] text-sm font-serif rounded-xs">Save Letter</button>
                </form>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">{label}</span>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">{label}</span>
      <textarea rows={4} value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-body" />
    </label>
  );
}

function CollectionEditor<T extends { id: string }>({ title, items, onAdd, render }: { title: string; items: T[]; onAdd: () => void; render: (item: T) => React.ReactNode }) {
  return (
    <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-scrapbook space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-[#382C24]">{title}</h3>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="space-y-4">
        {items.length ? items.map((item) => <div key={item.id}>{render(item)}</div>) : <p className="rounded-xs border border-dashed border-[#DECFBD] p-8 text-center font-hand text-xl text-[#7E6C5F]">Nothing here yet.</p>}
      </div>
    </div>
  );
}

function RowActions({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave} className="px-3 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs">Save</button>
      <button onClick={onDelete} className="px-3 py-2 bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] text-xs font-serif rounded-xs">Delete</button>
    </div>
  );
}

function PhotoEditor({ photo, onChange, onSave, onDelete, onUpload }: { photo: PhotoMemory; onChange: (photo: PhotoMemory) => void; onSave: () => void; onDelete: () => void; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Title" value={photo.title} onChange={(value) => onChange({ ...photo, title: value })} />
        <TextField label="Caption" value={photo.caption} onChange={(value) => onChange({ ...photo, caption: value })} />
        <TextField label="Image URL" value={photo.image_url} onChange={(value) => onChange({ ...photo, image_url: value })} />
        <label className="block">
          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">Category</span>
          <select value={photo.category} onChange={(event) => onChange({ ...photo, category: event.target.value as MemoryCategory })} className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm">
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
      </div>
      <label className="inline-flex items-center gap-2 text-xs font-serif"><input type="checkbox" checked={photo.is_published} onChange={(event) => onChange({ ...photo, is_published: event.target.checked })} className="accent-[#B77D7D]" />Published</label>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer"><Upload className="w-3.5 h-3.5" />Upload<input type="file" accept="image/*" className="hidden" onChange={onUpload} /></label>
        <RowActions onSave={onSave} onDelete={onDelete} />
      </div>
    </div>
  );
}

function TimelineEditor({ entry, onChange, onSave, onDelete }: { entry: TimelineMemory; onChange: (entry: TimelineMemory) => void; onSave: () => void; onDelete: () => void }) {
  return (
    <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Title" value={entry.title} onChange={(value) => onChange({ ...entry, title: value })} />
        <TextField label="Date" value={entry.date} onChange={(value) => onChange({ ...entry, date: value })} />
        <TextField label="Location" value={entry.location || ''} onChange={(value) => onChange({ ...entry, location: value })} />
        <TextField label="Image URL" value={entry.image_url || ''} onChange={(value) => onChange({ ...entry, image_url: value })} />
      </div>
      <TextArea label="Story" value={entry.story} onChange={(value) => onChange({ ...entry, story: value })} />
      <label className="inline-flex items-center gap-2 text-xs font-serif"><input type="checkbox" checked={entry.is_published} onChange={(event) => onChange({ ...entry, is_published: event.target.checked })} className="accent-[#B77D7D]" />Published</label>
      <RowActions onSave={onSave} onDelete={onDelete} />
    </div>
  );
}

function VideoEditor({ video, onChange, onSave, onDelete, onUpload }: { video: VideoMemory; onChange: (video: VideoMemory) => void; onSave: () => void; onDelete: () => void; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Title" value={video.title} onChange={(value) => onChange({ ...video, title: value })} />
        <TextField label="Video URL" value={video.video_url} onChange={(value) => onChange({ ...video, video_url: value })} />
        <TextField label="Thumbnail URL" value={video.thumbnail_url || ''} onChange={(value) => onChange({ ...video, thumbnail_url: value })} />
        <TextField label="Duration" value={video.duration || ''} onChange={(value) => onChange({ ...video, duration: value })} />
      </div>
      <TextArea label="Description" value={video.description} onChange={(value) => onChange({ ...video, description: value })} />
      <label className="inline-flex items-center gap-2 text-xs font-serif"><input type="checkbox" checked={video.is_published} onChange={(event) => onChange({ ...video, is_published: event.target.checked })} className="accent-[#B77D7D]" />Published</label>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer"><Upload className="w-3.5 h-3.5" />Upload<input type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={onUpload} /></label>
        <RowActions onSave={onSave} onDelete={onDelete} />
      </div>
    </div>
  );
}

function WishEditor({ wish, onChange, onSave, onDelete, onStatus }: { wish: BirthdayWish; onChange: (wish: BirthdayWish) => void; onSave: () => void; onDelete: () => void; onStatus: (status: 'approved' | 'rejected') => void }) {
  return (
    <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Sender" value={wish.sender_name} onChange={(value) => onChange({ ...wish, sender_name: value })} />
        <TextField label="Relationship" value={wish.relationship || ''} onChange={(value) => onChange({ ...wish, relationship: value })} />
      </div>
      <TextArea label="Message" value={wish.message} onChange={(value) => onChange({ ...wish, message: value })} />
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => onStatus('approved')} className="px-3 py-2 border border-[#A7AD96] text-[#636C52] text-xs font-serif rounded-xs">Approve</button>
          <button onClick={() => onStatus('rejected')} className="px-3 py-2 border border-[#E8A5A5] text-[#8C3A3A] text-xs font-serif rounded-xs">Reject</button>
          <span className="px-3 py-2 text-xs font-mono text-[#7E6C5F]">{wish.status}</span>
        </div>
        <RowActions onSave={onSave} onDelete={onDelete} />
      </div>
    </div>
  );
}
