import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Edit,
  Eye,
  Film,
  Heart,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  BirthdayPage,
  BirthdaySection,
  BirthdaySiteData,
  MemoryCategory,
  SectionType,
} from '../../types/scrapbook';
import {
  deletePhoto,
  deleteSection,
  deleteTimelineMemory,
  deleteVideo,
  getSections,
  mergeBirthdayWishes,
  mergePhotoMemories,
  mergeTimelineMemories,
  mergeVideoMemories,
  savePhoto,
  saveSection,
  saveSectionsOrder,
  saveTimelineMemory,
  saveVideo,
  slugify,
  toggleSectionVisibility,
  uploadMediaFile,
} from '../../lib/dataService';
import { DynamicSectionRenderer } from '../scrapbook/DynamicSectionRenderer';

interface SectionManagerProps {
  birthdayPage: BirthdayPage;
  siteData: BirthdaySiteData;
  onSectionsChanged?: () => void;
  notify: (type: 'success' | 'error', message: string) => void;
}

const SECTION_TYPE_DETAILS: Record<
  SectionType,
  { label: string; icon: React.ElementType; description: string; color: string }
> = {
  dedication: {
    label: 'Text / Dedication',
    icon: Heart,
    description: 'Personal messages, dedication title, paragraphs, and handwritten note pin.',
    color: 'bg-[#F2DFDE] text-[#8C3A3A] border-[#E8A5A5]',
  },
  photos: {
    label: 'Photo Gallery',
    icon: ImageIcon,
    description: 'Multiple Polaroid photographs, category filters, captions, and lightbox view.',
    color: 'bg-[#E3E8DE] text-[#4A5D3E] border-[#B7C4AB]',
  },
  timeline: {
    label: 'Timeline Stories',
    icon: Bookmark,
    description: 'Chronological events with dates, titles, descriptions, and optional photos.',
    color: 'bg-[#F5EEDB] text-[#7A6129] border-[#DFCFAB]',
  },
  videos: {
    label: 'Video Memories',
    icon: Film,
    description: 'Cinema reels with video player modal, direct URLs, thumbnails, and descriptions.',
    color: 'bg-[#EAE4E9] text-[#553C6E] border-[#C9BDCE]',
  },
  wishes: {
    label: 'Birthday Wishes',
    icon: MessageSquare,
    description: 'Bulletin board of notes from friends, plus public wish submission form.',
    color: 'bg-[#FBEBE8] text-[#8C4A3A] border-[#E8BFB5]',
  },
  letter: {
    label: 'Personal Letter',
    icon: FileText,
    description: 'Stationery paper letter with air-mail postmark, greeting, and handwritten signature.',
    color: 'bg-[#F8F1E5] text-[#6B5034] border-[#D9C4A5]',
  },
  custom: {
    label: 'Custom Content',
    icon: Sparkles,
    description: 'Flexible section with stories, quotes, cards, and memory photographs.',
    color: 'bg-[#E6EFF2] text-[#2C5D6E] border-[#A8C9D3]',
  },
};

export const SectionManager: React.FC<SectionManagerProps> = ({
  birthdayPage,
  siteData,
  onSectionsChanged,
  notify,
}) => {
  const [sections, setSections] = useState<BirthdaySection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<BirthdaySection | null>(null);
  const [previewSection, setPreviewSection] = useState<BirthdaySection | null>(null);

  // Add section form
  const [newType, setNewType] = useState<SectionType>('custom');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newSlug, setNewSlug] = useState('');

  // Editing state
  const [editActiveTab, setEditActiveTab] = useState<'details' | 'content'>('content');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSectionsData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSections(birthdayPage.id, false);
      setSections(data);
    } catch (err) {
      notify('error', 'Could not load sections: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [birthdayPage.id, notify]);

  useEffect(() => {
    void loadSectionsData();
  }, [loadSectionsData]);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = slugify(newSlug.trim() || newTitle.trim());
    const newSection: BirthdaySection = {
      id: crypto.randomUUID(),
      birthday_page_id: birthdayPage.id,
      section_type: newType,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      slug,
      display_order: sections.length,
      is_visible: true,
      content: defaultContentForType(newType, newTitle.trim(), birthdayPage),
    };

    setIsSaving(true);
    const res = await saveSection(newSection, birthdayPage.id);
    setIsSaving(false);

    if (res.success && res.data) {
      notify('success', `Added "${newSection.title}" to this birthday website.`);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewSubtitle('');
      setNewSlug('');
      await loadSectionsData();
      if (onSectionsChanged) onSectionsChanged();
      // Immediately open editor for the new section
      openEditSection(res.data);
    } else {
      notify('error', res.error || 'Failed to create section.');
    }
  };

  const openEditSection = (section: BirthdaySection) => {
    const cloned = JSON.parse(JSON.stringify(section)) as BirthdaySection;
    cloned.content = cloned.content || {};
    if (cloned.section_type === 'photos') {
      cloned.content.photos = mergePhotoMemories(cloned.content.photos || [], siteData.photos);
    } else if (cloned.section_type === 'videos') {
      cloned.content.videos = mergeVideoMemories(cloned.content.videos || [], siteData.videos);
    } else if (cloned.section_type === 'timeline') {
      cloned.content.events = mergeTimelineMemories(cloned.content.events || [], siteData.timeline);
    } else if (cloned.section_type === 'wishes') {
      cloned.content.wishes = mergeBirthdayWishes(cloned.content.wishes || [], siteData.wishes);
    }
    setEditingSection(cloned);
    setEditActiveTab('content');
  };

  const handleSaveEditedSection = async () => {
    if (!editingSection) return;
    setIsSaving(true);

    try {
      // Sync photos to relational photo memories table
      if (editingSection.section_type === 'photos' && Array.isArray(editingSection.content?.photos)) {
        const currentPhotoIds = new Set(editingSection.content.photos.map((p: any) => p.id).filter(Boolean));
        for (const sp of siteData.photos) {
          if (sp.id && !currentPhotoIds.has(sp.id)) {
            await deletePhoto(sp.id, birthdayPage.id);
          }
        }
        for (const p of editingSection.content.photos) {
          if (p && p.image_url) {
            await savePhoto({
              id: p.id || crypto.randomUUID(),
              birthday_page_id: birthdayPage.id,
              title: p.title ? p.title.trim() : '',
              caption: p.caption ? p.caption.trim() : '',
              image_url: p.image_url,
              category: p.category || 'Little Moments',
              date: p.date,
              location: p.location,
              rotation: p.rotation !== undefined ? Number(p.rotation) : 0,
              tape_style: p.tape_style || 'rose',
              sort_order: p.sort_order ?? 0,
              is_published: p.is_published !== false,
            }, birthdayPage.id);
          }
        }
      }

      // Sync videos to relational video memories table
      if (editingSection.section_type === 'videos' && Array.isArray(editingSection.content?.videos)) {
        const currentVideoIds = new Set(editingSection.content.videos.map((v: any) => v.id).filter(Boolean));
        for (const sv of siteData.videos) {
          if (sv.id && !currentVideoIds.has(sv.id)) {
            await deleteVideo(sv.id, birthdayPage.id);
          }
        }
        for (const v of editingSection.content.videos) {
          if (v && v.video_url) {
            await saveVideo({
              id: v.id || crypto.randomUUID(),
              birthday_page_id: birthdayPage.id,
              title: v.title ? v.title.trim() : '',
              description: v.description ? v.description.trim() : '',
              video_url: v.video_url,
              thumbnail_url: v.thumbnail_url,
              duration: v.duration,
              date: v.date,
              sort_order: v.sort_order ?? 0,
              is_published: v.is_published !== false,
            }, birthdayPage.id);
          }
        }
      }

      // Sync timeline stories to relational memories table
      if (editingSection.section_type === 'timeline' && Array.isArray(editingSection.content?.events)) {
        const currentEventIds = new Set(editingSection.content.events.map((e: any) => e.id).filter(Boolean));
        for (const st of siteData.timeline) {
          if (st.id && !currentEventIds.has(st.id)) {
            await deleteTimelineMemory(st.id, birthdayPage.id);
          }
        }
        for (const ev of editingSection.content.events) {
          if (ev && ev.title) {
            await saveTimelineMemory({
              id: ev.id || crypto.randomUUID(),
              birthday_page_id: birthdayPage.id,
              title: ev.title,
              date: ev.date || '',
              story: ev.story || '',
              tag: ev.tag,
              image_url: ev.image_url,
              location: ev.location,
              sort_order: ev.sort_order ?? 0,
              is_published: ev.is_published !== false,
            }, birthdayPage.id);
          }
        }
      }
    } catch (syncErr) {
      console.warn('Syncing items to database tables had notice:', syncErr);
    }

    const res = await saveSection(editingSection, birthdayPage.id);
    setIsSaving(false);

    if (res.success) {
      notify('success', `Saved changes to "${editingSection.title}".`);
      setEditingSection(null);
      await loadSectionsData();
      if (onSectionsChanged) onSectionsChanged();
    } else {
      notify('error', res.error || 'Failed to save section.');
    }
  };

  const handleDelete = async (section: BirthdaySection) => {
    if (!window.confirm(`Are you sure you want to permanently remove the section "${section.title}"?`)) {
      return;
    }
    const res = await deleteSection(section.id, birthdayPage.id);
    if (res.success) {
      notify('success', `Removed section "${section.title}".`);
      await loadSectionsData();
      if (onSectionsChanged) onSectionsChanged();
    } else {
      notify('error', res.error || 'Failed to delete section.');
    }
  };

  const handleToggleVisibility = async (section: BirthdaySection) => {
    const nextVal = !section.is_visible;
    const res = await toggleSectionVisibility(section.id, nextVal, birthdayPage.id);
    if (res.success) {
      notify('success', `"${section.title}" is now ${nextVal ? 'visible on' : 'hidden from'} the public website.`);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, is_visible: nextVal } : s))
      );
      if (onSectionsChanged) onSectionsChanged();
    } else {
      notify('error', res.error || 'Failed to update visibility.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((s) => s.id);
    setSections(reordered.map((s, idx) => ({ ...s, display_order: idx })));

    const res = await saveSectionsOrder(orderedIds, birthdayPage.id);
    if (res.success) {
      notify('success', 'Section order updated.');
      if (onSectionsChanged) onSectionsChanged();
    } else {
      notify('error', res.error || 'Failed to reorder sections.');
      await loadSectionsData();
    }
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void,
    folder = 'sections'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadMediaFile(file, folder, birthdayPage.id);
    setUploading(false);
    if (res.success && res.url) {
      callback(res.url);
      notify('success', 'Media uploaded successfully.');
    } else {
      notify('error', res.error || 'Upload failed.');
    }
  };

  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingSection) return;

    setUploading(true);
    const existing = editingSection.content?.photos || [];
    const newItems: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await uploadMediaFile(file, 'photos', birthdayPage.id);
      if (res.success && res.url) {
        newItems.push({
          id: crypto.randomUUID(),
          title: '',
          caption: '',
          image_url: res.url,
          category: 'Little Moments' as MemoryCategory,
          rotation: (Math.random() * 4 - 2).toFixed(1),
          tape_style: 'rose' as const,
          sort_order: existing.length + newItems.length + 1,
          is_published: true,
        });
      }
    }

    setUploading(false);
    if (newItems.length > 0) {
      setEditingSection({
        ...editingSection,
        content: {
          ...editingSection.content,
          photos: [...existing, ...newItems],
        },
      });
      notify('success', `Uploaded ${newItems.length} photo${newItems.length > 1 ? 's' : ''} successfully.`);
    } else {
      notify('error', 'Failed to upload photos.');
    }
    e.target.value = '';
  };

  const handleMultipleVideosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingSection) return;

    setUploading(true);
    const existing = editingSection.content?.videos || [];
    const newItems: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await uploadMediaFile(file, 'videos', birthdayPage.id);
      if (res.success && res.url) {
        newItems.push({
          id: crypto.randomUUID(),
          title: '',
          description: '',
          video_url: res.url,
          thumbnail_url: '',
          duration: '',
          date: '',
          sort_order: existing.length + newItems.length + 1,
          is_published: true,
        });
      }
    }

    setUploading(false);
    if (newItems.length > 0) {
      setEditingSection({
        ...editingSection,
        content: {
          ...editingSection.content,
          videos: [...existing, ...newItems],
        },
      });
      notify('success', `Uploaded ${newItems.length} video${newItems.length > 1 ? 's' : ''} successfully.`);
    } else {
      notify('error', 'Failed to upload videos.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#FAF7F2] border border-[#E8DEC8] p-5 rounded-xs shadow-scrapbook flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#B77D7D]" />
            <h3 className="font-serif text-2xl font-bold text-[#382C24]">
              Manage Sections for {birthdayPage.recipient_name}
            </h3>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#7E6C5F] mt-1">
            Add, edit, reorder, hide, or remove sections for this birthday book. Changes are isolated to this friend.
          </p>
        </div>

        <button
          onClick={() => {
            setNewType('custom');
            setNewTitle('');
            setNewSubtitle('');
            setNewSlug('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] font-serif text-sm rounded-xs shadow-scrapbook transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="p-12 text-center bg-[#FAF7F2] border border-dashed border-[#DECFBD] rounded-xs font-serif text-lg text-[#7E6C5F]">
          Loading sections...
        </div>
      ) : sections.length === 0 ? (
        <div className="p-12 text-center bg-[#FAF7F2] border border-dashed border-[#DECFBD] rounded-xs">
          <Layers className="mx-auto w-10 h-10 text-[#B77D7D] mb-3" />
          <h4 className="font-serif text-xl font-bold text-[#382C24]">No sections configured yet</h4>
          <p className="font-body text-sm text-[#7E6C5F] mt-1 mb-4">
            Create your first custom section or load the defaults for this friend.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#B77D7D] text-[#FAF6EC] text-sm font-serif rounded-xs"
          >
            + Add First Section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const typeInfo = SECTION_TYPE_DETAILS[section.section_type] || SECTION_TYPE_DETAILS.custom;
            const Icon = typeInfo.icon;
            const isFirst = index === 0;
            const isLast = index === sections.length - 1;

            return (
              <div
                key={section.id}
                className={`p-4 bg-[#FAF7F2] border rounded-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  section.is_visible
                    ? 'border-[#DECFBD] shadow-xs hover:border-[#B77D7D]/50'
                    : 'border-[#E8DEC8] opacity-75 bg-[#F4EFE6]'
                }`}
              >
                {/* Left side: Reorder + Details */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Up / Down Reorder Buttons */}
                  <div className="flex sm:flex-col gap-1 shrink-0">
                    <button
                      title="Move Up"
                      disabled={isFirst}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded-xs bg-[#FAF6EC] border border-[#DECFBD] text-[#7E6C5F] hover:text-[#382C24] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Move Down"
                      disabled={isLast}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded-xs bg-[#FAF6EC] border border-[#DECFBD] text-[#7E6C5F] hover:text-[#382C24] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Order Number Badge */}
                  <div className="w-7 h-7 rounded-full bg-[#FAF6EC] border border-[#DECFBD] flex items-center justify-center text-xs font-mono font-bold text-[#7E6C5F] shrink-0">
                    {index + 1}
                  </div>

                  {/* Section Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-lg font-bold text-[#382C24] truncate">
                        {section.title}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border ${typeInfo.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                          section.is_visible
                            ? 'bg-[#E3E8DE] text-[#4A5D3E]'
                            : 'bg-[#F2DFDE] text-[#8C3A3A]'
                        }`}
                      >
                        {section.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#7E6C5F] font-mono mt-1">
                      <span>/{section.slug}</span>
                      {section.subtitle && (
                        <span className="font-body italic text-[#8C7765] truncate max-w-xs">
                          — "{section.subtitle}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Action Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => handleToggleVisibility(section)}
                    title={section.is_visible ? 'Hide section from public site' : 'Show section on public site'}
                    className={`px-3 py-1.5 rounded-xs text-xs font-serif border transition-colors cursor-pointer ${
                      section.is_visible
                        ? 'bg-[#FAF6EC] border-[#DECFBD] text-[#7E6C5F] hover:bg-[#F1E8DA]'
                        : 'bg-[#FBEBE8] border-[#E8BFB5] text-[#8C3A3A] font-bold'
                    }`}
                  >
                    {section.is_visible ? 'Hide' : 'Restore'}
                  </button>

                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewSection(section)}
                    title="Preview this section layout"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] text-[#7E6C5F] hover:text-[#382C24] text-xs font-serif rounded-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditSection(section)}
                    title="Edit section content and settings"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(section)}
                    title="Delete section"
                    className="p-1.5 bg-[#FDF2F2] border border-[#E8A5A5] text-[#8C3A3A] hover:bg-[#F9DCDC] rounded-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW SECTION
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xs shadow-scrapbook-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E3D9CC] pb-4 mb-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#382C24]">Add New Section</h3>
                <p className="font-body text-xs text-[#7E6C5F] mt-0.5">
                  Choose a section type and enter its initial details.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#7E6C5F] hover:text-[#382C24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-6">
              {/* Type selection cards */}
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-3">
                  1. Select Section Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(SECTION_TYPE_DETAILS) as SectionType[]).map((type) => {
                    const info = SECTION_TYPE_DETAILS[type];
                    const Icon = info.icon;
                    const isSelected = newType === type;

                    return (
                      <div
                        key={type}
                        onClick={() => setNewType(type)}
                        role="button"
                        tabIndex={0}
                        className={`p-3.5 rounded-xs border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#F1E8DA] border-[#B77D7D] shadow-xs ring-1 ring-[#B77D7D]'
                            : 'bg-[#FAF6EC] border-[#DECFBD] hover:bg-[#FAF3E8]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${info.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-serif font-bold text-sm text-[#382C24]">
                            {info.label}
                          </span>
                        </div>
                        <p className="font-body text-xs text-[#7E6C5F] leading-snug">
                          {info.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-4 pt-4 border-t border-[#E3D9CC]">
                <label className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                  2. Section Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-serif text-[#7E6C5F] mb-1">Title *</span>
                    <input
                      required
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (!newSlug || newSlug === slugify(newTitle)) {
                          setNewSlug(slugify(e.target.value));
                        }
                      }}
                      placeholder="e.g. Our Late-Night Conversations"
                      className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-serif text-[#7E6C5F] mb-1">Subtitle (optional)</span>
                    <input
                      value={newSubtitle}
                      onChange={(e) => setNewSubtitle(e.target.value)}
                      placeholder="e.g. The talks that kept us up till dawn"
                      className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-serif text-[#7E6C5F] mb-1">
                    Route Slug (URL path under /birthday/{birthdayPage.slug}/...)
                  </span>
                  <input
                    value={newSlug}
                    onChange={(e) => setNewSlug(slugify(e.target.value))}
                    placeholder="e.g. late-night-conversations"
                    className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-mono text-xs"
                  />
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3D9CC]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#DECFBD] text-xs font-serif text-[#7E6C5F] rounded-xs hover:bg-[#F1E8DA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-scrapbook hover:bg-[#A36B6B] disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create & Edit Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT SECTION
         ========================================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xs shadow-scrapbook-lg max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3D9CC] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl sm:text-2xl font-bold text-[#382C24]">
                    Edit: {editingSection.title}
                  </span>
                  <span className="text-xs font-mono text-[#8C7765]">
                    ({SECTION_TYPE_DETAILS[editingSection.section_type]?.label || editingSection.section_type})
                  </span>
                </div>
                <p className="font-mono text-xs text-[#7E6C5F]">
                  /birthday/{birthdayPage.slug}/{editingSection.slug}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSection(editingSection)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] text-xs font-serif rounded-xs hover:bg-[#F1E8DA]"
                >
                  <Eye className="w-3.5 h-3.5 text-[#B77D7D]" /> Preview
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="p-1 text-[#7E6C5F] hover:text-[#382C24]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 pt-3 border-b border-[#E3D9CC] flex gap-2">
              <button
                onClick={() => setEditActiveTab('content')}
                className={`px-4 py-2 text-xs font-serif uppercase tracking-wider border-b-2 font-bold cursor-pointer ${
                  editActiveTab === 'content'
                    ? 'border-[#B77D7D] text-[#B77D7D]'
                    : 'border-transparent text-[#7E6C5F] hover:text-[#382C24]'
                }`}
              >
                Section Content
              </button>
              <button
                onClick={() => setEditActiveTab('details')}
                className={`px-4 py-2 text-xs font-serif uppercase tracking-wider border-b-2 font-bold cursor-pointer ${
                  editActiveTab === 'details'
                    ? 'border-[#B77D7D] text-[#B77D7D]'
                    : 'border-transparent text-[#7E6C5F] hover:text-[#382C24]'
                }`}
              >
                Title & Settings
              </button>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: TITLE & SETTINGS */}
              {editActiveTab === 'details' && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                        Section Title
                      </span>
                      <input
                        value={editingSection.title}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                        Subtitle / Tagline
                      </span>
                      <input
                        value={editingSection.subtitle || ''}
                        onChange={(e) =>
                          setEditingSection({ ...editingSection, subtitle: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <label className="block">
                      <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                        URL Slug
                      </span>
                      <input
                        value={editingSection.slug}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            slug: slugify(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm font-mono text-xs"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 p-2.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSection.is_visible}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            is_visible: e.target.checked,
                          })
                        }
                        className="accent-[#B77D7D]"
                      />
                      <span>Visible on public birthday website</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT EDITOR BY TYPE */}
              {editActiveTab === 'content' && (
                <div className="space-y-6">
                  {/* General section description */}
                  <label className="block">
                    <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                      Introductory Description
                    </span>
                    <textarea
                      rows={2}
                      value={editingSection.content?.description || ''}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          content: {
                            ...editingSection.content,
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Brief note or intro displayed under the title..."
                      className="w-full px-3 py-2 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-sm"
                    />
                  </label>

                  {/* ---------------- TYPE: DEDICATION ---------------- */}
                  {editingSection.section_type === 'dedication' && (
                    <div className="space-y-4 p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Dedication Title
                          </span>
                          <input
                            value={editingSection.content?.dedication_title || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  dedication_title: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g. A page dedicated to you"
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Recipient Name Override
                          </span>
                          <input
                            value={editingSection.content?.recipient_name || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  recipient_name: e.target.value,
                                },
                              })
                            }
                            placeholder={birthdayPage.recipient_name}
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                          Dedication Message
                        </span>
                        <textarea
                          rows={4}
                          value={editingSection.content?.message || ''}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              content: {
                                ...editingSection.content,
                                message: e.target.value,
                              },
                            })
                          }
                          placeholder="Write a heartfelt birthday dedication message..."
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                          Handwritten Note Pin
                        </span>
                        <input
                          value={editingSection.content?.note || ''}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              content: {
                                ...editingSection.content,
                                note: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. A few pages. A thousand reasons I'm glad it's you."
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-hand text-lg"
                        />
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Featured Photo URL
                          </span>
                          <input
                            value={editingSection.content?.photo_url || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  photo_url: e.target.value,
                                },
                              })
                            }
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                        <div className="flex items-end">
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-[#B77D7D]" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleMediaUpload(e, (url) =>
                                  setEditingSection({
                                    ...editingSection,
                                    content: {
                                      ...editingSection.content,
                                      photo_url: url,
                                    },
                                  })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------------- TYPE: PHOTO GALLERY ---------------- */}
                  {editingSection.section_type === 'photos' && (() => {
                    const galleryPhotos = editingSection.content?.photos || [];
                    const categoriesList: MemoryCategory[] = [
                      'Little Moments',
                      'Adventures',
                      'Celebrations',
                      'Everyday Chaos',
                    ];

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#382C24]">
                            Gallery Photos ({galleryPhotos.length})
                          </h4>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] text-[#382C24] text-xs font-serif rounded-xs cursor-pointer hover:bg-[#F3EAD8] transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#B77D7D]" /> Upload Multiple Photos
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleMultiplePhotosUpload}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newPhoto = {
                                  id: crypto.randomUUID(),
                                  title: '',
                                  caption: '',
                                  image_url: '',
                                  category: 'Little Moments' as MemoryCategory,
                                  rotation: (Math.random() * 4 - 2).toFixed(1),
                                  tape_style: 'rose' as const,
                                  sort_order: galleryPhotos.length + 1,
                                  is_published: true,
                                };
                                setEditingSection({
                                  ...editingSection,
                                  content: {
                                    ...editingSection.content,
                                    photos: [...galleryPhotos, newPhoto],
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Photo
                            </button>
                          </div>
                        </div>

                        {galleryPhotos.map((photo: any, idx: number) => (
                          <div
                            key={photo.id || idx}
                            className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-[#7E6C5F]">Photo #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = galleryPhotos.filter((_: any, i: number) => i !== idx);
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, photos: updated },
                                  });
                                }}
                                className="text-xs text-[#8C3A3A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <input
                                placeholder="Title (optional)"
                                value={photo.title || ''}
                                onChange={(e) => {
                                  const updated = [...galleryPhotos];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, photos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Caption / Note (optional)"
                                value={photo.caption || ''}
                                onChange={(e) => {
                                  const updated = [...galleryPhotos];
                                  updated[idx] = { ...updated[idx], caption: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, photos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Image URL *"
                                value={photo.image_url || ''}
                                onChange={(e) => {
                                  const updated = [...galleryPhotos];
                                  updated[idx] = { ...updated[idx], image_url: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, photos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <select
                                value={photo.category || 'Little Moments'}
                                onChange={(e) => {
                                  const updated = [...galleryPhotos];
                                  updated[idx] = {
                                    ...updated[idx],
                                    category: e.target.value as MemoryCategory,
                                  };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, photos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              >
                                {categoriesList.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                                <Upload className="w-3 h-3 text-[#B77D7D]" /> Upload Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMediaUpload(e, (url) => {
                                      const updated = [...galleryPhotos];
                                      updated[idx] = { ...updated[idx], image_url: url };
                                      setEditingSection({
                                        ...editingSection,
                                        content: { ...editingSection.content, photos: updated },
                                      });
                                    })
                                  }
                                />
                              </label>
                              {photo.image_url && (
                                <img
                                  src={photo.image_url}
                                  alt=""
                                  className="h-9 w-9 object-cover rounded-xs border border-[#DECFBD]"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* ---------------- TYPE: TIMELINE ---------------- */}
                  {editingSection.section_type === 'timeline' && (() => {
                    const events = editingSection.content?.events || [];
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-base text-[#382C24]">
                            Timeline Events ({events.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const newEvent = {
                                id: crypto.randomUUID(),
                                title: '',
                                date: '',
                                story: '',
                                location: '',
                                tag: '',
                                image_url: '',
                              };
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  events: [...events, newEvent],
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Event
                          </button>
                        </div>

                        {events.map((ev: any, idx: number) => (
                          <div
                            key={ev.id || idx}
                            className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-[#7E6C5F]">Milestone #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = events.filter((_: any, i: number) => i !== idx);
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, events: updated },
                                  });
                                }}
                                className="text-xs text-[#8C3A3A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                placeholder="Milestone Title *"
                                value={ev.title || ''}
                                onChange={(e) => {
                                  const updated = [...events];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, events: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Date (e.g. Summer 2023)"
                                value={ev.date || ''}
                                onChange={(e) => {
                                  const updated = [...events];
                                  updated[idx] = { ...updated[idx], date: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, events: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Tag / Milestone (e.g. Chapter 1)"
                                value={ev.tag || ''}
                                onChange={(e) => {
                                  const updated = [...events];
                                  updated[idx] = { ...updated[idx], tag: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, events: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Story / Details..."
                              value={ev.story || ''}
                              onChange={(e) => {
                                const updated = [...events];
                                updated[idx] = { ...updated[idx], story: e.target.value };
                                setEditingSection({
                                  ...editingSection,
                                  content: { ...editingSection.content, events: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                            />
                            <div className="flex items-center gap-3">
                              <input
                                placeholder="Optional Image URL"
                                value={ev.image_url || ''}
                                onChange={(e) => {
                                  const updated = [...events];
                                  updated[idx] = { ...updated[idx], image_url: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, events: updated },
                                  });
                                }}
                                className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                                <Upload className="w-3 h-3 text-[#B77D7D]" /> Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMediaUpload(e, (url) => {
                                      const updated = [...events];
                                      updated[idx] = { ...updated[idx], image_url: url };
                                      setEditingSection({
                                        ...editingSection,
                                        content: { ...editingSection.content, events: updated },
                                      });
                                    })
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* ---------------- TYPE: VIDEOS ---------------- */}
                  {editingSection.section_type === 'videos' && (() => {
                    const videoList = editingSection.content?.videos || [];
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#382C24]">
                            Video Reels ({videoList.length})
                          </h4>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] text-[#382C24] text-xs font-serif rounded-xs cursor-pointer hover:bg-[#F3EAD8] transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#B77D7D]" /> Upload Multiple Videos
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                className="hidden"
                                onChange={handleMultipleVideosUpload}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newVid = {
                                  id: crypto.randomUUID(),
                                  title: '',
                                  description: '',
                                  video_url: '',
                                  thumbnail_url: '',
                                  duration: '',
                                  date: '',
                                };
                                setEditingSection({
                                  ...editingSection,
                                  content: {
                                    ...editingSection.content,
                                    videos: [...videoList, newVid],
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Video
                            </button>
                          </div>
                        </div>

                        {videoList.map((vid: any, idx: number) => (
                          <div
                            key={vid.id || idx}
                            className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-[#7E6C5F]">Video #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = videoList.filter((_: any, i: number) => i !== idx);
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="text-xs text-[#8C3A3A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                placeholder="Video Title (optional)"
                                value={vid.title || ''}
                                onChange={(e) => {
                                  const updated = [...videoList];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Video URL (Direct MP4 or Embed) *"
                                value={vid.video_url || ''}
                                onChange={(e) => {
                                  const updated = [...videoList];
                                  updated[idx] = { ...updated[idx], video_url: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                placeholder="Thumbnail Image URL"
                                value={vid.thumbnail_url || ''}
                                onChange={(e) => {
                                  const updated = [...videoList];
                                  updated[idx] = { ...updated[idx], thumbnail_url: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Duration (e.g. 0:45)"
                                value={vid.duration || ''}
                                onChange={(e) => {
                                  const updated = [...videoList];
                                  updated[idx] = { ...updated[idx], duration: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Date (e.g. Oct 2024)"
                                value={vid.date || ''}
                                onChange={(e) => {
                                  const updated = [...videoList];
                                  updated[idx] = { ...updated[idx], date: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, videos: updated },
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                              />
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Description / caption (optional)..."
                              value={vid.description || ''}
                              onChange={(e) => {
                                const updated = [...videoList];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setEditingSection({
                                  ...editingSection,
                                  content: { ...editingSection.content, videos: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs"
                            />
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                                <Upload className="w-3 h-3 text-[#B77D7D]" /> Upload Video File
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMediaUpload(
                                      e,
                                      (url) => {
                                        const updated = [...videoList];
                                        updated[idx] = { ...updated[idx], video_url: url };
                                        setEditingSection({
                                          ...editingSection,
                                          content: { ...editingSection.content, videos: updated },
                                        });
                                      },
                                      'videos'
                                    )
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* ---------------- TYPE: WISHES ---------------- */}
                  {editingSection.section_type === 'wishes' && (
                    <div className="space-y-4 p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs">
                      <label className="inline-flex items-center gap-2 text-xs font-serif cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingSection.content?.allow_submissions !== false}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              content: {
                                ...editingSection.content,
                                allow_submissions: e.target.checked,
                              },
                            })
                          }
                          className="accent-[#B77D7D]"
                        />
                        <span>Enable public birthday wish submissions from visitors</span>
                      </label>
                    </div>
                  )}

                  {/* ---------------- TYPE: LETTER ---------------- */}
                  {editingSection.section_type === 'letter' && (
                    <div className="space-y-4 p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Greeting
                          </span>
                          <input
                            value={editingSection.content?.greeting || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  greeting: e.target.value,
                                },
                              })
                            }
                            placeholder="Dearest Friend,"
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Letter Date
                          </span>
                          <input
                            value={editingSection.content?.letter_date || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  letter_date: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g. October 18, 2026"
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-serif uppercase tracking-wider text-[#7E6C5F]">
                            Letter Paragraphs
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentParas = editingSection.content?.paragraphs || [];
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  paragraphs: [...currentParas, ''],
                                },
                              });
                            }}
                            className="text-xs text-[#B77D7D] font-serif hover:underline"
                          >
                            + Add Paragraph
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(editingSection.content?.paragraphs || []).map((para: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <textarea
                                rows={3}
                                value={para}
                                onChange={(e) => {
                                  const updated = [...(editingSection.content?.paragraphs || [])];
                                  updated[idx] = e.target.value;
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, paragraphs: updated },
                                  });
                                }}
                                placeholder={`Paragraph ${idx + 1}...`}
                                className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-body"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingSection.content?.paragraphs || []).filter(
                                    (_: any, i: number) => i !== idx
                                  );
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, paragraphs: updated },
                                  });
                                }}
                                className="p-1.5 text-[#8C3A3A] hover:bg-[#FDF2F2] rounded-xs text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Sign Off
                          </span>
                          <input
                            value={editingSection.content?.sign_off || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  sign_off: e.target.value,
                                },
                              })
                            }
                            placeholder="With all my love,"
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-serif uppercase tracking-wider text-[#7E6C5F] mb-1">
                            Sender Signature
                          </span>
                          <input
                            value={editingSection.content?.sender_signature || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  sender_signature: e.target.value,
                                },
                              })
                            }
                            placeholder="Your Name"
                            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-hand text-lg"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ---------------- TYPE: CUSTOM CONTENT ---------------- */}
                  {editingSection.section_type === 'custom' && (
                    <div className="space-y-5">
                      {/* Featured Quote */}
                      <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
                        <h4 className="font-serif font-bold text-sm text-[#382C24]">Featured Quote (optional)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            placeholder="Quote text..."
                            value={editingSection.content?.quote || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: { ...editingSection.content, quote: e.target.value },
                              })
                            }
                            className="sm:col-span-2 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-serif italic"
                          />
                          <input
                            placeholder="Quote Author"
                            value={editingSection.content?.quote_author || ''}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                content: { ...editingSection.content, quote_author: e.target.value },
                              })
                            }
                            className="px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-hand text-base"
                          />
                        </div>
                      </div>

                      {/* Paragraphs */}
                      <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-sm text-[#382C24]">Story Paragraphs</h4>
                          <button
                            type="button"
                            onClick={() => {
                              const paras = editingSection.content?.body_paragraphs || [];
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  body_paragraphs: [...paras, ''],
                                },
                              });
                            }}
                            className="text-xs text-[#B77D7D] font-serif hover:underline"
                          >
                            + Add Paragraph
                          </button>
                        </div>
                        {(editingSection.content?.body_paragraphs || []).map((p: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <textarea
                              rows={3}
                              value={p}
                              onChange={(e) => {
                                const updated = [...(editingSection.content?.body_paragraphs || [])];
                                updated[idx] = e.target.value;
                                setEditingSection({
                                  ...editingSection,
                                  content: { ...editingSection.content, body_paragraphs: updated },
                                });
                              }}
                              placeholder={`Paragraph ${idx + 1}...`}
                              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs text-sm font-body"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingSection.content?.body_paragraphs || []).filter(
                                  (_: any, i: number) => i !== idx
                                );
                                setEditingSection({
                                  ...editingSection,
                                  content: { ...editingSection.content, body_paragraphs: updated },
                                });
                              }}
                              className="p-1.5 text-[#8C3A3A] hover:bg-[#FDF2F2] rounded-xs text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Custom Cards */}
                      <div className="p-4 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-sm text-[#382C24]">
                            Memory Photo Cards ({(editingSection.content?.items || []).length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const items = editingSection.content?.items || [];
                              const newItem = {
                                id: crypto.randomUUID(),
                                title: '',
                                text: '',
                                image_url: '',
                                caption: '',
                                tag: '',
                              };
                              setEditingSection({
                                ...editingSection,
                                content: {
                                  ...editingSection.content,
                                  items: [...items, newItem],
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs"
                          >
                            <Plus className="w-3 h-3" /> Add Card
                          </button>
                        </div>

                        {(editingSection.content?.items || []).map((item: any, idx: number) => (
                          <div
                            key={item.id || idx}
                            className="p-3 bg-[#FAF7F2] border border-[#DECFBD] rounded-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-[#7E6C5F]">Card #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingSection.content?.items || []).filter(
                                    (_: any, i: number) => i !== idx
                                  );
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, items: updated },
                                  });
                                }}
                                className="text-xs text-[#8C3A3A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                placeholder="Title"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.content?.items || [])];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, items: updated },
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif font-bold"
                              />
                              <input
                                placeholder="Tag (e.g. Inside Joke)"
                                value={item.tag || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.content?.items || [])];
                                  updated[idx] = { ...updated[idx], tag: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, items: updated },
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-mono"
                              />
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Description text..."
                              value={item.text || ''}
                              onChange={(e) => {
                                const updated = [...(editingSection.content?.items || [])];
                                updated[idx] = { ...updated[idx], text: e.target.value };
                                setEditingSection({
                                  ...editingSection,
                                  content: { ...editingSection.content, items: updated },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                placeholder="Image URL"
                                value={item.image_url || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.content?.items || [])];
                                  updated[idx] = { ...updated[idx], image_url: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, items: updated },
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs"
                              />
                              <input
                                placeholder="Handwritten Caption"
                                value={item.caption || ''}
                                onChange={(e) => {
                                  const updated = [...(editingSection.content?.items || [])];
                                  updated[idx] = { ...updated[idx], caption: e.target.value };
                                  setEditingSection({
                                    ...editingSection,
                                    content: { ...editingSection.content, items: updated },
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-hand text-base"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF6EC] border border-[#DECFBD] rounded-xs text-xs font-serif cursor-pointer">
                                <Upload className="w-3 h-3 text-[#B77D7D]" /> Upload Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMediaUpload(e, (url) => {
                                      const updated = [...(editingSection.content?.items || [])];
                                      updated[idx] = { ...updated[idx], image_url: url };
                                      setEditingSection({
                                        ...editingSection,
                                        content: { ...editingSection.content, items: updated },
                                      });
                                    })
                                  }
                                />
                              </label>
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt=""
                                  className="h-8 w-8 object-cover rounded-xs border border-[#DECFBD]"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E3D9CC] flex items-center justify-between gap-3 bg-[#FAF7F2]">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 border border-[#DECFBD] text-xs font-serif text-[#7E6C5F] rounded-xs hover:bg-[#F1E8DA]"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSection(editingSection)}
                  className="px-4 py-2 bg-[#FAF6EC] border border-[#DECFBD] text-[#514137] text-xs font-serif rounded-xs hover:bg-[#F1E8DA]"
                >
                  Live Preview
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveEditedSection}
                  className="px-6 py-2 bg-[#B77D7D] hover:bg-[#A36B6B] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-scrapbook disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LIVE SECTION PREVIEW
         ========================================================================= */}
      {previewSection && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F4EC] overflow-y-auto animate-in fade-in duration-150">
          {/* Preview top banner */}
          <div className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#DECFBD] px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A7AD96] animate-pulse" />
              <span className="font-serif font-bold text-sm text-[#382C24]">
                Previewing Section: {previewSection.title}
              </span>
              <span className="text-xs font-mono text-[#7E6C5F] hidden sm:inline">
                ({SECTION_TYPE_DETAILS[previewSection.section_type]?.label || previewSection.section_type})
              </span>
            </div>
            <button
              onClick={() => setPreviewSection(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B77D7D] text-[#FAF6EC] text-xs font-serif rounded-xs shadow-xs"
            >
              <X className="w-4 h-4" /> Exit Preview
            </button>
          </div>

          {/* Render section with dynamic renderer */}
          <div className="flex-1 p-2 sm:p-6">
            <DynamicSectionRenderer
              section={previewSection}
              chapterNumber={1}
              totalChapters={1}
              previousPath="#"
              previousLabel="Cover"
              nextPath="#"
              nextLabel="Next Chapter"
              siteData={siteData}
              isPreview={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function defaultContentForType(type: SectionType, title: string, page: BirthdayPage): Record<string, any> {
  switch (type) {
    case 'dedication':
      return {
        recipient_name: page.recipient_name,
        dedication_title: title || 'A page dedicated to you',
        message: 'A special dedication gathered for your birthday.',
        note: 'A few pages. A thousand reasons I am glad it is you.',
        photo_url: page.hero_photo_url || '',
      };
    case 'photos':
      return {
        description: 'Click any photograph to step closer and relive the moment in full view.',
        photos: [],
      };
    case 'timeline':
      return {
        description: 'From the very first hello to the adventures that defined us.',
        events: [],
      };
    case 'videos':
      return {
        description: 'Short clips, spontaneous laughter, and genuine living.',
        videos: [],
      };
    case 'wishes':
      return {
        description: 'Warm notes and birthday love gathered from friends and family.',
        allow_submissions: true,
      };
    case 'letter':
      return {
        greeting: `Dear ${page.recipient_name},`,
        letter_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        paragraphs: ['I wanted to take a moment to write down what your friendship means to me...'],
        sign_off: 'With love and warmest wishes,',
        sender_signature: page.sender_name || 'Your friend',
      };
    case 'custom':
    default:
      return {
        description: 'A special collection of memories and moments.',
        body_paragraphs: [
          'Some moments become chapters we want to keep returning to. This space is dedicated to the unforgettable memories we share.',
        ],
        quote: 'Good times become good memories, and good memories become a lifetime of friendship.',
        quote_author: 'Forever Friends',
        items: [],
      };
  }
}
