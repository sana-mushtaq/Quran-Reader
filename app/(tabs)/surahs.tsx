import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { fetchSurahs, Surah, getArabicNumber } from "@/lib/quran-api";

export default function SurahsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSurahs = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchSurahs();
      setSurahs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurahs();
  }, []);

  const filtered = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const renderSurah = ({ item }: { item: Surah }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/surah/[id]", params: { id: item.number.toString() } });
      }}
      style={({ pressed }) => [
        styles.surahItem,
        {
          backgroundColor: pressed
            ? isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)"
            : "transparent",
        },
      ]}
    >
      <View style={[styles.surahNumber, { backgroundColor: isDark ? "rgba(46,170,138,0.15)" : "rgba(13,92,77,0.08)" }]}>
        <Text style={[styles.surahNumberText, { color: theme.tint }]}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={[styles.surahName, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
          {item.englishName}
        </Text>
        <Text style={[styles.surahMeta, { color: theme.textSecondary }]}>
          {item.revelationType} - {item.numberOfAyahs} Ayahs
        </Text>
      </View>
      <View style={styles.surahRight}>
        <Text style={[styles.arabicName, { color: theme.text }]}>{item.name}</Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingTop: insets.top + webTopInset }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Could not load surahs
        </Text>
        <Pressable
          onPress={loadSurahs}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurah}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + webTopInset + 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>Surahs</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>114 Chapters of the Holy Quran</Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  surahNumberText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  surahInfo: {
    flex: 1,
    marginLeft: 14,
  },
  surahName: {
    fontSize: 16,
  },
  surahMeta: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  surahRight: {
    alignItems: "flex-end",
  },
  arabicName: {
    fontSize: 20,
    fontFamily: "Amiri_400Regular",
  },
  separator: {
    height: 1,
    marginLeft: 74,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
