/**
 * Internationalisation fr/en (§ Lot 3) : bascule à chaud, persistance,
 * langue système par défaut. Les formats de date/nombre suivent la langue.
 */
/* eslint-disable import/no-named-as-default-member -- i18n est l'instance i18next, .use/.changeLanguage attendus */
import { ecrireJson, lireJson } from '@/services/stockage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import fr from './locales/fr';

export type Langue = 'fr' | 'en';
const CLE_LANGUE = 'booklist.langue';

function langueSysteme(): Langue {
  const code = getLocales()[0]?.languageCode;
  return code === 'en' ? 'en' : 'fr';
}

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: langueSysteme(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Restaure la langue mémorisée au démarrage (après l'init synchrone ci-dessus). */
export async function restaurerLangue(): Promise<void> {
  const stockee = await lireJson<Langue>(CLE_LANGUE);
  if (stockee && stockee !== i18n.language) await i18n.changeLanguage(stockee);
}

export async function changerLangue(langue: Langue): Promise<void> {
  await i18n.changeLanguage(langue);
  await ecrireJson(CLE_LANGUE, langue);
}

export function langueCourante(): Langue {
  return i18n.language === 'en' ? 'en' : 'fr';
}

export default i18n;
