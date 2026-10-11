import React, { useState, useEffect } from 'react';
import { 
  SiteSettings, 
  PhotoMemory, 
  TimelineMemory, 
  VideoMemory, 
  BirthdayWish, 
  PersonalLetter,
  MemoryCategory
} from '../types/scrapbook';
import { 
  getSiteSettings, updateSiteSettings,
  getPhotos, savePhoto, deletePhoto,
  getTimelineMemories, saveTimelineMemory, deleteTimelineMemory,
  getVideos, saveVideo, deleteVideo,
  getWishes, updateWishStatus, deleteWish,
  saveWish,
  getPersonalLetter, updatePersonalLetter,
  uploadMediaFile
} from '../lib/dataService';
import { checkAuthState, loginOwner, logoutOwner, AuthState } from '../lib/authService';
import { getSupabaseConfigStatus } from '../lib/supabase';
import { ScrapbookImage } from '../components/scrapbook/ScrapbookImage';
import { PolaroidPhoto } from '../components/scrapbook/PolaroidPhoto';
import { 
  Lock, LogOut, CheckCircle2, AlertCircle, Image as ImageIcon, Film, 
  Calendar, MessageSquare, BookOpen, Settings, Eye, Trash2, 
  Plus, Edit2, Database, Upload, X, Sparkles, HelpCircle 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isOwner: false,
    userEmail: null,
    isDemoMode: true,
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab navigation
  type AdminTab = 'overview' | 'settings' | 'photos' | 'timeline' | 'videos' | 'wishes' | 'letter';
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');

  // Data state
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [photos, setPhotos] = useState<PhotoMemory[]>([]);
  const [timeline, setTimeline] = useState<TimelineMemory[]>([]);
  const [videos, setVideos] = useState<VideoMemory[]>([]);
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [letter, setLetter] = useState<PersonalLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Editing states
  const [editingPhoto, setEditingPhoto] = useState<PhotoMemory | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const [editingTimeline, setEditingTimeline] = useState<TimelineMemory | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  const [editingVideo, setEditingVideo] = useState<VideoMemory | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<BirthdayWish | null>(null);
  const [isNewWish, setIsNewWish] = useState(false);

  const [isSetupHelpOpen, setIsSetupHelpOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Filter for wishes moderation
  const [wishesFilter, setWishesFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const supabaseStatus = getSupabaseConfigStatus();

  const refreshAuth = async () => {
    const auth = await checkAuthState();
    setAuthState(auth);
    if (auth.isAuthenticated) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [sData, pData, tData, vData, wData, lData] = await Promise.all([
        getSiteSettings(),
        getPhotos(false),
        getTimelineMemories(false),
        getVideos(false),
        getWishes(true),
        getPersonalLetter(),
      ]);

      setSettings(sData);
      setPhotos(pData);
      setTimeline(tData);
      setVideos(vData);
      setWishes(wData);
      setLetter(lData);
    } catch (e) {
      console.error('Error loading data:', e);
      notify('error', 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load auth and initial data
  useEffect(() => {
    refreshAuth();
  }, []);

  const notify = (type: 'success' | 'error', message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // -------------------------------------------------------------
  // AUTH HANDLERS
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const res = await loginOwner(loginEmail, loginPassword);
    if (res.success) {
      await refreshAuth();
    } else {
      setLoginError(res.error || 'Login failed. Please check credentials.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await logoutOwner();
    await refreshAuth();
  };

  // -------------------------------------------------------------
  // SETTINGS HANDLER
  // -------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const res = await updateSiteSettings(settings);
    if (res.success) {
      notify('success', 'Landing page and website settings updated successfully!');
    } else {
      notify('error', res.error || 'Failed to update settings');
    }
  };

  // -------------------------------------------------------------
  // PHOTO HANDLERS
  // -------------------------------------------------------------
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const res = await savePhoto(editingPhoto);
    if (res.success) {
      notify('success', 'Photograph saved successfully!');
      setIsPhotoModalOpen(false);
      setEditingPhoto(null);
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to save photograph');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this memory photo?')) return;
    const res = await deletePhoto(id);
    if (res.success) {
      notify('success', 'Photograph deleted successfully.');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to delete photo');
    }
  };

  // -------------------------------------------------------------
  // TIMELINE HANDLERS
  // -------------------------------------------------------------
  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimeline) return;

    const res = await saveTimelineMemory(editingTimeline);
    if (res.success) {
      notify('success', 'Timeline memory saved successfully!');
      setIsTimelineModalOpen(false);
      setEditingTimeline(null);
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to save timeline memory');
    }
  };

  const handleDeleteTimeline = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timeline story?')) return;
    const res = await deleteTimelineMemory(id);
    if (res.success) {
      notify('success', 'Timeline entry deleted.');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to delete timeline entry');
    }
  };

  // -------------------------------------------------------------
  // VIDEO HANDLERS
  // -------------------------------------------------------------
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    const res = await saveVideo(editingVideo);
    if (res.success) {
      notify('success', 'Video reel saved successfully!');
      setIsVideoModalOpen(false);
      setEditingVideo(null);
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to save video');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video reel?')) return;
    const res = await deleteVideo(id);
    if (res.success) {
      notify('success', 'Video reel deleted.');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to delete video');
    }
  };

  // -------------------------------------------------------------
  // WISHES MODERATION HANDLERS
  // -------------------------------------------------------------
  const handleApproveWish = async (id: string) => {
    const res = await updateWishStatus(id, 'approved');
    if (res.success) {
      notify('success', 'Wish approved and published to the memory book wall!');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to approve wish');
    }
  };

  const handleRejectWish = async (id: string) => {
    const res = await updateWishStatus(id, 'rejected');
    if (res.success) {
      notify('success', 'Wish rejected.');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to reject wish');
    }
  };

  const handleDeleteWish = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this wish permanently?')) return;
    const res = await deleteWish(id);
    if (res.success) {
      notify('success', 'Wish deleted.');
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to delete wish');
    }
  };

  const handleSaveWish = async () => {
    if (!editingWish) return;
    if (!editingWish.sender_name.trim() || !editingWish.message.trim()) {
      notify('error', 'A birthday wish needs a sender name and message.');
      return;
    }
    const res = await saveWish(editingWish);
    if (res.success) {
      notify('success', 'Birthday wish updated.');
      setEditingWish(null);
      setIsNewWish(false);
      loadAllData();
    } else {
      notify('error', res.error || 'Failed to update birthday wish');
    }
  };

  const handleCancelWishEdit = () => {
    if (isNewWish && editingWish) {
      setWishes((current) => current.filter((wish) => wish.id !== editingWish.id));
    }
    setEditingWish(null);
    setIsNewWish(false);
  };

  // -------------------------------------------------------------
  // PERSONAL LETTER HANDLER
  // -------------------------------------------------------------
  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letter) return;

    const res = await updatePersonalLetter(letter);
    if (res.success) {
      notify('success', 'Personal letter saved successfully!');
    } else {
      notify('error', res.error || 'Failed to update letter');
    }
  };

  // -------------------------------------------------------------
  // FILE UPLOAD HELPER
  // -------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetCallback: (url: string) => void, folder = 'photos') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const res = await uploadMediaFile(file, folder);
      if (res.success && res.url) {
        targetCallback(res.url);
        notify('success', 'Media uploaded successfully!');
      } else {
        notify('error', res.error || 'Upload failed');
      }
    } catch {
      notify('error', 'Error reading image file');
    } finally {
      setUploadProgress(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM (If not authenticated)
  // -------------------------------------------------------------
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 bg-[#F8F4EC]">
        <div className="max-w-md w-full bg-[#FAF7F2] border border-[#E8DEC8] p-8 rounded-xs shadow-scrapbook relative">
          
          <div className="w-12 h-12 rounded-full bg-[#EAD6D2] border border-[#B77D7D]/30 flex items-center justify-center mx-auto mb-4 text-[#B77D7D]">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-3xl font-bold text-center text-[#382C24]">
            Owner Portal
          </h2>
          <p className="font-hand text-xl text-center text-[#B77D7D] mt-1 mb-6">
            “A Little Book of You” content administration
          </p>

          {/* Supabase status indicator in login screen */}
          <div className="mb-6 p-3 rounded-xs bg-[#FAF6EC] border border-[#DECFBD] text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[#7E6C5F]">
              <Database className="w-3.5 h-3.5 text-[#B77D7D]" />
              <span>Status: {supabaseStatus.isConfigured ? 'Supabase Connected' : 'Backend Not Configured'}</span>
            </div>
            {!supabaseStatus.isConfigured && (
              <p className="font-serif text-[#8C7765] mt-1">
                Owner editing is disabled until Supabase Auth, database tables, and storage are configured. Local password checks cannot protect private content.
              </p>
            )}
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xs bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {supabaseStatus.isConfigured ? <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                Owner Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="owner@memorybook.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] focus:outline-none focus:ring-1 focus:ring-[#B77D7D] font-body text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] focus:outline-none focus:ring-1 focus:ring-[#B77D7D] font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-base rounded-sm shadow-scrapbook transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Log In to Dashboard'}
            </button>
          </form> : (
            <div className="rounded-xs border border-[#DECFBD] bg-[#FAF3DE] p-4 font-body text-xs leading-relaxed text-[#7E6C5F]">
              Configure Supabase and mark your account as the owner before signing in. See the setup instructions in the project README.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E3D9CC] text-center">
            <a
              href={import.meta.env.BASE_URL}
              className="text-xs font-serif text-[#7E6C5F] hover:text-[#3D3028] transition-colors"
            >
              ← Back to Birthday Memory Book
            </a>
          </div>

        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <p className="font-serif text-xl text-[#514137]" role="status">Opening the owner dashboard…</p>
      </div>
    );
  }

  // Count pending wishes
  const pendingWishesCount = wishes.filter((w) => w.status === 'pending').length;
  const approvedWishesCount = wishes.filter((w) => w.status === 'approved').length;

  return (
    <div className="min-h-screen bg-[#F8F4EC] pb-16">
      
      {/* Top Admin Bar */}
      <div className="bg-[#FAF7F2] border-b border-[#E3D9CC] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B77D7D] text-[#FAF6EC] flex items-center justify-center">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#382C24] leading-none">
                Owner Dashboard
              </h1>
              <span className="text-[11px] font-mono text-[#7E6C5F]">
                {authState.userEmail || 'Owner Session'}
              </span>
            </div>
          </div>

          {/* Quick status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Supabase Status Pill */}
            <button
              onClick={() => setIsSetupHelpOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
                supabaseStatus.isConfigured
                  ? 'bg-[#F0F3E8] border-[#A7AD96] text-[#636C52]'
                  : 'bg-[#FAF3DE] border-[#DECFBD] text-[#8C7765]'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{supabaseStatus.isConfigured ? 'Supabase Live' : 'Demo Storage Mode'}</span>
              <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* View Live Public Site */}
            <a
              href={import.meta.env.BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] text-[#514137] text-xs font-serif rounded-xs hover:bg-[#F1E8DA] transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#B77D7D]" />
              <span className="hidden sm:inline">Preview Public Site</span>
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] text-[#7E6C5F] text-xs font-serif rounded-xs hover:text-[#8C3A3A] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

          </div>

        </div>
      </div>

      {/* Status Notification Toast */}
      {statusNotification && (
        <div
          className={`fixed top-18 right-4 z-50 p-4 rounded-xs border shadow-lg max-w-sm animate-in slide-in-from-top-4 flex items-center gap-2.5 ${
            statusNotification.type === 'success'
              ? 'bg-[#F0F3E8] border-[#A7AD96] text-[#514137]'
              : 'bg-[#FDF2F2] border-[#E8A5A5] text-[#8C3A3A]'
          }`}
        >
          {statusNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#767D65] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#8C3A3A] shrink-0" />
          )}
          <span className="text-xs font-serif font-medium">{statusNotification.message}</span>
        </div>
      )}

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">

        {/* Pending Wishes Alert Callout */}
        {pendingWishesCount > 0 && (
          <div className="mb-6 p-4 rounded-xs bg-[#FAF3DE] border border-[#DECFBD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#B77D7D]" />
              <div>
                <p className="font-serif font-bold text-sm text-[#382C24]">
                  {pendingWishesCount} New Birthday Wish{pendingWishesCount > 1 ? 'es' : ''} Pending Review!
                </p>
                <p className="text-xs text-[#7E6C5F] font-body">
                  Friends have submitted new birthday messages that need your approval before appearing on the public wall.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentTab('wishes');
                setWishesFilter('pending');
              }}
              className="px-3.5 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs hover:bg-[#A36B6B] transition-colors cursor-pointer"
            >
              Review Now
            </button>
          </div>
        )}

        {/* Tab Navigation Navigation Bar */}
        <div className="flex overflow-x-auto gap-2 border-b border-[#E3D9CC] pb-3 mb-8">
          {[
            { id: 'overview', name: 'Overview', icon: BookOpen },
            { id: 'settings', name: 'Landing & Settings', icon: Settings },
            { id: 'photos', name: `Photos (${photos.length})`, icon: ImageIcon },
            { id: 'timeline', name: `Timeline (${timeline.length})`, icon: Calendar },
            { id: 'videos', name: `Videos (${videos.length})`, icon: Film },
            { 
              id: 'wishes', 
              name: `Wishes (${wishes.length})`, 
              icon: MessageSquare,
              badge: pendingWishesCount > 0 ? pendingWishesCount : undefined 
            },
            { id: 'letter', name: 'Personal Letter', icon: Edit2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as AdminTab)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-serif uppercase tracking-wider rounded-xs transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#B77D7D] text-[#FAF6EC] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#7E6C5F] hover:bg-[#F1E8DA] border border-[#DECFBD]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
                {tab.badge !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-[#EAD6D2] text-[#8C3A3A] font-bold text-[10px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">Total Photos</span>
                <p className="font-serif text-3xl font-bold text-[#382C24] mt-2">{photos.length}</p>
                <span className="text-[11px] text-[#A7AD96] font-mono">Scrapbook memories</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">Timeline Stories</span>
                <p className="font-serif text-3xl font-bold text-[#382C24] mt-2">{timeline.length}</p>
                <span className="text-[11px] text-[#A7AD96] font-mono">Milestone entries</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">Video Reels</span>
                <p className="font-serif text-3xl font-bold text-[#382C24] mt-2">{videos.length}</p>
                <span className="text-[11px] text-[#A7AD96] font-mono">Moments in motion</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">Approved Wishes</span>
                <p className="font-serif text-3xl font-bold text-[#382C24] mt-2">{approvedWishesCount}</p>
                <span className="text-[11px] text-[#767D65] font-mono">On public wall</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">Pending Wishes</span>
                <p className={`font-serif text-3xl font-bold mt-2 ${pendingWishesCount > 0 ? 'text-[#B77D7D]' : 'text-[#382C24]'}`}>
                  {pendingWishesCount}
                </p>
                <span className="text-[11px] text-[#8C3A3A] font-mono">Awaiting moderation</span>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 rounded-xs shadow-scrapbook">
                <h3 className="font-serif text-2xl font-bold text-[#382C24] mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setEditingPhoto({
                        id: `p_${Date.now()}`,
                        title: '',
                        caption: '',
                        image_url: '',
                        category: 'Little Moments',
                        rotation: 0,
                        tape_style: 'rose',
                        sort_order: photos.length + 1,
                        is_published: false,
                      });
                      setIsPhotoModalOpen(true);
                    }}
                    className="p-3 bg-[#FAF6EC] hover:bg-[#F1E8DA] border border-[#DECFBD] rounded-xs text-left transition-colors flex items-center gap-2 text-xs font-serif text-[#514137]"
                  >
                    <Plus className="w-4 h-4 text-[#B77D7D]" /> Add New Photo
                  </button>

                  <button
                    onClick={() => {
                      setEditingTimeline({
                        id: `t_${Date.now()}`,
                        title: '',
                        date: '',
                        story: '',
                        sort_order: timeline.length + 1,
                        is_published: true,
                      });
                      setIsTimelineModalOpen(true);
                    }}
                    className="p-3 bg-[#FAF6EC] hover:bg-[#F1E8DA] border border-[#DECFBD] rounded-xs text-left transition-colors flex items-center gap-2 text-xs font-serif text-[#514137]"
                  >
                    <Plus className="w-4 h-4 text-[#B77D7D]" /> Add Timeline Story
                  </button>

                  <button
                    onClick={() => {
                      setEditingVideo({
                        id: `v_${Date.now()}`,
                        title: '',
                        description: '',
                        video_url: '',
                        sort_order: videos.length + 1,
                        is_published: true,
                      });
                      setIsVideoModalOpen(true);
                    }}
                    className="p-3 bg-[#FAF6EC] hover:bg-[#F1E8DA] border border-[#DECFBD] rounded-xs text-left transition-colors flex items-center gap-2 text-xs font-serif text-[#514137]"
                  >
                    <Plus className="w-4 h-4 text-[#B77D7D]" /> Add Video Reel
                  </button>

                  <button
                    onClick={() => setCurrentTab('settings')}
                    className="p-3 bg-[#FAF6EC] hover:bg-[#F1E8DA] border border-[#DECFBD] rounded-xs text-left transition-colors flex items-center gap-2 text-xs font-serif text-[#514137]"
                  >
                    <Settings className="w-4 h-4 text-[#B77D7D]" /> Edit Birthday Person
                  </button>
                </div>
              </div>

              {/* Database & Deployment Status */}
              <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 rounded-xs shadow-scrapbook">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-2xl font-bold text-[#382C24]">
                    Backend & Storage
                  </h3>
                  <button
                    onClick={() => setIsSetupHelpOpen(true)}
                    className="text-xs text-[#B77D7D] font-serif hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Setup Guide
                  </button>
                </div>

                <p className="font-body text-xs text-[#7E6C5F] mb-4">
                  {supabaseStatus.isConfigured
                    ? 'Connected to live Supabase Postgres database. All changes, uploads, and wishes persist in your cloud backend.'
                    : 'Owner editing, uploads, and guest wish submissions are disabled until Supabase is configured. No local password-only admin is provided.'}
                </p>

                <div className="p-3 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono space-y-1 text-[#7E6C5F]">
                  <p>Mode: <span className="font-bold text-[#382C24]">{supabaseStatus.isConfigured ? 'Supabase Connected' : 'Backend Not Configured'}</span></p>
                  <p>Storage Bucket: <span className="text-[#382C24]">memories-media</span></p>
                  <p>Database: <span className="text-[#382C24]">{supabaseStatus.isConfigured ? supabaseStatus.url : 'Not connected'}</span></p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LANDING & GENERAL SETTINGS */}
        {currentTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-8 rounded-xs shadow-scrapbook max-w-3xl space-y-6">
            <h2 className="font-serif text-3xl font-bold text-[#382C24] mb-2">
              Website & Landing Page Settings
            </h2>
            <p className="font-body text-xs text-[#7E6C5F] mb-6">
              Customize the titles, recipient name, hero paragraph, and featured photograph.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Recipient Name (Birthday Person)
                </label>
                <input
                  type="text"
                  value={settings.recipient_name}
                  onChange={(e) => setSettings({ ...settings, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Sender Name (You)
                </label>
                <input
                  type="text"
                  value={settings.sender_name}
                  onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Website Title
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Hero Tagline (Small Pill)
                </label>
                <input
                  type="text"
                  value={settings.hero_tagline}
                  onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                Website Subtitle
              </label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                Hero Introductory Paragraph
              </label>
              <textarea
                rows={3}
                value={settings.hero_intro}
                onChange={(e) => setSettings({ ...settings, hero_intro: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-body"
              />
            </div>

            <div className="border-t border-[#E3D9CC] pt-4 space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#382C24]">Dedication Chapter</h3>
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Dedication Heading
                </label>
                <input
                  type="text"
                  value={settings.intro_dedication}
                  onChange={(e) => setSettings({ ...settings, intro_dedication: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Dedication Message
                </label>
                <textarea
                  rows={3}
                  value={settings.intro_message}
                  onChange={(e) => setSettings({ ...settings, intro_message: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-body"
                />
              </div>
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Handwritten Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={settings.intro_note}
                  onChange={(e) => setSettings({ ...settings, intro_note: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-body"
                />
              </div>
            </div>

            <div className="border-t border-[#E3D9CC] pt-4 space-y-3">
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">
                Dedication Photograph (Optional)
              </label>
              <ScrapbookImage
                src={settings.intro_photo_url}
                alt="Dedication photograph"
                fallbackLabel="No dedication photo selected"
                className="h-28 w-28 rounded-xs border border-[#DECFBD] object-cover"
              />
              <input
                type="url"
                value={settings.intro_photo_url}
                onChange={(e) => setSettings({ ...settings, intro_photo_url: e.target.value })}
                placeholder="Photo URL or upload"
                className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E8DA] hover:bg-[#EAD6D2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                <Upload className="h-3.5 w-3.5 text-[#B77D7D]" />
                <span>Upload Dedication Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, (url) => setSettings({ ...settings, intro_photo_url: url }))}
                />
              </label>
            </div>

            {/* Featured Hero Photo */}
            <div className="border-t border-[#E3D9CC] pt-4">
              <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-2">
                Featured Hero Polaroid Photograph
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ScrapbookImage
                  src={settings.hero_photo_url}
                  alt="Featured hero photograph"
                  fallbackLabel="No cover photo selected"
                  className="w-24 h-24 object-cover border border-[#DECFBD] rounded-xs"
                />
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    value={settings.hero_photo_url}
                    onChange={(e) => setSettings({ ...settings, hero_photo_url: e.target.value })}
                    placeholder="Image URL or upload"
                    className="w-full px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E8DA] hover:bg-[#EAD6D2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#B77D7D]" />
                    <span>Upload New Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setSettings({ ...settings, hero_photo_url: url }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Hero Photo Caption
                </label>
                <input
                  type="text"
                  value={settings.hero_photo_caption}
                  onChange={(e) => setSettings({ ...settings, hero_photo_caption: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Button Subtitle Note
                </label>
                <input
                  type="text"
                  value={settings.hero_button_caption}
                  onChange={(e) => setSettings({ ...settings, hero_button_caption: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>
            </div>

            <div className="border-t border-[#E3D9CC] pt-4 space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#382C24]">Closing Page</h3>
              <textarea
                rows={3}
                aria-label="Closing message"
                value={settings.closing_message}
                onChange={(e) => setSettings({ ...settings, closing_message: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-body"
              />
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Optional Background Audio URL
                </label>
                <input
                  type="url"
                  value={settings.background_audio_url}
                  onChange={(e) => setSettings({ ...settings, background_audio_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                />
                <p className="mt-1 text-[11px] text-[#8C7765]">The sound control stays disabled when this field is empty. Only add audio you have permission to use.</p>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-sm rounded-xs shadow-xs transition-colors cursor-pointer"
            >
              Save Settings Changes
            </button>
            <div className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] p-4" aria-live="polite">
              <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#7E6C5F]">Live cover preview · unsaved</p>
              <h3 className="font-serif text-2xl font-bold text-[#382C24]">{settings.title || 'A Little Book of You'}</h3>
              <p className="font-hand text-xl text-[#B77D7D]">{settings.subtitle}</p>
              <p className="mt-2 font-body text-sm text-[#514137]">{settings.hero_intro}</p>
              <p className="mt-2 font-hand text-lg text-[#7E6C5F]">{settings.closing_message}</p>
            </div>
          </form>
        )}

        {/* TAB 3: PHOTO SCRAPBOOK MANAGEMENT */}
        {currentTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#382C24]">
                Photo Scrapbook Management ({photos.length})
              </h2>
              <button
                onClick={() => {
                  setEditingPhoto({
                    id: `p_${Date.now()}`,
                    title: '',
                    caption: '',
                    image_url: '',
                    category: 'Little Moments',
                    rotation: 0,
                    tape_style: 'rose',
                    sort_order: photos.length + 1,
                    is_published: false,
                  });
                  setIsPhotoModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Photograph
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.length > 0 ? photos.map((photo) => (
                <div key={photo.id} className="bg-[#FAF7F2] border border-[#E8DEC8] p-4 rounded-xs shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-48 overflow-hidden rounded-xs border border-[#DECFBD] mb-3 bg-[#EFE8DD]">
                      <ScrapbookImage
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        fallbackLabel="Photograph unavailable"
                      />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E]">
                      {photo.category}
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#382C24] mt-1">
                      {photo.title || 'Untitled Photo'}
                    </h4>
                    <p className="font-hand text-lg text-[#514137] line-clamp-2">
                      {photo.caption}
                    </p>
                    {photo.date && (
                      <p className="text-xs text-[#7E6C5F] font-serif italic mt-1">
                        {photo.date} • {photo.location}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E3D9CC] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7E6C5F]">Order: {photo.sort_order}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setIsPhotoModalOpen(true);
                        }}
                        className="p-1.5 text-[#514137] hover:text-[#B77D7D] transition-colors"
                        title="Edit Photo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1.5 text-[#7E6C5F] hover:text-[#8C3A3A] transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="col-span-full rounded-sm border border-dashed border-[#DECFBD] bg-[#FAF7F2] p-8 text-center font-hand text-xl text-[#7E6C5F]">
                  No photographs yet. Add a real photo whenever you are ready.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TIMELINE MANAGEMENT */}
        {currentTab === 'timeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#382C24]">
                Timeline Memories ({timeline.length})
              </h2>
              <button
                onClick={() => {
                  setEditingTimeline({
                    id: `t_${Date.now()}`,
                    title: '',
                    date: '',
                    story: '',
                    sort_order: timeline.length + 1,
                    is_published: false,
                  });
                  setIsTimelineModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Timeline Story
              </button>
            </div>

            <div className="space-y-4">
              {timeline.length > 0 ? timeline.map((entry) => (
                <div key={entry.id} className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#EAD6D2]/60 text-[#8C5E5E]">
                        {entry.date}
                      </span>
                      {entry.tag && (
                        <span className="text-xs font-serif italic text-[#7E6C5F]">
                          • {entry.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#382C24]">
                      {entry.title}
                    </h3>
                    <p className="font-body text-sm text-[#514137] mt-2 leading-relaxed">
                      {entry.story}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingTimeline(entry);
                        setIsTimelineModalOpen(true);
                      }}
                      className="p-2 text-[#514137] hover:text-[#B77D7D] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTimeline(entry.id)}
                      className="p-2 text-[#7E6C5F] hover:text-[#8C3A3A] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="rounded-sm border border-dashed border-[#DECFBD] bg-[#FAF7F2] p-8 text-center font-hand text-xl text-[#7E6C5F]">
                  No timeline entries yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: VIDEO REELS MANAGEMENT */}
        {currentTab === 'videos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#382C24]">
                Moments in Motion — Video Reels ({videos.length})
              </h2>
              <button
                onClick={() => {
                  setEditingVideo({
                    id: `v_${Date.now()}`,
                    title: '',
                    description: '',
                    video_url: '',
                    sort_order: videos.length + 1,
                    is_published: false,
                  });
                  setIsVideoModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Video Reel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.length > 0 ? videos.map((video) => (
                <div key={video.id} className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-xl font-bold text-[#382C24]">{video.title}</h3>
                    <span className="text-xs font-mono text-[#7E6C5F]">{video.duration || 'Video'}</span>
                  </div>
                  <p className="font-hand text-lg text-[#514137] mb-3">{video.description}</p>
                  <p className="text-xs font-mono text-[#7E6C5F] truncate mb-4">URL: {video.video_url}</p>

                  <div className="flex items-center justify-end gap-2 border-t border-[#E3D9CC] pt-3">
                    <button
                      onClick={() => {
                        setEditingVideo(video);
                        setIsVideoModalOpen(true);
                      }}
                      className="p-1.5 text-[#514137] hover:text-[#B77D7D]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-1.5 text-[#7E6C5F] hover:text-[#8C3A3A]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="col-span-full rounded-sm border border-dashed border-[#DECFBD] bg-[#FAF7F2] p-8 text-center font-hand text-xl text-[#7E6C5F]">
                  No videos yet. Add a configured file or video link when ready.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BIRTHDAY WISHES MODERATION */}
        {currentTab === 'wishes' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#382C24]">
                  Birthday Wishes Moderation ({wishes.length})
                </h2>
                <p className="font-body text-xs text-[#7E6C5F]">
                  Public submissions remain pending until approved by the owner.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const wish: BirthdayWish = {
                      id: crypto.randomUUID(),
                      sender_name: '',
                      message: '',
                      paper_color: 'cream',
                      status: 'pending',
                      created_at: new Date().toISOString(),
                    };
                    setWishes((current) => [wish, ...current]);
                    setWishesFilter('pending');
                    setEditingWish(wish);
                    setIsNewWish(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-xs bg-[#B77D7D] px-3 py-1.5 text-xs font-serif text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Wish
                </button>
                {(['all', 'pending', 'approved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setWishesFilter(filter)}
                    className={`px-3 py-1 text-xs font-serif uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                      wishesFilter === filter
                        ? 'bg-[#B77D7D] text-[#FAF6EC]'
                        : 'bg-[#FAF7F2] text-[#7E6C5F] border border-[#DECFBD]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {wishes
                .filter((w) => wishesFilter === 'all' || w.status === wishesFilter)
                .map((wish) => (
                  <div
                    key={wish.id}
                    className={`p-5 rounded-xs border shadow-xs transition-all ${
                      wish.status === 'pending'
                        ? 'bg-[#FAF3DE] border-[#DECFBD]'
                        : 'bg-[#FAF7F2] border-[#E8DEC8]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {editingWish?.id === wish.id ? (
                          <div className="space-y-3">
                            <input
                              required
                              aria-label="Wish sender name"
                              value={editingWish.sender_name}
                              onChange={(e) => setEditingWish({ ...editingWish, sender_name: e.target.value })}
                              className="w-full rounded-xs border border-[#DECFBD] bg-[#FAF6EC] px-3 py-2 text-sm"
                            />
                            <input
                              aria-label="Wish relationship"
                              value={editingWish.relationship || ''}
                              onChange={(e) => setEditingWish({ ...editingWish, relationship: e.target.value })}
                              className="w-full rounded-xs border border-[#DECFBD] bg-[#FAF6EC] px-3 py-2 text-sm"
                            />
                            <textarea
                              required
                              aria-label="Birthday wish message"
                              rows={3}
                              value={editingWish.message}
                              onChange={(e) => setEditingWish({ ...editingWish, message: e.target.value })}
                              className="w-full rounded-xs border border-[#DECFBD] bg-[#FAF6EC] px-3 py-2 font-body text-sm"
                            />
                            <div className="flex flex-wrap gap-2">
                              <select
                                aria-label="Birthday wish paper color"
                                value={editingWish.paper_color || 'cream'}
                                onChange={(e) => setEditingWish({ ...editingWish, paper_color: e.target.value as BirthdayWish['paper_color'] })}
                                className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] px-3 py-2 text-xs"
                              >
                                <option value="cream">Cream</option>
                                <option value="blush">Blush</option>
                                <option value="sage">Sage</option>
                                <option value="ivory">Ivory</option>
                              </select>
                              <button
                                type="button"
                                onClick={handleSaveWish}
                                className="rounded-xs bg-[#B77D7D] px-3 py-2 text-xs font-serif text-white"
                              >
                                Save Wish
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelWishEdit}
                                className="rounded-xs border border-[#DECFBD] px-3 py-2 text-xs font-serif"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] p-3" aria-live="polite">
                              <p className="mb-1 text-[10px] font-mono uppercase text-[#7E6C5F]">Live wish preview · unsaved</p>
                              <p className="font-hand text-xl text-[#514137]">{editingWish.message || 'Your birthday message will appear here.'}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                            wish.status === 'approved'
                              ? 'bg-[#F0F3E8] text-[#556B2F]'
                              : wish.status === 'pending'
                              ? 'bg-[#EAD6D2] text-[#8C3A3A] font-bold'
                              : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            {wish.status.toUpperCase()}
                          </span>
                          <span className="font-serif font-bold text-base text-[#382C24]">
                            {wish.sender_name}
                          </span>
                          {wish.relationship && (
                            <span className="text-xs font-serif italic text-[#7E6C5F]">
                              ({wish.relationship})
                            </span>
                          )}
                        </div>

                        <p className="font-hand text-2xl text-[#3D3028] mt-2">
                          “{wish.message}”
                        </p>

                        <span className="text-[11px] font-mono text-[#8C7765] block mt-3">
                          Submitted on {new Date(wish.created_at).toLocaleString()}
                        </span>
                          </>
                        )}
                      </div>

                      {/* Moderation Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {editingWish?.id !== wish.id && (
                          <button
                            onClick={() => {
                              setEditingWish(wish);
                              setIsNewWish(false);
                            }}
                            className="p-1.5 text-[#514137] hover:text-[#B77D7D]"
                            aria-label={`Edit wish from ${wish.sender_name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {wish.status === 'pending' && (
                          <button
                            onClick={() => handleApproveWish(wish.id)}
                            className="px-3 py-1.5 bg-[#767D65] hover:bg-[#636C52] text-white text-xs font-serif rounded-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                          </button>
                        )}
                        {wish.status === 'approved' && (
                          <button
                            onClick={() => handleRejectWish(wish.id)}
                            className="px-3 py-1.5 bg-[#DECFBD] hover:bg-[#C5BAA8] text-[#514137] text-xs font-serif rounded-xs cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteWish(wish.id)}
                          className="p-1.5 text-[#7E6C5F] hover:text-[#8C3A3A] transition-colors"
                          title="Delete Wish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 7: PERSONAL LETTER EDITING */}
        {currentTab === 'letter' && letter && (
          <form onSubmit={handleSaveLetter} className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-8 rounded-xs shadow-scrapbook max-w-3xl space-y-6">
            <h2 className="font-serif text-3xl font-bold text-[#382C24] mb-2">
              Personal Birthday Letter Editor
            </h2>
            <p className="font-body text-xs text-[#7E6C5F] mb-6">
              Edit the intimate stationery letter displayed in Chapter 6.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Letter Greeting
                </label>
                <input
                  type="text"
                  value={letter.greeting}
                  onChange={(e) => setLetter({ ...letter, greeting: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Letter Date
                </label>
                <input
                  type="text"
                  value={letter.letter_date}
                  onChange={(e) => setLetter({ ...letter, letter_date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>
            </div>

            {/* Paragraphs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">
                  Letter Paragraphs ({letter.paragraphs.length})
                </label>
                <button
                  type="button"
                  onClick={() => setLetter({ ...letter, paragraphs: [...letter.paragraphs, ''] })}
                  className="text-xs font-serif text-[#B77D7D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Paragraph
                </button>
              </div>

              <div className="space-y-3">
                {letter.paragraphs.map((para, idx) => (
                  <div key={idx} className="relative">
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const updated = [...letter.paragraphs];
                        updated[idx] = e.target.value;
                        setLetter({ ...letter, paragraphs: updated });
                      }}
                      className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-body leading-relaxed"
                    />
                    {letter.paragraphs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = letter.paragraphs.filter((_, i) => i !== idx);
                          setLetter({ ...letter, paragraphs: updated });
                        }}
                        className="absolute top-2 right-2 p-1 text-[#8C3A3A] opacity-60 hover:opacity-100"
                        title="Remove Paragraph"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Sign-off Phrase
                </label>
                <input
                  type="text"
                  value={letter.sign_off}
                  onChange={(e) => setLetter({ ...letter, sign_off: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Sender Signature
                </label>
                <input
                  type="text"
                  value={letter.sender_signature}
                  onChange={(e) => setLetter({ ...letter, sender_signature: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-[#514137] text-sm font-hand text-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-sm rounded-xs shadow-xs transition-colors cursor-pointer"
            >
              Save Personal Letter
            </button>
            <div className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] p-5" aria-live="polite">
              <p className="mb-3 text-xs font-mono uppercase tracking-wider text-[#7E6C5F]">Live letter preview · unsaved</p>
              {letter.letter_date && <p className="text-right text-xs italic text-[#7E6C5F]">{letter.letter_date}</p>}
              {letter.greeting && <h3 className="font-serif text-xl font-bold text-[#382C24]">{letter.greeting}</h3>}
              {letter.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-[#514137]">{paragraph || 'Your paragraph will appear here.'}</p>
              ))}
              {letter.sign_off && <p className="mt-4 text-right font-serif italic text-[#7E6C5F]">{letter.sign_off}</p>}
              {letter.sender_signature && <p className="text-right font-hand text-2xl text-[#B77D7D]">{letter.sender_signature}</p>}
              {letter.paragraphs.length === 0 && <p className="font-hand text-lg text-[#7E6C5F]">Add a paragraph to preview the letter.</p>}
            </div>
          </form>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PHOTO EDIT / CREATE */}
      {/* ------------------------------------------------------------- */}
      {isPhotoModalOpen && editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 rounded-xs shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3D9CC] pb-3">
              <h3 className="font-serif text-2xl font-bold text-[#382C24]">
                {photos.some(p => p.id === editingPhoto.id) ? 'Edit Photograph' : 'Add New Photograph'}
              </h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-[#7E6C5F] hover:text-[#382C24]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                  placeholder="e.g. Afternoon Coffee & Matcha"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Handwritten Caption
                </label>
                <textarea
                  rows={2}
                  value={editingPhoto.caption}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-hand text-lg"
                  placeholder="e.g. The day we talked for 4 hours and lost track of time..."
                />
              </div>

              {/* Photo Image Selection */}
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Photo Image URL or File
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={editingPhoto.image_url}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                    placeholder="https://... or upload below"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E8DA] hover:bg-[#EAD6D2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#B77D7D]" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setEditingPhoto({ ...editingPhoto, image_url: url }))}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] p-4">
                <p className="mb-3 text-xs font-mono uppercase tracking-wider text-[#7E6C5F]">Live photo preview · unsaved</p>
                <PolaroidPhoto
                  image_url={editingPhoto.image_url}
                  title={editingPhoto.title}
                  caption={editingPhoto.caption}
                  date={editingPhoto.date}
                  location={editingPhoto.location}
                  rotation={editingPhoto.rotation}
                  tape_style={editingPhoto.tape_style}
                  size="small"
                  className="mx-auto"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="photo-published"
                  type="checkbox"
                  checked={editingPhoto.is_published}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, is_published: e.target.checked })}
                  className="accent-[#B77D7D]"
                />
                <label htmlFor="photo-published" className="text-xs font-serif text-[#514137]">
                  Publish this photograph on the public book
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Category
                  </label>
                  <select
                    value={editingPhoto.category}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, category: e.target.value as MemoryCategory })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif"
                  >
                    <option value="Little Moments">Little Moments</option>
                    <option value="Adventures">Adventures</option>
                    <option value="Celebrations">Celebrations</option>
                    <option value="Everyday Chaos">Everyday Chaos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Tape Decoration
                  </label>
                  <select
                    value={editingPhoto.tape_style || 'rose'}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, tape_style: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif"
                  >
                    <option value="rose">Dusty Rose</option>
                    <option value="sage">Muted Sage</option>
                    <option value="cream">Warm Cream</option>
                    <option value="none">No Tape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={editingPhoto.date || ''}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    placeholder="e.g. October 14, 2024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingPhoto.location || ''}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    placeholder="e.g. Downtown Cafe"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E3D9CC]">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 border border-[#DECFBD] text-xs font-serif rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs hover:bg-[#A36B6B]"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TIMELINE EDIT / CREATE */}
      {/* ------------------------------------------------------------- */}
      {isTimelineModalOpen && editingTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 rounded-xs shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3D9CC] pb-3">
              <h3 className="font-serif text-2xl font-bold text-[#382C24]">
                {timeline.some(t => t.id === editingTimeline.id) ? 'Edit Timeline Story' : 'Add Timeline Story'}
              </h3>
              <button onClick={() => setIsTimelineModalOpen(false)} className="text-[#7E6C5F] hover:text-[#382C24]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimeline} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  required
                  value={editingTimeline.title}
                  onChange={(e) => setEditingTimeline({ ...editingTimeline, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                  placeholder="e.g. The First Road Trip"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Date / Time Period
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTimeline.date}
                    onChange={(e) => setEditingTimeline({ ...editingTimeline, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    placeholder="e.g. July 2022"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Tag / Milestone
                  </label>
                  <input
                    type="text"
                    value={editingTimeline.tag || ''}
                    onChange={(e) => setEditingTimeline({ ...editingTimeline, tag: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    placeholder="e.g. Road Trip Chronicles"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Story Text
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingTimeline.story}
                  onChange={(e) => setEditingTimeline({ ...editingTimeline, story: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-body"
                  placeholder="Write the memory details..."
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Accompanying Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={editingTimeline.image_url || ''}
                  onChange={(e) => setEditingTimeline({ ...editingTimeline, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                  placeholder="Image URL, or upload a photograph"
                />
                <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E8DA] hover:bg-[#EAD6D2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                  <Upload className="h-3.5 w-3.5 text-[#B77D7D]" />
                  <span>Upload Timeline Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, (url) => setEditingTimeline({ ...editingTimeline, image_url: url }))}
                  />
                </label>
              </div>

              <div className="rounded-xs border border-[#DECFBD] bg-[#FAF6EC] p-4" aria-live="polite">
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#7E6C5F]">Live timeline preview · unsaved</p>
                <p className="font-hand text-lg text-[#B77D7D]">{editingTimeline.date}</p>
                <h4 className="font-serif text-xl font-semibold text-[#382C24]">{editingTimeline.title || 'Timeline entry'}</h4>
                <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-[#514137]">{editingTimeline.story}</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="timeline-published"
                  type="checkbox"
                  checked={editingTimeline.is_published}
                  onChange={(e) => setEditingTimeline({ ...editingTimeline, is_published: e.target.checked })}
                  className="accent-[#B77D7D]"
                />
                <label htmlFor="timeline-published" className="text-xs font-serif text-[#514137]">
                  Publish this memory on the public book
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E3D9CC]">
                <button
                  type="button"
                  onClick={() => setIsTimelineModalOpen(false)}
                  className="px-4 py-2 border border-[#DECFBD] text-xs font-serif rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs hover:bg-[#A36B6B]"
                >
                  Save Timeline Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIDEO EDIT / CREATE */}
      {/* ------------------------------------------------------------- */}
      {isVideoModalOpen && editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 rounded-xs shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3D9CC] pb-3">
              <h3 className="font-serif text-2xl font-bold text-[#382C24]">
                {videos.some(v => v.id === editingVideo.id) ? 'Edit Video Reel' : 'Add Video Reel'}
              </h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-[#7E6C5F] hover:text-[#382C24]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Video Reel Title
                </label>
                <input
                  type="text"
                  required
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                  placeholder="e.g. Blowing Out the Candles"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Video URL (Direct MP4, YouTube, or Vimeo)
                </label>
                <input
                  type="text"
                  required
                  value={editingVideo.video_url}
                  onChange={(e) => setEditingVideo({ ...editingVideo, video_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                  placeholder="https://... or YouTube link"
                />
                <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1E8DA] hover:bg-[#EAD6D2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                  <Upload className="h-3.5 w-3.5 text-[#B77D7D]" />
                  <span>Upload Video File</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    disabled={uploadProgress}
                    onChange={(e) => handleFileUpload(e, (url) => setEditingVideo({ ...editingVideo, video_url: url }), 'videos')}
                  />
                </label>
                <p className="mt-1 text-[11px] text-[#8C7765]">Use a direct video URL or upload a supported video file; no sample clips are included.</p>
              </div>

              <div className="rounded-xs border border-[#DECFBD] bg-[#2A231F] p-4 text-[#FAF6EC]" aria-live="polite">
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#C5BAA8]">Live reel preview · unsaved</p>
                <h4 className="font-serif text-xl font-semibold">{editingVideo.title || 'Video title'}</h4>
                <p className="mt-1 font-hand text-lg text-[#DECFBD]">{editingVideo.description || 'Video description'}</p>
                <p className="mt-2 truncate text-xs font-mono text-[#C5BAA8]">{editingVideo.video_url || 'No video configured'}</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="video-published"
                  type="checkbox"
                  checked={editingVideo.is_published}
                  onChange={(e) => setEditingVideo({ ...editingVideo, is_published: e.target.checked })}
                  className="accent-[#B77D7D]"
                />
                <label htmlFor="video-published" className="text-xs font-serif text-[#514137]">
                  Publish this reel on the public book
                </label>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  Handwritten Note / Description
                </label>
                <textarea
                  rows={2}
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-hand text-lg"
                  placeholder="e.g. A snippet of laughter on the beach..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="text"
                    value={editingVideo.thumbnail_url || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                    placeholder="Thumbnail image URL (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                    Duration (e.g. 0:45)
                  </label>
                  <input
                    type="text"
                    value={editingVideo.duration || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    placeholder="0:45"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E3D9CC]">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 border border-[#DECFBD] text-xs font-serif rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs hover:bg-[#A36B6B]"
                >
                  Save Video Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SUPABASE SETUP HELPER */}
      {/* ------------------------------------------------------------- */}
      {isSetupHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-6 sm:p-8 rounded-xs shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3D9CC] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#B77D7D]" />
                <h3 className="font-serif text-2xl font-bold text-[#382C24]">
                  Connecting Supabase (Setup Guide)
                </h3>
              </div>
              <button onClick={() => setIsSetupHelpOpen(false)} className="text-[#7E6C5F] hover:text-[#382C24]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-body text-[#514137] leading-relaxed">
              <p>
                Owner content management and guest wish submissions require a configured Supabase project. Set it up before sharing or deploying the book:
              </p>

              <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-2">
                <p className="font-bold font-serif text-sm text-[#382C24]">Step 1: Create a Free Supabase Project</p>
                <p>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#B77D7D] underline">supabase.com</a> and click "New Project".</p>
              </div>

              <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-2">
                <p className="font-bold font-serif text-sm text-[#382C24]">Step 2: Run the SQL Schema Script</p>
                <p>In your Supabase project dashboard, click on <strong>SQL Editor</strong> on the left, paste the contents of <code>supabase_schema.sql</code> (provided in this repository), and click <strong>Run</strong>.</p>
                <p className="text-[11px] text-[#7E6C5F]">This creates all tables, Row-Level-Security (RLS) policies, and the <code>memories-media</code> storage bucket automatically.</p>
              </div>

              <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-2">
                <p className="font-bold font-serif text-sm text-[#382C24]">Step 3: Add Your Environment Variables</p>
                <p>In your project root, create a <code>.env</code> file (or set environment variables in your Vercel deployment settings):</p>
                <pre className="p-2.5 bg-[#382C24] text-[#FAF6EC] rounded text-[11px] font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...`}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E3D9CC] flex justify-end">
              <button
                onClick={() => setIsSetupHelpOpen(false)}
                className="px-5 py-2 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs hover:bg-[#A36B6B]"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
