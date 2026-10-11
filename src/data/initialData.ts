import { SiteSettings, PhotoMemory, TimelineMemory, VideoMemory, BirthdayWish, PersonalLetter, BirthdayPage } from '../types/scrapbook';

const demoAsset = (filename: string) => `${import.meta.env.BASE_URL}demo-assets/${filename}`;

export const initialSiteSettings: SiteSettings = {
  recipient_name: '',
  sender_name: '',
  title: 'A Little Book of You',
  subtitle: 'For all the little moments that become our big memories.',
  hero_tagline: 'A BIRTHDAY MEMORY BOOK',
  hero_note: 'a little birthday something, just for you',
  hero_intro: 'A little corner of the internet for photographs, stories, and birthday wishes. The owner can add personal memories whenever they are ready.',
  hero_button_caption: 'Turn the page when you are ready.',
  hero_photo_url: demoAsset('hero-friends.jpg'),
  hero_photo_caption: 'Sample photo — replace with your own',
  hero_photo_date: '',
  intro_dedication: '',
  intro_message: '',
  intro_photo_url: '',
  intro_note: '',
  closing_message: 'Here’s to the memories still waiting to be made.',
  background_audio_url: '',
};

export const initialPhotos: PhotoMemory[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Sample photo',
    caption: 'Replace this sample image before sharing your book.',
    image_url: demoAsset('hero-friends.jpg'),
    category: 'Little Moments',
    rotation: -2.5,
    tape_style: 'rose',
    sort_order: 0,
    is_published: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Sample photo',
    caption: 'Replace this sample image before sharing your book.',
    image_url: demoAsset('adventure.jpg'),
    category: 'Adventures',
    rotation: 1.8,
    tape_style: 'sage',
    sort_order: 1,
    is_published: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    title: 'Sample photo',
    caption: 'Replace this sample image before sharing your book.',
    image_url: demoAsset('celebration.jpg'),
    category: 'Celebrations',
    rotation: -1.2,
    tape_style: 'cream',
    sort_order: 2,
    is_published: true,
  },
];

export const initialTimeline: TimelineMemory[] = [];

export const initialVideos: VideoMemory[] = [];

export const initialWishes: BirthdayWish[] = [];

export const initialPersonalLetter: PersonalLetter = {
  greeting: '',
  paragraphs: [],
  sign_off: '',
  sender_signature: '',
  letter_date: '',
};

export const initialBirthdayPages: BirthdayPage[] = [
  {
    id: 'birthday-ananya',
    slug: 'ananya',
    recipient_name: 'Ananya',
    sender_name: 'Your people',
    title: 'A Little Book of You',
    subtitle: 'For all the little moments that became our big memories.',
    hero_tagline: 'A BIRTHDAY MEMORY BOOK',
    hero_note: 'a little birthday something, just for you',
    hero_intro: 'A little corner of the internet for photographs, stories, and birthday wishes. This page is ready for a personal birthday story, memories, and messages from the people who love you.',
    hero_button_caption: 'Turn the page when you are ready.',
    hero_photo_url: demoAsset('hero-friends.jpg'),
    hero_photo_caption: 'Sample birthday page — replace with a real photo.',
    hero_photo_date: '',
    intro_dedication: 'For Ananya',
    intro_message: 'You make ordinary days feel extra special, and every memory with you feels brighter and warmer.',
    intro_photo_url: '',
    intro_note: 'A few pages, a thousand reasons we are so glad it is you.',
    closing_message: 'Here’s to more laughter, more memories, and more reasons to celebrate you.',
    background_audio_url: '',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
