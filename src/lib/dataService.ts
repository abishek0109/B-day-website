import { supabase, isSupabaseConfigured } from './supabase';
import {
  BirthdayPage,
  BirthdaySection,
  BirthdaySiteData,
  BirthdayWish,
  PersonalLetter,
  PhotoMemory,
  SiteSettings,
  TimelineMemory,
  VideoMemory,
} from '../types/scrapbook';
import {
  initialBirthdayPages,
  initialPersonalLetter,
  initialPhotos,
  initialSiteSettings,
  initialTimeline,
  initialVideos,
  initialWishes,
} from '../data/initialData';

const LOCAL_STORAGE_KEYS = {
  BIRTHDAY_PAGES: 'scrapbook_birthday_pages',
  PHOTOS: 'scrapbook_photos_by_page',
  TIMELINE: 'scrapbook_timeline_by_page',
  VIDEOS: 'scrapbook_videos_by_page',
  WISHES: 'scrapbook_wishes_by_page',
  LETTERS: 'scrapbook_letters_by_page',
  SECTIONS: 'scrapbook_sections_by_page',
};

const DEFAULT_PAGE_ID = initialBirthdayPages[0]?.id || 'birthday-default';

function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'birthday-page';
}

export function settingsFromPage(page: BirthdayPage): SiteSettings {
  return {
    id: page.id,
    recipient_name: page.recipient_name,
    sender_name: page.sender_name || '',
    title: page.title,
    subtitle: page.subtitle,
    hero_tagline: page.hero_tagline,
    hero_note: page.hero_note,
    hero_intro: page.hero_intro,
    hero_button_caption: page.hero_button_caption,
    hero_photo_url: page.hero_photo_url,
    hero_photo_caption: page.hero_photo_caption,
    hero_photo_date: page.hero_photo_date,
    intro_dedication: page.intro_dedication,
    intro_message: page.intro_message,
    intro_photo_url: page.intro_photo_url,
    intro_note: page.intro_note,
    closing_message: page.closing_message,
    background_audio_url: page.background_audio_url,
    updated_at: page.updated_at,
  };
}

function pageFromSettings(settings: SiteSettings, page: BirthdayPage): BirthdayPage {
  return {
    ...page,
    recipient_name: settings.recipient_name,
    sender_name: settings.sender_name,
    title: settings.title,
    subtitle: settings.subtitle,
    hero_tagline: settings.hero_tagline,
    hero_note: settings.hero_note,
    hero_intro: settings.hero_intro,
    hero_button_caption: settings.hero_button_caption,
    hero_photo_url: settings.hero_photo_url,
    hero_photo_caption: settings.hero_photo_caption,
    hero_photo_date: settings.hero_photo_date,
    intro_dedication: settings.intro_dedication,
    intro_message: settings.intro_message,
    intro_photo_url: settings.intro_photo_url,
    intro_note: settings.intro_note,
    closing_message: settings.closing_message,
    background_audio_url: settings.background_audio_url,
  };
}

function scopedId(birthdayPageId?: string) {
  return birthdayPageId || DEFAULT_PAGE_ID;
}

function addDefaultScope<T extends { birthday_page_id?: string }>(items: T[]) {
  return items.map((item) => ({ ...item, birthday_page_id: item.birthday_page_id || DEFAULT_PAGE_ID }));
}

function localRows<T extends { birthday_page_id?: string }>(key: string, defaults: T[]): T[] {
  return getLocalStorage<T[]>(key, addDefaultScope(defaults));
}

function filterByPage<T extends { birthday_page_id?: string }>(items: T[], birthdayPageId?: string): T[] {
  const id = scopedId(birthdayPageId);
  return addDefaultScope(items).filter((item) => item.birthday_page_id === id);
}

export async function getBirthdayPages(): Promise<BirthdayPage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('birthday_pages').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to load birthday websites from Supabase: ${error.message}`);
    return (data || []) as BirthdayPage[];
  }
  return getLocalStorage<BirthdayPage[]>(LOCAL_STORAGE_KEYS.BIRTHDAY_PAGES, initialBirthdayPages);
}

export async function getAvailableSlug(name: string, currentPageId?: string): Promise<string> {
  const pages = await getBirthdayPages();
  const base = slugify(name);
  let slug = base;
  let index = 2;
  while (pages.some((page) => page.id !== currentPageId && page.slug.toLowerCase() === slug.toLowerCase())) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

export async function getBirthdayPageBySlug(slug: string, publishedOnly = false): Promise<BirthdayPage | null> {
  const normalized = slugify(slug);
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('birthday_pages').select('*').eq('slug', normalized).limit(1);
    if (publishedOnly) query = query.eq('is_published', true);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Failed to load birthday website from Supabase: ${error.message}`);
    return data as BirthdayPage | null;
  }
  const page = (await getBirthdayPages()).find((item) => item.slug.toLowerCase() === normalized);
  return page && (!publishedOnly || page.is_published) ? page : null;
}

export async function getDefaultPublishedBirthdayPage(): Promise<BirthdayPage | null> {
  const pages = await getBirthdayPages();
  return pages.find((page) => page.is_published) || pages[0] || null;
}

export async function saveBirthdayPage(page: BirthdayPage): Promise<{ success: boolean; data?: BirthdayPage; error?: string }> {
  const normalized = { ...page, slug: slugify(page.slug), updated_at: new Date().toISOString() };
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('birthday_pages').upsert(normalized).select().single();
      if (error) throw error;
      return { success: true, data: data as BirthdayPage };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save birthday page' };
    }
  }
  const pages = await getBirthdayPages();
  if (pages.some((item) => item.id !== normalized.id && item.slug.toLowerCase() === normalized.slug.toLowerCase())) {
    return { success: false, error: 'That birthday link slug is already taken.' };
  }
  const updated = pages.some((item) => item.id === normalized.id)
    ? pages.map((item) => item.id === normalized.id ? normalized : item)
    : [normalized, ...pages];
  setLocalStorage(LOCAL_STORAGE_KEYS.BIRTHDAY_PAGES, updated);
  return { success: true, data: normalized };
}

export async function createBirthdayPage(name: string): Promise<{ success: boolean; data?: BirthdayPage; error?: string }> {
  const now = new Date().toISOString();
  const trimmed = name.trim() || 'Birthday Friend';
  const slug = await getAvailableSlug(trimmed);
  return saveBirthdayPage({
    id: crypto.randomUUID(),
    slug,
    ...initialSiteSettings,
    recipient_name: trimmed,
    intro_dedication: `For ${trimmed}`,
    is_published: false,
    created_at: now,
    updated_at: now,
  });
}

export async function deleteBirthdayPage(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('birthday_pages').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete birthday page' };
    }
  }
  setLocalStorage(LOCAL_STORAGE_KEYS.BIRTHDAY_PAGES, (await getBirthdayPages()).filter((page) => page.id !== id));
  return { success: true };
}

export async function getSiteSettings(birthdayPageId = DEFAULT_PAGE_ID): Promise<SiteSettings> {
  const page = (await getBirthdayPages()).find((item) => item.id === birthdayPageId) || (await getDefaultPublishedBirthdayPage());
  return page ? settingsFromPage(page) : initialSiteSettings;
}

export async function updateSiteSettings(settings: SiteSettings, birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  const page = (await getBirthdayPages()).find((item) => item.id === birthdayPageId);
  if (!page) return { success: false, error: 'Birthday page not found.' };
  const res = await saveBirthdayPage(pageFromSettings(settings, page));
  return res.success ? { success: true } : { success: false, error: res.error };
}

async function getRows<T extends { birthday_page_id?: string; is_published?: boolean; status?: string }>(
  table: string,
  key: string,
  defaults: T[],
  birthdayPageId = DEFAULT_PAGE_ID,
  options: { publishedOnly?: boolean; includePending?: boolean } = {},
): Promise<T[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from(table).select('*').eq('birthday_page_id', birthdayPageId);
    if (options.publishedOnly) query = query.eq('is_published', true);
    if (options.includePending === false) query = query.eq('status', 'approved');
    const orderColumn = table === 'birthday_wishes' ? 'created_at' : 'sort_order';
    const { data, error } = await query.order(orderColumn, { ascending: table !== 'birthday_wishes' });
    if (error) throw new Error(`Failed to load ${table} from Supabase: ${error.message}`);
    return (data || []) as T[];
  }
  let rows = filterByPage(localRows<T>(key, defaults), birthdayPageId);
  if (options.publishedOnly) rows = rows.filter((row) => row.is_published);
  if (options.includePending === false) rows = rows.filter((row) => row.status === 'approved');
  return rows;
}

async function saveRow<T extends { id: string; birthday_page_id?: string }>(
  table: string,
  key: string,
  defaults: T[],
  row: T,
  birthdayPageId = DEFAULT_PAGE_ID,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const scopedRow = { ...row, birthday_page_id: birthdayPageId };
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from(table).upsert(scopedRow).select().single();
      if (error) throw error;
      return { success: true, data: data as T };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : `Failed to save ${table}` };
    }
  }
  const rows = localRows<T>(key, defaults);
  const isSamePageRow = (item: T) => item.id === scopedRow.id && scopedId(item.birthday_page_id) === birthdayPageId;
  const updated = rows.some(isSamePageRow)
    ? rows.map((item) => isSamePageRow(item) ? scopedRow : item)
    : [...rows, scopedRow];
  setLocalStorage(key, updated);
  return { success: true, data: scopedRow };
}

async function deleteRow(
  table: string,
  key: string,
  defaults: { id: string; birthday_page_id?: string }[],
  id: string,
  birthdayPageId = DEFAULT_PAGE_ID,
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('birthday_page_id', birthdayPageId);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : `Failed to delete ${table}` };
    }
  }
  setLocalStorage(key, localRows(key, defaults).filter((item) => (
    item.id !== id || scopedId(item.birthday_page_id) !== birthdayPageId
  )));
  return { success: true };
}

export const getPhotos = (publishedOnly = true, birthdayPageId = DEFAULT_PAGE_ID) =>
  getRows<PhotoMemory>('photos', LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos, birthdayPageId, { publishedOnly });
export const savePhoto = (photo: PhotoMemory, birthdayPageId = DEFAULT_PAGE_ID) =>
  saveRow<PhotoMemory>('photos', LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos, photo, birthdayPageId);
export const deletePhoto = (photoId: string, birthdayPageId = DEFAULT_PAGE_ID) =>
  deleteRow('photos', LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos, photoId, birthdayPageId);

export const getTimelineMemories = (publishedOnly = true, birthdayPageId = DEFAULT_PAGE_ID) =>
  getRows<TimelineMemory>('memories', LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline, birthdayPageId, { publishedOnly });
export const saveTimelineMemory = (memory: TimelineMemory, birthdayPageId = DEFAULT_PAGE_ID) =>
  saveRow<TimelineMemory>('memories', LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline, memory, birthdayPageId);
export const deleteTimelineMemory = (id: string, birthdayPageId = DEFAULT_PAGE_ID) =>
  deleteRow('memories', LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline, id, birthdayPageId);

export const getVideos = (publishedOnly = true, birthdayPageId = DEFAULT_PAGE_ID) =>
  getRows<VideoMemory>('videos', LOCAL_STORAGE_KEYS.VIDEOS, initialVideos, birthdayPageId, { publishedOnly });
export const saveVideo = (video: VideoMemory, birthdayPageId = DEFAULT_PAGE_ID) =>
  saveRow<VideoMemory>('videos', LOCAL_STORAGE_KEYS.VIDEOS, initialVideos, video, birthdayPageId);
export const deleteVideo = (id: string, birthdayPageId = DEFAULT_PAGE_ID) =>
  deleteRow('videos', LOCAL_STORAGE_KEYS.VIDEOS, initialVideos, id, birthdayPageId);

export const getWishes = (includePending = false, birthdayPageId = DEFAULT_PAGE_ID) =>
  getRows<BirthdayWish>('birthday_wishes', LOCAL_STORAGE_KEYS.WISHES, initialWishes, birthdayPageId, { includePending });

export async function submitPublicWish(
  wish: Omit<BirthdayWish, 'id' | 'status' | 'created_at'>,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Wish submissions require the owner to configure Supabase first.' };
  }
  try {
    const { error } = await supabase.from('birthday_wishes').insert([{
      birthday_page_id: wish.birthday_page_id,
      sender_name: wish.sender_name,
      relationship: wish.relationship,
      message: wish.message,
      photo_url: wish.photo_url,
      paper_color: wish.paper_color || 'cream',
      rotation: Math.random() * 4 - 2,
      status: 'pending',
    }]);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit wish' };
  }
}

export const saveWish = (wish: BirthdayWish, birthdayPageId = DEFAULT_PAGE_ID) =>
  saveRow<BirthdayWish>('birthday_wishes', LOCAL_STORAGE_KEYS.WISHES, initialWishes, wish, birthdayPageId).then((res) => (
    res.success ? { success: true } : { success: false, error: res.error }
  ));

export async function updateWishStatus(id: string, status: 'approved' | 'rejected', birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('birthday_wishes').update({ status }).eq('id', id).eq('birthday_page_id', birthdayPageId);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update wish status' };
    }
  }
  const rows = localRows<BirthdayWish>(LOCAL_STORAGE_KEYS.WISHES, initialWishes);
  setLocalStorage(LOCAL_STORAGE_KEYS.WISHES, rows.map((wish) => (
    wish.id === id && scopedId(wish.birthday_page_id) === birthdayPageId ? { ...wish, status } : wish
  )));
  return { success: true };
}

export const deleteWish = (id: string, birthdayPageId = DEFAULT_PAGE_ID) =>
  deleteRow('birthday_wishes', LOCAL_STORAGE_KEYS.WISHES, initialWishes, id, birthdayPageId);

export async function getPersonalLetter(birthdayPageId = DEFAULT_PAGE_ID): Promise<PersonalLetter> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('personal_letter').select('*').eq('birthday_page_id', birthdayPageId).limit(1).maybeSingle();
    if (error) throw new Error(`Failed to load personal letter from Supabase: ${error.message}`);
    return data as PersonalLetter || { ...initialPersonalLetter, birthday_page_id: birthdayPageId };
  }
  const letters = localRows<PersonalLetter & { id: string }>(LOCAL_STORAGE_KEYS.LETTERS, [{ ...initialPersonalLetter, id: 'default-letter' }]);
  return letters.find((letter) => letter.birthday_page_id === birthdayPageId) || { ...initialPersonalLetter, id: crypto.randomUUID(), birthday_page_id: birthdayPageId };
}

export async function updatePersonalLetter(letter: PersonalLetter, birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  const scopedLetter = { ...letter, id: letter.id || crypto.randomUUID(), birthday_page_id: birthdayPageId, updated_at: new Date().toISOString() };
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('personal_letter').upsert(scopedLetter);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update letter' };
    }
  }
  const letters = localRows<PersonalLetter & { id: string }>(LOCAL_STORAGE_KEYS.LETTERS, [{ ...initialPersonalLetter, id: 'default-letter' }]);
  const updated = letters.some((item) => item.birthday_page_id === birthdayPageId)
    ? letters.map((item) => item.birthday_page_id === birthdayPageId ? scopedLetter : item)
    : [...letters, scopedLetter];
  setLocalStorage(LOCAL_STORAGE_KEYS.LETTERS, updated);
  return { success: true };
}

export function createDefaultSectionsForPage(page: BirthdayPage): BirthdaySection[] {
  return [
    {
      id: `default-sec-dedication-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'dedication',
      title: 'The Dedication',
      subtitle: 'A page dedicated to you',
      slug: 'intro',
      display_order: 0,
      is_visible: true,
      content: {
        recipient_name: page.recipient_name,
        dedication_title: page.intro_dedication || 'A page dedicated to you',
        message: page.intro_message || '',
        note: page.intro_note || '',
        photo_url: page.intro_photo_url || '',
      },
    },
    {
      id: `default-sec-photos-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'photos',
      title: 'Photo Scrapbook',
      subtitle: 'Our Favourite Memories',
      slug: 'photos',
      display_order: 1,
      is_visible: true,
      content: {
        description: 'Click any photograph to step closer and relive the moment in full view.',
      },
    },
    {
      id: `default-sec-timeline-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'timeline',
      title: 'The Timeline',
      subtitle: 'Little Moments, Big Memories',
      slug: 'timeline',
      display_order: 2,
      is_visible: true,
      content: {
        description: 'From the very first hello to the adventures that defined us, here is how our story unfolded.',
      },
    },
    {
      id: `default-sec-videos-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'videos',
      title: 'Moments in Motion',
      subtitle: 'Our little cinema reel',
      slug: 'videos',
      display_order: 3,
      is_visible: true,
      content: {
        description: 'Short clips, spontaneous laughter, and genuine living. Click on any reel to watch the video.',
      },
    },
    {
      id: `default-sec-wishes-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'wishes',
      title: 'Words From Your People',
      subtitle: 'Birthday notes and messages',
      slug: 'wishes',
      display_order: 4,
      is_visible: true,
      content: {
        description: 'Warm notes, inside jokes, and heartfelt blessings from the people who love you most.',
      },
    },
    {
      id: `default-sec-letter-${page.id}`,
      birthday_page_id: page.id,
      section_type: 'letter',
      title: 'Personal Letter',
      subtitle: 'A letter just for you',
      slug: 'letter',
      display_order: 5,
      is_visible: true,
      content: {
        description: 'From my heart to yours.',
      },
    },
  ];
}

export async function getSections(birthdayPageId = DEFAULT_PAGE_ID, visibleOnly = false): Promise<BirthdaySection[]> {
  const scopedPageId = scopedId(birthdayPageId);
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('birthday_sections').select('*').eq('birthday_page_id', scopedPageId);
      if (visibleOnly) query = query.eq('is_visible', true);
      const { data, error } = await query.order('display_order', { ascending: true });
      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
        return data as BirthdaySection[];
      }
      // If no custom sections in DB, generate defaults based on the page
      const page = (await getBirthdayPages()).find((p) => p.id === scopedPageId);
      if (page) {
        const defaults = createDefaultSectionsForPage(page);
        return visibleOnly ? defaults.filter((s) => s.is_visible) : defaults;
      }
      return [];
    } catch (e) {
      console.warn('Error reading birthday_sections from Supabase, attempting fallback:', e);
    }
  }

  // Local storage mode
  const allSections = getLocalStorage<BirthdaySection[]>(LOCAL_STORAGE_KEYS.SECTIONS, []);
  let pageSections = allSections.filter((item) => scopedId(item.birthday_page_id) === scopedPageId);
  if (pageSections.length === 0) {
    const page = (await getBirthdayPages()).find((p) => p.id === scopedPageId) || initialBirthdayPages[0];
    if (page) {
      pageSections = createDefaultSectionsForPage(page);
      setLocalStorage(LOCAL_STORAGE_KEYS.SECTIONS, [...allSections, ...pageSections]);
    }
  }
  pageSections.sort((a, b) => a.display_order - b.display_order);
  return visibleOnly ? pageSections.filter((s) => s.is_visible) : pageSections;
}

export async function saveSection(section: BirthdaySection, birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; data?: BirthdaySection; error?: string }> {
  const scopedPageId = scopedId(birthdayPageId);
  const now = new Date().toISOString();
  const normalized: BirthdaySection = {
    ...section,
    id: section.id || crypto.randomUUID(),
    birthday_page_id: scopedPageId,
    slug: slugify(section.slug || section.title),
    content: section.content || {},
    updated_at: now,
    created_at: section.created_at || now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('birthday_sections').upsert(normalized).select().single();
      if (error) throw error;
      return { success: true, data: data as BirthdaySection };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save section' };
    }
  }

  const allSections = getLocalStorage<BirthdaySection[]>(LOCAL_STORAGE_KEYS.SECTIONS, []);
  const isMatch = (item: BirthdaySection) => item.id === normalized.id && scopedId(item.birthday_page_id) === scopedPageId;
  const updated = allSections.some(isMatch)
    ? allSections.map((item) => (isMatch(item) ? normalized : item))
    : [...allSections, normalized];
  setLocalStorage(LOCAL_STORAGE_KEYS.SECTIONS, updated);
  return { success: true, data: normalized };
}

export async function saveSectionsOrder(orderedIds: string[], birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  const scopedPageId = scopedId(birthdayPageId);
  const currentSections = await getSections(scopedPageId, false);
  const updatedSections = currentSections.map((sec) => {
    const newIdx = orderedIds.indexOf(sec.id);
    return newIdx !== -1 ? { ...sec, display_order: newIdx, updated_at: new Date().toISOString() } : sec;
  });
  updatedSections.sort((a, b) => a.display_order - b.display_order);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('birthday_sections').upsert(updatedSections);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update section ordering' };
    }
  }

  const allSections = getLocalStorage<BirthdaySection[]>(LOCAL_STORAGE_KEYS.SECTIONS, []);
  const otherPageSections = allSections.filter((item) => scopedId(item.birthday_page_id) !== scopedPageId);
  setLocalStorage(LOCAL_STORAGE_KEYS.SECTIONS, [...otherPageSections, ...updatedSections]);
  return { success: true };
}

export async function toggleSectionVisibility(id: string, is_visible: boolean, birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  const scopedPageId = scopedId(birthdayPageId);
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('birthday_sections').update({ is_visible, updated_at: new Date().toISOString() }).eq('id', id).eq('birthday_page_id', scopedPageId);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update section visibility' };
    }
  }

  const allSections = getLocalStorage<BirthdaySection[]>(LOCAL_STORAGE_KEYS.SECTIONS, []);
  const updated = allSections.map((sec) => (
    sec.id === id && scopedId(sec.birthday_page_id) === scopedPageId ? { ...sec, is_visible, updated_at: new Date().toISOString() } : sec
  ));
  setLocalStorage(LOCAL_STORAGE_KEYS.SECTIONS, updated);
  return { success: true };
}

export async function deleteSection(id: string, birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; error?: string }> {
  const scopedPageId = scopedId(birthdayPageId);
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('birthday_sections').delete().eq('id', id).eq('birthday_page_id', scopedPageId);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete section' };
    }
  }

  const allSections = getLocalStorage<BirthdaySection[]>(LOCAL_STORAGE_KEYS.SECTIONS, []);
  const filtered = allSections.filter((item) => (
    item.id !== id || scopedId(item.birthday_page_id) !== scopedPageId
  ));
  setLocalStorage(LOCAL_STORAGE_KEYS.SECTIONS, filtered);
  return { success: true };
}

export async function getPublicBirthdaySite(slug: string): Promise<BirthdaySiteData | null> {
  const page = await getBirthdayPageBySlug(slug, true);
  if (!page) return null;
  const [photos, timeline, videos, wishes, letter, sections] = await Promise.all([
    getPhotos(true, page.id),
    getTimelineMemories(true, page.id),
    getVideos(true, page.id),
    getWishes(false, page.id),
    getPersonalLetter(page.id),
    getSections(page.id, true),
  ]);
  return { page, settings: settingsFromPage(page), photos, timeline, videos, wishes, letter, sections };
}

export async function uploadMediaFile(file: File, folder = 'photos', birthdayPageId = DEFAULT_PAGE_ID): Promise<{ success: boolean; url?: string; error?: string }> {
  const maxBytes = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 12 * 1024 * 1024;
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
    return { success: false, error: 'Unsupported file type.' };
  }
  if (file.size > maxBytes) {
    return { success: false, error: 'File is too large for this upload type.' };
  }
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
      const fileName = `${birthdayPageId}/${safeFolder}/${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('memories-media').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('memories-media').getPublicUrl(fileName);
      return { success: true, url: data.publicUrl };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upload file to Supabase storage' };
    }
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ success: true, url: reader.result as string });
    reader.onerror = () => resolve({ success: false, error: 'Failed to read local file' });
    reader.readAsDataURL(file);
  });
}

/**
 * Merges photos from section JSON content and relational photo memories table.
 * Guarantees that photos added in either the PHOTOS tab or Manage Sections appear on the website without duplicates.
 */
export function mergePhotoMemories(
  contentPhotos: PhotoMemory[] | any[] = [],
  sitePhotos: PhotoMemory[] = []
): PhotoMemory[] {
  const map = new Map<string, PhotoMemory>();

  // 1. Relational table items (PHOTOS tab)
  for (const photo of sitePhotos || []) {
    if (!photo || !photo.image_url) continue;
    if (photo.is_published === false) continue;
    const key = (photo.id && String(photo.id).trim()) || photo.image_url.trim();
    map.set(key, { ...photo });
  }

  // 2. Section content items (Manage Sections)
  for (const item of contentPhotos || []) {
    if (!item || !item.image_url) continue;
    if (item.is_published === false) continue;

    let existingKey: string | null = null;
    if (item.id && map.has(item.id)) {
      existingKey = item.id;
    } else {
      for (const [k, v] of map.entries()) {
        if (v.image_url.trim() === item.image_url.trim()) {
          existingKey = k;
          break;
        }
      }
    }

    if (existingKey) {
      const prev = map.get(existingKey)!;
      map.set(existingKey, {
        ...prev,
        title: item.title || prev.title || '',
        caption: item.caption || prev.caption || '',
        category: item.category || prev.category || 'Little Moments',
        date: item.date || prev.date,
        location: item.location || prev.location,
        rotation: item.rotation !== undefined ? Number(item.rotation) : prev.rotation,
        tape_style: item.tape_style || prev.tape_style,
        sort_order: item.sort_order ?? prev.sort_order ?? 0,
      });
    } else {
      const newKey = (item.id && String(item.id).trim()) || item.image_url.trim();
      map.set(newKey, {
        id: item.id || crypto.randomUUID(),
        birthday_page_id: item.birthday_page_id || '',
        title: item.title || '',
        caption: item.caption || '',
        image_url: item.image_url.trim(),
        category: item.category || 'Little Moments',
        date: item.date,
        location: item.location,
        rotation: item.rotation !== undefined ? Number(item.rotation) : 0,
        tape_style: item.tape_style || 'rose',
        sort_order: item.sort_order ?? (map.size + 1),
        is_published: true,
      });
    }
  }

  const list = Array.from(map.values());
  list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return list;
}

/**
 * Merges videos from section JSON content and relational video memories table without duplicates.
 */
export function mergeVideoMemories(
  contentVideos: VideoMemory[] | any[] = [],
  siteVideos: VideoMemory[] = []
): VideoMemory[] {
  const map = new Map<string, VideoMemory>();

  for (const vid of siteVideos || []) {
    if (!vid || !vid.video_url) continue;
    if (vid.is_published === false) continue;
    const key = (vid.id && String(vid.id).trim()) || vid.video_url.trim();
    map.set(key, { ...vid });
  }

  for (const item of contentVideos || []) {
    if (!item || !item.video_url) continue;
    if (item.is_published === false) continue;

    let existingKey: string | null = null;
    if (item.id && map.has(item.id)) {
      existingKey = item.id;
    } else {
      for (const [k, v] of map.entries()) {
        if (v.video_url.trim() === item.video_url.trim()) {
          existingKey = k;
          break;
        }
      }
    }

    if (existingKey) {
      const prev = map.get(existingKey)!;
      map.set(existingKey, {
        ...prev,
        title: item.title || prev.title || '',
        description: item.description || prev.description || '',
        thumbnail_url: item.thumbnail_url || prev.thumbnail_url,
        duration: item.duration || prev.duration,
        date: item.date || prev.date,
        sort_order: item.sort_order ?? prev.sort_order ?? 0,
      });
    } else {
      const newKey = (item.id && String(item.id).trim()) || item.video_url.trim();
      map.set(newKey, {
        id: item.id || crypto.randomUUID(),
        birthday_page_id: item.birthday_page_id || '',
        title: item.title || '',
        description: item.description || '',
        video_url: item.video_url.trim(),
        thumbnail_url: item.thumbnail_url,
        duration: item.duration,
        date: item.date,
        sort_order: item.sort_order ?? (map.size + 1),
        is_published: true,
      });
    }
  }

  const list = Array.from(map.values());
  list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return list;
}

/**
 * Merges timeline stories from section JSON content and relational memories table without duplicates.
 */
export function mergeTimelineMemories(
  contentEvents: TimelineMemory[] | any[] = [],
  siteTimeline: TimelineMemory[] = []
): TimelineMemory[] {
  const map = new Map<string, TimelineMemory>();

  for (const ev of siteTimeline || []) {
    if (!ev || !ev.title) continue;
    if (ev.is_published === false) continue;
    const key = (ev.id && String(ev.id).trim()) || `${ev.title.trim()}_${ev.date?.trim()}`;
    map.set(key, { ...ev });
  }

  for (const item of contentEvents || []) {
    if (!item || !item.title) continue;
    if (item.is_published === false) continue;

    let existingKey: string | null = null;
    if (item.id && map.has(item.id)) {
      existingKey = item.id;
    } else {
      for (const [k, v] of map.entries()) {
        if (v.title.trim() === item.title.trim() && (v.date || '') === (item.date || '')) {
          existingKey = k;
          break;
        }
      }
    }

    if (existingKey) {
      const prev = map.get(existingKey)!;
      map.set(existingKey, {
        ...prev,
        title: item.title || prev.title,
        date: item.date || prev.date,
        story: item.story || prev.story || '',
        tag: item.tag || prev.tag,
        image_url: item.image_url || prev.image_url,
        location: item.location || prev.location,
        sort_order: item.sort_order ?? prev.sort_order ?? 0,
      });
    } else {
      const newKey = (item.id && String(item.id).trim()) || `${item.title.trim()}_${item.date?.trim()}`;
      map.set(newKey, {
        id: item.id || crypto.randomUUID(),
        birthday_page_id: item.birthday_page_id || '',
        title: item.title.trim(),
        date: item.date || '',
        story: item.story || '',
        tag: item.tag,
        image_url: item.image_url,
        location: item.location,
        sort_order: item.sort_order ?? (map.size + 1),
        is_published: true,
      });
    }
  }

  const list = Array.from(map.values());
  list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return list;
}

/**
 * Merges wishes from section JSON content and relational birthday_wishes table without duplicates.
 */
export function mergeBirthdayWishes(
  contentWishes: BirthdayWish[] | any[] = [],
  siteWishes: BirthdayWish[] = []
): BirthdayWish[] {
  const map = new Map<string, BirthdayWish>();

  for (const wish of siteWishes || []) {
    if (!wish || !wish.message) continue;
    if (wish.status === 'rejected') continue;
    const key = (wish.id && String(wish.id).trim()) || `${wish.sender_name}_${wish.message.slice(0, 20)}`;
    map.set(key, { ...wish });
  }

  for (const item of contentWishes || []) {
    if (!item || !item.message) continue;
    const key = (item.id && String(item.id).trim()) || `${item.sender_name}_${item.message.slice(0, 20)}`;
    if (!map.has(key)) {
      map.set(key, {
        id: item.id || crypto.randomUUID(),
        birthday_page_id: item.birthday_page_id || '',
        sender_name: item.sender_name || 'Friend',
        relationship: item.relationship,
        message: item.message,
        photo_url: item.photo_url,
        paper_color: item.paper_color || 'cream',
        rotation: item.rotation !== undefined ? Number(item.rotation) : 0,
        status: item.status || 'approved',
        created_at: item.created_at || new Date().toISOString(),
      });
    }
  }

  return Array.from(map.values());
}
