import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinates, PrayerTimes as AdhanPrayerTimes, CalculationMethod, SunnahTimes } from "adhan";

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string;
  hijriDate: string;
  hijriMonth: string;
  hijriYear: string;
}

const LOCATION_KEY = "@prayer_location";

export interface PrayerLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_LOCATION: PrayerLocation = {
  city: "Makkah",
  country: "Saudi Arabia",
  latitude: 21.4225,
  longitude: 39.8262,
};

export async function getSavedLocation(): Promise<PrayerLocation> {
  try {
    const stored = await AsyncStorage.getItem(LOCATION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.latitude && parsed.longitude) return parsed;
      return { ...DEFAULT_LOCATION, ...parsed };
    }
  } catch {}
  return DEFAULT_LOCATION;
}

export async function saveLocation(location: PrayerLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {}
}

function formatTime24(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function toHijriDate(date: Date): { day: number; month: string; year: number } {
  const hijriMonths = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
  ];

  const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lRem = l - 10631 * n + 354;
  const j = Math.floor((10985 - lRem) / 5316) * Math.floor((50 * lRem) / 17719) +
    Math.floor(lRem / 5670) * Math.floor((43 * lRem) / 15238);
  const lFinal = lRem - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * lFinal) / 709);
  const day = lFinal - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return {
    day,
    month: hijriMonths[month - 1] || "Unknown",
    year,
  };
}

export function calculatePrayerTimes(location: PrayerLocation): PrayerTimings {
  const today = new Date();
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();

  const prayerTimes = new AdhanPrayerTimes(coordinates, today, params);

  const hijri = toHijriDate(today);

  return {
    Fajr: formatTime24(prayerTimes.fajr),
    Sunrise: formatTime24(prayerTimes.sunrise),
    Dhuhr: formatTime24(prayerTimes.dhuhr),
    Asr: formatTime24(prayerTimes.asr),
    Maghrib: formatTime24(prayerTimes.maghrib),
    Isha: formatTime24(prayerTimes.isha),
    date: today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    hijriDate: `${hijri.day} ${hijri.month} ${hijri.year}`,
    hijriMonth: hijri.month,
    hijriYear: hijri.year.toString(),
  };
}

export async function fetchPrayerTimes(
  location: PrayerLocation
): Promise<PrayerTimings> {
  return calculatePrayerTimes(location);
}

export function getNextPrayer(timings: PrayerTimings): { name: string; time: string } | null {
  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Sunrise", time: timings.Sunrise },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha },
  ];

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    const [h, m] = prayer.time.split(":").map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > nowMinutes) return prayer;
  }
  return prayers[0];
}

export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export const PRAYER_ICONS: Record<string, string> = {
  Fajr: "partly-sunny-outline",
  Sunrise: "sunny-outline",
  Dhuhr: "sunny",
  Asr: "sunny-outline",
  Maghrib: "cloudy-night-outline",
  Isha: "moon-outline",
};
