import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

// Arabic translations
import arCommon from "../locales/ar/common.json";
import arCalculator from "../locales/ar/calculator.json";
import arSettings from "../locales/ar/settings.json";
import arHistory from "../locales/ar/history.json";
import arTabs from "../locales/ar/tabs.json";
import arErrors from "../locales/ar/errors.json";

// Catalan translations
import caCommon from "../locales/ca/common.json";
import caCalculator from "../locales/ca/calculator.json";
import caSettings from "../locales/ca/settings.json";
import caHistory from "../locales/ca/history.json";
import caTabs from "../locales/ca/tabs.json";
import caErrors from "../locales/ca/errors.json";

// Czech translations
import csCommon from "../locales/cs/common.json";
import csCalculator from "../locales/cs/calculator.json";
import csSettings from "../locales/cs/settings.json";
import csHistory from "../locales/cs/history.json";
import csTabs from "../locales/cs/tabs.json";
import csErrors from "../locales/cs/errors.json";

// Danish translations
import daCommon from "../locales/da/common.json";
import daCalculator from "../locales/da/calculator.json";
import daSettings from "../locales/da/settings.json";
import daHistory from "../locales/da/history.json";
import daTabs from "../locales/da/tabs.json";
import daErrors from "../locales/da/errors.json";

// German translations
import deCommon from "../locales/de/common.json";
import deCalculator from "../locales/de/calculator.json";
import deSettings from "../locales/de/settings.json";
import deHistory from "../locales/de/history.json";
import deTabs from "../locales/de/tabs.json";
import deErrors from "../locales/de/errors.json";

// Greek translations
import elCommon from "../locales/el/common.json";
import elCalculator from "../locales/el/calculator.json";
import elSettings from "../locales/el/settings.json";
import elHistory from "../locales/el/history.json";
import elTabs from "../locales/el/tabs.json";
import elErrors from "../locales/el/errors.json";

// English translations
import enCommon from "../locales/en/common.json";
import enCalculator from "../locales/en/calculator.json";
import enSettings from "../locales/en/settings.json";
import enHistory from "../locales/en/history.json";
import enTabs from "../locales/en/tabs.json";
import enErrors from "../locales/en/errors.json";

// Spanish translations
import esCommon from "../locales/es/common.json";
import esCalculator from "../locales/es/calculator.json";
import esSettings from "../locales/es/settings.json";
import esHistory from "../locales/es/history.json";
import esTabs from "../locales/es/tabs.json";
import esErrors from "../locales/es/errors.json";

// Finnish translations
import fiCommon from "../locales/fi/common.json";
import fiCalculator from "../locales/fi/calculator.json";
import fiSettings from "../locales/fi/settings.json";
import fiHistory from "../locales/fi/history.json";
import fiTabs from "../locales/fi/tabs.json";
import fiErrors from "../locales/fi/errors.json";

// French translations
import frCommon from "../locales/fr/common.json";
import frCalculator from "../locales/fr/calculator.json";
import frSettings from "../locales/fr/settings.json";
import frHistory from "../locales/fr/history.json";
import frTabs from "../locales/fr/tabs.json";
import frErrors from "../locales/fr/errors.json";

// Hebrew translations
import heCommon from "../locales/he/common.json";
import heCalculator from "../locales/he/calculator.json";
import heSettings from "../locales/he/settings.json";
import heHistory from "../locales/he/history.json";
import heTabs from "../locales/he/tabs.json";
import heErrors from "../locales/he/errors.json";

// Hindi translations
import hiCommon from "../locales/hi/common.json";
import hiCalculator from "../locales/hi/calculator.json";
import hiSettings from "../locales/hi/settings.json";
import hiHistory from "../locales/hi/history.json";
import hiTabs from "../locales/hi/tabs.json";
import hiErrors from "../locales/hi/errors.json";

// Croatian translations
import hrCommon from "../locales/hr/common.json";
import hrCalculator from "../locales/hr/calculator.json";
import hrSettings from "../locales/hr/settings.json";
import hrHistory from "../locales/hr/history.json";
import hrTabs from "../locales/hr/tabs.json";
import hrErrors from "../locales/hr/errors.json";

// Hungarian translations
import huCommon from "../locales/hu/common.json";
import huCalculator from "../locales/hu/calculator.json";
import huSettings from "../locales/hu/settings.json";
import huHistory from "../locales/hu/history.json";
import huTabs from "../locales/hu/tabs.json";
import huErrors from "../locales/hu/errors.json";

// Indonesian translations
import idCommon from "../locales/id/common.json";
import idCalculator from "../locales/id/calculator.json";
import idSettings from "../locales/id/settings.json";
import idHistory from "../locales/id/history.json";
import idTabs from "../locales/id/tabs.json";
import idErrors from "../locales/id/errors.json";

// Italian translations
import itCommon from "../locales/it/common.json";
import itCalculator from "../locales/it/calculator.json";
import itSettings from "../locales/it/settings.json";
import itHistory from "../locales/it/history.json";
import itTabs from "../locales/it/tabs.json";
import itErrors from "../locales/it/errors.json";

// Japanese translations
import jaCommon from "../locales/ja/common.json";
import jaCalculator from "../locales/ja/calculator.json";
import jaSettings from "../locales/ja/settings.json";
import jaHistory from "../locales/ja/history.json";
import jaTabs from "../locales/ja/tabs.json";
import jaErrors from "../locales/ja/errors.json";

// Korean translations
import koCommon from "../locales/ko/common.json";
import koCalculator from "../locales/ko/calculator.json";
import koSettings from "../locales/ko/settings.json";
import koHistory from "../locales/ko/history.json";
import koTabs from "../locales/ko/tabs.json";
import koErrors from "../locales/ko/errors.json";

// Malay translations
import msCommon from "../locales/ms/common.json";
import msCalculator from "../locales/ms/calculator.json";
import msSettings from "../locales/ms/settings.json";
import msHistory from "../locales/ms/history.json";
import msTabs from "../locales/ms/tabs.json";
import msErrors from "../locales/ms/errors.json";

// Dutch translations
import nlCommon from "../locales/nl/common.json";
import nlCalculator from "../locales/nl/calculator.json";
import nlSettings from "../locales/nl/settings.json";
import nlHistory from "../locales/nl/history.json";
import nlTabs from "../locales/nl/tabs.json";
import nlErrors from "../locales/nl/errors.json";

// Norwegian translations
import noCommon from "../locales/no/common.json";
import noCalculator from "../locales/no/calculator.json";
import noSettings from "../locales/no/settings.json";
import noHistory from "../locales/no/history.json";
import noTabs from "../locales/no/tabs.json";
import noErrors from "../locales/no/errors.json";

// Polish translations
import plCommon from "../locales/pl/common.json";
import plCalculator from "../locales/pl/calculator.json";
import plSettings from "../locales/pl/settings.json";
import plHistory from "../locales/pl/history.json";
import plTabs from "../locales/pl/tabs.json";
import plErrors from "../locales/pl/errors.json";

// Portuguese translations
import ptCommon from "../locales/pt/common.json";
import ptCalculator from "../locales/pt/calculator.json";
import ptSettings from "../locales/pt/settings.json";
import ptHistory from "../locales/pt/history.json";
import ptTabs from "../locales/pt/tabs.json";
import ptErrors from "../locales/pt/errors.json";

// Romanian translations
import roCommon from "../locales/ro/common.json";
import roCalculator from "../locales/ro/calculator.json";
import roSettings from "../locales/ro/settings.json";
import roHistory from "../locales/ro/history.json";
import roTabs from "../locales/ro/tabs.json";
import roErrors from "../locales/ro/errors.json";

// Russian translations
import ruCommon from "../locales/ru/common.json";
import ruCalculator from "../locales/ru/calculator.json";
import ruSettings from "../locales/ru/settings.json";
import ruHistory from "../locales/ru/history.json";
import ruTabs from "../locales/ru/tabs.json";
import ruErrors from "../locales/ru/errors.json";

// Slovak translations
import skCommon from "../locales/sk/common.json";
import skCalculator from "../locales/sk/calculator.json";
import skSettings from "../locales/sk/settings.json";
import skHistory from "../locales/sk/history.json";
import skTabs from "../locales/sk/tabs.json";
import skErrors from "../locales/sk/errors.json";

// Swedish translations
import svCommon from "../locales/sv/common.json";
import svCalculator from "../locales/sv/calculator.json";
import svSettings from "../locales/sv/settings.json";
import svHistory from "../locales/sv/history.json";
import svTabs from "../locales/sv/tabs.json";
import svErrors from "../locales/sv/errors.json";

// Thai translations
import thCommon from "../locales/th/common.json";
import thCalculator from "../locales/th/calculator.json";
import thSettings from "../locales/th/settings.json";
import thHistory from "../locales/th/history.json";
import thTabs from "../locales/th/tabs.json";
import thErrors from "../locales/th/errors.json";

// Turkish translations
import trCommon from "../locales/tr/common.json";
import trCalculator from "../locales/tr/calculator.json";
import trSettings from "../locales/tr/settings.json";
import trHistory from "../locales/tr/history.json";
import trTabs from "../locales/tr/tabs.json";
import trErrors from "../locales/tr/errors.json";

// Ukrainian translations
import ukCommon from "../locales/uk/common.json";
import ukCalculator from "../locales/uk/calculator.json";
import ukSettings from "../locales/uk/settings.json";
import ukHistory from "../locales/uk/history.json";
import ukTabs from "../locales/uk/tabs.json";
import ukErrors from "../locales/uk/errors.json";

// Vietnamese translations
import viCommon from "../locales/vi/common.json";
import viCalculator from "../locales/vi/calculator.json";
import viSettings from "../locales/vi/settings.json";
import viHistory from "../locales/vi/history.json";
import viTabs from "../locales/vi/tabs.json";
import viErrors from "../locales/vi/errors.json";

// Chinese Simplified translations
import zhCommon from "../locales/zh/common.json";
import zhCalculator from "../locales/zh/calculator.json";
import zhSettings from "../locales/zh/settings.json";
import zhHistory from "../locales/zh/history.json";
import zhTabs from "../locales/zh/tabs.json";
import zhErrors from "../locales/zh/errors.json";

export const defaultNS = "common";
export const supportedLanguages = [
  "ar",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "fi",
  "fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh",
] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  ar: {
    common: arCommon,
    calculator: arCalculator,
    settings: arSettings,
    history: arHistory,
    tabs: arTabs,
    errors: arErrors,
  },
  ca: {
    common: caCommon,
    calculator: caCalculator,
    settings: caSettings,
    history: caHistory,
    tabs: caTabs,
    errors: caErrors,
  },
  cs: {
    common: csCommon,
    calculator: csCalculator,
    settings: csSettings,
    history: csHistory,
    tabs: csTabs,
    errors: csErrors,
  },
  da: {
    common: daCommon,
    calculator: daCalculator,
    settings: daSettings,
    history: daHistory,
    tabs: daTabs,
    errors: daErrors,
  },
  de: {
    common: deCommon,
    calculator: deCalculator,
    settings: deSettings,
    history: deHistory,
    tabs: deTabs,
    errors: deErrors,
  },
  el: {
    common: elCommon,
    calculator: elCalculator,
    settings: elSettings,
    history: elHistory,
    tabs: elTabs,
    errors: elErrors,
  },
  en: {
    common: enCommon,
    calculator: enCalculator,
    settings: enSettings,
    history: enHistory,
    tabs: enTabs,
    errors: enErrors,
  },
  es: {
    common: esCommon,
    calculator: esCalculator,
    settings: esSettings,
    history: esHistory,
    tabs: esTabs,
    errors: esErrors,
  },
  fi: {
    common: fiCommon,
    calculator: fiCalculator,
    settings: fiSettings,
    history: fiHistory,
    tabs: fiTabs,
    errors: fiErrors,
  },
  fr: {
    common: frCommon,
    calculator: frCalculator,
    settings: frSettings,
    history: frHistory,
    tabs: frTabs,
    errors: frErrors,
  },
  he: {
    common: heCommon,
    calculator: heCalculator,
    settings: heSettings,
    history: heHistory,
    tabs: heTabs,
    errors: heErrors,
  },
  hi: {
    common: hiCommon,
    calculator: hiCalculator,
    settings: hiSettings,
    history: hiHistory,
    tabs: hiTabs,
    errors: hiErrors,
  },
  hr: {
    common: hrCommon,
    calculator: hrCalculator,
    settings: hrSettings,
    history: hrHistory,
    tabs: hrTabs,
    errors: hrErrors,
  },
  hu: {
    common: huCommon,
    calculator: huCalculator,
    settings: huSettings,
    history: huHistory,
    tabs: huTabs,
    errors: huErrors,
  },
  id: {
    common: idCommon,
    calculator: idCalculator,
    settings: idSettings,
    history: idHistory,
    tabs: idTabs,
    errors: idErrors,
  },
  it: {
    common: itCommon,
    calculator: itCalculator,
    settings: itSettings,
    history: itHistory,
    tabs: itTabs,
    errors: itErrors,
  },
  ja: {
    common: jaCommon,
    calculator: jaCalculator,
    settings: jaSettings,
    history: jaHistory,
    tabs: jaTabs,
    errors: jaErrors,
  },
  ko: {
    common: koCommon,
    calculator: koCalculator,
    settings: koSettings,
    history: koHistory,
    tabs: koTabs,
    errors: koErrors,
  },
  ms: {
    common: msCommon,
    calculator: msCalculator,
    settings: msSettings,
    history: msHistory,
    tabs: msTabs,
    errors: msErrors,
  },
  nl: {
    common: nlCommon,
    calculator: nlCalculator,
    settings: nlSettings,
    history: nlHistory,
    tabs: nlTabs,
    errors: nlErrors,
  },
  no: {
    common: noCommon,
    calculator: noCalculator,
    settings: noSettings,
    history: noHistory,
    tabs: noTabs,
    errors: noErrors,
  },
  pl: {
    common: plCommon,
    calculator: plCalculator,
    settings: plSettings,
    history: plHistory,
    tabs: plTabs,
    errors: plErrors,
  },
  pt: {
    common: ptCommon,
    calculator: ptCalculator,
    settings: ptSettings,
    history: ptHistory,
    tabs: ptTabs,
    errors: ptErrors,
  },
  ro: {
    common: roCommon,
    calculator: roCalculator,
    settings: roSettings,
    history: roHistory,
    tabs: roTabs,
    errors: roErrors,
  },
  ru: {
    common: ruCommon,
    calculator: ruCalculator,
    settings: ruSettings,
    history: ruHistory,
    tabs: ruTabs,
    errors: ruErrors,
  },
  sk: {
    common: skCommon,
    calculator: skCalculator,
    settings: skSettings,
    history: skHistory,
    tabs: skTabs,
    errors: skErrors,
  },
  sv: {
    common: svCommon,
    calculator: svCalculator,
    settings: svSettings,
    history: svHistory,
    tabs: svTabs,
    errors: svErrors,
  },
  th: {
    common: thCommon,
    calculator: thCalculator,
    settings: thSettings,
    history: thHistory,
    tabs: thTabs,
    errors: thErrors,
  },
  tr: {
    common: trCommon,
    calculator: trCalculator,
    settings: trSettings,
    history: trHistory,
    tabs: trTabs,
    errors: trErrors,
  },
  uk: {
    common: ukCommon,
    calculator: ukCalculator,
    settings: ukSettings,
    history: ukHistory,
    tabs: ukTabs,
    errors: ukErrors,
  },
  vi: {
    common: viCommon,
    calculator: viCalculator,
    settings: viSettings,
    history: viHistory,
    tabs: viTabs,
    errors: viErrors,
  },
  zh: {
    common: zhCommon,
    calculator: zhCalculator,
    settings: zhSettings,
    history: zhHistory,
    tabs: zhTabs,
    errors: zhErrors,
  },
};

const systemLocale = getLocales()[0]?.languageCode ?? "en";
const defaultLanguage = supportedLanguages.includes(systemLocale as SupportedLanguage)
  ? systemLocale
  : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: "en",
  defaultNS,
  ns: ["common", "calculator", "settings", "history", "tabs", "errors"],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

export default i18n;
