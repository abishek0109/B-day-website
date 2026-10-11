import { supabase, isSupabaseConfigured } from './supabase';
import { 
  SiteSettings, 
  PhotoMemory, 
  TimelineMemory, 
  VideoMemory, 
  BirthdayWish, 
  PersonalLetter 
} from '../types/scrapbook';
import { 
  initialSiteSettings, 
  initialPhotos, 
  initialTimeline, 
  initialVideos, 
  initialWishes, 
  initialPersonalLetter 
} from '../data/initialData';

const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'scrapbook_site_settings',
  PHOTOS: 'scrapbook_photos',
  TIMELINE: 'scrapbook_timeline',
  VIDEOS: 'scrapbook_videos',
  WISHES: 'scrapbook_wishes',
  LETTER: 'scrapbook_personal_letter',
  DEMO_OWNER: 'scrapbook_demo_owner_logged_in',
};

// Helper for local storage retrieval with defaults
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

// -------------------------------------------------------------
// SITE SETTINGS
// -------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching site_settings from Supabase, falling back to local:', error.message);
      } else if (data) {
        return data as SiteSettings;
      }
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
    }
  }

  return getLocalStorage<SiteSettings>(LOCAL_STORAGE_KEYS.SETTINGS, initialSiteSettings);
}

export async function updateSiteSettings(settings: SiteSettings): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ ...settings, updated_at: new Date().toISOString() });

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update settings in Supabase';
      return { success: false, error: message };
    }
  }

  // Local fallback
  setLocalStorage(LOCAL_STORAGE_KEYS.SETTINGS, settings);
  return { success: true };
}

// -------------------------------------------------------------
// PHOTOS
// -------------------------------------------------------------
export async function getPhotos(publishedOnly = true): Promise<PhotoMemory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('photos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching photos from Supabase, falling back to local:', error.message);
      } else if (data) {
        return data as PhotoMemory[];
      }
    } catch (err) {
      console.warn('Supabase photos fetch failed:', err);
    }
  }

  const local = getLocalStorage<PhotoMemory[]>(LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos);
  return publishedOnly ? local.filter(p => p.is_published) : local;
}

export async function savePhoto(photo: PhotoMemory): Promise<{ success: boolean; data?: PhotoMemory; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .upsert(photo)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as PhotoMemory };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save photo in Supabase';
      return { success: false, error: message };
    }
  }

  // Local fallback
  const existing = getLocalStorage<PhotoMemory[]>(LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos);
  const index = existing.findIndex(p => p.id === photo.id);
  let updated: PhotoMemory[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = photo;
  } else {
    updated = [...existing, photo];
  }
  setLocalStorage(LOCAL_STORAGE_KEYS.PHOTOS, updated);
  return { success: true, data: photo };
}

export async function deletePhoto(photoId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo in Supabase';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<PhotoMemory[]>(LOCAL_STORAGE_KEYS.PHOTOS, initialPhotos);
  setLocalStorage(LOCAL_STORAGE_KEYS.PHOTOS, existing.filter(p => p.id !== photoId));
  return { success: true };
}

// -------------------------------------------------------------
// TIMELINE MEMORIES
// -------------------------------------------------------------
export async function getTimelineMemories(publishedOnly = true): Promise<TimelineMemory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('memories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching timeline from Supabase, falling back to local:', error.message);
      } else if (data && data.length > 0) {
        return data as TimelineMemory[];
      }
    } catch (err) {
      console.warn('Supabase timeline fetch failed:', err);
    }
  }

  const local = getLocalStorage<TimelineMemory[]>(LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline);
  return publishedOnly ? local.filter(m => m.is_published) : local;
}

export async function saveTimelineMemory(memory: TimelineMemory): Promise<{ success: boolean; data?: TimelineMemory; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .upsert(memory)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as TimelineMemory };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save timeline memory';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<TimelineMemory[]>(LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline);
  const index = existing.findIndex(m => m.id === memory.id);
  const updated = index >= 0
    ? existing.map(m => m.id === memory.id ? memory : m)
    : [...existing, memory];
  setLocalStorage(LOCAL_STORAGE_KEYS.TIMELINE, updated);
  return { success: true, data: memory };
}

export async function deleteTimelineMemory(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete timeline memory';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<TimelineMemory[]>(LOCAL_STORAGE_KEYS.TIMELINE, initialTimeline);
  setLocalStorage(LOCAL_STORAGE_KEYS.TIMELINE, existing.filter(m => m.id !== id));
  return { success: true };
}

// -------------------------------------------------------------
// VIDEOS
// -------------------------------------------------------------
export async function getVideos(publishedOnly = true): Promise<VideoMemory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching videos from Supabase:', error.message);
      } else if (data && data.length > 0) {
        return data as VideoMemory[];
      }
    } catch (err) {
      console.warn('Supabase videos fetch failed:', err);
    }
  }

  const local = getLocalStorage<VideoMemory[]>(LOCAL_STORAGE_KEYS.VIDEOS, initialVideos);
  return publishedOnly ? local.filter(v => v.is_published) : local;
}

export async function saveVideo(video: VideoMemory): Promise<{ success: boolean; data?: VideoMemory; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .upsert(video)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as VideoMemory };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save video';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<VideoMemory[]>(LOCAL_STORAGE_KEYS.VIDEOS, initialVideos);
  const index = existing.findIndex(v => v.id === video.id);
  const updated = index >= 0
    ? existing.map(v => v.id === video.id ? video : v)
    : [...existing, video];
  setLocalStorage(LOCAL_STORAGE_KEYS.VIDEOS, updated);
  return { success: true, data: video };
}

export async function deleteVideo(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete video';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<VideoMemory[]>(LOCAL_STORAGE_KEYS.VIDEOS, initialVideos);
  setLocalStorage(LOCAL_STORAGE_KEYS.VIDEOS, existing.filter(v => v.id !== id));
  return { success: true };
}

// -------------------------------------------------------------
// BIRTHDAY WISHES & MODERATION
// -------------------------------------------------------------
export async function getWishes(includePending = false): Promise<BirthdayWish[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('birthday_wishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includePending) {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching wishes from Supabase:', error.message);
      } else if (data && data.length > 0) {
        return data as BirthdayWish[];
      }
    } catch (err) {
      console.warn('Supabase wishes fetch failed:', err);
    }
  }

  const local = getLocalStorage<BirthdayWish[]>(LOCAL_STORAGE_KEYS.WISHES, initialWishes);
  return includePending ? local : local.filter(w => w.status === 'approved');
}

export async function submitPublicWish(wish: Omit<BirthdayWish, 'id' | 'status' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Wish submissions require the owner to configure Supabase first.' };
  }

  const newWish: BirthdayWish = {
    ...wish,
    id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    status: 'pending', // Public submissions ALWAYS require owner approval
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('birthday_wishes')
        .insert([{
          sender_name: newWish.sender_name,
          relationship: newWish.relationship,
          message: newWish.message,
          photo_url: newWish.photo_url,
          paper_color: newWish.paper_color || 'cream',
          rotation: (Math.random() * 4 - 2),
          status: 'pending', // RLS ensures public can only insert pending
        }]);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit wish';
      return { success: false, error: message };
    }
  }

  return { success: false, error: 'Wish submission failed unexpectedly.' };
}

export async function saveWish(
  wish: BirthdayWish
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('birthday_wishes')
        .upsert(wish);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update birthday wish';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<BirthdayWish[]>(LOCAL_STORAGE_KEYS.WISHES, initialWishes);
  const updated = existing.some((item) => item.id === wish.id)
    ? existing.map((item) => item.id === wish.id ? wish : item)
    : [wish, ...existing];
  setLocalStorage(LOCAL_STORAGE_KEYS.WISHES, updated);
  return { success: true };
}

export async function updateWishStatus(id: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('birthday_wishes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update wish status';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<BirthdayWish[]>(LOCAL_STORAGE_KEYS.WISHES, initialWishes);
  const updated = existing.map(w => w.id === id ? { ...w, status } : w);
  setLocalStorage(LOCAL_STORAGE_KEYS.WISHES, updated);
  return { success: true };
}

export async function deleteWish(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('birthday_wishes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete wish';
      return { success: false, error: message };
    }
  }

  const existing = getLocalStorage<BirthdayWish[]>(LOCAL_STORAGE_KEYS.WISHES, initialWishes);
  setLocalStorage(LOCAL_STORAGE_KEYS.WISHES, existing.filter(w => w.id !== id));
  return { success: true };
}

// -------------------------------------------------------------
// PERSONAL BIRTHDAY LETTER
// -------------------------------------------------------------
export async function getPersonalLetter(): Promise<PersonalLetter> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('personal_letter')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching personal letter from Supabase:', error.message);
      } else if (data) {
        return data as PersonalLetter;
      }
    } catch (err) {
      console.warn('Supabase letter fetch failed:', err);
    }
  }

  return getLocalStorage<PersonalLetter>(LOCAL_STORAGE_KEYS.LETTER, initialPersonalLetter);
}

export async function updatePersonalLetter(letter: PersonalLetter): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('personal_letter')
        .upsert({ ...letter, updated_at: new Date().toISOString() });

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update letter';
      return { success: false, error: message };
    }
  }

  setLocalStorage(LOCAL_STORAGE_KEYS.LETTER, letter);
  return { success: true };
}

// -------------------------------------------------------------
// FILE UPLOAD HANDLER
// -------------------------------------------------------------
export async function uploadMediaFile(file: File, folder = 'photos'): Promise<{ success: boolean; url?: string; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('memories-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('memories-media')
        .getPublicUrl(fileName);

      return { success: true, url: data.publicUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload file to Supabase storage';
      return { success: false, error: message };
    }
  }

  // Development Fallback: Read as Data URL so owner can test uploads locally
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read local file' });
    };
    reader.readAsDataURL(file);
  });
}
