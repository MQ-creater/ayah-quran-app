import React, { useEffect, useState } from "react";
import * as Font from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme,
  Pressable, TextInput, ImageBackground, Alert, ActivityIndicator
} from "react-native";

const PREFERENCES_KEY = "@ayah/preferences-v1";

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFERENCES_KEY + ":" + key).then(raw => {
      if (!active) return;
      if (raw) {
        const saved = JSON.parse(raw);
        setValue(JSON.parse(raw));
      }
    }).catch(error => {
      console.warn("Could not load saved Ayah preferences:", error);
    }).finally(() => {
      if (active) setHydrated(true);
    });
    return () => { active = false; };
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PREFERENCES_KEY + ":" + key, JSON.stringify(value)).catch(error => console.warn("Could not save Ayah preferences:", error));
  }, [key, value, hydrated]);
  return [value, setValue, hydrated];
}

const GOLD = "#D9B96E";
const NAVY = "#101C2D";
const PANEL = "#1B2A40";
const MUTED = "#AAB6C7";
// Public app URL only. Never place Quran Foundation client secrets in this mobile app.
const AYAH_API_BASE = process.env.EXPO_PUBLIC_AYAH_API_URL || "";

const THEME_PALETTES = {
  dark: { bg:"#101C2D",panel:"#1B2A40",surface:"#24354C",text:"#FFFFFF",soft:"#E1E6ED",muted:"#AAB6C7",accent:"#D9B96E",border:"#34445B",navyText:"#101C2D" },
  light: { bg:"#F5F7FA",panel:"#FFFFFF",surface:"#EAF0F6",text:"#142238",soft:"#26364A",muted:"#66758A",accent:"#A87924",border:"#D7E0EA",navyText:"#FFFFFF" },
  sepia: { bg:"#E8DDC8",panel:"#F5EBD8",surface:"#E3D3B8",text:"#332819",soft:"#51412D",muted:"#78694F",accent:"#8A672E",border:"#D0BD9D",navyText:"#332819" }
};
const DAILY = {
  arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
  translation: "My Lord, increase me in knowledge.",
  reference: "Surah Taha · 20:114"
};
const PRACTICE = {
  arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  translation: "All praise is for Allah—Lord of all worlds.",
  reference: "Surah Al-Fatihah · 1:2"
};

function Button({ title, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </Pressable>
  );
}
function Header({ eyebrow, title }) {
  return <View style={styles.pageHeader}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text></View>;
}
function DailyAyah({ compact = false }) {
  return (
    <View style={[styles.dailyCard, compact && styles.dailyCardCompact]}>
      <Text style={styles.cardEyebrow}>AYAH OF THE DAY</Text>
      <Text style={styles.dailyArabic} writingDirection="rtl">{DAILY.arabic}</Text>
      <Text style={styles.translation}>“{DAILY.translation}”</Text>
      <Text style={styles.reference}>{DAILY.reference}</Text>
    </View>
  );
}
function WelcomeScreen({ onEmailContinue, onGoogle }) {
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80" }}
      blurRadius={13} resizeMode="cover" style={styles.welcomeBackground}>
      <View style={styles.welcomeShade}>
        <View style={styles.welcomeTop}>
          <View style={styles.logo}><Text style={styles.logoArabic}>آيَة</Text></View>
          <Text style={styles.brand}>AYAH</Text>
          <Text style={styles.tagline}>A calmer way to connect with the Qur’an</Text>
        </View>
        <DailyAyah />
        <View style={styles.signInCard}>
          <Text style={styles.signInTitle}>Begin your journey</Text>
          <Text style={styles.signInCopy}>Sign in to keep your learning and progress together.</Text>
          <Button title="Continue with Google" onPress={onGoogle} />
          <Button title="Continue with email" secondary onPress={() => setShowEmail(true)} />
          {showEmail && (
            <View style={styles.emailArea}>
              <TextInput value={email} onChangeText={setEmail} placeholder="Your email address"
                placeholderTextColor={MUTED} keyboardType="email-address" autoCapitalize="none"
                style={styles.emailInput} />
              <Button title="Continue" onPress={() => onEmailContinue(email)} disabled={!/^\S+@\S+\.\S+$/.test(email)} />
            </View>
          )}
          <Text style={styles.tinyNote}>Sign-in is a visual prototype. Secure Google/email authentication will be connected before launch.</Text>
          <Button title="Explore preview without signing in" secondary onPress={onEmailContinue} />
        </View>
      </View>
    </ImageBackground>
  );
}
function HomeScreen({ onNavigate, onPractice }) {
  return (
    <>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>ASSALAMU ALAIKUM</Text><Text style={styles.heading}>Your Qur’an journey</Text></View>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("settings")} style={styles.settingsButton}><Text style={styles.settingsButtonText}>⚙  Appearance</Text></Pressable>
        <View style={styles.logo}><Text style={styles.logoArabic}>آيَة</Text></View>
      </View>
      <DailyAyah />
      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Build a little consistency</Text>
        <Text style={styles.progressHint}>Start with one ayah, review what you know, and grow at your own pace.</Text>
        <Button title="Start memorizing" onPress={onPractice} />
      </View>
      <Text style={styles.sectionTitle}>Your tools</Text>
      <View style={styles.actionGrid}>
        <ActionTile icon="۞" title="Memorize" subtitle="Learn step by step" onPress={onPractice} />
        <ActionTile icon="▤" title="Memorization plan" subtitle="Build your hifdh routine" onPress={() => onNavigate("plan")} />
        <ActionTile icon="↻" title="Smart revision" subtitle="Review ayahs when due" onPress={() => onNavigate("revision")} />
        <ActionTile icon="ا" title="Arabic lessons" subtitle="Everyday words" onPress={() => onNavigate("arabic")} />
        <ActionTile icon="ح" title="Arabic alphabet" subtitle="Recognize your first letters" onPress={() => onNavigate("arabicAlphabet")} />
        <ActionTile icon="▥" title="My progress" subtitle="See your learning activity" onPress={() => onNavigate("progress")} />
        <ActionTile icon="☆" title="Saved ayahs" subtitle="Your bookmarked verses" onPress={() => onNavigate("saved")} />
        <ActionTile icon="📖" title="Qur’an library" subtitle="Browse all surahs" onPress={() => onNavigate("library")} />
        <ActionTile icon="↻" title="Smart review" subtitle="Guided revision · Plus" locked onPress={() => onNavigate("premium")} />
        <ActionTile icon="♫" title="Recitation library" subtitle="More reciters · Plus" locked onPress={() => onNavigate("premium")} />
        <ActionTile icon="✧" title="AI teacher" subtitle="Hamza or Maryam · Plus" locked onPress={() => onNavigate("premium")} />
      </View>
      <View style={styles.premiumBanner}>
        <Text style={styles.premiumTitle}>Go deeper with Ayah Plus</Text>
        <Text style={styles.progressHint}>Meet your personal Qur’an learning assistant, practice repeat-after-me, and more.</Text>
        <Button title="Explore premium" onPress={() => onNavigate("premium")} />
      </View>
    </>
  );
}
function ActionTile({ icon, title, subtitle, onPress, locked = false }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}>
      <View style={styles.tileTop}><Text style={styles.actionIcon}>{icon}</Text>{locked && <Text style={styles.lock}>PLUS</Text>}</View>
      <Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}
const PRACTICE_PASSAGES = [
  { id: "fatiha2", surah: "Al-Fatihah", verse: "2", arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is for Allah—Lord of all worlds.", reference: "Surah Al-Fatihah · 1:2" },
  { id: "ikhlas1", surah: "Al-Ikhlas", verse: "1", arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Say, He is Allah, the One.", reference: "Surah Al-Ikhlas · 112:1" },
  { id: "asr1", surah: "Al-Asr", verse: "1", arabic: "وَالْعَصْرِ", translation: "By time.", reference: "Surah Al-Asr · 103:1" }
];
function MemorizeScreen({ onPracticed, onPracticeCompleted, onSyncRating, onBuildSession, savedIds, onToggleSave, onSaved, onRateReview, reviewRecords }) {
  const [selectedId, setSelectedId] = useState("fatiha2");
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const passage = PRACTICE_PASSAGES.find(item => item.id === selectedId) || PRACTICE_PASSAGES[0];
  const stages = [
    { title: "Read and become familiar", detail: "Read the ayah slowly a few times. Notice where each word begins and ends." },
    { title: "Repeat from memory", detail: "Look away from the text and try to recite what you remember. Take your time." },
    { title: "Check your recall", detail: "Reveal the ayah and compare carefully. Return to the beginning if you want another round." }
  ];
  const choosePassage = id => { setSelectedId(id); setStage(0); setDone(false); setShowMeaning(false); };
  return (
    <>
      <Header eyebrow="MEMORIZATION" title="Your learning session" />
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Choose a practice ayah</Text>
        <Button title="Build a session from any surah" secondary onPress={onBuildSession}/>
        <Text style={styles.progressHint}>Start with one ayah. More surahs and passage ranges will be added as the verified Qur’an text library grows.</Text>
        {PRACTICE_PASSAGES.map(item => (
          <Pressable key={item.id} onPress={() => choosePassage(item.id)} style={[styles.choice, selectedId === item.id && styles.choiceSelected]}>
            <View><Text style={[styles.choiceText, selectedId === item.id && styles.choiceTextSelected]}>{item.surah}</Text><Text style={styles.reference}>Ayah {item.verse}</Text></View>
            <Text style={styles.choiceMark}>{selectedId === item.id ? "✓" : "○"}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.lessonCard}>
        <Text style={styles.cardEyebrow}>PRACTICE · STEP {stage + 1} OF 3</Text>
        <Text style={styles.sectionTitle}>{stages[stage].title}</Text>
        <Text style={styles.dailyArabic} writingDirection="rtl">{stage === 1 && !showMeaning ? "••••••••••••" : passage.arabic}</Text>
        <Text style={styles.progressHint}>{stages[stage].detail}</Text>
        {(stage !== 1 || showMeaning) && <Text style={styles.reference}>{passage.reference}</Text>}
        <Button title={savedIds.includes(passage.id) ? "★ Saved to bookmarks" : "☆ Save this ayah"} secondary onPress={() => onToggleSave(passage.id)} />
        {stage === 2 && <Button title={showMeaning ? "Hide ayah" : "Reveal ayah"} secondary onPress={() => setShowMeaning(!showMeaning)} />}
        {stage === 0 && <Text style={styles.translation}>{passage.translation}</Text>}
      </View>
      <View style={styles.stepDots}>
        {stages.map((item, index) => <View key={item.title} style={[styles.stepDot, index <= stage && styles.stepDotActive]} />)}
      </View>
      <View style={styles.rowButtons}>
        <View style={styles.rowButtonCell}><Button title="Previous" secondary disabled={stage === 0} onPress={() => { setStage(n => Math.max(0, n - 1)); setShowMeaning(false); }} /></View>
        <View style={styles.rowButtonCell}><Button title={stage === 2 ? "Start again" : "Next step"} onPress={() => { if (stage === 2) { setStage(0); setShowMeaning(false); setDone(false); } else { setStage(n => n + 1); setShowMeaning(false); } }} /></View>
      </View>
      <Button title={done ? "Session completed" : "Finish this practice"} onPress={() => { if (!done) { setDone(true); onPracticed(); onPracticeCompleted?.(passage.id); } }} disabled={done} />
      {done && <View style={styles.infoCard}>
        <Text style={styles.cardEyebrow}>REVISION CHECK-IN</Text>
        <Text style={styles.sectionTitle}>How did this ayah feel?</Text>
        <Text style={styles.progressHint}>Your answer helps Ayah suggest when to revisit it. Choose honestly; this is a planning aid, not a recitation score.</Text>
        <View style={styles.languageGrid}>
          {[{id:"difficult",label:"Difficult · review tomorrow"},{id:"medium",label:"Getting there · in 3 days"},{id:"easy",label:"Comfortable · in 7 days"}].map(option => <Pressable key={option.id} onPress={() => { onRateReview(passage.id, option.id); onSyncRating?.(passage.id, option.id); }} style={[styles.choice, reviewRecords?.[passage.id]?.rating === option.id && styles.choiceSelected, {flexGrow:1}]}><Text style={styles.choiceText}>{option.label}</Text><Text style={styles.choiceMark}>{reviewRecords?.[passage.id]?.rating === option.id ? "✓" : "○"}</Text></Pressable>)}
        </View>
        {reviewRecords?.[passage.id]?.dueAt ? <Text style={styles.reference}>Next suggested review: {new Date(reviewRecords[passage.id].dueAt).toLocaleDateString()}</Text> : null}
      </View>}
      <Button title="View saved ayahs" secondary onPress={onSaved} />
      <Text style={styles.tinyNote}>This guided practice is interactive, but audio playback and automatic recitation checking are not connected yet. Please check Qur’an text and pronunciation with a trusted mushaf or qualified teacher.</Text>
    </>
  );
}
function BuildMemorizationSessionScreen({ onBack, onProgressUpdate, initialAssignment, onFinishAssignment }) {
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState(String(initialAssignment?.chapterId || "1"));
  const [startVerse, setStartVerse] = useState(String(initialAssignment?.startVerse || "1"));
  const [endVerse, setEndVerse] = useState(String(initialAssignment?.endVerse || "5"));
  const [verses, setVerses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [showAyah, setShowAyah] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const base = AYAH_API_BASE ? (AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE) : "";
  useEffect(() => {
    if (!base) return;
    let active = true;
    setChapterLoading(true);
    fetch(base + "/chapters")
      .then(response => { if (!response.ok) throw new Error("Unable to load surahs"); return response.json(); })
      .then(data => { if (active) setChapters(Array.isArray(data.chapters) ? data.chapters : []); })
      .catch(() => { if (active) setError("The verified Qur’an library could not load. Please try again later."); })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, []);
  const selectedChapter = chapters.find(item => String(item.id) === String(chapterId));
  const currentVerse = verses[currentIndex];
  const cleanText = value => String(value || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const loadSession = async () => {
    const first = Number(startVerse);
    const last = Number(endVerse);
    const total = Number(selectedChapter?.verses_count || 0);
    if (!base) { setError("The verified Qur’an content server is not configured yet."); return; }
    if (!selectedChapter || !Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first || last > total || last-first+1 > 50) {
      setError("Choose a valid ayah range of up to 50 ayahs within this surah."); return;
    }
    setLoading(true); setError(""); setVerses([]); setCurrentIndex(0); setStage(0); setShowAyah(false); setCompleted(false);
    try {
      const firstPage = Math.floor((first - 1) / 50) + 1;
      const lastPage = Math.floor((last - 1) / 50) + 1;
      let all = [];
      for (let page = firstPage; page <= lastPage; page++) {
        const url = base + "/chapters/" + chapterId + "/verses?page=" + page + "&per_page=50&translation_id=131&script=uthmani&language=en";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Unable to load the selected ayahs.");
        const data = await response.json();
        if (Array.isArray(data.verses)) all = all.concat(data.verses);
      }
      const selected = all.filter(item => {
        const key = String(item.verse_key || "");
        const number = Number(key.split(":")[1]);
        return number >= first && number <= last;
      }).map(item => ({
        key: item.verse_key,
        number: Number(String(item.verse_key || "").split(":")[1]),
        arabic: item.text_uthmani || item.text || "",
        translation: cleanText(item.translations?.[0]?.text || "")
      }));
      if (selected.length !== last-first+1 || selected.some(item => !item.arabic)) throw new Error("The server did not return every ayah in that range. Try again.");
      setVerses(selected);
    } catch (e) {
      setError(e.message || "Could not build this session.");
    } finally { setLoading(false); }
  };
  const markCurrent = status => {
    if (currentVerse?.key) onProgressUpdate?.(chapterId, String(currentVerse.number), status);
  };
  const finishVerse = () => {
    markCurrent("learning");
    if (currentIndex >= verses.length - 1) { setCompleted(true); if (initialAssignment) onFinishAssignment?.(initialAssignment); }
    else { setCurrentIndex(index => index + 1); setStage(0); setShowAyah(false); }
  };
  return <>
    <Header eyebrow="GUIDED HIDHFH" title="Build a memorization session" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>{initialAssignment ? "Today’s assigned ayahs" : "Choose your surah and ayah range"}</Text>
      {initialAssignment ? <Text style={styles.progressHint}>This session was opened from your memorization schedule. Your assigned range is pre-filled below.</Text> : null}
      <Text style={styles.progressHint}>Choose a surah, then enter the first and last ayah. Ayah loads the Arabic and translation from the connected verified content service.</Text>
      {chapterLoading ? <ActivityIndicator color={GOLD} /> : null}
      <Text style={styles.reference}>Surah</Text>
      <View style={styles.languageGrid}>
        {chapters.map(item => <Pressable key={item.id} onPress={() => { setChapterId(String(item.id)); setVerses([]); setError(""); setStartVerse("1"); setEndVerse(String(Math.min(5, Number(item.verses_count || 5)))); }} style={[styles.goalChoice, String(item.id) === String(chapterId) && styles.choiceSelected]}><Text style={[styles.choiceText, String(item.id) === String(chapterId) && styles.choiceTextSelected]}>{item.id}. {item.name_simple}</Text></Pressable>)}
      </View>
      {selectedChapter ? <Text style={styles.reference}>{selectedChapter.name_simple} · {selectedChapter.verses_count} ayahs</Text> : null}
      <Text style={styles.reference}>First ayah</Text>
      <TextInput value={startVerse} onChangeText={setStartVerse} keyboardType="number-pad" placeholder="1" placeholderTextColor={MUTED} style={styles.emailInput}/>
      <Text style={styles.reference}>Last ayah (maximum 50 ayahs per session)</Text>
      <TextInput value={endVerse} onChangeText={setEndVerse} keyboardType="number-pad" placeholder="5" placeholderTextColor={MUTED} style={styles.emailInput}/>
      <Button title={loading ? "Loading ayahs…" : "Load my session"} onPress={loadSession} disabled={loading || chapterLoading || !selectedChapter}/>
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
    </View>
    {currentVerse && !completed ? <>
      <View style={styles.lessonCard}>
        <Text style={styles.cardEyebrow}>AYAH {currentIndex+1} OF {verses.length} · {currentVerse.key}</Text>
        <Text style={styles.sectionTitle}>{stage === 0 ? "Read and become familiar" : stage === 1 ? "Recall from memory" : "Check your memorization"}</Text>
        <Text style={styles.dailyArabic} writingDirection="rtl">{stage === 1 && !showAyah ? "••••••••••••" : currentVerse.arabic}</Text>
        {stage !== 1 || showAyah ? <Text style={styles.translation}>{currentVerse.translation}</Text> : null}
        {stage === 2 ? <Button title={showAyah ? "Hide ayah" : "Reveal ayah"} secondary onPress={() => setShowAyah(value => !value)}/> : null}
        <Text style={styles.progressHint}>{stage === 0 ? "Read slowly and listen to a qualified reciter or teacher if available." : stage === 1 ? "Try to recall the ayah without looking at the text." : "Compare your recall with the verified text, then continue."}</Text>
      </View>
      <View style={styles.rowButtons}>
        <View style={styles.rowButtonCell}><Button title="Previous step" secondary disabled={stage===0} onPress={() => {setStage(value=>Math.max(0,value-1));setShowAyah(false);}}/></View>
        <View style={styles.rowButtonCell}><Button title={stage===2 ? "Complete ayah" : "Next step"} onPress={() => stage===2 ? finishVerse() : setStage(value=>value+1)}/></View>
      </View>
    </> : null}
    {completed ? <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>SESSION COMPLETE</Text>
      <Text style={styles.sectionTitle}>You worked through {verses.length} ayahs.</Text>
      <Text style={styles.progressHint}>Each completed ayah has been marked Learning in your tracker. You can review and update each status there.</Text>
      <Button title="Build another session" onPress={() => {setVerses([]);setCompleted(false);setCurrentIndex(0);setStage(0);}}/>
    </View> : null}
    <Button title="Back to memorization" secondary onPress={onBack}/>
    <Text style={styles.tinyNote}>This guided session records that you completed a practice step. It does not automatically judge tajwid or verify that an ayah has been memorized.</Text>
  </>;
}

function SmartRevisionScreen({ records, onRateReview, onStartPractice }) {
  const now = Date.now();
  const items = PRACTICE_PASSAGES.map(passage => ({ ...passage, record: records?.[passage.id] || null }))
    .filter(item => item.record)
    .sort((a,b) => new Date(a.record.dueAt || 0).getTime() - new Date(b.record.dueAt || 0).getTime());
  const due = items.filter(item => new Date(item.record.dueAt || 0).getTime() <= now);
  const upcoming = items.filter(item => new Date(item.record.dueAt || 0).getTime() > now);
  const labels = { difficult: "Needs more practice", medium: "Building confidence", easy: "Comfortable" };
  const rate = (id, rating) => onRateReview(id, rating);
  return <>
    <Header eyebrow="SMART REVISION" title="Your review queue" />
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>REVISION OVERVIEW</Text>
      <Text style={styles.quizScore}>{due.length}</Text>
      <Text style={styles.sectionTitle}>Ayahs suggested for review</Text>
      <Text style={styles.progressHint}>Ayah schedules a suggested review using your self-rating: difficult in 1 day, getting there in 3 days, and comfortable in 7 days. These intervals are a simple starter system and can be adjusted as we learn more.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Due now</Text>
      {due.length === 0 ? <Text style={styles.progressHint}>Nothing is due right now. You can still review any ayah you have practiced.</Text> : due.map(item => <View key={item.id} style={styles.savedAyah}>
        <Text style={styles.choiceText}>{item.surah} · {item.reference}</Text>
        <Text style={styles.dailyArabic} writingDirection="rtl">{item.arabic}</Text>
        <Text style={styles.translation}>{item.translation}</Text>
        <Text style={styles.reference}>Last rating: {labels[item.record.rating] || "Not rated"}</Text>
        <View style={styles.languageGrid}>
          {[{id:"difficult",label:"Difficult"},{id:"medium",label:"Getting there"},{id:"easy",label:"Comfortable"}].map(option => <Pressable key={option.id} onPress={() => rate(item.id, option.id)} style={[styles.goalChoice, item.record.rating === option.id && styles.choiceSelected]}><Text style={styles.choiceText}>{option.label}</Text></Pressable>)}
        </View>
      </View>)}
      <Button title="Practice an ayah" onPress={onStartPractice} />
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Coming up</Text>
      {upcoming.length === 0 ? <Text style={styles.progressHint}>No upcoming reviews have been scheduled yet.</Text> : upcoming.map(item => <View key={item.id} style={styles.choice}>
        <View style={{flex:1}}><Text style={styles.choiceText}>{item.surah}</Text><Text style={styles.reference}>Review on {new Date(item.record.dueAt).toLocaleDateString()}</Text></View>
        <Text style={styles.choiceMark}>{item.record.rating === "easy" ? "✓" : "◷"}</Text>
      </View>)}
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your practiced ayahs</Text>
      {items.length === 0 ? <Text style={styles.progressHint}>Finish a memorization practice and rate how it felt. It will appear here.</Text> : items.map(item => <View key={item.id} style={styles.choice}>
        <View style={{flex:1}}><Text style={styles.choiceText}>{item.surah} · {item.verse}</Text><Text style={styles.reference}>{labels[item.record.rating] || "Awaiting rating"}</Text></View>
        <Text style={styles.choiceMark}>{item.record.attempts || 1}×</Text>
      </View>)}
      <Text style={styles.tinyNote}>Ratings are self-reported and do not verify memorization accuracy. Ask a qualified teacher to check your recitation.</Text>
    </View>
  </>;
}
function MemorizationPlanScreen({ plan, onSavePlan, onStartPractice, onBuildSession, onStartAssignment, practiceCount }) {
  const [dailyTarget, setDailyTarget] = useState(plan?.dailyTarget || 1);
  const [daysPerWeek, setDaysPerWeek] = useState(plan?.daysPerWeek || 5);
  const [focus, setFocus] = useState(plan?.focus || "balanced");
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState(String(plan?.chapterId || "1"));
  const [startVerse, setStartVerse] = useState(String(plan?.startVerse || "1"));
  const [endVerse, setEndVerse] = useState(String(plan?.endVerse || "7"));
  const [startDate, setStartDate] = useState(plan?.startDate || new Date().toISOString().slice(0,10));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [chapterLoading, setChapterLoading] = useState(false);
  const base = AYAH_API_BASE ? (AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE) : "";
  useEffect(() => {
    if (!base) return;
    let active = true;
    setChapterLoading(true);
    fetch(base + "/chapters")
      .then(response => { if (!response.ok) throw new Error("Could not load surahs"); return response.json(); })
      .then(data => { if (active) setChapters(Array.isArray(data.chapters) ? data.chapters : []); })
      .catch(() => { if (active) setError("Connect the verified Qur’an content server to choose a surah."); })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, []);
  const selectedChapter = chapters.find(item => String(item.id) === String(chapterId));
  const estimatedWeekly = dailyTarget * daysPerWeek;
  const dateLabel = value => {
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
  };
  const buildSchedule = () => {
    const first = Number(startVerse), last = Number(endVerse);
    if (!selectedChapter || !Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first || last > Number(selectedChapter.verses_count || 0)) {
      setError("Choose a valid ayah range in the selected surah."); return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(new Date(startDate + "T12:00:00").getTime())) {
      setError("Enter a valid start date in YYYY-MM-DD format."); return;
    }
    const schedule = [];
    let cursor = first;
    let date = new Date(startDate + "T12:00:00");
    let dayCounter = 0;
    while (cursor <= last && schedule.length < 400) {
      if (dayCounter % 7 < daysPerWeek) {
        const end = Math.min(last, cursor + dailyTarget - 1);
        schedule.push({ date: date.toISOString().slice(0,10), startVerse: cursor, endVerse: end, completed: false });
        cursor = end + 1;
      }
      date.setDate(date.getDate() + 1);
      dayCounter += 1;
    }
    if (cursor <= last) { setError("This schedule is longer than the supported planning range."); return; }
    const next = { ...plan, dailyTarget, daysPerWeek, focus, chapterId, startVerse:first, endVerse:last, startDate, schedule, updatedAt:new Date().toISOString() };
    onSavePlan(next);
    setSaved(true);
    setError("");
  };
  const markDay = index => {
    const schedule = (plan?.schedule || []).map((item,i) => i === index ? { ...item, completed: !item.completed } : item);
    onSavePlan({ ...plan, dailyTarget, daysPerWeek, focus, schedule, updatedAt:new Date().toISOString() });
  };
  const assignments = plan?.schedule || [];
  const completedDays = assignments.filter(item => item.completed).length;
  const completion = assignments.length ? Math.round(completedDays / assignments.length * 100) : 0;
  const selectedName = selectedChapter?.name_simple || plan?.chapterName || "Selected surah";
  const localToday = (() => { const now = new Date(); return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-"); })();
  const todayAssignment = assignments.find(item => item.date === localToday && !item.completed);
  const nextAssignment = assignments.find(item => item.date > localToday && !item.completed);
  const assignmentToShow = todayAssignment || nextAssignment;
  const assignmentLabel = todayAssignment ? "Today's assignment" : nextAssignment ? "Next scheduled assignment" : "No upcoming assignment";

  return <>
    <Header eyebrow="YOUR HIDHFH JOURNEY" title="Memorization plan" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Build a realistic routine</Text>
      <Text style={styles.progressHint}>Choose a steady amount and the days you can study. Ayah will create a daily plan for the range you select.</Text>
      <Text style={styles.settingLabel}>New ayahs per study day</Text>
      <View style={styles.languageGrid}>{[1,2,3].map(n => <Pressable key={n} onPress={() => {setDailyTarget(n);setSaved(false);}} style={[styles.goalChoice,dailyTarget===n&&styles.choiceSelected]}><Text style={[styles.choiceText,dailyTarget===n&&styles.choiceTextSelected]}>{n} {n===1?"ayah":"ayahs"}</Text></Pressable>)}</View>
      <Text style={styles.settingLabel}>Study days per week</Text>
      <View style={styles.languageGrid}>{[3,5,6,7].map(n => <Pressable key={n} onPress={() => {setDaysPerWeek(n);setSaved(false);}} style={[styles.goalChoice,daysPerWeek===n&&styles.choiceSelected]}><Text style={[styles.choiceText,daysPerWeek===n&&styles.choiceTextSelected]}>{n} days</Text></Pressable>)}</View>
      <Text style={styles.settingLabel}>Your learning focus</Text>
      {[{id:"new",label:"Learn new ayahs"},{id:"revision",label:"Strengthen what you know"},{id:"balanced",label:"Balance new learning and revision"}].map(item => <Pressable key={item.id} onPress={() => {setFocus(item.id);setSaved(false);}} style={[styles.choice,focus===item.id&&styles.choiceSelected]}><Text style={[styles.choiceText,focus===item.id&&styles.choiceTextSelected]}>{item.label}</Text><Text style={styles.choiceMark}>{focus===item.id?"✓":"○"}</Text></Pressable>)}
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Choose what you want to memorize</Text>
      {chapterLoading ? <ActivityIndicator color={GOLD}/> : null}
      <Text style={styles.settingLabel}>Surah</Text>
      <View style={styles.languageGrid}>{chapters.map(item => <Pressable key={item.id} onPress={() => {setChapterId(String(item.id));setEndVerse(String(item.verses_count || 1));setSaved(false);}} style={[styles.goalChoice,String(item.id)===chapterId&&styles.choiceSelected]}><Text style={[styles.choiceText,String(item.id)===chapterId&&styles.choiceTextSelected]}>{item.id}. {item.name_simple}</Text></Pressable>)}</View>
      {selectedChapter ? <Text style={styles.reference}>{selectedChapter.name_simple} · {selectedChapter.verses_count} ayahs</Text> : <Text style={styles.progressHint}>Surah choices load from the verified content server.</Text>}
      <Text style={styles.settingLabel}>First ayah</Text>
      <TextInput value={startVerse} onChangeText={value=>{setStartVerse(value);setSaved(false);}} keyboardType="number-pad" style={styles.emailInput} placeholder="1" placeholderTextColor={MUTED}/>
      <Text style={styles.settingLabel}>Last ayah</Text>
      <TextInput value={endVerse} onChangeText={value=>{setEndVerse(value);setSaved(false);}} keyboardType="number-pad" style={styles.emailInput} placeholder="7" placeholderTextColor={MUTED}/>
      <Text style={styles.settingLabel}>Start date (YYYY-MM-DD)</Text>
      <TextInput value={startDate} onChangeText={value=>{setStartDate(value);setSaved(false);}} style={styles.emailInput} placeholder="2026-11-08" placeholderTextColor={MUTED}/>
      <Button title="Generate my daily schedule" onPress={buildSchedule} disabled={chapterLoading||!selectedChapter}/>
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
    </View>
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>YOUR WEEKLY STARTER TARGET</Text>
      <Text style={styles.quizScore}>{estimatedWeekly}</Text>
      <Text style={styles.sectionTitle}>New ayahs per week</Text>
      <Text style={styles.progressHint}>{dailyTarget} {dailyTarget===1?"ayah":"ayahs"} per study day across {daysPerWeek} days. This is a planning estimate, not a prediction of memorization speed.</Text>
      <Text style={styles.reference}>Completed practice sessions in this preview: {practiceCount}</Text>
      <Button title={saved ? "Schedule generated and saved" : "Save routine only"} secondary onPress={() => {onSavePlan({...plan,dailyTarget,daysPerWeek,focus,updatedAt:new Date().toISOString()});setSaved(true);}}/>
      <Button title="Start a practice session" onPress={onStartPractice}/>
      <Button title="Practice a selected ayah range" secondary onPress={onBuildSession}/>
    </View>
    {assignmentToShow ? <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>{assignmentLabel.toUpperCase()}</Text>
      <Text style={styles.sectionTitle}>{selectedName}</Text>
      <Text style={styles.progressHint}>{dateLabel(assignmentToShow.date)} · Ayahs {assignmentToShow.startVerse}–{assignmentToShow.endVerse}</Text>
      <Button title="Start this assignment" onPress={() => onStartAssignment?.({ chapterId: String(plan.chapterId), date: assignmentToShow.date, startVerse: assignmentToShow.startVerse, endVerse: assignmentToShow.endVerse })}/>
    </View> : assignments.length ? <View style={styles.infoCard}><Text style={styles.sectionTitle}>Schedule complete</Text><Text style={styles.progressHint}>All scheduled assignments have been checked off. You can create another plan whenever you're ready.</Text></View> : null}
    {assignments.length ? <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your daily assignments</Text>
      <Text style={styles.progressHint}>{selectedName} · {assignments.length} study days · {completedDays} completed</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill,{width:completion+"%"}]}/></View>
      <Text style={styles.reference}>{completion}% of scheduled days checked off</Text>
      {assignments.map((item,index) => <Pressable key={item.date+"-"+index} onPress={()=>markDay(index)} style={[styles.choice,item.completed&&styles.choiceSelected]}>
        <View style={{flex:1}}><Text style={[styles.choiceText,item.completed&&styles.choiceTextSelected]}>{dateLabel(item.date)}</Text><Text style={styles.reference}>Ayahs {item.startVerse}–{item.endVerse}</Text></View>
        <Text style={styles.choiceMark}>{item.completed?"✓":"○"}</Text>
      </Pressable>)}
      <Text style={styles.tinyNote}>Tap a day to mark its assignment complete. This is a personal checklist; it does not verify that the assigned ayahs were memorized.</Text>
    </View> : null}
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>A balanced approach</Text>
      <Text style={styles.stepText}>Learn a manageable portion, then return to previous portions for revision.</Text>
      <Text style={styles.stepText}>If a day is difficult, adjust the plan rather than rushing.</Text>
      <Text style={styles.tinyNote}>Daily assignments are a planning guide. Ask a qualified teacher to check recitation and memorization.</Text>
    </View>
  </>;
}
const ARABIC_LESSON = [
  { word: "كِتَابٌ", transliteration: "kitābun", meaning: "a book", example: "هَذَا كِتَابٌ", exampleMeaning: "This is a book." },
  { word: "قَلَمٌ", transliteration: "qalamun", meaning: "a pen", example: "هَذَا قَلَمٌ", exampleMeaning: "This is a pen." },
  { word: "بَابٌ", transliteration: "bābun", meaning: "a door", example: "هَذَا بَابٌ", exampleMeaning: "This is a door." }
];
const ARABIC_STARTER_QUIZ = [
  { prompt: "What does كِتَابٌ mean?", options: ["A door", "A book", "A pen"], answer: "A book", explanation: "كِتَابٌ (kitābun) means “a book.”" },
  { prompt: "Which Arabic word means “a pen”?", options: ["قَلَمٌ", "بَابٌ", "كِتَابٌ"], answer: "قَلَمٌ", explanation: "قَلَمٌ (qalamun) means “a pen.”" },
  { prompt: "What does بَابٌ mean?", options: ["A book", "A pen", "A door"], answer: "A door", explanation: "بَابٌ (bābun) means “a door.”" }
];
function ArabicStarterQuiz({ onReview }) {
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = ARABIC_STARTER_QUIZ[question];
  const submit = () => {
    if (!answer) return;
    if (answer === item.answer) setScore(n => n + 1);
    if (question === ARABIC_STARTER_QUIZ.length - 1) setFinished(true);
    else { setQuestion(n => n + 1); setAnswer(""); }
  };
  const retry = () => { setQuestion(0); setAnswer(""); setScore(0); setFinished(false); };
  if (finished) return <View style={styles.infoCard}>
    <Text style={styles.cardEyebrow}>MILESTONE CHECKPOINT</Text>
    <Text style={styles.sectionTitle}>Starter lesson quiz complete!</Text>
    <Text style={styles.quizScore}>{score} / {ARABIC_STARTER_QUIZ.length}</Text>
    <Text style={styles.progressHint}>{score === 3 ? "Excellent work! You got every question right." : "Good effort. Review the words and try again whenever you're ready."}</Text>
    <Button title="Try the quiz again" secondary onPress={retry} />
    <Button title="Review the lesson" onPress={onReview} />
  </View>;
  return <View style={styles.infoCard}>
    <Text style={styles.cardEyebrow}>MILESTONE CHECKPOINT · QUESTION {question + 1} OF {ARABIC_STARTER_QUIZ.length}</Text>
    <Text style={styles.sectionTitle}>Test what you've learned</Text>
    <Text style={styles.quizPrompt}>{item.prompt}</Text>
    {item.options.map(option => <Pressable key={option} onPress={() => setAnswer(option)} style={[styles.choice, answer === option && styles.choiceSelected]}>
      <Text style={[styles.choiceText, answer === option && styles.choiceTextSelected]}>{option}</Text>
      <Text style={styles.choiceMark}>{answer === option ? "✓" : "○"}</Text>
    </Pressable>)}
    <Button title={question === ARABIC_STARTER_QUIZ.length - 1 ? "Finish quiz" : "Next question"} disabled={!answer} onPress={submit} />
    <Text style={styles.tinyNote}>This short checkpoint reviews the three words in the starter lesson. It is practice, not a formal language proficiency test.</Text>
  </View>;
}
function QuranLibraryScreen({ onOpenChapter }) {
  const [chapters, setChapters] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!AYAH_API_BASE) return;
    let active = true;
    setLoading(true); setError("");
    fetch(`${(AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0, -1) : AYAH_API_BASE)}/chapters`)
      .then(response => { if (!response.ok) throw new Error(`Server returned ${response.status}`); return response.json(); })
      .then(data => { if (active) setChapters(Array.isArray(data.chapters) ? data.chapters : []); })
      .catch(() => { if (active) setError("We could not load the surah list. Please check the Ayah content server connection."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const filtered = chapters.filter(ch => `${ch.name_simple || ""} ${ch.name_arabic || ""} ${ch.translated_name?.name || ""} ${ch.id || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <Header eyebrow="QUR’AN" title="Qur’an library" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Explore all 114 surahs</Text>
      <Text style={styles.progressHint}>Search by surah name, Arabic name, meaning, or number.</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search surahs…" placeholderTextColor={MUTED} style={styles.emailInput} />
      {!AYAH_API_BASE ? <View style={styles.apiNotice}>
        <Text style={styles.sectionTitle}>Qur’an content connection needed</Text>
        <Text style={styles.progressHint}>The library interface is ready. Before showing Qur’an text, we need to connect a secure Ayah backend to a verified content source. API credentials must stay on the backend, never inside the app.</Text>
        <Text style={styles.tinyNote}>Developer setup: configure EXPO_PUBLIC_AYAH_API_URL to your own backend URL. The backend should provide GET /chapters and GET /chapters/:id/verses.</Text>
      </View> : loading ? <ActivityIndicator color={GOLD} size="large" /> : error ? <Text style={styles.progressHint}>{error}</Text> : filtered.length === 0 ? <Text style={styles.progressHint}>No matching surahs found.</Text> : filtered.map(ch => <Pressable key={ch.id} onPress={() => onOpenChapter(ch)} style={styles.chapterRow}>
        <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{ch.id}</Text></View>
        <View style={styles.chapterDetails}><Text style={styles.choiceText}>{ch.name_simple}</Text><Text style={styles.reference}>{ch.translated_name?.name || ""} · {ch.verses_count} ayahs</Text></View>
        <Text style={styles.chapterArabic}>{ch.name_arabic || ""}</Text>
      </Pressable>)}
    </View>
    <Text style={styles.tinyNote}>Ayah will display verified Uthmani Arabic and selected translations after the secure content connection is configured. We will not fill gaps with invented Qur’an text.</Text>
  </>;
}
function QuranReaderScreen({ chapter, onBack, savedIds, onToggleSave }) {
  const wordPlayer = useAudioPlayer(null);
  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [arabicSize, setArabicSize] = useState(29);
  const [showArabic, setShowArabic] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [arabicScript, setArabicScript] = useState("Uthmani");
  const [arabicFontReady, setArabicFontReady] = useState(false);
  const [arabicFontError, setArabicFontError] = useState("");
  const [translationFont, setTranslationFont] = useState("Sans");
  const [translationLanguage, setTranslationLanguage] = useState("en");
  const [translationOptions, setTranslationOptions] = useState([]);
  const [translationId, setTranslationId] = useState("131");
  const [translationListLoading, setTranslationListLoading] = useState(false);
  const [translationListError, setTranslationListError] = useState("");
  const translationFontFamily = translationFont === "Serif" ? "serif" : translationFont === "Monospace" ? "monospace" : undefined;
  const translationLanguages = [{ code: "en", label: "English" }, { code: "ur", label: "Urdu" }, { code: "ar", label: "Arabic" }, { code: "bn", label: "Bengali" }, { code: "tr", label: "Turkish" }, { code: "fr", label: "French" }, { code: "id", label: "Indonesian" }];
  useEffect(() => {
    setVerses([]);
    setPage(1);
    setError("");
  }, [chapter?.id]);
  useEffect(() => {
    let active = true;
    setArabicFontReady(false);
    setArabicFontError("");
    const fontName = arabicScript === "IndoPak" ? "AyahIndoPak" : "AyahUthmanicHafs";
    const fontUri = arabicScript === "IndoPak"
      ? "https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.ttf"
      : "https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.ttf";
    Font.loadAsync({ [fontName]: { uri: fontUri } })
      .then(() => { if (active) setArabicFontReady(true); })
      .catch(() => { if (active) setArabicFontError("The selected Qur’an font could not be loaded. Check your connection and try again."); });
    return () => { active = false; };
  }, [arabicScript]);

  useEffect(() => {
    if (!AYAH_API_BASE) return;
    let active = true;
    setTranslationListLoading(true);
    setTranslationListError("");
    const base = AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0, -1) : AYAH_API_BASE;
    fetch(base + "/translations?language=" + translationLanguage)
      .then(response => { if (!response.ok) throw new Error("Server returned " + response.status); return response.json(); })
      .then(data => {
        if (!active) return;
        const items = Array.isArray(data.translations) ? data.translations : [];
        setTranslationOptions(items);
        if (!items.some(item => String(item.id) === String(translationId))) {
          setTranslationId(items.length ? String(items[0].id) : "");
        }
      })
      .catch(() => { if (active) setTranslationListError("We could not load translations for this language. Please try again later."); })
      .finally(() => { if (active) setTranslationListLoading(false); });
    return () => { active = false; };
  }, [translationLanguage]);
  useEffect(() => {
    if (!AYAH_API_BASE || !chapter?.id) return;
    let active = true;
    setLoading(true); setError("");
    const base = AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0, -1) : AYAH_API_BASE;
    fetch(base + "/chapters/" + chapter.id + "/verses?page=" + page + "&per_page=50&translation_id=" + encodeURIComponent(translationId) + "&script=" + (arabicScript === "IndoPak" ? "indopak" : "uthmani") + "&language=" + encodeURIComponent(translationLanguage))
      .then(response => { if (!response.ok) throw new Error("Server returned " + response.status); return response.json(); })
      .then(data => {
        if (!active) return;
        const incoming = Array.isArray(data.verses) ? data.verses : [];
        setVerses(current => page === 1 ? incoming : [...current, ...incoming]);
      })
      .catch(() => { if (active) setError("Unable to load this surah right now. Please try again later."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [chapter?.id, page, translationId, arabicScript, translationLanguage]);
  return <>
    <Header eyebrow={"SURAH " + chapter.id} title={chapter.name_simple} />
    <View style={styles.infoCard}>
      <Text style={styles.chapterArabicLarge}>{chapter.name_arabic || ""}</Text>
      <Text style={styles.reference}>{chapter.translated_name?.name || ""} · {chapter.verses_count} ayahs · {chapter.revelation_place || ""}</Text>
      <Button title="Back to surah list" secondary onPress={onBack} />
      <View style={styles.readerTools}>
        <Text style={styles.sectionTitle}>Reading preferences</Text>
        <View style={styles.readerToolRow}>
          <Text style={styles.readerToolLabel}>Arabic text</Text>
          <View style={styles.readerSizeControls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Decrease Arabic text size" onPress={() => setArabicSize(size => Math.max(22, size - 2))} style={styles.readerSizeButton}><Text style={styles.readerSizeButtonText}>A−</Text></Pressable>
            <Text style={styles.readerSizeValue}>{arabicSize}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Increase Arabic text size" onPress={() => setArabicSize(size => Math.min(44, size + 2))} style={styles.readerSizeButton}><Text style={styles.readerSizeButtonText}>A+</Text></Pressable>
          </View>
        </View>
        <View style={styles.readerToggleRow}>
          <Pressable accessibilityRole="button" onPress={() => setShowArabic(value => !value)} style={[styles.readerToggle, showArabic && styles.readerToggleActive]}><Text style={[styles.readerToggleText, showArabic && styles.readerToggleTextActive]}>{showArabic ? "✓ Arabic shown" : "Show Arabic"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setShowTranslation(value => !value)} style={[styles.readerToggle, showTranslation && styles.readerToggleActive]}><Text style={[styles.readerToggleText, showTranslation && styles.readerToggleTextActive]}>{showTranslation ? "✓ Translation shown" : "Show translation"}</Text></Pressable>
        </View>
        <View style={styles.readerToggleRow}>
          <Pressable accessibilityRole="button" onPress={() => setShowWordByWord(value => !value)} style={[styles.readerToggle, showWordByWord && styles.readerToggleActive]}><Text style={[styles.readerToggleText, showWordByWord && styles.readerToggleTextActive]}>{showWordByWord ? "✓ Word study on" : "Word-by-word study"}</Text></Pressable>
        </View>
        <Text style={styles.readerToolLabel}>Translation language</Text>
        <View style={styles.readerToggleRow}>
          {translationLanguages.map(item => <Pressable key={item.code} accessibilityRole="button" onPress={() => { setTranslationLanguage(item.code); setPage(1); setVerses([]); }} style={[styles.readerToggle, translationLanguage === item.code && styles.readerToggleActive]}><Text style={[styles.readerToggleText, translationLanguage === item.code && styles.readerToggleTextActive]}>{item.label}</Text></Pressable>)}
        </View>
        <Text style={styles.readerToolLabel}>Choose a translation</Text>
        {translationListLoading ? <ActivityIndicator color={GOLD} size="small" /> : null}
        {translationListError ? <Text style={styles.tinyNote}>{translationListError}</Text> : null}
        {!AYAH_API_BASE ? <Text style={styles.tinyNote}>Connect the secure content backend to load the translation catalogue.</Text> : null}
        {translationOptions.map(item => {
          const selected = String(item.id) === String(translationId);
          const title = item.name || item.translated_name?.name || ("Translation " + item.id);
          return <Pressable key={item.id} accessibilityRole="button" onPress={() => { setTranslationId(String(item.id)); setPage(1); setVerses([]); }} style={[styles.choice, selected && styles.choiceSelected]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{title}</Text>
              <Text style={styles.reference}>{item.author_name || ""}{item.language_name ? " · " + item.language_name : ""}</Text>
            </View>
            <Text style={styles.choiceMark}>{selected ? "✓" : "○"}</Text>
          </Pressable>;
        })}
        <Text style={styles.readerToolLabel}>Arabic script edition</Text>
        <View style={styles.readerToggleRow}>
          {["Uthmani", "IndoPak"].map(option => <Pressable key={option} accessibilityRole="button" onPress={() => setArabicScript(option)} style={[styles.readerToggle, arabicScript === option && styles.readerToggleActive]}><Text style={[styles.readerToggleText, arabicScript === option && styles.readerToggleTextActive]}>{option}</Text></Pressable>)}
        </View>
        <Text style={styles.tinyNote}>Each option uses its matching Qur’an text field and compatible font. Fonts are provided by Quran Foundation.</Text>
        <Text style={styles.readerToolLabel}>Translation font</Text>
        <View style={styles.readerToggleRow}>
          {["Sans", "Serif", "Monospace"].map(option => <Pressable key={option} accessibilityRole="button" onPress={() => setTranslationFont(option)} style={[styles.readerToggle, translationFont === option && styles.readerToggleActive]}><Text style={[styles.readerToggleText, translationFont === option && styles.readerToggleTextActive]}>{option}</Text></Pressable>)}
        </View>
        <Text style={styles.tinyNote}>Font and display choices apply to this reading session. Preferences are not saved between app launches yet.</Text>
      </View>
      {!AYAH_API_BASE ? <Text style={styles.progressHint}>Connect the verified Qur’an content backend to read this surah.</Text> : null}
      {verses.map((verse, index) => {
        const key = verse.verse_key || (chapter.id + ":" + (index + 1));
        const translation = verse.translations?.[0]?.text || "";
        const plainTranslation = translation.replace(/<[^>]*>/g, "");
        return <View key={key} style={styles.verseCard}>
          <View style={styles.verseMeta}><Text style={styles.verseNumber}>{key}</Text><Pressable onPress={() => onToggleSave(key, { arabic: verse.text_uthmani || "", translation: plainTranslation, reference: chapter.name_simple + " · " + key })}><Text style={styles.verseBookmark}>{savedIds.includes(key) ? "★ Saved" : "☆ Save"}</Text></Pressable></View>
          {showArabic ? (arabicFontReady ? <Text style={[styles.verseArabic, { fontSize: arabicSize, lineHeight: Math.round(arabicSize * 2.2), fontFamily: arabicScript === "IndoPak" ? "AyahIndoPak" : "AyahUthmanicHafs" }]} writingDirection="rtl">{arabicScript === "IndoPak" ? (verse.text_indopak_nastaleeq || "") : (verse.text_qpc_hafs || "")}</Text> : <Text style={styles.tinyNote}>{arabicFontError || "Loading the selected Qur’an font…"}</Text>) : null}
          {showTranslation ? <Text style={[styles.translation, translationFontFamily ? { fontFamily: translationFontFamily } : null]}>{plainTranslation}</Text> : null}
          {showWordByWord ? <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 }}>
            <Text style={styles.readerToolLabel}>Word-by-word study</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 9 }}>
              {(verse.words || []).filter(word => word.char_type_name === "word").map(word => {
                const wordArabic = arabicScript === "IndoPak" ? (word.text_indopak_nastaleeq || word.text_uthmani || "") : (word.text_qpc_hafs || word.text_uthmani || "");
                const wordMeaning = (word.translation?.text || "").replace(/<[^>]*>/g, "");
                const wordPronunciation = word.transliteration?.text || "";
                return <View key={word.id || word.position} style={{ minWidth: 88, maxWidth: 150, backgroundColor: PANEL, borderColor: BORDER, borderWidth: 1, borderRadius: 12, padding: 9, alignItems: "center" }}>
                  <Text style={{ color: TEXT, fontSize: 22, textAlign: "center", writingDirection: "rtl", fontFamily: arabicFontReady ? (arabicScript === "IndoPak" ? "AyahIndoPak" : "AyahUthmanicHafs") : undefined }}>{wordArabic}</Text>
                  <Text style={{ color: GOLD, fontSize: 12, textAlign: "center", marginTop: 5 }}>{wordPronunciation || "Pronunciation unavailable"}</Text>
                  <Text style={{ color: TEXT, fontSize: 13, textAlign: "center", marginTop: 4 }}>{wordMeaning || "Meaning unavailable"}</Text>
                  {word.audio_url ? <Pressable accessibilityRole="button" accessibilityLabel={"Play pronunciation for " + (wordPronunciation || "this word")} onPress={() => { const path = String(word.audio_url).replace(/^\/+/, ""); wordPlayer.replace("https://audio.qurancdn.com/" + path); wordPlayer.play(); }} style={[styles.readerToggle, { marginTop: 8, paddingVertical: 6 }]}><Text style={styles.readerToggleText}>▶ Hear word</Text></Pressable> : null}
                </View>;
              })}
            </View>
            <Text style={styles.tinyNote}>Word meanings and transliterations are supplied by Quran Foundation. Transliteration is a reading aid, not a replacement for learning pronunciation from a qualified teacher.</Text>
          </View> : null}
        </View>;
      })}
      {loading ? <ActivityIndicator color={GOLD} size="small" /> : null}
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
      {AYAH_API_BASE && verses.length < Number(chapter.verses_count || 0) ? <Button title="Load next ayahs" secondary disabled={loading} onPress={() => setPage(current => current + 1)} /> : null}
    </View>
  </>;
}
function SavedAyahsScreen({ savedIds, savedVerseDetails, onToggleSave, onLearn }) {
  const saved = PRACTICE_PASSAGES.filter(item => savedIds.includes(item.id));
  const savedVerses = Object.entries(savedVerseDetails || {}).filter(([key]) => savedIds.includes(key));
  return <>
    <Header eyebrow="YOUR COLLECTION" title="Saved ayahs" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your bookmarks</Text>
      <Text style={styles.progressHint}>Keep ayahs you want to revisit. Bookmarks currently last only while this app session stays open.</Text>
      {saved.length === 0 && savedVerses.length === 0 ? <><Text style={styles.progressHint}>No saved ayahs yet. Save one during memorization practice or from the Qur’an reader.</Text><Button title="Go to memorization" onPress={onLearn} /></> : <>{saved.map(item => <View key={item.id} style={styles.savedAyah}>
        <Text style={styles.dailyArabic} writingDirection="rtl">{item.arabic}</Text><Text style={styles.translation}>{item.translation}</Text><Text style={styles.reference}>{item.reference}</Text>
        <Button title="Remove bookmark" secondary onPress={() => onToggleSave(item.id)} />
      </View>)}{savedVerses.map(([key, item]) => <View key={key} style={styles.savedAyah}>
        <Text style={styles.dailyArabic} writingDirection="rtl">{item.arabic}</Text><Text style={styles.translation}>{item.translation}</Text><Text style={styles.reference}>{item.reference}</Text>
        <Button title="Remove bookmark" secondary onPress={() => onToggleSave(key)} />
      </View>)}</> }
    </View>
    <Button title="Back to learning" onPress={onLearn} />
  </>;
}
function ArabicLessonsScreen({ onPremium }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const item = ARABIC_LESSON[index];
  const next = () => {
    if (index === ARABIC_LESSON.length - 1) {
      setCompleted(true);
    } else {
      setIndex(n => n + 1);
      setRevealed(false);
    }
  };
  return <>
    <Header eyebrow="ARABIC LEARNING" title="Learn Arabic, step by step" />
    <View style={styles.freeLessonBadge}><Text style={styles.freeLessonBadgeText}>FREE STARTER LESSON</Text></View>
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>LESSON 1 · EVERYDAY WORDS</Text>
      <Text style={styles.dailyArabic} writingDirection="rtl">{item.word}</Text>
      <Text style={styles.translation}>{item.transliteration}</Text>
      <View style={styles.practicePrompt}><Text style={styles.practicePromptText}>{revealed ? item.meaning : "Try to guess the meaning, then reveal it."}</Text></View>
      <Button title={revealed ? "Hide meaning" : "Reveal meaning"} secondary onPress={() => setRevealed(v => !v)} />
      {revealed && <View style={styles.exampleBox}><Text style={styles.exampleArabic} writingDirection="rtl">{item.example}</Text><Text style={styles.progressHint}>{item.exampleMeaning}</Text></View>}
      <Text style={styles.reference}>Word {index + 1} of {ARABIC_LESSON.length}</Text>
    </View>
    <View style={styles.stepDots}>{ARABIC_LESSON.map((x,i) => <View key={x.word} style={[styles.stepDot, i <= index && styles.stepDotActive]} />)}</View>
    {completed ? <ArabicStarterQuiz onReview={() => {setIndex(0);setRevealed(false);setCompleted(false);}} /> : <Button title={index === ARABIC_LESSON.length - 1 ? "Finish starter lesson" : "Next word"} onPress={next} />}
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Unlock the full Arabic course</Text>
      <Text style={styles.progressHint}>Ayah Plus is planned to include structured lessons in reading, vocabulary, grammar, sentence building and guided practice.</Text>
      <Text style={styles.lockedLabel}>AYAH PLUS · PLANNED</Text>
      <Button title="Explore Ayah Plus" onPress={onPremium} secondary />
    </View>
    <Text style={styles.tinyNote}>This starter lesson is a small learning preview. More lessons will be reviewed for accuracy before release.</Text>
  </>;
}

const ALPHABET_LESSON = [
  { letter: "ا", name: "Alif", sound: "A long or open vowel carrier in many beginner examples.", word: "أَسَدٌ", wordName: "asadun", meaning: "a lion" },
  { letter: "ب", name: "Bā’", sound: "A b sound.", word: "بَابٌ", wordName: "bābun", meaning: "a door" },
  { letter: "ت", name: "Tā’", sound: "A t sound.", word: "تِينٌ", wordName: "tīnun", meaning: "figs" },
  { letter: "ث", name: "Thā’", sound: "A th sound, as in “think”.", word: "ثَوْبٌ", wordName: "thawbun", meaning: "a garment" },
  { letter: "ج", name: "Jīm", sound: "A j sound in many varieties of standard Arabic teaching.", word: "جَمَلٌ", wordName: "jamalun", meaning: "a camel" },
  { letter: "ح", name: "Ḥā’", sound: "A distinct breathy, throaty h sound. It is not the same as ه.", word: "حَلِيبٌ", wordName: "ḥalībun", meaning: "milk" },
  { letter: "خ", name: "Khā’", sound: "A throaty kh sound.", word: "خُبْزٌ", wordName: "khubzun", meaning: "bread" },
  { letter: "د", name: "Dāl", sound: "A d sound.", word: "دَارٌ", wordName: "dārun", meaning: "a home" }
];
function ArabicAlphabetScreen({ onPremium }) {
  const [selected, setSelected] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const quizLetters = [1, 3, 5, 7];
  const target = ALPHABET_LESSON[quizLetters[quizIndex]];
  const choices = [target, ALPHABET_LESSON[(quizLetters[quizIndex] + 2) % 8], ALPHABET_LESSON[(quizLetters[quizIndex] + 5) % 8]];
  const submitAnswer = () => {
    if (!quizAnswer) return;
    if (quizAnswer === target.letter) setQuizScore(n => n + 1);
    if (quizIndex === quizLetters.length - 1) setQuizDone(true);
    else { setQuizIndex(n => n + 1); setQuizAnswer(""); }
  };
  const restartQuiz = () => { setQuizIndex(0); setQuizAnswer(""); setQuizScore(0); setQuizDone(false); };
  const item = ALPHABET_LESSON[selected];
  return <>
    <Header eyebrow="ARABIC ACADEMY · LEVEL 1" title="Meet the Arabic letters" />
    <View style={styles.infoCard}>
      <Text style={styles.cardEyebrow}>LETTER CLASSROOM · FIRST 8 LETTERS</Text>
      <Text style={styles.progressHint}>Tap a letter to explore its name and a beginner example. Arabic letters can change shape when they join other letters; connected forms will be a later lesson.</Text>
      <View style={styles.alphabetGrid}>
        {ALPHABET_LESSON.map((entry, index) => <Pressable key={entry.letter} accessibilityRole="button" accessibilityLabel={entry.name} onPress={() => {setSelected(index);setShowWord(false);}} style={[styles.alphabetTile, selected === index && styles.choiceSelected]}>
          <Text style={[styles.alphabetTileLetter, selected === index && styles.choiceTextSelected]}>{entry.letter}</Text>
          <Text style={styles.alphabetTileName}>{entry.name}</Text>
        </Pressable>)}
      </View>
    </View>
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>LETTER {selected + 1} OF {ALPHABET_LESSON.length}</Text>
      <Text style={styles.alphabetHeroLetter} writingDirection="rtl">{item.letter}</Text>
      <Text style={styles.teacherName}>{item.name}</Text>
      <Text style={styles.progressHint}>{item.sound}</Text>
      <Button title={showWord ? "Hide example word" : "See an example word"} secondary onPress={() => setShowWord(v => !v)} />
      {showWord && <View style={styles.exampleBox}>
        <Text style={styles.exampleArabic} writingDirection="rtl">{item.word}</Text>
        <Text style={styles.translation}>{item.wordName} · {item.meaning}</Text>
      </View>}
      <View style={styles.rowButtons}>
        <View style={styles.rowButtonCell}><Button title="Previous" secondary disabled={selected === 0} onPress={() => {setSelected(n => Math.max(0,n-1));setShowWord(false);}} /></View>
        <View style={styles.rowButtonCell}><Button title={selected === ALPHABET_LESSON.length - 1 ? "Back to Alif" : "Next letter"} onPress={() => {setSelected(n => (n + 1) % ALPHABET_LESSON.length);setShowWord(false);}} /></View>
      </View>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.cardEyebrow}>QUICK CHECK · 4 QUESTIONS</Text>
      <Text style={styles.sectionTitle}>Find the letter</Text>
      {quizDone ? <>
        <Text style={styles.quizScore}>{quizScore} / {quizLetters.length}</Text>
        <Text style={styles.progressHint}>{quizScore === 4 ? "Excellent recognition!" : "Nice effort. Review the letters and try again."}</Text>
        <Button title="Try again" onPress={restartQuiz} />
      </> : <>
        <Text style={styles.quizPrompt}>Which letter is {target.name}?</Text>
        {choices.map(option => <Pressable key={option.letter} onPress={() => setQuizAnswer(option.letter)} style={[styles.choice, quizAnswer === option.letter && styles.choiceSelected]}>
          <Text style={styles.alphabetOption}>{option.letter}</Text>
          <Text style={styles.choiceMark}>{quizAnswer === option.letter ? "✓" : "○"}</Text>
        </Pressable>)}
        <Button title={quizIndex === quizLetters.length - 1 ? "Finish checkpoint" : "Next question"} disabled={!quizAnswer} onPress={submitAnswer} />
      </>}
      <Text style={styles.tinyNote}>This is a letter-recognition exercise, not a pronunciation assessment. Listen to a qualified Arabic teacher for accurate sound practice.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Continue your Arabic journey</Text>
      <Text style={styles.progressHint}>The full course is planned to cover all 28 letters, connected letter shapes, short vowels, reading practice, vocabulary and grammar.</Text>
      <Text style={styles.lockedLabel}>MORE LESSONS · PLANNED</Text>
      <Button title="Explore Ayah Plus" secondary onPress={onPremium} />
    </View>
  </>;
}


function SettingsScreen({ themeName, onSelectTheme, language, onSelectLanguage, dailyGoal, onSelectGoal, remindersEnabled, onToggleReminders, practiceCount, onBack }) {
  const options = [
    { id:"auto", name:"Auto", note:"Follow your device appearance" },
    { id:"light", name:"Light", note:"Bright background and dark text" },
    { id:"sepia", name:"Sepia", note:"Warm cream and golden-brown tones" },
    { id:"dark", name:"Dark", note:"Deep navy background and light text" }
  ];
  const languages = ["English", "العربية", "اردو", "বাংলা", "Türkçe", "Français", "Bahasa Indonesia"];
  const goals = [5, 10, 15, 20];
  return <>
    <Header eyebrow="APP SETTINGS" title="Settings" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <Text style={styles.progressHint}>Choose comfortable colors. Auto follows your device setting, so it can look the same as Dark when your device is in dark mode.</Text>
      {options.map(option => <Pressable key={option.id} onPress={() => onSelectTheme(option.id)} style={[styles.themeOption, themeName === option.id && styles.choiceSelected]}>
        <View style={styles.themeSwatches}>
          <View style={[styles.swatch,{backgroundColor:option.id==="sepia"?"#E8DDC8":option.id==="light"?"#F5F7FA":"#101C2D"}]} />
          <View style={[styles.swatch,{backgroundColor:option.id==="sepia"?"#8A672E":option.id==="light"?"#A87924":"#D9B96E"}]} />
          <View style={[styles.swatch,{backgroundColor:option.id==="sepia"?"#F5EBD8":option.id==="light"?"#FFFFFF":"#1B2A40"}]} />
        </View>
        <View style={styles.themeTextWrap}><Text style={styles.choiceText}>{option.name}</Text><Text style={styles.themeNote}>{option.note}</Text></View>
        <Text style={styles.choiceMark}>{themeName === option.id ? "✓" : "○"}</Text>
      </Pressable>)}
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Learning preferences</Text>
      <Text style={styles.progressHint}>Choose the language for app guidance and your daily learning target. These preferences are currently kept while the app stays open.</Text>
      <Text style={styles.settingLabel}>Preferred language</Text>
      <View style={styles.languageGrid}>{languages.map(item => <Pressable key={item} onPress={() => onSelectLanguage(item)} style={[styles.languageChoice, language === item && styles.choiceSelected]}><Text style={[styles.choiceText, language === item && styles.choiceTextSelected]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.settingLabel}>Daily learning goal</Text>
      <View style={styles.languageGrid}>{goals.map(minutes => <Pressable key={minutes} onPress={() => onSelectGoal(minutes)} style={[styles.goalChoice, dailyGoal === minutes && styles.choiceSelected]}><Text style={[styles.choiceText, dailyGoal === minutes && styles.choiceTextSelected]}>{minutes} min</Text></Pressable>)}</View>
      <View style={styles.settingRow}><View style={styles.settingTextWrap}><Text style={styles.choiceText}>Learning reminders</Text><Text style={styles.themeNote}>Preference only; notifications are not connected yet.</Text></View><Pressable accessibilityRole="switch" accessibilityState={{checked:remindersEnabled}} onPress={onToggleReminders} style={[styles.toggle, remindersEnabled && styles.toggleOn]}><View style={[styles.toggleKnob, remindersEnabled && styles.toggleKnobOn]} /></Pressable></View>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your learning</Text>
      <Text style={styles.progressHint}>Practice sessions completed in this app session: {practiceCount}</Text>
      <Text style={styles.tinyNote}>Account sign-in, cloud syncing, saved preferences and cross-device progress will be connected after secure authentication is set up.</Text>
    </View>
    <Button title="Back to Ayah" secondary onPress={onBack} />
  </>;
}

function FullMemorizationTrackingScreen({ progress, onSetStatus, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!AYAH_API_BASE) return;
    let active = true;
    setLoading(true);
    fetch((AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE) + "/chapters")
      .then(response => { if (!response.ok) throw new Error("Unable to load surahs"); return response.json(); })
      .then(data => { if (active) setChapters(Array.isArray(data.chapters) ? data.chapters : []); })
      .catch(() => { if (active) setError("Connect the verified Ayah content server to load all 114 surahs."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const chapter = chapters.find(item => String(item.id) === String(chapterId));
  const total = Number(chapter?.verses_count || 0);
  const statuses = progress?.[chapterId] || {};
  const counts = { learning: 0, memorized: 0, revision: 0 };
  Object.values(statuses).forEach(value => { if (counts[value] !== undefined) counts[value] += 1; });
  const completed = counts.memorized;
  const percent = total ? Math.round(completed / total * 100) : 0;
  const cycle = { none: "learning", learning: "memorized", memorized: "revision", revision: "none" };
  const labels = { none: "Not started", learning: "Learning", memorized: "Memorized", revision: "Needs revision" };
  const colors = { none: MUTED, learning: "#D9B96E", memorized: "#78B88A", revision: "#D68B78" };
  const update = verse => onSetStatus(chapterId, String(verse), cycle[statuses[String(verse)] || "none"]);
  return <>
    <Header eyebrow="HIFDH TRACKER" title="Full Qur’an memorization" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Choose a surah</Text>
      {loading ? <ActivityIndicator color={GOLD} /> : null}
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
      {!AYAH_API_BASE ? <Text style={styles.progressHint}>The tracker supports all 114 surahs once the verified Qur’an content server is connected. No Qur’an text is generated here.</Text> : null}
      {chapters.length > 0 ? <View style={styles.languageGrid}>{chapters.map(item => <Pressable key={item.id} onPress={() => setChapterId(String(item.id))} style={[styles.goalChoice, String(item.id) === String(chapterId) && styles.choiceSelected]}><Text style={[styles.choiceText, String(item.id) === String(chapterId) && styles.choiceTextSelected]}>{item.id}. {item.name_simple}</Text></Pressable>)}</View> : null}
    </View>
    {chapter ? <>
      <View style={styles.lessonCard}>
        <Text style={styles.cardEyebrow}>SURAH {chapter.id}</Text>
        <Text style={styles.sectionTitle}>{chapter.name_simple}</Text>
        <Text style={styles.progressHint}>{completed} of {total} ayahs marked memorized · {percent}%</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill,{width:percent + "%"}]} /></View>
        <View style={styles.languageGrid}>
          <View style={styles.goalChoice}><Text style={styles.choiceText}>Learning: {counts.learning}</Text></View>
          <View style={styles.goalChoice}><Text style={styles.choiceText}>Memorized: {counts.memorized}</Text></View>
          <View style={styles.goalChoice}><Text style={styles.choiceText}>Revision: {counts.revision}</Text></View>
        </View>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Ayah-by-ayah tracker</Text>
        <Text style={styles.progressHint}>Tap an ayah to cycle through Learning → Memorized → Needs revision → Not started. These are your own progress labels, not an automatic recitation assessment.</Text>
        <View style={styles.alphabetGrid}>{Array.from({length:total},(_,index)=>index+1).map(verse => {
          const status = statuses[String(verse)] || "none";
          return <Pressable key={verse} accessibilityRole="button" accessibilityLabel={"Ayah " + verse + ", " + labels[status] + ". Change status."} onPress={() => update(verse)} style={[styles.alphabetTile,{borderWidth:1,borderColor:status === "none" ? BORDER : colors[status]}]}>
            <Text style={[styles.choiceText,{color:colors[status],fontWeight:"800"}]}>{verse}</Text>
            <Text style={styles.alphabetTileName}>{status === "none" ? "—" : labels[status]}</Text>
          </Pressable>;
        })}</View>
      </View>
    </> : null}
    <View style={styles.infoCard}>
      <Text style={styles.tinyNote}>Your status changes are saved on this device. Account sync and detailed history will be added after secure sign-in is implemented. Please use a trusted mushaf and teacher to verify memorization.</Text>
      <Button title="Back to progress" secondary onPress={onBack} />
    </View>
  </>;
}
function ProgressScreen({ practiceCount, dailyGoal, language, onLearn, onSettings, reviewRecords, onRevision, onTracking }) {
  const records = reviewRecords || {};
  const practiced = PRACTICE_PASSAGES.filter(item => records[item.id]);
  const dueCount = practiced.filter(item => new Date(records[item.id].dueAt || 0).getTime() <= Date.now()).length;
  const comfortableCount = practiced.filter(item => records[item.id].rating === "easy").length;
  const developingCount = practiced.filter(item => records[item.id].rating === "medium").length;
  const needsPracticeCount = practiced.filter(item => records[item.id].rating === "difficult").length;
  const totalReviews = Object.values(records).reduce((sum, item) => sum + (Number(item.attempts) || 1), 0);
  const lastActivity = practiced.map(item => records[item.id].lastReviewedAt).filter(Boolean).sort().reverse()[0];
  const statusLabel = rating => rating === "easy" ? "Comfortable" : rating === "medium" ? "Building confidence" : rating === "difficult" ? "Needs practice" : "Not rated";
  return <>
    <Header eyebrow="YOUR JOURNEY" title="My learning progress" />
    <View style={styles.infoCard}>
      <Text style={styles.cardEyebrow}>PRACTICE ACTIVITY</Text>
      <Text style={styles.quizScore}>{practiceCount}</Text>
      <Text style={styles.sectionTitle}>Completed memorization sessions</Text>
      <Text style={styles.progressHint}>This is the number of practice sessions recorded on this device. It does not measure recitation accuracy.</Text>
      <View style={styles.readerToggleRow}>
        <View style={[styles.readerToggle, styles.readerToggleActive]}><Text style={styles.readerToggleText}>Ayahs practiced: {practiced.length}</Text></View>
        <View style={[styles.readerToggle, styles.readerToggleActive]}><Text style={styles.readerToggleText}>Review ratings: {totalReviews}</Text></View>
      </View>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Memorization overview</Text>
      <Text style={styles.progressHint}>Your current practice set contains {PRACTICE_PASSAGES.length} sample ayahs. Status is based on your own review check-in, not an automatic memorization test.</Text>
      {PRACTICE_PASSAGES.map(item => {
        const record = records[item.id];
        return <View key={item.id} style={styles.choice}>
          <View style={{flex:1,paddingRight:8}}>
            <Text style={styles.choiceText}>{item.surah} · Ayah {item.verse}</Text>
            <Text style={styles.reference}>{statusLabel(record?.rating)}{record?.dueAt ? " · Review " + (new Date(record.dueAt).getTime() <= Date.now() ? "due now" : "scheduled") : " · Not practiced yet"}</Text>
          </View>
          <Text style={styles.choiceMark}>{record ? "✓" : "○"}</Text>
        </View>;
      })}
      <View style={styles.languageGrid}>
        <View style={[styles.goalChoice,{flexGrow:1}]}><Text style={styles.choiceText}>Comfortable: {comfortableCount}</Text></View>
        <View style={[styles.goalChoice,{flexGrow:1}]}><Text style={styles.choiceText}>Building: {developingCount}</Text></View>
        <View style={[styles.goalChoice,{flexGrow:1}]}><Text style={styles.choiceText}>Needs practice: {needsPracticeCount}</Text></View>
      </View>
      <Button title={"Open Smart Revision · " + dueCount + " due"} onPress={onRevision} />
      <Button title="Track all 114 surahs" secondary onPress={onTracking} />
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your daily learning goal</Text>
      <Text style={styles.progressHint}>Your selected target is {dailyGoal} minutes per day. Ayah does not yet measure active study time, so it will not claim that this goal has been reached.</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill,{width:"0%"}]} /></View>
      <Text style={styles.reference}>Daily time tracking is not connected yet.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Learning activity</Text>
      <Text style={styles.progressHint}>Total review check-ins: {totalReviews}</Text>
      <Text style={styles.progressHint}>Last review check-in: {lastActivity ? new Date(lastActivity).toLocaleDateString() : "No review check-ins yet"}</Text>
      <Text style={styles.progressHint}>Preferred guidance language: {language}</Text>
      <Button title="Continue learning" onPress={onLearn} />
      <Button title="Update preferences" secondary onPress={onSettings} />
    </View>
    <Text style={styles.tinyNote}>This dashboard currently summarizes the three built-in practice ayahs and locally saved review ratings. Full-surah tracking, verified recitation assessment, weekly history and cloud-synced analytics are future steps.</Text>
  </>;
}
export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState("home");
  const [practiceCount, setPracticeCount] = usePersistentState("practiceCount", 0);
  const [memorizationPlan, setMemorizationPlan] = usePersistentState("memorizationPlan", { dailyTarget: 1, daysPerWeek: 5, focus: "balanced" });
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [reviewRecords, setReviewRecords] = usePersistentState("reviewRecords", {});
  const [memorizationProgress, setMemorizationProgress] = usePersistentState("memorizationProgress", {});
  const saveReviewRating = (id, rating) => { const days = rating === "difficult" ? 1 : rating === "medium" ? 3 : 7; const previous = reviewRecords[id] || {}; setReviewRecords(current => ({ ...current, [id]: { rating, lastReviewedAt: new Date().toISOString(), dueAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(), attempts: (previous.attempts || 0) + 1 } })); };
  const [savedIds, setSavedIds] = usePersistentState("savedIds", []);
  const [savedVerseDetails, setSavedVerseDetails] = usePersistentState("savedVerseDetails", {});
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [themeName, setThemeName] = usePersistentState("themeName", "auto");
  const [learningLanguage, setLearningLanguage] = usePersistentState("learningLanguage", "English");
  const [dailyGoal, setDailyGoal] = usePersistentState("dailyGoal", 10);
  const [remindersEnabled, setRemindersEnabled] = usePersistentState("remindersEnabled", false);
  const systemScheme = useColorScheme();
  const activeTheme = themeName === "auto" ? (systemScheme === "light" ? "light" : "dark") : themeName;
  styles = createStyles(THEME_PALETTES[activeTheme] || THEME_PALETTES.dark);
  const navigate = key => {
    if (["review", "listen", "teacher"].includes(key)) {
      setTab("premium");
    } else {
      setTab(key);
    }
  };
  const continueEmail = email => {
    if (typeof email === "string" && email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Check your email", "Please enter a valid email address.");
      return;
    }
    setSignedIn(true);
  };
  const googlePlaceholder = () => Alert.alert("Google sign-in", "Google authentication will be connected in a later development step. You can use the preview for now.");
  if (!signedIn) return <SafeAreaView style={styles.safeArea}><StatusBar barStyle={activeTheme === "light" || activeTheme === "sepia" ? "dark-content" : "light-content"} /><WelcomeScreen onEmailContinue={continueEmail} onGoogle={googlePlaceholder} /></SafeAreaView>;
  let screen;
  if (tab === "libraryReader" && selectedChapter) screen = <QuranReaderScreen chapter={selectedChapter} onBack={() => setTab("library")} savedIds={savedIds} onToggleSave={(id, detail) => { setSavedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); setSavedVerseDetails(current => { const next = { ...current }; if (savedIds.includes(id)) delete next[id]; else next[id] = detail; return next; }); }} />;
  else if (tab === "library") screen = <QuranLibraryScreen onOpenChapter={chapter => { setSelectedChapter(chapter); setTab("libraryReader"); }} />;
  else if (tab === "tracking") screen = <FullMemorizationTrackingScreen progress={memorizationProgress} onSetStatus={(surahId, verse, status) => setMemorizationProgress(current => { const next = { ...current, [surahId]: { ...(current[surahId] || {}) } }; if (status === "none") delete next[surahId][verse]; else next[surahId][verse] = status; return next; })} onBack={() => setTab("progress")} />;
  else if (tab === "revision") screen = <SmartRevisionScreen records={reviewRecords} onRateReview={saveReviewRating} onStartPractice={() => setTab("memorize")} />;
  else if (tab === "plan") screen = <MemorizationPlanScreen plan={memorizationPlan} onSavePlan={setMemorizationPlan} onStartPractice={() => setTab("memorize")} onBuildSession={() => { setActiveAssignment(null); setTab("buildSession"); }} onStartAssignment={assignment => { setActiveAssignment(assignment); setTab("buildSession"); }} practiceCount={practiceCount} />;
  else if (tab === "buildSession") screen = <BuildMemorizationSessionScreen onBack={() => setTab("memorize")} initialAssignment={activeAssignment} onFinishAssignment={assignment => { setMemorizationPlan(current => ({ ...current, schedule: (current.schedule || []).map(item => item.date === assignment.date && item.startVerse === assignment.startVerse && item.endVerse === assignment.endVerse ? { ...item, completed: true, completedAt: new Date().toISOString() } : item) })); setActiveAssignment(null); }} onProgressUpdate={(surahId, verse, status) => setMemorizationProgress(current => ({ ...current, [surahId]: { ...(current[surahId] || {}), [verse]: status } }))} />;
  else if (tab === "memorize") screen = <MemorizeScreen onPracticed={() => setPracticeCount(n => n + 1)} onBuildSession={() => setTab("buildSession")} onPracticeCompleted={id => { const map = { fatiha2: ["1","2"], ikhlas1: ["112","1"], asr1: ["103","1"] }; const ref = map[id]; if (ref) setMemorizationProgress(current => ({ ...current, [ref[0]]: { ...(current[ref[0]] || {}), [ref[1]]: current[ref[0]]?.[ref[1]] === "memorized" ? "memorized" : "learning" } })); }} onSyncRating={(id, rating) => { const map = { fatiha2: ["1","2"], ikhlas1: ["112","1"], asr1: ["103","1"] }; const ref = map[id]; if (ref) setMemorizationProgress(current => ({ ...current, [ref[0]]: { ...(current[ref[0]] || {}), [ref[1]]: rating === "easy" ? "memorized" : rating === "difficult" ? "revision" : "learning" } })); }} savedIds={savedIds} onToggleSave={id => setSavedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])} onSaved={() => setTab("saved")} onRateReview={saveReviewRating} reviewRecords={reviewRecords} />;
  else if (tab === "saved") screen = <SavedAyahsScreen savedIds={savedIds} savedVerseDetails={savedVerseDetails} onToggleSave={id => { setSavedIds(ids => ids.filter(x => x !== id)); setSavedVerseDetails(current => { const next = { ...current }; delete next[id]; return next; }); }} onLearn={() => setTab("memorize")} />;
  else if (tab === "arabic") screen = <ArabicLessonsScreen onPremium={() => setTab("premium")} />;
  else if (tab === "arabicAlphabet") screen = <ArabicAlphabetScreen onPremium={() => setTab("premium")} />;
  else if (tab === "teacher") screen = <TeacherPreviewScreen onBack={() => setTab("home")} onPremium={() => setTab("premium")} />;
  else if (tab === "review" || tab === "listen") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} />;
  else if (tab === "settings") screen = <SettingsScreen themeName={themeName} onSelectTheme={setThemeName} language={learningLanguage} onSelectLanguage={setLearningLanguage} dailyGoal={dailyGoal} onSelectGoal={setDailyGoal} remindersEnabled={remindersEnabled} onToggleReminders={() => setRemindersEnabled(v => !v)} practiceCount={practiceCount} onBack={() => setTab("home")} />;
  else if (tab === "progress") screen = <ProgressScreen practiceCount={practiceCount} dailyGoal={dailyGoal} language={learningLanguage} reviewRecords={reviewRecords} onRevision={() => setTab("revision")} onTracking={() => setTab("tracking")} onLearn={() => setTab("memorize")} onSettings={() => setTab("settings")} />;
  else if (tab === "premium") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} />;
  else screen = <HomeScreen onNavigate={navigate} onPractice={() => setTab("memorize")} />;
  const tabs = [["home", "⌂", "Home"], ["library", "📖", "Qur’an"], ["memorize", "۞", "Learn"], ["settings", "⚙", "Appearance"], ["premium", "✧", "Ayah Plus"]];
  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle={activeTheme === "light" || activeTheme === "sepia" ? "dark-content" : "light-content"} backgroundColor={THEME_PALETTES[activeTheme].bg} /><View style={styles.appShell}><ScrollView contentContainerStyle={styles.container}>{screen}</ScrollView><View style={styles.bottomNav}>{tabs.map(([key, icon, label]) => <Pressable key={key} onPress={() => navigate(key)} style={styles.navButton}><Text style={[styles.navIcon, tab === key && styles.navSelected]}>{icon}</Text><Text style={[styles.navLabel, tab === key && styles.navSelected]}>{label}</Text></Pressable>)}</View></View></SafeAreaView>;
}
const createStyles = (p) => StyleSheet.create({
  safeArea:{flex:1,backgroundColor:p.bg}, appShell:{flex:1}, container:{padding:22,paddingBottom:28,flexGrow:1},
  welcomeBackground:{flex:1,justifyContent:"center"}, welcomeShade:{flex:1,backgroundColor:"rgba(8,17,30,0.68)",padding:20,justifyContent:"center"},
  welcomeTop:{alignItems:"center",marginBottom:18}, logo:{width:54,height:54,borderRadius:18,backgroundColor:p.panel,borderWidth:1,borderColor:"#53617A",alignItems:"center",justifyContent:"center",marginBottom:8},
  logoArabic:{color:p.accent,fontSize:24,fontWeight:"700"},brand:{color:p.text,fontSize:17,fontWeight:"800",letterSpacing:5},tagline:{color:"#D5DCE6",fontSize:12,marginTop:7,textAlign:"center"},
  dailyCard:{backgroundColor:"rgba(27,42,64,0.88)",borderRadius:24,padding:20,borderWidth:1,borderColor:"rgba(217,185,110,0.38)",marginBottom:16},
  dailyCardCompact:{marginBottom:14},cardEyebrow:{color:p.accent,fontSize:10,letterSpacing:2,fontWeight:"700",textAlign:"center"},
  dailyArabic:{color:p.text,fontSize:29,lineHeight:58,textAlign:"center",marginTop:14,marginBottom:9},translation:{color:p.soft,fontSize:14,textAlign:"center",lineHeight:23,marginBottom:7},
  reference:{color:p.muted,fontSize:11,textAlign:"center",marginTop:7},signInCard:{backgroundColor:"rgba(16,28,45,0.94)",borderRadius:22,padding:18,borderWidth:1,borderColor:p.border},
  signInTitle:{color:p.text,fontSize:19,fontWeight:"700",textAlign:"center"},signInCopy:{color:p.muted,fontSize:12,textAlign:"center",lineHeight:19,marginTop:7},
  emailArea:{marginTop:12},emailInput:{backgroundColor:p.surface,borderWidth:1,borderColor:"#53617A",borderRadius:12,padding:13,color:p.text,fontSize:14},
  tinyNote:{color:p.muted,fontSize:10,lineHeight:16,textAlign:"center",marginTop:12},button:{backgroundColor:GOLD,borderRadius:14,paddingVertical:14,paddingHorizontal:16,alignItems:"center",marginTop:12},
  buttonSecondary:{backgroundColor:"transparent",borderWidth:1,borderColor:GOLD},buttonText:{color:p.navyText,fontWeight:"700",fontSize:13},buttonTextSecondary:{color:p.accent},disabled:{opacity:0.55},pressed:{opacity:0.76},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:14,marginBottom:23},eyebrow:{color:p.accent,fontSize:10,letterSpacing:2,fontWeight:"700",marginBottom:7},
  heading:{color:p.text,fontSize:22,fontWeight:"700"},pageHeader:{marginTop:18,marginBottom:23},pageTitle:{color:p.text,fontSize:27,fontWeight:"700"},
  progressCard:{backgroundColor:p.panel,borderRadius:18,padding:18,borderWidth:1,borderColor:p.border,marginBottom:24},
  progressTrack:{height:12,backgroundColor:p.surface,borderRadius:8,overflow:"hidden",marginTop:16},progressFill:{height:12,backgroundColor:p.accent,borderRadius:8},
  sectionTitle:{color:p.text,fontSize:17,fontWeight:"700",marginBottom:10},progressHint:{color:p.muted,fontSize:12,marginTop:9,lineHeight:19},
  actionGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",marginTop:4},actionTile:{width:"48%",backgroundColor:p.panel,borderRadius:18,padding:15,marginBottom:12,borderWidth:1,borderColor:p.border,minHeight:118},
  tileTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},actionIcon:{color:p.accent,fontSize:23,marginBottom:10},lock:{color:p.accent,fontSize:9,letterSpacing:1,fontWeight:"800"},
  actionTitle:{color:p.text,fontSize:14,fontWeight:"700",marginBottom:5},actionSubtitle:{color:p.muted,fontSize:11},
  premiumBanner:{backgroundColor:"#25364B",borderRadius:18,padding:17,borderWidth:1,borderColor:"#8D784B",marginTop:8},premiumTitle:{color:p.accent,fontSize:17,fontWeight:"700"},
  lessonCard:{backgroundColor:p.panel,borderRadius:22,padding:20,borderWidth:1,borderColor:p.border,marginBottom:15},infoCard:{backgroundColor:p.panel,borderRadius:20,padding:18,borderWidth:1,borderColor:p.border,marginTop:16,marginBottom:16},
  stepText:{color:p.soft,fontSize:13,lineHeight:21,marginBottom:9},choice:{backgroundColor:p.surface,borderRadius:13,padding:14,marginTop:9,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  choiceSelected:{borderWidth:1,borderColor:GOLD},choiceText:{color:p.soft,fontSize:13},choiceTextSelected:{color:p.accent,fontWeight:"700"},choiceMark:{color:p.accent,fontSize:17},
  teacherCard:{backgroundColor:p.panel,borderRadius:22,padding:20,alignItems:"center",borderWidth:1,borderColor:"#8D784B"},
  teacherAvatar:{width:76,height:76,borderRadius:38,backgroundColor:"#2C4059",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:GOLD},
  teacherAvatarText:{color:p.accent,fontSize:34},teacherName:{color:p.text,fontSize:23,fontWeight:"700",marginTop:12},assistantChoices:{flexDirection:"row",gap:10,marginTop:15},
  nameChoice:{paddingVertical:10,paddingHorizontal:22,borderRadius:12,backgroundColor:p.surface},lockedLabel:{color:p.accent,fontSize:10,fontWeight:"800",letterSpacing:1,marginTop:12},
  premiumHero:{backgroundColor:"#263A50",borderRadius:22,padding:22,borderWidth:1,borderColor:"#8D784B",marginBottom:16},
  premiumKicker:{color:p.accent,fontSize:10,letterSpacing:1.5,fontWeight:"800"},premiumBig:{color:p.text,fontSize:25,fontWeight:"800",marginTop:14,marginBottom:10},
  trialCard:{backgroundColor:p.panel,borderRadius:20,padding:18,borderWidth:1,borderColor:GOLD,marginBottom:14},
  languageGrid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},languageChoice:{backgroundColor:p.surface,borderRadius:12,paddingVertical:10,paddingHorizontal:13},
  practicePrompt:{backgroundColor:p.surface,borderRadius:14,padding:15,marginTop:10},practicePromptText:{color:p.accent,fontSize:14,fontWeight:"600",textAlign:"center",lineHeight:22},
  quizPrompt:{color:p.text,fontSize:17,fontWeight:"700",lineHeight:25,marginTop:14,marginBottom:6},quizScore:{color:p.accent,fontSize:36,fontWeight:"800",textAlign:"center",marginVertical:12},
  freeLessonBadge:{backgroundColor:p.surface,borderRadius:12,padding:10,alignSelf:"flex-start",borderWidth:1,borderColor:GOLD,marginBottom:8},freeLessonBadgeText:{color:p.accent,fontSize:10,fontWeight:"800",letterSpacing:1.2},
  exampleBox:{backgroundColor:p.surface,borderRadius:14,padding:14,marginTop:14,alignItems:"center"},exampleArabic:{color:p.text,fontSize:24,lineHeight:42,textAlign:"center"},
  navButton:{alignItems:"center",minWidth:58,paddingVertical:4},bottomNav:{flexDirection:"row",justifyContent:"space-around",borderTopWidth:1,borderTopColor:"#34445B",paddingTop:10,paddingBottom:7,backgroundColor:p.bg},
  savedAyah:{backgroundColor:p.surface,borderRadius:15,padding:13,marginTop:12},
  readerTools:{backgroundColor:p.surface,borderRadius:15,padding:14,marginTop:15,marginBottom:4},
  readerToolRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  readerToolLabel:{color:p.text,fontSize:13,fontWeight:"700"},
  readerSizeControls:{flexDirection:"row",alignItems:"center",gap:12},
  readerSizeButton:{backgroundColor:p.panel,borderRadius:9,paddingVertical:8,paddingHorizontal:12,borderWidth:1,borderColor:p.border},
  readerSizeButtonText:{color:p.accent,fontWeight:"800",fontSize:14},
  readerSizeValue:{color:p.text,fontSize:12,minWidth:20,textAlign:"center"},
  readerToggleRow:{flexDirection:"row",gap:8,marginTop:12},
  readerToggle:{flex:1,backgroundColor:p.panel,borderRadius:10,paddingVertical:10,paddingHorizontal:7,alignItems:"center",borderWidth:1,borderColor:p.border},
  readerToggleActive:{borderColor:p.accent},
  readerToggleText:{color:p.muted,fontSize:10,fontWeight:"600",textAlign:"center"},
  readerToggleTextActive:{color:p.accent},
  apiNotice:{backgroundColor:p.surface,borderRadius:14,padding:14,marginTop:14},chapterRow:{flexDirection:"row",alignItems:"center",paddingVertical:13,borderBottomWidth:1,borderBottomColor:p.border,gap:11},chapterNumber:{width:34,height:34,borderRadius:10,backgroundColor:p.surface,alignItems:"center",justifyContent:"center"},chapterNumberText:{color:p.accent,fontWeight:"800"},chapterDetails:{flex:1},chapterArabic:{color:p.text,fontSize:19},chapterArabicLarge:{color:p.text,fontSize:34,textAlign:"center",marginVertical:12},verseCard:{backgroundColor:p.surface,borderRadius:15,padding:14,marginTop:14},verseMeta:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},verseNumber:{color:p.accent,fontWeight:"800"},verseBookmark:{color:p.accent,fontSize:12,fontWeight:"700"},verseArabic:{color:p.text,fontSize:27,lineHeight:54,textAlign:"right",marginTop:13},
  navIcon:{color:p.muted,fontSize:19,marginBottom:3},navLabel:{color:p.muted,fontSize:10},navSelected:{color:p.accent,fontWeight:"700"},
  stepDots:{flexDirection:"row",justifyContent:"center",gap:9,marginTop:4,marginBottom:8},stepDot:{width:8,height:8,borderRadius:4,backgroundColor:"#43536A"},stepDotActive:{backgroundColor:GOLD},
  rowButtons:{flexDirection:"row",gap:10},rowButtonCell:{flex:1},
  settingsButton:{backgroundColor:p.panel,borderWidth:1,borderColor:p.border,borderRadius:12,paddingVertical:9,paddingHorizontal:12,marginRight:8},settingsButtonText:{color:p.accent,fontSize:11,fontWeight:"700"},settingLabel:{color:p.accent,fontSize:11,fontWeight:"800",letterSpacing:1,marginTop:18,marginBottom:3},settingRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:18,paddingTop:14,borderTopWidth:1,borderTopColor:p.border},settingTextWrap:{flex:1,paddingRight:12},goalChoice:{backgroundColor:p.surface,borderRadius:12,paddingVertical:11,paddingHorizontal:16},toggle:{width:48,height:28,borderRadius:15,backgroundColor:p.surface,borderWidth:1,borderColor:p.border,justifyContent:"center",padding:3},toggleOn:{backgroundColor:p.accent,alignItems:"flex-end"},toggleKnob:{width:20,height:20,borderRadius:10,backgroundColor:"#FFFFFF"},toggleKnobOn:{backgroundColor:"#101C2D"},themeOption:{backgroundColor:p.surface,borderRadius:14,padding:13,marginTop:10,flexDirection:"row",alignItems:"center",gap:10},themeSwatches:{flexDirection:"row",gap:4},swatch:{width:15,height:28,borderRadius:5},themeTextWrap:{flex:1},themeNote:{color:p.muted,fontSize:10,marginTop:3},
  alphabetGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",marginTop:14},alphabetTile:{width:"23%",minHeight:82,backgroundColor:p.surface,borderRadius:14,marginBottom:9,alignItems:"center",justifyContent:"center",padding:6},alphabetTileLetter:{color:p.text,fontSize:28,lineHeight:38},alphabetTileName:{color:p.muted,fontSize:9,marginTop:3},alphabetHeroLetter:{color:p.text,fontSize:76,lineHeight:104,textAlign:"center",marginTop:10},alphabetOption:{color:p.text,fontSize:30,lineHeight:38}
});
let styles = createStyles(THEME_PALETTES.dark);