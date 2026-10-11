export interface SiteSettings {
  id?: string;
  recipient_name: string;
  sender_name: string;
  title: string;
  subtitle: string;
  hero_tagline: string;
  hero_note: string;
  hero_intro: string;
  hero_button_caption: string;
  hero_photo_url: string;
  hero_photo_caption: string;
  hero_photo_date?: string;
  intro_dedication: string;
  intro_message: string;
  intro_photo_url: string;
  intro_note: string;
  closing_message: string;
  background_audio_url: string;
  updated_at?: string;
}

export type MemoryCategory = 'All' | 'Little Moments' | 'Adventures' | 'Celebrations' | 'Everyday Chaos';

export interface PhotoMemory {
  id: string;
  birthday_page_id?: string;
  title: string;
  caption: string;
  image_url: string;
  date?: string;
  location?: string;
  category: MemoryCategory;
  rotation?: number; // e.g. -3 to 3 degrees
  tape_style?: 'sage' | 'rose' | 'cream' | 'none';
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export interface TimelineMemory {
  id: string;
  birthday_page_id?: string;
  title: string;
  date: string;
  story: string;
  location?: string;
  image_url?: string;
  tag?: string;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export interface VideoMemory {
  id: string;
  birthday_page_id?: string;
  title: string;
  description: string;
  video_url: string; // direct MP4 or embeddable URL
  thumbnail_url?: string;
  duration?: string;
  date?: string;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export interface BirthdayWish {
  id: string;
  birthday_page_id?: string;
  sender_name: string;
  relationship?: string;
  message: string;
  photo_url?: string;
  paper_color?: 'cream' | 'blush' | 'sage' | 'ivory';
  rotation?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PersonalLetter {
  id?: string;
  birthday_page_id?: string;
  greeting: string;
  paragraphs: string[];
  sign_off: string;
  sender_signature: string;
  letter_date: string;
  updated_at?: string;
}

export interface BirthdayPage {
  id: string;
  owner_id?: string;
  slug: string;
  recipient_name: string;
  sender_name?: string;
  title: string;
  subtitle: string;
  hero_tagline: string;
  hero_note: string;
  hero_intro: string;
  hero_button_caption: string;
  hero_photo_url: string;
  hero_photo_caption: string;
  hero_photo_date?: string;
  intro_dedication: string;
  intro_message: string;
  intro_photo_url: string;
  intro_note: string;
  closing_message: string;
  background_audio_url: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BirthdaySiteData {
  page: BirthdayPage;
  settings: SiteSettings;
  photos: PhotoMemory[];
  timeline: TimelineMemory[];
  videos: VideoMemory[];
  wishes: BirthdayWish[];
  letter: PersonalLetter;
}
