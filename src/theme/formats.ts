/**
 * Formats de date et de nombre sensibles à la langue (Intl).
 * Réexporte aussi useTranslation pour un import unique côté UI.
 */
import { useTranslation } from 'react-i18next';
import { langueCourante } from './i18n';

const locale: Record<'fr' | 'en', string> = { fr: 'fr-FR', en: 'en-US' };

export function formaterDate(iso: string, langue = langueCourante()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale[langue], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formaterDateCourte(iso: string, langue = langueCourante()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale[langue], { dateStyle: 'medium' }).format(d);
}

export function formaterNombre(n: number, langue = langueCourante()): string {
  return new Intl.NumberFormat(locale[langue]).format(n);
}

/** Hook de traduction qui se re-rend au changement de langue. */
export function useI18n() {
  const { t, i18n } = useTranslation();
  const langue = i18n.language === 'en' ? 'en' : 'fr';
  return {
    t,
    langue: langue as 'fr' | 'en',
    formaterDate: (iso: string) => formaterDate(iso, langue as 'fr' | 'en'),
    formaterDateCourte: (iso: string) => formaterDateCourte(iso, langue as 'fr' | 'en'),
    formaterNombre: (n: number) => formaterNombre(n, langue as 'fr' | 'en'),
  };
}
