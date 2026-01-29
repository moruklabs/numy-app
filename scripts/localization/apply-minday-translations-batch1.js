#!/usr/bin/env node

/**
 * Professional translations for minday app
 * Based on standard meditation/mindfulness app localizations
 */

const fs = require("fs");
const path = require("path");

const MINDAY_TRANSLATIONS_DIR = path.join(__dirname, "../../apps/minday/src/translations");

// Professional translations for each locale
const TRANSLATIONS = {
  ar: {
    common: {
      loading: "جارٍ تحميل التأملات...",
      error: "خطأ",
      retry: "إعادة المحاولة",
      cancel: "إلغاء",
      close: "إغلاق",
      settings: "الإعدادات",
      language: "اللغة",
      version: "الإصدار",
    },
    home: {
      title: "ما هي",
      subtitle: "حالتك المزاجية اليوم؟",
      all: "الكل",
      loadingError: "فشل تحميل التأملات",
    },
    settings: {
      spreadMinday: "شارك Minday",
      shareApp: "مشاركة التطبيق",
      rateUs: "قيمنا",
      writeReview: "اكتب مراجعة",
      reachUs: "اتصل بنا",
      contactSupport: "الدعم الفني",
      requestFeature: "اقتراح ميزة",
      reportBug: "الإبلاغ عن خطأ",
      legal: "القانونية",
      privacyPolicy: "سياسة الخصوصية",
      termsOfUse: "شروط الاستخدام",
      selectLanguage: "اختر اللغة",
    },
    meditation: {
      category: "الفئة",
      duration: "المدة",
      play: "تشغيل",
      pause: "إيقاف مؤقت",
      stop: "إيقاف",
    },
    categories: {
      all: "الكل",
      sleep: "النوم",
      focus: "التركيز",
      stress: "تخفيف التوتر",
      anxiety: "القلق",
      mindfulness: "اليقظة الذهنية",
      breathing: "التنفس",
      relaxation: "الاسترخاء",
    },
    notFound: {
      title: "عفواً!",
      message: "هذه الصفحة غير موجودة.",
      goHome: "العودة إلى الصفحة الرئيسية!",
    },
  },

  ca: {
    common: {
      loading: "Carregant meditacions...",
      error: "Error",
      retry: "Tornar a intentar",
      cancel: "Cancel·lar",
      close: "Tancar",
      settings: "Configuració",
      language: "Idioma",
      version: "Versió",
    },
    home: {
      title: "Quin és el teu",
      subtitle: "estat d'ànim avui?",
      all: "Tot",
      loadingError: "No s'han pogut carregar les meditacions",
    },
    settings: {
      spreadMinday: "Comparteix Minday",
      shareApp: "Compartir App",
      rateUs: "Valora'ns",
      writeReview: "Escriu una ressenya",
      reachUs: "Contacta'ns",
      contactSupport: "Suport tècnic",
      requestFeature: "Sol·licitar funció",
      reportBug: "Informar d'un error",
      legal: "Legal",
      privacyPolicy: "Política de privacitat",
      termsOfUse: "Condicions d'ús",
      selectLanguage: "Seleccionar idioma",
    },
    meditation: {
      category: "Categoria",
      duration: "Durada",
      play: "Reproduir",
      pause: "Pausa",
      stop: "Aturar",
    },
    categories: {
      all: "Tot",
      sleep: "Son",
      focus: "Concentració",
      stress: "Alleujament de l'estrès",
      anxiety: "Ansietat",
      mindfulness: "Atenció plena",
      breathing: "Respiració",
      relaxation: "Relaxació",
    },
    notFound: {
      title: "Ups!",
      message: "Aquesta pantalla no existeix.",
      goHome: "Anar a la pàgina d'inici!",
    },
  },

  cs: {
    common: {
      loading: "Načítání meditací...",
      error: "Chyba",
      retry: "Zkusit znovu",
      cancel: "Zrušit",
      close: "Zavřít",
      settings: "Nastavení",
      language: "Jazyk",
      version: "Verze",
    },
    home: {
      title: "Jaká je vaše",
      subtitle: "nálada dnes?",
      all: "Vše",
      loadingError: "Nepodařilo se načíst meditace",
    },
    settings: {
      spreadMinday: "Sdílet Minday",
      shareApp: "Sdílet aplikaci",
      rateUs: "Ohodnotit nás",
      writeReview: "Napsat recenzi",
      reachUs: "Kontaktujte nás",
      contactSupport: "Podpora",
      requestFeature: "Požádat o funkci",
      reportBug: "Nahlásit chybu",
      legal: "Právní",
      privacyPolicy: "Zásady ochrany osobních údajů",
      termsOfUse: "Podmínky použití",
      selectLanguage: "Vybrat jazyk",
    },
    meditation: {
      category: "Kategorie",
      duration: "Délka",
      play: "Přehrát",
      pause: "Pauza",
      stop: "Zastavit",
    },
    categories: {
      all: "Vše",
      sleep: "Spánek",
      focus: "Soustředění",
      stress: "Úleva od stresu",
      anxiety: "Úzkost",
      mindfulness: "Všímavost",
      breathing: "Dýchání",
      relaxation: "Relaxace",
    },
    notFound: {
      title: "Jejda!",
      message: "Tato obrazovka neexistuje.",
      goHome: "Přejít na domovskou obrazovku!",
    },
  },

  da: {
    common: {
      loading: "Indlæser meditationer...",
      error: "Fejl",
      retry: "Prøv igen",
      cancel: "Annuller",
      close: "Luk",
      settings: "Indstillinger",
      language: "Sprog",
      version: "Version",
    },
    home: {
      title: "Hvad er dit",
      subtitle: "humør i dag?",
      all: "Alle",
      loadingError: "Kunne ikke hente meditationer",
    },
    settings: {
      spreadMinday: "Del Minday",
      shareApp: "Del app",
      rateUs: "Bedøm os",
      writeReview: "Skriv en anmeldelse",
      reachUs: "Kontakt os",
      contactSupport: "Kundesupport",
      requestFeature: "Anmod om funktion",
      reportBug: "Rapporter fejl",
      legal: "Juridisk",
      privacyPolicy: "Privatlivspolitik",
      termsOfUse: "Vilkår for brug",
      selectLanguage: "Vælg sprog",
    },
    meditation: {
      category: "Kategori",
      duration: "Varighed",
      play: "Afspil",
      pause: "Pause",
      stop: "Stop",
    },
    categories: {
      all: "Alle",
      sleep: "Søvn",
      focus: "Fokus",
      stress: "Stressreduktion",
      anxiety: "Angst",
      mindfulness: "Mindfulness",
      breathing: "Vejrtrækning",
      relaxation: "Afslapning",
    },
    notFound: {
      title: "Hovsa!",
      message: "Denne skærm eksisterer ikke.",
      goHome: "Gå til startskærm!",
    },
  },

  de: {
    common: {
      loading: "Lade Meditationen...",
      error: "Fehler",
      retry: "Wiederholen",
      cancel: "Abbrechen",
      close: "Schließen",
      settings: "Einstellungen",
      language: "Sprache",
      version: "Version",
    },
    home: {
      title: "Wie ist deine",
      subtitle: "Stimmung heute?",
      all: "Alle",
      loadingError: "Meditationen konnten nicht geladen werden",
    },
    settings: {
      spreadMinday: "Minday teilen",
      shareApp: "App teilen",
      rateUs: "Bewerte uns",
      writeReview: "Bewertung schreiben",
      reachUs: "Kontaktiere uns",
      contactSupport: "Support kontaktieren",
      requestFeature: "Funktion anfragen",
      reportBug: "Fehler melden",
      legal: "Rechtliches",
      privacyPolicy: "Datenschutz",
      termsOfUse: "Nutzungsbedingungen",
      selectLanguage: "Sprache wählen",
    },
    meditation: {
      category: "Kategorie",
      duration: "Dauer",
      play: "Abspielen",
      pause: "Pause",
      stop: "Stopp",
    },
    categories: {
      all: "Alle",
      sleep: "Schlaf",
      focus: "Fokus",
      stress: "Stressabbau",
      anxiety: "Angst",
      mindfulness: "Achtsamkeit",
      breathing: "Atmung",
      relaxation: "Entspannung",
    },
    notFound: {
      title: "Hoppla!",
      message: "Dieser Bildschirm existiert nicht.",
      goHome: "Zum Startbildschirm!",
    },
  },
};

// Generate TypeScript export format
function generateTsFile(locale, translations) {
  return `export default ${JSON.stringify(translations, null, 2).replace(/"([^"]+)":/g, "$1:")};
`;
}

function applyTranslations() {
  console.log("🌍 Applying professional translations for minday app\n");

  let count = 0;
  for (const [locale, translations] of Object.entries(TRANSLATIONS)) {
    const content = generateTsFile(locale, translations);
    const filePath = path.join(MINDAY_TRANSLATIONS_DIR, `${locale}.ts`);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✅ ${locale}: ${filePath}`);
    count++;
  }

  console.log(`\n✨ Applied ${count} professional translations!\n`);
}

if (require.main === module) {
  applyTranslations();
}

module.exports = { TRANSLATIONS, generateTsFile };
