export function normalizePersianText(input: string): string {
  return input
    .trim()
    // Normalize Arabic Yeh & Kaf to Persian
    .replace(/\u064A/g, '\u06CC') // ي -> ی
    .replace(/\u0649/g, '\u06CC') // ى -> ی
    .replace(/\u0626/g, '\u06CC') // ئ -> ی
    .replace(/\u0643/g, '\u06A9') // ك -> ک
    // Normalize Alef variants
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    // Normalize Teh Marbuta -> Heh
    .replace(/\u0629/g, '\u0647')
    // Remove Arabic diacritics / tashkeel & tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Remove all whitespace, ZWNJ (\u200C), ZWJ (\u200D), and punctuation
    .replace(/[\s\u200C\u200D\u00A0.,!?؟،؛:"'()\-_✨♥❤️💜🌟]/g, '');
}

export function isInfinityAnswer(input: string): boolean {
  const normalized = normalizePersianText(input);
  return normalized === 'بینهایت';
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function formatPersianDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return 'امروز';
  }
}
