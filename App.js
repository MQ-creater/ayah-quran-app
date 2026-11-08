import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, Pressable } from "react-native";

const GOLD = "#D9B96E";
const NAVY = "#101C2D";
const PANEL = "#1B2A40";
const MUTED = "#AAB6C7";

function ActionTile({ icon, title, subtitle }) {
  return (
    <Pressable style={styles.actionTile} accessibilityRole="button">
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ASSALAMU ALAIKUM</Text>
            <Text style={styles.heading}>Your Qur’an journey</Text>
          </View>
          <View style={styles.logo}>
            <Text style={styles.logoArabic}>آيَة</Text>
          </View>
        </View>

        <View style={styles.dailyCard}>
          <Text style={styles.cardEyebrow}>TODAY’S AYAH</Text>
          <Text style={styles.arabic} writingDirection="rtl">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </Text>
          <Text style={styles.translation}>“My Lord, increase me in knowledge.”</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.reference}>Surah Taha · 20:114</Text>
            <Text style={styles.goldText}>Read ayah  ↗</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your progress</Text>
          <Text style={styles.goldText}>View all</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Memorization journey</Text>
            <Text style={styles.progressPercent}>0%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressHint}>Your progress will appear here as you memorize.</Text>
        </View>

        <Text style={[styles.sectionTitle, styles.quickTitle]}>Continue learning</Text>
        <View style={styles.actionGrid}>
          <ActionTile icon="۞" title="Memorize" subtitle="Learn new ayahs" />
          <ActionTile icon="↻" title="Review" subtitle="Strengthen recall" />
          <ActionTile icon="♫" title="Listen" subtitle="Choose a reciter" />
          <ActionTile icon="▤" title="My plan" subtitle="Build a routine" />
        </View>

        <View style={styles.bottomNav}>
          <Text style={styles.navActive}>⌂\nHome</Text>
          <Text style={styles.navItem}>۞\nMemorize</Text>
          <Text style={styles.navItem}>↻\nReview</Text>
          <Text style={styles.navItem}>◉\nProfile</Text>
        </View>
        <Text style={styles.footer}>AYAH · A GENTLE STEP EVERY DAY</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NAVY },
  container: { padding: 22, paddingBottom: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 26 },
  eyebrow: { color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 8 },
  heading: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  logo: { width: 54, height: 54, borderRadius: 18, backgroundColor: PANEL, borderWidth: 1, borderColor: "#53617A", alignItems: "center", justifyContent: "center" },
  logoArabic: { color: GOLD, fontSize: 24, fontWeight: "700" },
  dailyCard: { backgroundColor: PANEL, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "#34445B", marginBottom: 28 },
  cardEyebrow: { color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: "700", textAlign: "center" },
  arabic: { color: "#FFFFFF", fontSize: 29, lineHeight: 56, textAlign: "center", marginTop: 20, marginBottom: 12 },
  translation: { color: "#E1E6ED", fontSize: 15, textAlign: "center", lineHeight: 23 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#3A4960", marginTop: 22, paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reference: { color: MUTED, fontSize: 12 },
  goldText: { color: GOLD, fontSize: 12, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  progressCard: { backgroundColor: PANEL, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#34445B" },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  progressLabel: { color: "#E1E6ED", fontSize: 13 },
  progressPercent: { color: GOLD, fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 7, backgroundColor: "#34445B", borderRadius: 8, overflow: "hidden" },
  progressFill: { width: "0%", height: "100%", backgroundColor: GOLD },
  progressHint: { color: MUTED, fontSize: 11, marginTop: 12, lineHeight: 17 },
  quickTitle: { marginTop: 28, marginBottom: 14 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionTile: { width: "48%", backgroundColor: PANEL, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#34445B", minHeight: 128 },
  actionIcon: { color: GOLD, fontSize: 24, marginBottom: 12 },
  actionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 5 },
  actionSubtitle: { color: MUTED, fontSize: 11 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: "#34445B", marginTop: 18, paddingTop: 16 },
  navActive: { color: GOLD, textAlign: "center", fontSize: 11, lineHeight: 19, fontWeight: "700" },
  navItem: { color: MUTED, textAlign: "center", fontSize: 11, lineHeight: 19 },
  footer: { color: "#75849A", fontSize: 9, letterSpacing: 1.5, textAlign: "center", marginTop: 24 }
});
