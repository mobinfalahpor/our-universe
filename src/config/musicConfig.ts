export interface MusicTrackConfig {
  id: string;
  /** نام دقیق فایل صوتی در پوشه public/audio/ (مثلاً lara-fabian-je-taime.mp3) */
  filename: string;
  /** عنوان نمایشی آهنگ (مستقل از نام فایل) */
  title: string;
  /** نام خواننده یا نوازنده */
  artist: string;
  /** مسیر تصویر کاور نسبت به پوشه public (مثلاً audio/covers/rainy-night.jpg) */
  cover: string;
  /** توضیح کوتاه اختیاری */
  description?: string;
  /** رنگ تم صفحه وینیل */
  accentColor?: string;
}

/**
 * فهرست رسمی آهنگ‌های اتاق موسیقی
 * برای افزودن آهنگ جدید:
 * ۱. فایل صوتی (MP3 / WAV / OGG) را در پوشه public/audio/ قرار دهید.
 * ۲. تصویر کاور را در پوشه public/audio/covers/ بگذارید.
 * ۳. یک مورد جدید به آرایه زیر اضافه کنید.
 */
export const MUSIC_TRACKS_CONFIG: MusicTrackConfig[] = [
  {
    id: 'rainy-night-dream',
    filename: 'rainy-night-dream.wav',
    title: 'شب بارانی کنار تو',
    artist: 'نوای جهان کوچولوی ما',
    cover: 'audio/covers/rainy-night.jpg',
    description: 'ملودی آرام و بارانی برای لحظه‌های دنج شبانه',
    accentColor: '#7771A8',
  },
  {
    id: 'moonlight-waltz',
    filename: 'moonlight-waltz.wav',
    title: 'رقص زیر نور ماه',
    artist: 'ارکستر رؤیا',
    cover: 'audio/covers/moon-waltz.jpg',
    description: 'والس ملایم زیر آسمان پرستاره',
    accentColor: '#D9A9C5',
  },
];
