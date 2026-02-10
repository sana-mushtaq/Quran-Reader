import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  useColorScheme,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { DUAS, DUA_CATEGORIES, Dua } from "@/lib/dua-data";

function DuaDetailModal({ dua, visible, onClose, theme, isDark }: {
  dua: Dua | null;
  visible: boolean;
  onClose: () => void;
  theme: typeof Colors.light;
  isDark: boolean;
}) {
  if (!dua) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              {dua.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? "rgba(46,170,138,0.15)" : "rgba(13,92,77,0.08)" }]}>
              <Text style={[styles.categoryBadgeText, { color: theme.tint }]}>{dua.category}</Text>
            </View>

            <LinearGradient
              colors={isDark ? ["#0F2B23", "#1A4035"] : ["#0D5C4D", "#147A64"]}
              style={styles.arabicContainer}
            >
              <Text style={styles.duaArabicFull}>{dua.arabic}</Text>
            </LinearGradient>

            <Text style={[styles.transliterationFull, { color: theme.text }]}>
              {dua.transliteration}
            </Text>

            <View style={[styles.translationBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.translationLabel, { color: theme.textSecondary }]}>Translation</Text>
              <Text style={[styles.translationFull, { color: theme.text }]}>{dua.translation}</Text>
            </View>

            <Text style={[styles.reference, { color: theme.textSecondary }]}>
              Reference: {dua.reference}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function DuaScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);

  const filteredDuas = selectedCategory
    ? DUAS.filter((d) => d.category === selectedCategory)
    : DUAS;

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const renderDua = useCallback(({ item }: { item: Dua }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDua(item);
      }}
      style={({ pressed }) => [
        styles.duaCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.duaCardHeader}>
        <View style={[styles.duaNumBadge, { backgroundColor: isDark ? "rgba(46,170,138,0.15)" : "rgba(13,92,77,0.08)" }]}>
          <Text style={[styles.duaNumText, { color: theme.tint }]}>{item.id}</Text>
        </View>
        <View style={styles.duaCardInfo}>
          <Text style={[styles.duaTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.duaCategory, { color: theme.textSecondary }]}>{item.category}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </View>
      <Text style={[styles.duaArabicPreview, { color: theme.arabicText }]} numberOfLines={1}>
        {item.arabic}
      </Text>
      <Text style={[styles.duaTranslationPreview, { color: theme.translationText }]} numberOfLines={2}>
        {item.translation}
      </Text>
    </Pressable>
  ), [theme, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredDuas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDua}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: insets.top + webTopInset + 16,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
              Duas
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {filteredDuas.length} supplications
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: !selectedCategory
                      ? theme.tint
                      : theme.card,
                    borderColor: !selectedCategory ? theme.tint : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: !selectedCategory ? "#fff" : theme.textSecondary },
                  ]}
                >
                  All
                </Text>
              </Pressable>
              {DUA_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat === selectedCategory ? null : cat);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === cat
                        ? theme.tint
                        : theme.card,
                      borderColor: selectedCategory === cat ? theme.tint : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === cat ? "#fff" : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      <DuaDetailModal
        dua={selectedDua}
        visible={!!selectedDua}
        onClose={() => setSelectedDua(null)}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: { paddingHorizontal: 4, paddingBottom: 16 },
  headerTitle: { fontSize: 28, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontFamily: "Inter_400Regular" },
  categoryScroll: { marginTop: 14, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  duaCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  duaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  duaNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  duaNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  duaCardInfo: { flex: 1, marginLeft: 12 },
  duaTitle: { fontSize: 15 },
  duaCategory: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  duaArabicPreview: {
    fontSize: 20,
    fontFamily: "Amiri_400Regular",
    textAlign: "right",
    marginBottom: 8,
  },
  duaTranslationPreview: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingTop: 16 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 20, flex: 1, marginRight: 12 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  categoryBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  arabicContainer: { borderRadius: 16, padding: 24, marginBottom: 20 },
  duaArabicFull: {
    fontSize: 26,
    lineHeight: 48,
    textAlign: "right",
    color: "#fff",
    fontFamily: "Amiri_400Regular",
  },
  transliterationFull: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    fontStyle: "italic" as const,
    marginBottom: 16,
  },
  translationBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  translationLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  translationFull: { fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" },
  reference: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
