import React, { useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, Pressable
} from "react-native";

const GOLD = "#D9B96E";
const NAVY = "#101C2D";
const PANEL = "#1B2A40";
const MUTED = "#AAB6C7";
const AYAH = {
  arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  translation: "All praise is for Allah—Lord of all worlds.",
  reference: "Surah Al-Fatihah · 1:2"
};

function Button({ title, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </Pressable>
  );
}

function Header({ eyebrow, title }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
    </View>
  );
}

function HomeScreen({ practicedCount, onNavigate }) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ASSALAMU ALAIKUM</Text>
          <Text style={styles.heading}>Your Qur’an journey</Text>
        </View>
        <View style={styles.logo}><Text style={styles.logoArabic}>آيَة</Text></View>
      </View>

      <View style={styles.dailyCard}>
        <Text style={styles.cardEyebrow}>A VERSE TO REFLECT ON</Text>
        <Text style={styles.arabic} writingDirection="rtl">وَقُل رَّبِّ زِدْنِي عِلْمًا</Text>
        <Text style={styles.translation}>“My Lord, increase me in knowledge.”</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.reference}>Surah Taha · 20:114</Text>
          <Text style={styles.goldText}>Daily ayah</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your progress</Text>
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Practice sessions completed</Text>
          <Text style={styles.progressPercent}>{practicedCount}</Text>
        </View>
        <Text style={styles.progressHint}>
          This count is saved while the app is open. Long-term progress saving will be added later.
        </Text>
        <Button title="Start memorizing" onPress={() => onNavigate("memorize")} />
      </View>

      <Text style={[styles.sectionTitle, styles.quickTitle]}>Your tools</Text>
      <View style={styles.actionGrid}>
        <ActionTile icon="۞" title="Memorize" subtitle="Learn step by step" onPress={() => onNavigate("memorize")} />
        <ActionTile icon="↻" title="Review" subtitle="Revisit an ayah" onPress={() => onNavigate("review")} />
        <ActionTile icon="♫" title="Listen" subtitle="Audio options" onPress={() => onNavigate("listen")} />
        <ActionTile icon="▤" title="My plan" subtitle="Build a routine" onPress={() => onNavigate("plan")} />
      </View>
    </>
  );
}

function ActionTile({ icon, title, subtitle, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function MemorizeScreen({ onPracticed }) {
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  return (
    <>
      <Header eyebrow="MEMORIZATION" title="Learn one ayah" />
      <View style={styles.lessonCard}>
        <Text style={styles.cardEyebrow}>YOUR PRACTICE AYAH</Text>
        <Text style={styles.arabic} writingDirection="rtl">{AYAH.arabic}</Text>
        {revealed ? (
          <>
            <Text style={styles.translation}>{AYAH.translation}</Text>
            <Text style={styles.reference}>{AYAH.reference}</Text>
          </>
        ) : (
          <Text style={styles.hiddenHint}>Try reciting from memory, then reveal the meaning.</Text>
        )}
      </View>
      <Button title={revealed ? "Hide meaning" : "Reveal meaning"} secondary onPress={() => setRevealed(!revealed)} />
      <View style={styles.spacer} />
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>A simple practice method</Text>
        <Text style={styles.stepText}>1. Read the ayah slowly while looking at the text.</Text>
        <Text style={styles.stepText}>2. Listen to a trusted recitation and follow along.</Text>
        <Text style={styles.stepText}>3. Cover the text and try to recite it from memory.</Text>
        <Text style={styles.stepText}>4. Check carefully and repeat calmly.</Text>
      </View>
      <Button
        title={completed ? "Practice recorded" : "I practiced this ayah"}
        onPress={() => { if (!completed) { setCompleted(true); onPracticed(); } }}
        disabled={completed}
      />
      {completed && <Text style={styles.successText}>Nice work. Your session count has been updated for this app session.</Text>}
    </>
  );
}

function ReviewScreen() {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <>
      <Header eyebrow="REVIEW" title="Strengthen your recall" />
      <View style={styles.infoCard}>
        <Text style={styles.cardEyebrow}>REVIEW CARD · 1</Text>
        <Text style={styles.arabic} writingDirection="rtl">{AYAH.arabic}</Text>
        {showAnswer && <Text style={styles.translation}>{AYAH.translation}</Text>}
        <Text style={styles.reference}>{AYAH.reference}</Text>
        <Button title={showAnswer ? "Hide translation" : "Show translation"} secondary onPress={() => setShowAnswer(!showAnswer)} />
      </View>
      <Text style={styles.progressHint}>Review cards are a starter feature. A personal review schedule and saved memorized ayahs are coming later.</Text>
    </>
  );
}

function ListenScreen() {
  const [selected, setSelected] = useState("Choose a reciter");
  return (
    <>
      <Header eyebrow="AUDIO" title="Listen and follow" />
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Reciter selection</Text>
        <Text style={styles.progressHint}>Choose a reciter preference for a future audio player.</Text>
        {["Mishary Rashid Alafasy", "Abdul Basit", "Maher Al-Muaiqly"].map(name => (
          <Pressable key={name} onPress={() => setSelected(name)} style={[styles.choice, selected === name && styles.choiceSelected]}>
            <Text style={[styles.choiceText, selected === name && styles.choiceTextSelected]}>{name}</Text>
            <Text style={styles.choiceMark}>{selected === name ? "✓" : "○"}</Text>
          </Pressable>
        ))}
        <Text style={styles.progressHint}>Selected: {selected}</Text>
      </View>
      <Text style={styles.progressHint}>Audio playback is not connected yet. I’ll add it after we choose a verified Qur’an audio source.</Text>
    </>
  );
}

function PlanScreen() {
  const [target, setTarget] = useState("1 ayah");
  return (
    <>
      <Header eyebrow="YOUR ROUTINE" title="A steady daily plan" />
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Choose a gentle daily target</Text>
        {["1 ayah", "3 ayahs", "5 ayahs"].map(value => (
          <Pressable key={value} onPress={() => setTarget(value)} style={[styles.choice, target === value && styles.choiceSelected]}>
            <Text style={[styles.choiceText, target === value && styles.choiceTextSelected]}>{value}</Text>
            <Text style={styles.choiceMark}>{target === value ? "✓" : "○"}</Text>
          </Pressable>
        ))}
        <Text style={styles.progressHint}>Current target: {target}. You can change it whenever you need.</Text>
      </View>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [practicedCount, setPracticedCount] = useState(0);
  const screen = useMemo(() => {
    switch (tab) {
      case "memorize": return <MemorizeScreen onPracticed={() => setPracticedCount(n => n + 1)} />;
      case "review": return <ReviewScreen />;
      case "listen": return <ListenScreen />;
      case "plan": return <PlanScreen />;
      default: return <HomeScreen practicedCount={practicedCount} onNavigate={setTab} />;
    }
  }, [tab, practicedCount]);

  const tabs = [
    ["home", "⌂", "Home"],
    ["memorize", "۞", "Learn"],
    ["review", "↻", "Review"],
    ["plan", "▤", "Plan"]
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.container}>{screen}</ScrollView>
        <View style={styles.bottomNav}>
          {tabs.map(([key, icon, label]) => (
            <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={styles.navButton}>
              <Text style={[styles.navIcon, tab === key && styles.navSelected]}>{icon}</Text>
              <Text style={[styles.navLabel, tab === key && styles.navSelected]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NAVY },
  appShell: { flex: 1 },
  container: { padding: 22, paddingBottom: 24, flexGrow: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 26 },
  eyebrow: { color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 8 },
  heading: { color: "#FFFFFF", fontSize: 23, fontWeight: "700" },
  logo: { width: 54, height: 54, borderRadius: 18, backgroundColor: PANEL, borderWidth: 1, borderColor: "#53617A", alignItems: "center", justifyContent: "center" },
  logoArabic: { color: GOLD, fontSize: 24, fontWeight: "700" },
  pageHeader: { marginTop: 18, marginBottom: 24 },
  pageTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "700" },
  dailyCard: { backgroundColor: PANEL, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "#34445B", marginBottom: 25 },
  lessonCard: { backgroundColor: PANEL, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "#34445B", marginBottom: 16 },
  cardEyebrow: { color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: "700", textAlign: "center" },
  arabic: { color: "#FFFFFF", fontSize: 28, lineHeight: 56, textAlign: "center", marginTop: 18, marginBottom: 12 },
  translation: { color: "#E1E6ED", fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 8 },
  hiddenHint: { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 21, marginTop: 8 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#3A4960", marginTop: 20, paddingTop: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reference: { color: MUTED, fontSize: 12, textAlign: "center", marginTop: 8 },
  goldText: { color: GOLD, fontSize: 12, fontWeight: "700" },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 13 },
  progressCard: { backgroundColor: PANEL, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#34445B" },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: "#E1E6ED", fontSize: 13 },
  progressPercent: { color: GOLD, fontSize: 17, fontWeight: "700" },
  progressHint: { color: MUTED, fontSize: 12, marginTop: 12, lineHeight: 19 },
  button: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", marginTop: 15 },
  buttonSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: GOLD },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: NAVY, fontWeight: "700", fontSize: 14 },
  buttonTextSecondary: { color: GOLD },
  pressed: { opacity: 0.75 },
  quickTitle: { marginTop: 28 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionTile: { width: "48%", backgroundColor: PANEL, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#34445B", minHeight: 126 },
  actionIcon: { color: GOLD, fontSize: 24, marginBottom: 12 },
  actionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 5 },
  actionSubtitle: { color: MUTED, fontSize: 11 },
  infoCard: { backgroundColor: PANEL, borderRadius: 20, padding: 19, borderWidth: 1, borderColor: "#34445B", marginBottom: 17 },
  stepText: { color: "#E1E6ED", fontSize: 13, lineHeight: 21, marginBottom: 10 },
  spacer: { height: 10 },
  successText: { color: GOLD, fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 18 },
  choice: { backgroundColor: "#24354C", borderRadius: 13, padding: 15, marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  choiceSelected: { borderWidth: 1, borderColor: GOLD },
  choiceText: { color: "#E1E6ED", fontSize: 13 },
  choiceTextSelected: { color: GOLD, fontWeight: "700" },
  choiceMark: { color: GOLD, fontSize: 17 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: "#34445B", paddingTop: 10, paddingBottom: 7, backgroundColor: NAVY },
  navButton: { alignItems: "center", minWidth: 58, paddingVertical: 4 },
  navIcon: { color: MUTED, fontSize: 19, marginBottom: 3 },
  navLabel: { color: MUTED, fontSize: 10 },
  navSelected: { color: GOLD, fontWeight: "700" }
});
