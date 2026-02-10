import AsyncStorage from "@react-native-async-storage/async-storage";

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

const PRAYER_CACHE_KEY = "@prayer_timings_cache";
const LOCATION_KEY = "@prayer_location";

export interface PrayerLocation {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_LOCATION: PrayerLocation = {
  city: "Makkah",
  country: "Saudi Arabia",
};

export async function getSavedLocation(): Promise<PrayerLocation> {
  try {
    const stored = await AsyncStorage.getItem(LOCATION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_LOCATION;
}

export async function saveLocation(location: PrayerLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {}
}

export async function fetchPrayerTimes(
  location: PrayerLocation
): Promise<PrayerTimings> {
  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const cacheKey = `${PRAYER_CACHE_KEY}_${location.city}_${dateStr}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  let url: string;
  if (location.latitude && location.longitude) {
    url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;
  } else {
    url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=2`;
  }

  const res = await fetch(url);
  const json = await res.json();

  if (json.code === 200) {
    const timings = json.data.timings;
    const hijri = json.data.date.hijri;
    const result: PrayerTimings = {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      date: json.data.date.readable,
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
      hijriMonth: hijri.month.en,
      hijriYear: hijri.year,
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {}

    return result;
  }
  throw new Error("Failed to fetch prayer times");
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
