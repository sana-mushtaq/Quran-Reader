import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DhikrPhrase {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
}

export const DHIKR_PHRASES: DhikrPhrase[] = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللّٰهِ",
    transliteration: "SubhanAllah",
    translation: "Glory be to Allah",
    target: 33,
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلّٰهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise is due to Allah",
    target: 33,
  },
  {
    id: "allahuakbar",
    arabic: "اللّٰهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest",
    target: 33,
  },
  {
    id: "lailaha",
    arabic: "لَا إِلَٰهَ إِلَّا اللّٰهُ",
    transliteration: "La ilaha illallah",
    translation: "There is no god but Allah",
    target: 100,
  },
  {
    id: "astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللّٰهَ",
    transliteration: "Astaghfirullah",
    translation: "I seek forgiveness from Allah",
    target: 100,
  },
  {
    id: "subhanallahwabihamdihi",
    arabic: "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ",
    transliteration: "SubhanAllahi wa bihamdihi",
    translation: "Glory and praise be to Allah",
    target: 100,
  },
  {
    id: "lahawla",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ",
    transliteration: "La hawla wa la quwwata illa billah",
    translation: "There is no power except with Allah",
    target: 100,
  },
];

interface TasbihCounts {
  [dhikrId: string]: {
    total: number;
    daily: number;
    lastDate: string;
    sets: number;
  };
}

interface TasbihContextValue {
  currentDhikr: DhikrPhrase;
  setCurrentDhikr: (dhikr: DhikrPhrase) => void;
  count: number;
  sets: number;
  totalCount: number;
  dailyCount: number;
  increment: () => void;
  reset: () => void;
  allCounts: TasbihCounts;
}

const TasbihContext = createContext<TasbihContextValue | null>(null);
const TASBIH_KEY = "@tasbih_counts";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export function TasbihProvider({ children }: { children: ReactNode }) {
  const [currentDhikr, setCurrentDhikr] = useState<DhikrPhrase>(DHIKR_PHRASES[0]);
  const [count, setCount] = useState(0);
  const [allCounts, setAllCounts] = useState<TasbihCounts>({});

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(TASBIH_KEY);
      if (stored) {
        const parsed: TasbihCounts = JSON.parse(stored);
        const today = getTodayStr();
        for (const key of Object.keys(parsed)) {
          if (parsed[key].lastDate !== today) {
            parsed[key].daily = 0;
            parsed[key].lastDate = today;
          }
        }
        setAllCounts(parsed);
      }
    } catch {}
  };

  const saveCounts = async (counts: TasbihCounts) => {
    try {
      await AsyncStorage.setItem(TASBIH_KEY, JSON.stringify(counts));
    } catch {}
  };

  const currentCounts = allCounts[currentDhikr.id] || {
    total: 0,
    daily: 0,
    lastDate: getTodayStr(),
    sets: 0,
  };

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      const completedSet = next >= currentDhikr.target;

      setAllCounts((prevCounts) => {
        const existing = prevCounts[currentDhikr.id] || {
          total: 0,
          daily: 0,
          lastDate: getTodayStr(),
          sets: 0,
        };

        const today = getTodayStr();
        const updatedCounts = {
          ...prevCounts,
          [currentDhikr.id]: {
            total: existing.total + 1,
            daily: existing.lastDate === today ? existing.daily + 1 : 1,
            lastDate: today,
            sets: completedSet ? existing.sets + 1 : existing.sets,
          },
        };
        saveCounts(updatedCounts);
        return updatedCounts;
      });

      if (completedSet) return 0;
      return next;
    });
  }, [currentDhikr]);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  const handleSetDhikr = useCallback((dhikr: DhikrPhrase) => {
    setCurrentDhikr(dhikr);
    setCount(0);
  }, []);

  const value = useMemo(
    () => ({
      currentDhikr,
      setCurrentDhikr: handleSetDhikr,
      count,
      sets: currentCounts.sets,
      totalCount: currentCounts.total,
      dailyCount: currentCounts.daily,
      increment,
      reset,
      allCounts,
    }),
    [currentDhikr, handleSetDhikr, count, currentCounts, increment, reset, allCounts]
  );

  return <TasbihContext.Provider value={value}>{children}</TasbihContext.Provider>;
}

export function useTasbih() {
  const ctx = useContext(TasbihContext);
  if (!ctx) throw new Error("useTasbih must be used within TasbihProvider");
  return ctx;
}
