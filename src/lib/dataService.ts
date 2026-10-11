import { supabase, isSupabaseConfigured } from './supabase';
import {
  BirthdayPage,
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
    try {
      const { data, error } = await supabase.from('birthday_pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BirthdayPage[];
    } catch (err) {
      console.warn('Supabase birthday pages fetch failed, falling back to local:', err);
    }
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
    try {
      let query = supabase.from('birthday_pages').select('*').eq('slug', normalized).limit(1);
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as BirthdayPage | null;
    } catch (err) {
      console.warn('Supabase birthday page lookup failed, falling back to local:', err);
    }
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
    ...initialBirthdayPages[0],
    id: crypto.randomUUID(),
    slug,
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
    try {
      let query = supabase.from(table).select('*').eq('birthday_page_id', birthdayPageId);
      if (options.publishedOnly) query = query.eq('is_published', true);
      if (options.includePending === false) query = query.eq('status', 'approved');
      const orderColumn = table === 'birthday_wishes' ? 'created_at' : 'sort_order';
      const { data, error } = await query.order(orderColumn, { ascending: table !== 'birthday_wishes' });
      if (error) throw error;
      return (data || []) as T[];
    } catch (err) {
      console.warn(`Supabase ${table} fetch failed, falling back to local:`, err);
    }
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
  const updated = rows.some((item) => item.id === scopedRow.id)
    ? rows.map((item) => item.id === scopedRow.id ? scopedRow : item)
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
  setLocalStorage(key, localRows(key, defaults).filter((item) => item.id !== id));
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
  setLocalStorage(LOCAL_STORAGE_KEYS.WISHES, rows.map((wish) => wish.id === id ? { ...wish, status } : wish));
  return { success: true };
}

export const deleteWish = (id: string, birthdayPageId = DEFAULT_PAGE_ID) =>
  deleteRow('birthday_wishes', LOCAL_STORAGE_KEYS.WISHES, initialWishes, id, birthdayPageId);

export async function getPersonalLetter(birthdayPageId = DEFAULT_PAGE_ID): Promise<PersonalLetter> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('personal_letter').select('*').eq('birthday_page_id', birthdayPageId).limit(1).maybeSingle();
      if (error) throw error;
      return data as PersonalLetter || { ...initialPersonalLetter, birthday_page_id: birthdayPageId };
    } catch (err) {
      console.warn('Supabase letter fetch failed, falling back to local:', err);
    }
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

export async function getPublicBirthdaySite(slug: string): Promise<BirthdaySiteData | null> {
  const page = await getBirthdayPageBySlug(slug, true);
  if (!page) return null;
  const [photos, timeline, videos, wishes, letter] = await Promise.all([
    getPhotos(true, page.id),
    getTimelineMemories(true, page.id),
    getVideos(true, page.id),
    getWishes(false, page.id),
    getPersonalLetter(page.id),
  ]);
  return { page, settings: settingsFromPage(page), photos, timeline, videos, wishes, letter };
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
