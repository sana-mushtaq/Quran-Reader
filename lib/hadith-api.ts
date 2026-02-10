import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Hadith {
  id: number;
  collection: string;
  bookNumber: string;
  hadithNumber: string;
  arabic: string;
  english: string;
  narrator: string;
}

const HADITH_FAVORITES_KEY = "@hadith_favorites";

export const HADITH_COLLECTIONS = [
  { id: "bukhari", name: "Sahih Bukhari", arabic: "صحيح البخاري", count: 7563 },
  { id: "muslim", name: "Sahih Muslim", arabic: "صحيح مسلم", count: 5362 },
  { id: "abudawud", name: "Sunan Abu Dawud", arabic: "سنن أبي داود", count: 5274 },
  { id: "tirmidhi", name: "Jami at-Tirmidhi", arabic: "جامع الترمذي", count: 3956 },
  { id: "nasai", name: "Sunan an-Nasai", arabic: "سنن النسائي", count: 5758 },
  { id: "ibnmajah", name: "Sunan Ibn Majah", arabic: "سنن ابن ماجه", count: 4341 },
];

const CURATED_HADITHS: Hadith[] = [
  {
    id: 1,
    collection: "Sahih Bukhari",
    bookNumber: "1",
    hadithNumber: "1",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english: "The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.",
    narrator: "Umar ibn al-Khattab",
  },
  {
    id: 2,
    collection: "Sahih Bukhari",
    bookNumber: "2",
    hadithNumber: "13",
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english: "None of you truly believes until he loves for his brother what he loves for himself.",
    narrator: "Anas ibn Malik",
  },
  {
    id: 3,
    collection: "Sahih Muslim",
    bookNumber: "1",
    hadithNumber: "72",
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    english: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    narrator: "Abu Hurairah",
  },
  {
    id: 4,
    collection: "Sahih Bukhari",
    bookNumber: "73",
    hadithNumber: "56",
    arabic: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ",
    english: "The strong man is not the one who can overpower others. Rather, the strong man is the one who controls himself when he gets angry.",
    narrator: "Abu Hurairah",
  },
  {
    id: 5,
    collection: "Sahih Muslim",
    bookNumber: "32",
    hadithNumber: "6225",
    arabic: "لَا تَحَاسَدُوا وَلَا تَنَاجَشُوا وَلَا تَبَاغَضُوا وَلَا تَدَابَرُوا وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا",
    english: "Do not envy one another, do not inflate prices for one another, do not hate one another, do not turn away from one another, but rather be servants of Allah as brothers.",
    narrator: "Abu Hurairah",
  },
  {
    id: 6,
    collection: "Sahih Bukhari",
    bookNumber: "2",
    hadithNumber: "9",
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    english: "A Muslim is the one from whose tongue and hands the Muslims are safe.",
    narrator: "Abdullah ibn Amr",
  },
  {
    id: 7,
    collection: "Jami at-Tirmidhi",
    bookNumber: "27",
    hadithNumber: "2004",
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
    english: "Fear Allah wherever you are, follow a bad deed with a good deed and it will erase it, and behave well towards people.",
    narrator: "Abu Dharr and Mu'adh ibn Jabal",
  },
  {
    id: 8,
    collection: "Sahih Muslim",
    bookNumber: "45",
    hadithNumber: "2586",
    arabic: "لَا يَرْحَمُ اللَّهُ مَنْ لَا يَرْحَمُ النَّاسَ",
    english: "Allah will not show mercy to the one who does not show mercy to people.",
    narrator: "Jarir ibn Abdullah",
  },
  {
    id: 9,
    collection: "Sahih Bukhari",
    bookNumber: "10",
    hadithNumber: "504",
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    english: "The best among you are those who learn the Quran and teach it.",
    narrator: "Uthman ibn Affan",
  },
  {
    id: 10,
    collection: "Sahih Muslim",
    bookNumber: "1",
    hadithNumber: "45",
    arabic: "مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ وَذَلِكَ أَضْعَفُ الْإِيمَانِ",
    english: "Whoever among you sees evil, let him change it with his hand. If he cannot do so, then with his tongue. If he cannot do so, then with his heart, and that is the weakest level of faith.",
    narrator: "Abu Sa'id al-Khudri",
  },
  {
    id: 11,
    collection: "Sahih Bukhari",
    bookNumber: "78",
    hadithNumber: "6018",
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ضَيْفَهُ",
    english: "Whoever believes in Allah and the Last Day, let him honor his guest.",
    narrator: "Abu Hurairah",
  },
  {
    id: 12,
    collection: "Jami at-Tirmidhi",
    bookNumber: "36",
    hadithNumber: "2516",
    arabic: "احْفَظِ اللَّهَ يَحْفَظْكَ احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ",
    english: "Be mindful of Allah, and Allah will protect you. Be mindful of Allah, and you will find Him in front of you.",
    narrator: "Abdullah ibn Abbas",
  },
  {
    id: 13,
    collection: "Sahih Bukhari",
    bookNumber: "52",
    hadithNumber: "2",
    arabic: "إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ",
    english: "That which is lawful is clear and that which is unlawful is clear, and between the two are doubtful matters about which many people do not know.",
    narrator: "An-Nu'man ibn Bashir",
  },
  {
    id: 14,
    collection: "Sahih Muslim",
    bookNumber: "36",
    hadithNumber: "2699",
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    english: "Whoever takes a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.",
    narrator: "Abu Hurairah",
  },
  {
    id: 15,
    collection: "Sahih Bukhari",
    bookNumber: "24",
    hadithNumber: "1443",
    arabic: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ",
    english: "Charity does not decrease wealth.",
    narrator: "Abu Hurairah",
  },
  {
    id: 16,
    collection: "Sunan Abu Dawud",
    bookNumber: "40",
    hadithNumber: "4800",
    arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    english: "Your smile in the face of your brother is a charity.",
    narrator: "Abu Dharr",
  },
  {
    id: 17,
    collection: "Sahih Muslim",
    bookNumber: "48",
    hadithNumber: "2664",
    arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ",
    english: "How wonderful is the affair of the believer, for his affairs are all good.",
    narrator: "Suhaib ar-Rumi",
  },
  {
    id: 18,
    collection: "Sahih Bukhari",
    bookNumber: "56",
    hadithNumber: "2893",
    arabic: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
    english: "This world is a prison for the believer and a paradise for the disbeliever.",
    narrator: "Abu Hurairah",
  },
  {
    id: 19,
    collection: "Jami at-Tirmidhi",
    bookNumber: "37",
    hadithNumber: "2687",
    arabic: "الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ",
    english: "The one who guides to good is like the one who does it.",
    narrator: "Abu Mas'ud al-Ansari",
  },
  {
    id: 20,
    collection: "Sahih Muslim",
    bookNumber: "35",
    hadithNumber: "2588",
    arabic: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
    english: "Verily Allah does not look at your faces and your wealth but He looks at your hearts and your deeds.",
    narrator: "Abu Hurairah",
  },
];

export function getDailyHadith(): Hadith {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % CURATED_HADITHS.length;
  return CURATED_HADITHS[index];
}

export function getRandomHadith(): Hadith {
  const index = Math.floor(Math.random() * CURATED_HADITHS.length);
  return CURATED_HADITHS[index];
}

export function getAllHadiths(): Hadith[] {
  return CURATED_HADITHS;
}

export async function getHadithFavorites(): Promise<number[]> {
  try {
    const stored = await AsyncStorage.getItem(HADITH_FAVORITES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function toggleHadithFavorite(id: number): Promise<number[]> {
  const favorites = await getHadithFavorites();
  const exists = favorites.includes(id);
  const updated = exists ? favorites.filter((f) => f !== id) : [...favorites, id];
  try {
    await AsyncStorage.setItem(HADITH_FAVORITES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}
