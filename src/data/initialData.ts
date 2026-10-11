import { SiteSettings, PhotoMemory, TimelineMemory, VideoMemory, BirthdayWish, PersonalLetter } from '../types/scrapbook';

export const initialSiteSettings: SiteSettings = {
  recipient_name: '',
  sender_name: '',
  title: 'A Little Book of You',
  subtitle: 'For all the little moments that become our big memories.',
  hero_tagline: 'A BIRTHDAY MEMORY BOOK',
  hero_note: 'a little birthday something, just for you',
  hero_intro: 'A little corner of the internet for photographs, stories, and birthday wishes. The owner can add personal memories whenever they are ready.',
  hero_button_caption: 'Turn the page when you are ready.',
  hero_photo_url: '/demo-assets/hero-friends.jpg',
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
    image_url: '/demo-assets/hero-friends.jpg',
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
    image_url: '/demo-assets/adventure.jpg',
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
    image_url: '/demo-assets/celebration.jpg',
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
