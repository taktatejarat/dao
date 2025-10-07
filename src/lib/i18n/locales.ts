
import type { Locale } from '@/context/LanguageProvider';
import { fa } from './fa';
import { ar } from './ar';
import { en } from './en';
import { ru } from './ru';
import { de } from './de';
import { tr } from './tr';

export const translations: Record<Locale, typeof en> = {
  fa,
  ar,
  en,
  ru,
  de,
  tr,
};
