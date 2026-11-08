import React, { useEffect, useState } from "react";
import * as Font from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme,
  Pressable, TextInput, ImageBackground, Alert, ActivityIndicator
} from "react-native";

const PREFERENCES_KEY = "@ayah/preferences-v1";

function formatAudioTime(seconds) { const value=Number(seconds);if(!Number.isFinite(value)||value<0)return "0:00";const whole=Math.floor(value);return Math.floor(whole/60)+":"+String(whole%60).padStart(2,"0"); }

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
function HomeScreen({ onNavigate, onPractice, lastReadPosition, onContinueReading }) {
  return (
    <>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>ASSALAMU ALAIKUM</Text><Text style={styles.heading}>Your Qur’an journey</Text></View>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("settings")} style={styles.settingsButton}><Text style={styles.settingsButtonText}>⚙  Appearance</Text></Pressable>
        <View style={styles.logo}><Text style={styles.logoArabic}>آيَة</Text></View>
      </View>
      <DailyAyah />
      {lastReadPosition?.chapter ? <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Pick up where you left off</Text>
        <Text style={styles.progressHint}>{lastReadPosition.chapterName || lastReadPosition.chapter.name_simple} · Ayah {lastReadPosition.ayah}</Text>
        <Button title="Continue reading" onPress={onContinueReading} />
      </View> : null}
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
        <ActionTile icon="🔥" title="Daily goals & streaks" subtitle="Your routine and weekly report" onPress={() => onNavigate("goals")} />
        <ActionTile icon="✦" title="For you" subtitle="Personalized learning recommendations" onPress={() => onNavigate("recommendations")} />
        <ActionTile icon="▦" title="Learning calendar" subtitle="Monthly reading and hifdh schedule" onPress={() => onNavigate("calendar")} />
        <ActionTile icon="☆" title="Saved ayahs" subtitle="Your bookmarked verses" onPress={() => onNavigate("saved")} />
        <ActionTile icon="▤" title="Study notebook" subtitle="Notes and ayah collections" onPress={() => onNavigate("notebook")} />
        <ActionTile icon="📖" title="Qur’an library" subtitle="Browse all surahs" onPress={() => onNavigate("library")} />
        <ActionTile icon="⌕" title="Search ayahs" subtitle="Find words and passages" onPress={() => onNavigate("search")} />
        <ActionTile icon="↻" title="Smart review" subtitle="Guided revision · Plus" locked onPress={() => onNavigate("premium")} />
        <ActionTile icon="♫" title="Recitation library" subtitle="Browse and preview reciters" onPress={() => onNavigate("reciters")} />
        <ActionTile icon="✧" title="AI teacher" subtitle="Hamza or Maryam · Plus" locked onPress={() => onNavigate("premium")} />
        <ActionTile icon="۞" title="Tafsir library" subtitle="Verse explanations · Plus" locked onPress={() => onNavigate("premium")} />
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
function BuildMemorizationSessionScreen({ onBack, onProgressUpdate, onCompleteSession, initialAssignment, onFinishAssignment }) {
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
    if (currentIndex >= verses.length - 1) { setCompleted(true); onCompleteSession?.(verses.map(item => item.key)); if (initialAssignment) onFinishAssignment?.(initialAssignment); }
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

function SmartRevisionScreen({ records, progress, onRateReview, onSyncRating, onStartVerse, onStartPractice }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const base = AYAH_API_BASE ? (AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE) : "";
  useEffect(() => {
    if (!base) return;
    let active = true;
    setLoading(true);
    fetch(base + "/chapters")
      .then(response => { if (!response.ok) throw new Error("Could not load surah names."); return response.json(); })
      .then(data => { if (active) setChapters(Array.isArray(data.chapters) ? data.chapters : []); })
      .catch(() => { if (active) setLoadError("Surah names are unavailable. You can still use the review list."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const chapterNames = Object.fromEntries(chapters.map(chapter => [String(chapter.id), chapter.name_simple]));
  const legacyKeys = { fatiha2:"1:2", ikhlas1:"112:1", asr1:"103:1" };
  const tracked = [];
  Object.entries(progress || {}).forEach(([surahId, verses]) => {
    Object.entries(verses || {}).forEach(([verse, status]) => {
      if (!["learning","memorized","revision"].includes(status)) return;
      const key = surahId + ":" + verse;
      const legacyId = Object.keys(legacyKeys).find(id => legacyKeys[id] === key);
      const record = records?.[key] || (legacyId ? records?.[legacyId] : null) || null;
      tracked.push({ id:key, chapterId:String(surahId), verse:String(verse), surah:chapterNames[String(surahId)] || ("Surah " + surahId), status, record });
    });
  });
  const now = Date.now();
  const due = tracked.filter(item => !item.record?.dueAt || new Date(item.record.dueAt).getTime() <= now)
    .sort((a,b) => (a.status === "revision" ? -1 : 0) - (b.status === "revision" ? -1 : 0) || new Date(a.record?.dueAt || 0).getTime() - new Date(b.record?.dueAt || 0).getTime());
  const upcoming = tracked.filter(item => item.record?.dueAt && new Date(item.record.dueAt).getTime() > now)
    .sort((a,b) => new Date(a.record.dueAt).getTime() - new Date(b.record.dueAt).getTime());
  const labels = { difficult:"Needs more practice", medium:"Building confidence", easy:"Comfortable" };
  const rate = (item, rating) => {
    onRateReview(item.id, rating);
    onSyncRating?.(item.chapterId, item.verse, rating);
  };
  const ratingChoices = [{id:"difficult",label:"Difficult"},{id:"medium",label:"Getting there"},{id:"easy",label:"Comfortable"}];
  return <>
    <Header eyebrow="SMART REVISION" title="Your review queue" />
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>REVISION OVERVIEW</Text>
      <Text style={styles.quizScore}>{due.length}</Text>
      <Text style={styles.sectionTitle}>Ayahs suggested for review today</Text>
      <Text style={styles.progressHint}>Your queue now uses ayahs recorded in the full memorization tracker. New or unrated tracked ayahs appear as due; after a check-in, Ayah suggests 1, 3 or 7 days before the next review. These are adjustable starter intervals, not a scientifically validated prediction.</Text>
      <Text style={styles.reference}>{tracked.length} tracked ayahs · {upcoming.length} scheduled for later</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Due now</Text>
      {due.length === 0 ? <Text style={styles.progressHint}>Your tracked ayahs have no reviews due right now. Keep memorizing, or check the upcoming list below.</Text> : due.map(item => <View key={item.id} style={styles.savedAyah}>
        <Text style={styles.choiceText}>{item.surah} · Ayah {item.verse}</Text>
        <Text style={styles.reference}>Tracker status: {item.status === "revision" ? "Needs revision" : item.status === "memorized" ? "Marked memorized" : "Learning"}</Text>
        <Text style={styles.reference}>Last check-in: {labels[item.record?.rating] || "Not rated yet"}</Text>
        <Button title="Start this ayah's review" onPress={() => onStartVerse?.(item.chapterId, item.verse)} />
        <View style={styles.languageGrid}>
          {ratingChoices.map(option => <Pressable key={option.id} onPress={() => rate(item, option.id)} style={[styles.goalChoice, item.record?.rating === option.id && styles.choiceSelected]}><Text style={styles.choiceText}>{option.label}</Text></Pressable>)}
        </View>
      </View>)}
      <Button title="Open memorization practice" secondary onPress={onStartPractice} />
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Coming up</Text>
      {upcoming.length === 0 ? <Text style={styles.progressHint}>No future reviews yet. Rate a due ayah to schedule its next check-in.</Text> : upcoming.map(item => <View key={item.id} style={styles.choice}>
        <View style={{flex:1}}><Text style={styles.choiceText}>{item.surah} · Ayah {item.verse}</Text><Text style={styles.reference}>Suggested review: {new Date(item.record.dueAt).toLocaleDateString()}</Text></View>
        <Text style={styles.choiceMark}>{item.record.rating === "easy" ? "✓" : "◷"}</Text>
      </View>)}
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Review history</Text>
      {tracked.length === 0 ? <Text style={styles.progressHint}>Mark ayahs as Learning, Memorized or Needs revision in the full memorization tracker. They will appear here automatically.</Text> : tracked.map(item => <View key={item.id} style={styles.choice}>
        <View style={{flex:1}}><Text style={styles.choiceText}>{item.surah} · {item.verse}</Text><Text style={styles.reference}>{labels[item.record?.rating] || item.status}</Text></View>
        <Text style={styles.choiceMark}>{item.record?.attempts || 0}×</Text>
      </View>)}
      {loading ? <ActivityIndicator color={GOLD}/> : null}
      {loadError ? <Text style={styles.progressHint}>{loadError}</Text> : null}
      <Text style={styles.tinyNote}>A self-rating is not an accuracy check. Use a trusted mushaf or qualified Qur’an teacher to verify recitation and memorization.</Text>
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



function LearningRecommendationsScreen({ progress, reviewRecords, activity, onStartVerse, onStartPractice, onOpenPlan, onBack }) {
  const now = Date.now();
  const legacy = { "1:2":"fatiha2", "112:1":"ikhlas1", "103:1":"asr1" };
  const items = [];
  Object.entries(progress || {}).forEach(([surah, verses]) => Object.entries(verses || {}).forEach(([verse,status]) => {
    if (!["learning","memorized","revision"].includes(status)) return;
    const key=surah+":"+verse, record=reviewRecords?.[key] || reviewRecords?.[legacy[key]] || {};
    const due=!record.dueAt || new Date(record.dueAt).getTime()<=now;
    items.push({key,surah,verse,status,record,due});
  }));
  const due=items.filter(item=>item.due).sort((a,b)=>(a.status==="revision"?0:1)-(b.status==="revision"?0:1) || (a.record.rating==="difficult"?-1:0)-(b.record.rating==="difficult"?-1:0));
  const bySurah={};
  items.forEach(item=>{const x=bySurah[item.surah]||(bySurah[item.surah]={total:0,difficult:0,revision:0,learning:0});x.total++;if(item.record.rating==="difficult")x.difficult++;if(item.status==="revision")x.revision++;if(item.status==="learning")x.learning++;});
  const focus=Object.entries(bySurah).sort((a,b)=>(b[1].revision*3+b[1].difficult*2+b[1].learning)-(a[1].revision*3+a[1].difficult*2+a[1].learning))[0];
  const today=new Date(), dateKey=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
  const todayData=activity?.[dateKey]||{};
  const read=(todayData.readingAyahs||[]).length, practiced=(todayData.memorizationAyahs||[]).length;
  return <>
    <Header eyebrow="PERSONALIZED LEARNING" title="Your next best steps" />
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>TODAY’S RECOMMENDATION</Text>
      <Text style={styles.sectionTitle}>{due.length ? "Begin with a revision" : items.length ? "Keep your learning moving" : "Start with a small step"}</Text>
      <Text style={styles.progressHint}>{due.length ? "You have "+due.length+" tracked ayah"+(due.length===1?"":"s")+" due for review. Start with one, then continue at a comfortable pace." : items.length ? "No tracked ayahs are due right now. Continue your current memorization plan or read a few new ayahs." : "Track a few ayahs in the memorization tracker or begin a guided session to unlock more tailored suggestions."}</Text>
      <View style={styles.goalStatRow}>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{due.length}</Text><Text style={styles.reference}>Due to review</Text></View>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{read}</Text><Text style={styles.reference}>Read today</Text></View>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{practiced}</Text><Text style={styles.reference}>Practiced today</Text></View>
      </View>
      {due[0] ? <Button title={"Review ayah "+due[0].key} onPress={()=>onStartVerse(due[0].surah,due[0].verse)}/> : <Button title="Start memorization practice" onPress={onStartPractice}/>}
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Suggested revision queue</Text>
      {due.slice(0,5).map(item=><Pressable key={item.key} onPress={()=>onStartVerse(item.surah,item.verse)} style={styles.choice}>
        <View style={{flex:1}}><Text style={styles.choiceText}>Surah {item.surah} · Ayah {item.verse}</Text><Text style={styles.reference}>{item.status==="revision"?"Marked for revision":item.record.rating==="difficult"?"Previously rated difficult":"Ready for a check-in"}</Text></View><Text style={styles.choiceMark}>›</Text>
      </Pressable>)}
      {due.length===0 ? <Text style={styles.progressHint}>No review recommendations at the moment.</Text> : null}
      <Button title="Open full Smart Revision" secondary onPress={()=>onStartPractice("revision")}/>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Where to focus</Text>
      {focus ? <><Text style={styles.choiceText}>Surah {focus[0]}</Text><Text style={styles.progressHint}>This surah has {focus[1].revision} ayahs marked for revision, {focus[1].difficult} previously rated difficult, and {focus[1].learning} still being learned. Consider reviewing these before adding more new ayahs.</Text></> : <Text style={styles.progressHint}>As you track and review ayahs, Ayah will highlight areas that may benefit from extra attention.</Text>}
      <Button title="Open memorization tracker" secondary onPress={onOpenPlan}/>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Build a steady routine</Text>
      <Text style={styles.progressHint}>Your current activity today: {read} ayahs read and {practiced} ayahs practiced. A short, consistent session can be a useful next step.</Text>
      <Button title="View my memorization plan" onPress={onOpenPlan}/>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.cardEyebrow}>AYAH PLUS · FUTURE INSIGHTS</Text>
      <Text style={styles.sectionTitle}>Advanced learning insights</Text>
      <Text style={styles.progressHint}>A future Plus experience can add longer-term trends, customizable review strategies, and deeper learning reports. Current suggestions are simple rules based on your own tracker and self-ratings—not AI judgments or verified recitation scores.</Text>
    </View>
    <Button title="Back to home" secondary onPress={onBack}/>
  </>;
}


function PersonalLearningCalendarScreen({ plan, activity, onStartAssignment, onBack }) {
  const [monthOffset,setMonthOffset]=useState(0),[selectedDate,setSelectedDate]=useState(null);
  const baseDate=new Date();baseDate.setDate(1);baseDate.setMonth(baseDate.getMonth()+monthOffset);
  const year=baseDate.getFullYear(),month=baseDate.getMonth();
  const keyOf=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const todayKey=keyOf(new Date()),assignments=plan?.schedule||[],daysInMonth=new Date(year,month+1,0).getDate(),firstWeekday=new Date(year,month,1).getDay();
  const cells=Array.from({length:Math.ceil((firstWeekday+daysInMonth)/7)*7},(_,i)=>{const n=i-firstWeekday+1;if(n<1||n>daysInMonth)return null;const date=new Date(year,month,n),key=keyOf(date),assignment=assignments.find(a=>a.date===key),data=activity?.[key]||{},read=(data.readingAyahs||[]).length,memorized=(data.memorizationAyahs||[]).length;return {date,key,n,assignment,read,memorized,active:read+memorized>0};});
  const selected=cells.find(d=>d?.key===selectedDate)||cells.find(d=>d?.key===todayKey)||null;
  const monthLabel=baseDate.toLocaleDateString(undefined,{month:"long",year:"numeric"}),planName=plan?.chapterName||("Surah "+(plan?.chapterId||""));
  return <>
    <Header eyebrow="YOUR STUDY ROUTINE" title="Learning calendar" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Your month</Text>
      <View style={[styles.goalStatRow,{alignItems:"center"}]}>
        <Pressable onPress={()=>{setMonthOffset(v=>v-1);setSelectedDate(null);}} style={styles.goalChoice}><Text style={styles.choiceText}>‹ Prev</Text></Pressable>
        <View style={{flex:1,alignItems:"center"}}><Text style={styles.choiceText}>{monthLabel}</Text></View>
        <Pressable onPress={()=>{setMonthOffset(v=>v+1);setSelectedDate(null);}} style={styles.goalChoice}><Text style={styles.choiceText}>Next ›</Text></Pressable>
      </View>
      <View style={styles.weekActivityRow}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><View key={day} style={styles.weekDay}><Text style={styles.reference}>{day}</Text></View>)}</View>
      <View style={styles.calendarGrid}>{cells.map((day,index)=>day?<Pressable key={day.key} onPress={()=>setSelectedDate(day.key)} style={[styles.calendarDay,day.key===selected?.key&&styles.choiceSelected,day.key===todayKey&&styles.calendarToday]}><Text style={[styles.choiceText,day.key===selected?.key&&styles.choiceTextSelected]}>{day.n}</Text><View style={styles.calendarMarks}><View style={[styles.calendarDot,day.assignment&&styles.calendarAssignmentDot]}/>{day.active?<View style={[styles.calendarDot,styles.calendarActivityDot]}/>:null}</View></Pressable>:<View key={"empty-"+index} style={styles.calendarDay}/>)}</View>
      <View style={styles.calendarLegend}><Text style={styles.reference}>● Planned study</Text><Text style={styles.reference}>● Activity recorded</Text></View>
      <Text style={styles.tinyNote}>Planned study and recorded activity are shown separately. A missed day is not a failure—adjust your routine whenever needed.</Text>
    </View>
    <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>SELECTED DAY</Text><Text style={styles.sectionTitle}>{selected?selected.date:"Choose a date"}</Text>
      {selected?.assignment?<><Text style={styles.progressHint}>Memorization · {planName}, ayahs {selected.assignment.startVerse}–{selected.assignment.endVerse}</Text><Text style={styles.reference}>{selected.assignment.completed?"Marked complete":"Scheduled assignment"}</Text>{!selected.assignment.completed?<Button title="Start this memorization assignment" onPress={()=>onStartAssignment?.({chapterId:String(plan.chapterId),date:selected.key,startVerse:selected.assignment.startVerse,endVerse:selected.assignment.endVerse})}/>:null}</>:<Text style={styles.progressHint}>No memorization assignment scheduled for this day.</Text>}
      {selected?<><Text style={styles.reference}>Reading activity: {selected.read} ayahs · Memorization activity: {selected.memorized} ayahs</Text><Text style={styles.reference}>{selected.active?"Activity recorded on this device":"No activity recorded yet."}</Text></>:null}
    </View>
    <View style={styles.infoCard}><Text style={styles.sectionTitle}>Your schedule at a glance</Text><Text style={styles.progressHint}>{assignments.length} planned sessions · {assignments.filter(a=>a.completed).length} marked complete</Text>{assignments.length===0?<Text style={styles.progressHint}>Create a memorization plan to place study assignments on this calendar.</Text>:null}<Button title="Open memorization plan" secondary onPress={()=>onBack("plan")}/></View>
    <Button title="Back to home" secondary onPress={()=>onBack("home")}/>
  </>;
}


function ReciterLibraryScreen({ favoriteIds, setFavoriteIds, preferredId, setPreferredId, setPreferredName, onBack }) {
  const player=useAudioPlayer(null),status=useAudioPlayerStatus(player);
  const [reciters,setReciters]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const [language,setLanguage]=useState("en"),[selectedChapter,setSelectedChapter]=useState("1"),[playingId,setPlayingId]=useState(null),[search,setSearch]=useState("");
  useEffect(()=>{let active=true;if(!AYAH_API_BASE){setError("Connect the secure Ayah content backend to browse reciters.");return;}
    const base=AYAH_API_BASE.endsWith("/")?AYAH_API_BASE.slice(0,-1):AYAH_API_BASE;
    setLoading(true);setError("");
    fetch(base+"/audio/reciters?language="+language).then(res=>{if(!res.ok)throw new Error("Reciter catalogue is unavailable (server "+res.status+").");return res.json();})
      .then(data=>{if(active)setReciters(Array.isArray(data.reciters)?data.reciters:[]);})
      .catch(err=>{if(active)setError(err.message||"Unable to load reciters.");})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[language]);
  const getId=item=>String(item.id??item.reciter_id??"");
  const getName=item=>item.reciter_name||item.name||item.translated_name?.name||("Reciter "+getId(item));
  const filtered=reciters.filter(item=>getName(item).toLowerCase().includes(search.toLowerCase()));
  const toggleFavorite=id=>setFavoriteIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
  const preview=async item=>{
    const id=getId(item);if(!id)return;
    if(!AYAH_API_BASE){Alert.alert("Backend required","Connect the Ayah content backend first.");return;}
    try{
      const base=AYAH_API_BASE.endsWith("/")?AYAH_API_BASE.slice(0,-1):AYAH_API_BASE;
      const response=await fetch(base+"/audio/chapters/"+encodeURIComponent(id)+"/"+selectedChapter);
      if(!response.ok)throw new Error("A preview is not available for this reciter and surah.");
      const data=await response.json(),url=data.audio?.url;
      if(!url)throw new Error("The provider did not return an audio file.");
      setPreferredId(id);setPreferredName?.(getName(item));setPlayingId(id);player.replace(url);player.play();
    }catch(err){Alert.alert("Unable to play preview",err.message||"Please try again.");}
  };
  return <>
    <Header eyebrow="RECITATION LIBRARY" title="Choose your reciter" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Find a reciter</Text>
      <Text style={styles.progressHint}>Browse the available recordings supplied by the connected Qur’an content provider.</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search reciter names" placeholderTextColor={MUTED} style={styles.emailInput}/>
      <Text style={styles.readerToolLabel}>Catalogue language</Text>
      <View style={styles.readerToggleRow}>{[{code:"en",label:"English"},{code:"ar",label:"Arabic"},{code:"ur",label:"Urdu"}].map(item=><Pressable key={item.code} onPress={()=>setLanguage(item.code)} style={[styles.readerToggle,language===item.code&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,language===item.code&&styles.readerToggleTextActive]}>{item.label}</Text></Pressable>)}</View>
      <Text style={styles.readerToolLabel}>Preview surah</Text>
      <View style={styles.readerToggleRow}>{[1,2,36,55,112,114].map(id=><Pressable key={id} onPress={()=>setSelectedChapter(String(id))} style={[styles.readerToggle,selectedChapter===String(id)&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,selectedChapter===String(id)&&styles.readerToggleTextActive]}>{id}</Text></Pressable>)}</View>
      {loading?<ActivityIndicator color={GOLD}/>:null}
      {error?<Text style={styles.tinyNote}>{error}</Text>:null}
      {!loading&&!error&&filtered.length===0?<Text style={styles.progressHint}>No reciters match this search. Try another name or catalogue language.</Text>:null}
    </View>
    {filtered.map(item=>{const id=getId(item),name=getName(item),favorite=favoriteIds.includes(id),selected=preferredId===id;return <View key={id||name} style={styles.infoCard}>
      <View style={styles.reciterRow}><View style={{flex:1}}><Text style={styles.sectionTitle}>{name}</Text><Text style={styles.reference}>{item.style||item.recitation_style||item.translated_name?.name||"Qur’an recitation"}</Text>{selected?<Text style={styles.lockedLabel}>YOUR PREFERRED RECITER</Text>:null}</View>
      <Pressable onPress={()=>toggleFavorite(id)} style={styles.readerToggle}><Text style={styles.readerToggleText}>{favorite?"★ Saved":"☆ Favorite"}</Text></Pressable></View>
      <View style={styles.readerToggleRow}><Pressable onPress={()=>{setPreferredId(id);setPreferredName?.(name);}} style={[styles.readerToggle,selected&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,selected&&styles.readerToggleTextActive]}>{selected?"✓ Preferred":"Set as preferred"}</Text></Pressable><Pressable onPress={()=>preview(item)} style={[styles.readerToggle,playingId===id&&status?.playing&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,playingId===id&&status?.playing&&styles.readerToggleTextActive]}>{playingId===id&&status?.playing?"Ⅱ Playing":"▶ Preview surah"}</Text></Pressable></View>
    </View>;})}
    <Text style={styles.tinyNote}>Reciter availability and recording rights depend on the content provider. Favorites and preferred reciter are saved on this device. Preview uses the selected surah's recording; it is not a short sample.</Text>
    <Button title="Back to home" secondary onPress={onBack}/>
  </>;
}

function DailyGoalsScreen({ activity, onBack, readingTarget, memorizationTarget }) {
  const dateKey = date => {
    const d = new Date(date);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  };
  const today = dateKey(new Date());
  const dayData = activity?.[today] || {};
  const readCount = (dayData.readingAyahs || []).length;
  const memorizedCount = (dayData.memorizationAyahs || []).length;
  const days = Array.from({length:7},(_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const key = dateKey(d), item = activity?.[key] || {};
    return { key, label:d.toLocaleDateString(undefined,{weekday:"short"}), reading:(item.readingAyahs||[]).length, memorization:(item.memorizationAyahs||[]).length, active:((item.readingAyahs||[]).length+(item.memorizationAyahs||[]).length)>0 };
  });
  let streak=0;
  for(let i=0;i<365;i++){ const d=new Date(); d.setDate(d.getDate()-i); const key=dateKey(d); const item=activity?.[key]||{}; if(((item.readingAyahs||[]).length+(item.memorizationAyahs||[]).length)>0) streak++; else if(i===0) continue; else break; }
  const weekReading=days.reduce((n,d)=>n+d.reading,0), weekMem=days.reduce((n,d)=>n+d.memorization,0);
  const Progress = ({value,target}) => <View style={styles.goalProgressTrack}><View style={[styles.goalProgressFill,{width:Math.min(100,target?value/target*100:0)+"%"}]}/></View>;
  return <>
    <Header eyebrow="YOUR DAILY ROUTINE" title="Goals & streaks" />
    <View style={styles.infoCard}>
      <View style={styles.goalStatRow}>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{streak}</Text><Text style={styles.reference}>Day streak</Text></View>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{readCount}</Text><Text style={styles.reference}>Ayahs read today</Text></View>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{memorizedCount}</Text><Text style={styles.reference}>Practiced today</Text></View>
      </View>
      <Text style={styles.sectionTitle}>Today’s goals</Text>
      <Text style={styles.reference}>Reading · {readCount} / {readingTarget} ayahs</Text>
      <Progress value={readCount} target={readingTarget}/>
      <Text style={styles.reference}>Memorization · {memorizedCount} / {memorizationTarget} ayahs</Text>
      <Progress value={memorizedCount} target={memorizationTarget}/>
      <Text style={styles.tinyNote}>Goals count unique ayahs opened in the reader and completed in guided practice. They do not measure minutes or verify memorization accuracy.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Last 7 days</Text>
      <View style={styles.weekActivityRow}>{days.map(day=><View key={day.key} style={styles.weekDay}>
        <View style={[styles.weekDayDot,day.active && styles.weekDayDotActive]}><Text style={styles.weekDayCount}>{day.reading+day.memorization}</Text></View>
        <Text style={styles.reference}>{day.label}</Text>
      </View>)}</View>
      <View style={styles.goalStatRow}>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{weekReading}</Text><Text style={styles.reference}>Read ayahs</Text></View>
        <View style={styles.goalStat}><Text style={styles.goalStatValue}>{weekMem}</Text><Text style={styles.reference}>Practice ayahs</Text></View>
      </View>
      <Text style={styles.tinyNote}>Your streak continues when you complete at least one reading or memorization activity on a calendar day. The weekly report uses this device’s local date.</Text>
    </View>
    <Button title="Back to home" secondary onPress={onBack}/>
  </>;
}

function QuranSearchScreen({ onOpenResult, language }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const search = async () => {
    const term = query.trim();
    if (term.length < 2) { setError("Enter at least two characters to search."); return; }
    if (!AYAH_API_BASE) { setError("Connect the Ayah content server to search the Qur’an."); return; }
    setLoading(true); setError(""); setSearched(true); setResults([]);
    const base = AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE;
    try {
      const codes = {English:"en",Arabic:"ar",Urdu:"ur",Bengali:"bn",Turkish:"tr",French:"fr","Bahasa Indonesia":"id"};
      const response = await fetch(base + "/search?q=" + encodeURIComponent(term) + "&language=" + (codes[language] || "en"));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search could not be completed.");
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (e) { setError(e.message || "Search is temporarily unavailable."); }
    finally { setLoading(false); }
  };
  return <>
    <Header eyebrow="EXPLORE THE QUR’AN" title="Search ayahs" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Find a passage</Text>
      <Text style={styles.progressHint}>Search Arabic words, words from a translation, or a verse reference such as 2:255.</Text>
      <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" placeholder="Search the Qur’an…" placeholderTextColor={MUTED} style={styles.emailInput}/>
      <Button title="Search Qur’an" onPress={search} disabled={loading}/>
      {loading ? <ActivityIndicator color={GOLD} size="large"/> : null}
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
      {searched && !loading && !error ? <Text style={styles.reference}>{results.length} matching ayahs</Text> : null}
      {results.map((item,index) => <Pressable key={item.verse_key || index} onPress={() => onOpenResult(item)} style={styles.savedAyah}>
        <Text style={styles.reference}>Surah {item.chapter_id} · Ayah {item.verse_number} ({item.verse_key})</Text>
        {item.arabic ? <Text style={styles.dailyArabic} writingDirection="rtl">{item.arabic}</Text> : null}
        <Text style={styles.translation}>{String(item.translation || "Translation not available").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").trim()}</Text>
        <Text style={styles.readerToolLabel}>Open in reader →</Text>
      </Pressable>)}
      {searched && !loading && !error && results.length===0 ? <Text style={styles.progressHint}>No matching ayahs found. Try another word or phrase.</Text> : null}
    </View>
  </>;
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
function QuranReaderScreen({ chapter, initialAyah = 1, onRecordReading, onBack, savedIds, onToggleSave, onOpenTafsir, notes, onSaveNote, lastReadPosition, onSetReadingPosition, preferredReciterId, preferredReciterName, onChangeChapter }) {
  const wordPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(wordPlayer);
  const chapterPlayer = useAudioPlayer(null);
  const chapterAudioStatus = useAudioPlayerStatus(chapterPlayer);
  const [chapterAudioLoading,setChapterAudioLoading] = useState(false);
  const [chapterAudioError,setChapterAudioError] = useState("");
  const [verseTimestamps,setVerseTimestamps] = useState([]);
  const [activeSyncedVerseKey,setActiveSyncedVerseKey] = useState("");
  const [chapterList,setChapterList] = useState([]);
  const [lastAudioPosition,setLastAudioPosition] = usePersistentState("lastAudioPosition_"+String(chapter?.id||""),0);
  const [autoAdvance,setAutoAdvance] = useState(true);
  const [surahRepeatCount,setSurahRepeatCount] = usePersistentState("surahRepeatCount",1);
  const [surahRepeatsRemaining,setSurahRepeatsRemaining] = useState(0);
  const [resumeAfterLoad,setResumeAfterLoad] = useState(false);
  useEffect(()=>{if(!AYAH_API_BASE)return;let active=true;const base=AYAH_API_BASE.endsWith("/")?AYAH_API_BASE.slice(0,-1):AYAH_API_BASE;fetch(base+"/chapters").then(r=>{if(!r.ok)throw new Error("Surah list unavailable");return r.json();}).then(data=>{if(active)setChapterList(Array.isArray(data.chapters)?data.chapters:[]);}).catch(()=>{if(active)setChapterAudioError("Surah navigation is unavailable until the content service responds.");});return()=>{active=false;};},[]);
  const playPreferredReciter = async () => {
    if (!preferredReciterId) { Alert.alert("Choose a reciter first","Open the Recitation Library and choose your preferred reciter."); return; }
    if (!AYAH_API_BASE) { Alert.alert("Backend required","Connect the Ayah content backend to play chapter recitations."); return; }
    try {
      setChapterAudioLoading(true);setChapterAudioError("");
      const base=AYAH_API_BASE.endsWith("/")?AYAH_API_BASE.slice(0,-1):AYAH_API_BASE;
      const response=await fetch(base+"/audio/chapters/"+encodeURIComponent(preferredReciterId)+"/"+chapter.id);
      const data=await response.json();
      if (!response.ok) throw new Error(data.error || "This recording is unavailable.");
      if (!data.audio?.url) throw new Error("The provider did not return an audio file.");
      setVerseTimestamps(Array.isArray(data.audio.timestamps)?data.audio.timestamps:[]);
      setActiveSyncedVerseKey("");
      chapterPlayer.replace(data.audio.url);
      if (Number(lastAudioPosition)>3) setResumeAfterLoad(true); else chapterPlayer.play();
    } catch(error) {
      const message=error.message||"Please try again.";setChapterAudioError(message);Alert.alert("Unable to play recitation",message);
    } finally { setChapterAudioLoading(false); }
  };
  useEffect(()=>{if(chapterAudioStatus?.currentTime!=null&&chapterAudioStatus.playing)setLastAudioPosition(chapterAudioStatus.currentTime);},[chapterAudioStatus?.currentTime,chapterAudioStatus?.playing]);
  useEffect(()=>{if(!chapterAudioStatus?.playing||!verseTimestamps.length)return;const now=Number(chapterAudioStatus.currentTime||0)*1000;const match=verseTimestamps.find(item=>{const start=Number(item.timestamp_from??item.start??item.from??item.start_time);const end=Number(item.timestamp_to??item.end??item.to??item.end_time);return Number.isFinite(start)&&Number.isFinite(end)&&now>=start&&now<=end;});if(match){const key=String(match.verse_key||match.verseKey||match.key||"");if(key)setActiveSyncedVerseKey(key);}},[chapterAudioStatus?.currentTime,chapterAudioStatus?.playing,verseTimestamps]);
  const seekToVerse=key=>{const timing=verseTimestamps.find(item=>String(item.verse_key||item.verseKey||item.key||"")===String(key));const start=Number(timing?.timestamp_from??timing?.start??timing?.from??timing?.start_time);if(Number.isFinite(start)){chapterPlayer.seekTo(Math.max(0,start/1000));chapterPlayer.play();setActiveSyncedVerseKey(String(key));}else Alert.alert("Ayah timing unavailable","This recording does not provide a timestamp for that ayah. You can still use its individual Play ayah button.");};
  useEffect(()=>{if(resumeAfterLoad&&chapterAudioStatus?.isLoaded){chapterPlayer.seekTo(Number(lastAudioPosition)||0);chapterPlayer.play();setResumeAfterLoad(false);}},[resumeAfterLoad,chapterAudioStatus?.isLoaded]);
  useEffect(()=>{if(!chapterAudioStatus?.didJustFinish||surahRepeatsRemaining<=0)return;setSurahRepeatsRemaining(value=>Math.max(0,value-1));chapterPlayer.seekTo(0);chapterPlayer.play();},[chapterAudioStatus?.didJustFinish,surahRepeatsRemaining]);
  useEffect(()=>{if(!chapterAudioStatus?.didJustFinish||!autoAdvance||surahRepeatsRemaining>0)return;const next=chapterList.find(item=>Number(item.id)===Number(chapter.id)+1);if(!next||!preferredReciterId||!AYAH_API_BASE)return;let active=true;const base=AYAH_API_BASE.endsWith("/")?AYAH_API_BASE.slice(0,-1):AYAH_API_BASE;fetch(base+"/audio/chapters/"+encodeURIComponent(preferredReciterId)+"/"+next.id).then(r=>{if(!r.ok)throw new Error("Next surah audio unavailable");return r.json();}).then(data=>{if(!active||!data.audio?.url)return;onChangeChapter?.(next);chapterPlayer.replace(data.audio.url);chapterPlayer.play();}).catch(()=>{if(active)setChapterAudioError("The next surah could not be loaded. You can continue manually.");});return()=>{active=false;};},[chapterAudioStatus?.didJustFinish,autoAdvance,chapterList,chapter.id,preferredReciterId]);
  const navigateSurah=direction=>{const target=chapterList.find(item=>Number(item.id)===Number(chapter.id)+direction);if(target){chapterPlayer.pause();onChangeChapter?.(target);}};
  const restartSurah=()=>{chapterPlayer.seekTo(0);chapterPlayer.play();setLastAudioPosition(0);};
  const [activeAudioKey,setActiveAudioKey] = useState(null);
  const [repeatCount,setRepeatCount] = usePersistentState("recitationRepeatCount",3);
  const [repeatsRemaining,setRepeatsRemaining] = useState(0);
  const [audioQueueKeys,setAudioQueueKeys] = useState([]);
  const [audioQueueIndex,setAudioQueueIndex] = useState(0);
  const [selectedAudioKeys,setSelectedAudioKeys] = useState([]);
  const [recallMode,setRecallMode] = useState(false);
  const playVerseAudio = (verse,key,keepQueue=false) => {
    const audioUrl = verse.audio?.url || verse.audio_url || verse.audio?.audio_url;
    if (!audioUrl) { Alert.alert("Audio unavailable","A recitation recording is not available for this ayah in the current content response."); return; }
    const url = /^https?:\\/\\//i.test(audioUrl) ? audioUrl : "https://audio.qurancdn.com/" + String(audioUrl).replace(/^\\/+/, "");
    if(!keepQueue){setAudioQueueKeys([key]);setAudioQueueIndex(0);}
    setActiveAudioKey(key);
    setRepeatsRemaining(Math.max(0,Number(repeatCount)-1));
    wordPlayer.replace(url);
    wordPlayer.play();
  };
  const playSelectedAudioRange=()=>{
    const keys=verses.map((verse,index)=>verse.verse_key||(chapter.id+":"+(index+1))).filter(key=>selectedAudioKeys.includes(key));
    if(!keys.length){Alert.alert("Select ayahs first","Choose at least one ayah using Select for range.");return;}
    const first=verses.find((verse,index)=>(verse.verse_key||(chapter.id+":"+(index+1)))===keys[0]);
    setAudioQueueKeys(keys);setAudioQueueIndex(0);setSelectedAudioKeys([]);
    if(first)playVerseAudio(first,keys[0],true);
  };
  const toggleAudioRangeKey=key=>setSelectedAudioKeys(current=>current.includes(key)?current.filter(item=>item!==key):[...current,key]);
  useEffect(() => {
    if(!audioStatus?.didJustFinish)return;
    if(repeatsRemaining>0){setRepeatsRemaining(value=>Math.max(0,value-1));wordPlayer.seekTo(0);wordPlayer.play();return;}
    const nextIndex=audioQueueIndex+1;
    const nextKey=audioQueueKeys[nextIndex];
    if(nextKey){const nextVerse=verses.find((verse,index)=>(verse.verse_key||(chapter.id+":"+(index+1)))===nextKey);if(nextVerse){setAudioQueueIndex(nextIndex);playVerseAudio(nextVerse,nextKey,true);return;}}
    setActiveAudioKey(null);setAudioQueueKeys([]);setAudioQueueIndex(0);
  }, [audioStatus?.didJustFinish,repeatsRemaining,audioQueueIndex,audioQueueKeys,verses,chapter.id]);

  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(() => lastReadPosition?.chapterId === String(chapter?.id) ? Number(lastReadPosition.page || 1) : Math.floor((Number(initialAyah || 1) - 1) / 50) + 1);
  const [jumpAyah, setJumpAyah] = useState("");
  const [noteEditorKey, setNoteEditorKey] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteFilter, setNoteFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [arabicSize, setArabicSize] = usePersistentState("readerArabicSize", 29);
  const [showArabic, setShowArabic] = usePersistentState("readerShowArabic", true);
  const [showTranslation, setShowTranslation] = usePersistentState("readerShowTranslation", true);
  const [showWordByWord, setShowWordByWord] = usePersistentState("readerShowWordByWord", false);
  const [arabicScript, setArabicScript] = usePersistentState("readerArabicScript", "Uthmani");
  const [arabicFontReady, setArabicFontReady] = useState(false);
  const [arabicFontError, setArabicFontError] = useState("");
  const [translationFont, setTranslationFont] = usePersistentState("readerTranslationFont", "Sans");
  const [translationLanguage, setTranslationLanguage] = useState("en");
  const [translationOptions, setTranslationOptions] = useState([]);
  const [translationId, setTranslationId] = useState("131");
  const [translationListLoading, setTranslationListLoading] = useState(false);
  const [translationListError, setTranslationListError] = useState("");
  const translationFontFamily = translationFont === "Serif" ? "serif" : translationFont === "Monospace" ? "monospace" : undefined;
  const translationLanguages = [{ code: "en", label: "English" }, { code: "ur", label: "Urdu" }, { code: "ar", label: "Arabic" }, { code: "bn", label: "Bengali" }, { code: "tr", label: "Turkish" }, { code: "fr", label: "French" }, { code: "id", label: "Indonesian" }];
  useEffect(() => {
    setVerses([]);
    setPage(lastReadPosition?.chapterId === String(chapter?.id) ? Number(lastReadPosition.page || 1) : Math.floor((Number(initialAyah || 1) - 1) / 50) + 1);
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
        setVerses(incoming);
        onRecordReading?.(incoming.map(item => item.verse_key).filter(Boolean));
      })
      .catch(() => { if (active) setError("Unable to load this surah right now. Please try again later."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [chapter?.id, page, translationId, arabicScript, translationLanguage]);
  return <>
    <Header eyebrow={"SURAH " + chapter.id} title={chapter.name_simple} />
    <View style={styles.infoCard}>
      <Text style={styles.chapterArabicLarge}>{chapter.name_arabic || ""}</Text>
      <Text style={styles.readerToolLabel}>PREFERRED RECITER</Text>
      <Text style={styles.progressHint}>{preferredReciterName || (preferredReciterId ? "Selected reciter" : "No preferred reciter selected")}</Text>
      <View style={styles.readerToggleRow}>
        <Pressable accessibilityRole="button" disabled={Number(chapter.id)<=1} onPress={()=>navigateSurah(-1)} style={styles.readerToggle}><Text style={styles.readerToggleText}>← Previous surah</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={Number(chapter.id)>=114} onPress={()=>navigateSurah(1)} style={styles.readerToggle}><Text style={styles.readerToggleText}>Next surah →</Text></Pressable>
      </View>
      <View style={styles.readerToggleRow}>
        <Pressable accessibilityRole="button" disabled={chapterAudioLoading} onPress={playPreferredReciter} style={[styles.readerToggle,styles.readerToggleActive,chapterAudioLoading&&styles.disabled]}>
          <Text style={[styles.readerToggleText,styles.readerToggleTextActive]}>{chapterAudioLoading?"Loading recitation…":chapterAudioStatus?.playing?"Play again · Surah":Number(lastAudioPosition)>3?"▶ Resume surah":"▶ Play surah"}</Text>
        </Pressable>
        {chapterAudioStatus?.playing?<Pressable accessibilityRole="button" onPress={()=>chapterPlayer.pause()} style={styles.readerToggle}><Text style={styles.readerToggleText}>Ⅱ Pause</Text></Pressable>:null}
        {chapterAudioStatus?.paused?<Pressable accessibilityRole="button" onPress={()=>chapterPlayer.play()} style={styles.readerToggle}><Text style={styles.readerToggleText}>▶ Resume</Text></Pressable>:null}
        <Pressable accessibilityRole="button" disabled={!chapterAudioStatus?.isLoaded} onPress={restartSurah} style={styles.readerToggle}><Text style={styles.readerToggleText}>↺ Restart</Text></Pressable>
      </View>
      <View style={{marginTop:12}}>
        <View style={{height:7,backgroundColor:BORDER,borderRadius:8,overflow:"hidden"}}><View style={{height:7,width:(Number(chapterAudioStatus?.duration)>0?Math.min(100,Number(chapterAudioStatus.currentTime||0)/Number(chapterAudioStatus.duration)*100):0)+"%",backgroundColor:GOLD,borderRadius:8}} /></View>
        <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:6}}><Text style={styles.reference}>{formatAudioTime(chapterAudioStatus?.currentTime)}</Text><Text style={styles.reference}>{formatAudioTime(chapterAudioStatus?.duration)}</Text></View>
        <View style={styles.readerToggleRow}><Pressable onPress={()=>chapterPlayer.seekTo(Math.max(0,Number(chapterAudioStatus?.currentTime||0)-10))} style={styles.readerToggle}><Text style={styles.readerToggleText}>−10 sec</Text></Pressable><Pressable onPress={()=>chapterPlayer.seekTo(Number(chapterAudioStatus?.currentTime||0)+10)} style={styles.readerToggle}><Text style={styles.readerToggleText}>+10 sec</Text></Pressable><Pressable onPress={()=>setAutoAdvance(value=>!value)} style={[styles.readerToggle,autoAdvance&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,autoAdvance&&styles.readerToggleTextActive]}>{autoAdvance?"Auto-next on":"Auto-next off"}</Text></Pressable></View>
        <View style={styles.readerToggleRow}><Text style={styles.reference}>Repeat surah</Text>{[1,2,3].map(count=><Pressable key={count} onPress={()=>{setSurahRepeatCount(count);setSurahRepeatsRemaining(count-1);setAutoAdvance(count===1);}} style={[styles.readerToggle,Number(surahRepeatCount)===count&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,Number(surahRepeatCount)===count&&styles.readerToggleTextActive]}>{count===1?"Off":count+"×"}</Text></Pressable>)}</View>
      </View>
      {chapterAudioError?<Text style={styles.tinyNote}>{chapterAudioError}</Text>:null}
      <Text style={styles.tinyNote}>{verseTimestamps.length?"Ayah highlighting uses timestamps supplied with this recording.":"Ayah highlighting is available when this recording includes ayah timestamps."}</Text>
      <Text style={styles.reference}>{chapter.translated_name?.name || ""} · {chapter.verses_count} ayahs · {chapter.revelation_place || ""}</Text>
      <Button title="Back to surah list" secondary onPress={onBack} />
      <View style={styles.readerTools}>
        <Text style={styles.sectionTitle}>Ayah navigation</Text>
        <Text style={styles.progressHint}>Page {page} · Showing ayahs {verses.length ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, Number(chapter.verses_count || 0))} of {chapter.verses_count}</Text>
        <View style={styles.readerToggleRow}>
          <View style={{flex:1}}><TextInput value={jumpAyah} onChangeText={setJumpAyah} keyboardType="number-pad" placeholder="Enter ayah number" placeholderTextColor={MUTED} style={styles.emailInput}/></View>
          <Pressable accessibilityRole="button" onPress={() => {
            const target = Number(jumpAyah);
            if (!Number.isInteger(target) || target < 1 || target > Number(chapter.verses_count || 0)) {
              Alert.alert("Check ayah number", "Enter a number from 1 to " + chapter.verses_count + ".");
              return;
            }
            setPage(Math.floor((target - 1) / 50) + 1);
            setJumpAyah("");
          }} style={[styles.readerToggle,styles.readerToggleActive]}><Text style={[styles.readerToggleText,styles.readerToggleTextActive]}>Go to ayah</Text></Pressable>
        </View>
        <View style={styles.readerToggleRow}>
          <Pressable accessibilityRole="button" disabled={page <= 1 || loading} onPress={() => setPage(value => Math.max(1,value-1))} style={[styles.readerToggle,page <= 1 && styles.disabled]}><Text style={styles.readerToggleText}>← Previous 50</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={page * 50 >= Number(chapter.verses_count || 0) || loading} onPress={() => setPage(value => value+1)} style={[styles.readerToggle,page * 50 >= Number(chapter.verses_count || 0) && styles.disabled]}><Text style={styles.readerToggleText}>Next 50 →</Text></Pressable>
        </View>
        <View style={styles.readerToggleRow}>
          <Pressable accessibilityRole="button" onPress={() => setNoteFilter(value => !value)} style={[styles.readerToggle,noteFilter && styles.readerToggleActive]}><Text style={[styles.readerToggleText,noteFilter && styles.readerToggleTextActive]}>{noteFilter ? "✓ Showing notes only" : "Show ayahs with notes"}</Text></Pressable>
        </View>
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
      <View style={{marginTop:14,padding:12,backgroundColor:PANEL,borderRadius:14,borderWidth:1,borderColor:BORDER}}>
        <Text style={styles.readerToolLabel}>AYAH MEMORIZATION AUDIO</Text>
        <View style={styles.readerToggleRow}>
          <Pressable accessibilityRole="button" onPress={playSelectedAudioRange} style={[styles.readerToggle,styles.readerToggleActive]}><Text style={[styles.readerToggleText,styles.readerToggleTextActive]}>▶ Play selected range ({selectedAudioKeys.length})</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>setSelectedAudioKeys([])} style={styles.readerToggle}><Text style={styles.readerToggleText}>Clear selection</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>setRecallMode(value=>!value)} style={[styles.readerToggle,recallMode&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,recallMode&&styles.readerToggleTextActive]}>{recallMode?"Reveal Arabic":"Hide Arabic · Recall"}</Text></Pressable>
        </View>
        <Text style={styles.tinyNote}>Select individual ayahs below to build a sequential practice queue. Each ayah repeats according to your repeat setting before the next begins.</Text>
      </View>
      {verses.filter((verse,index) => {
        const key = verse.verse_key || (chapter.id + ":" + (index + 1));
        return !noteFilter || Boolean(notes?.[key]);
      }).map((verse, index) => {
        const key = verse.verse_key || (chapter.id + ":" + (index + 1));
        const translation = verse.translations?.[0]?.text || "";
        const plainTranslation = translation.replace(/<[^>]*>/g, "");
        const isSyncedVerse=activeSyncedVerseKey===key;
        return <View key={key} style={[styles.verseCard,isSyncedVerse&&{borderWidth:2,borderColor:GOLD,backgroundColor:PANEL}]}>
          <View style={styles.verseMeta}><Text style={styles.verseNumber}>{isSyncedVerse?"▶ "+key:key}</Text><View style={{flexDirection:"row",alignItems:"center",gap:12}}><Pressable onPress={() => onOpenTafsir?.(chapter.id, Number(String(key).split(":")[1]))}><Text style={styles.verseBookmark}>Read Tafsir · Plus</Text></Pressable><Pressable onPress={() => onSetReadingPosition?.({ chapter, chapterId:String(chapter.id), chapterName:chapter.name_simple, ayah:Number(String(key).split(":")[1]), page, updatedAt:new Date().toISOString() })}><Text style={styles.verseBookmark}>{lastReadPosition?.chapterId === String(chapter.id) && Number(lastReadPosition.ayah) === Number(String(key).split(":")[1]) ? "✓ Reading position" : "Set reading position"}</Text></Pressable><Pressable onPress={() => onToggleSave(key, { arabic: verse.text_uthmani || "", translation: plainTranslation, reference: chapter.name_simple + " · " + key })}><Text style={styles.verseBookmark}>{savedIds.includes(key) ? "★ Saved" : "☆ Save"}</Text></Pressable></View></View>
          {showArabic && !recallMode ? (arabicFontReady ? <Text style={[styles.verseArabic, { fontSize: arabicSize, lineHeight: Math.round(arabicSize * 2.2), fontFamily: arabicScript === "IndoPak" ? "AyahIndoPak" : "AyahUthmanicHafs" }]} writingDirection="rtl">{arabicScript === "IndoPak" ? (verse.text_indopak_nastaleeq || "") : (verse.text_qpc_hafs || "")}</Text> : <Text style={styles.tinyNote}>{arabicFontError || "Loading the selected Qur’an font…"}</Text>) : null}
          {showTranslation ? <Text style={[styles.translation, translationFontFamily ? { fontFamily: translationFontFamily } : null]}>{plainTranslation}</Text> : null}
          <View style={styles.verseAudioControls}>
            <Pressable accessibilityRole="button" onPress={()=>toggleAudioRangeKey(key)} style={[styles.readerToggle,selectedAudioKeys.includes(key)&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,selectedAudioKeys.includes(key)&&styles.readerToggleTextActive]}>{selectedAudioKeys.includes(key)?"✓ Selected":"Select for range"}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>seekToVerse(key)} style={[styles.readerToggle,isSyncedVerse&&styles.readerToggleActive]}><Text style={[styles.readerToggleText,isSyncedVerse&&styles.readerToggleTextActive]}>{isSyncedVerse?"▶ Following audio":"Jump to ayah in audio"}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => playVerseAudio(verse,key)} style={[styles.readerToggle,activeAudioKey===key&&styles.readerToggleActive]}>
              <Text style={[styles.readerToggleText,activeAudioKey===key&&styles.readerToggleTextActive]}>{activeAudioKey===key&&audioStatus?.playing?"Ⅱ Playing":"▶ Play ayah"}</Text>
            </Pressable>
            <Text style={styles.reference}>Repeat</Text>
            {[1,3,5].map(count=><Pressable key={count} accessibilityRole="button" onPress={()=>setRepeatCount(count)} style={[styles.readerToggle,Number(repeatCount)===count&&styles.readerToggleActive]}>
              <Text style={[styles.readerToggleText,Number(repeatCount)===count&&styles.readerToggleTextActive]}>{count}×</Text>
            </Pressable>)}
          </View>
          {activeAudioKey===key&&repeatsRemaining>0?<Text style={styles.reference}>{repeatsRemaining} repeat{repeatsRemaining===1?"":"s"} remaining</Text>:null}
          <View style={{marginTop:12,borderTopWidth:1,borderTopColor:BORDER,paddingTop:10}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
              <Text style={styles.readerToolLabel}>{notes?.[key] ? "Personal note saved" : "Personal note"}</Text>
              <Pressable accessibilityRole="button" onPress={() => {setNoteEditorKey(noteEditorKey===key?null:key);setNoteDraft(notes?.[key] || "");}}><Text style={styles.verseBookmark}>{noteEditorKey===key ? "Close" : notes?.[key] ? "Edit note" : "Add note"}</Text></Pressable>
            </View>
            {notes?.[key] && noteEditorKey !== key ? <Text style={styles.progressHint}>{notes[key]}</Text> : null}
            {noteEditorKey === key ? <>
              <TextInput multiline value={noteDraft} onChangeText={setNoteDraft} placeholder="Write a reflection or study note…" placeholderTextColor={MUTED} style={[styles.emailInput,{minHeight:90,textAlignVertical:"top",marginTop:8}]}/>
              <View style={styles.readerToggleRow}>
                <Pressable accessibilityRole="button" onPress={() => {onSaveNote?.(key,noteDraft);setNoteEditorKey(null);}} style={[styles.readerToggle,styles.readerToggleActive]}><Text style={[styles.readerToggleText,styles.readerToggleTextActive]}>Save note</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => {onSaveNote?.(key,"");setNoteDraft("");setNoteEditorKey(null);}} style={styles.readerToggle}><Text style={styles.readerToggleText}>Delete note</Text></Pressable>
              </View>
            </> : null}
          </View>
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
      <View style={styles.readerToggleRow}>
        <Pressable accessibilityRole="button" disabled={page <= 1 || loading} onPress={() => setPage(value => Math.max(1,value-1))} style={[styles.readerToggle,page <= 1 && styles.disabled]}><Text style={styles.readerToggleText}>← Previous page</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={page * 50 >= Number(chapter.verses_count || 0) || loading} onPress={() => setPage(value => value+1)} style={[styles.readerToggle,page * 50 >= Number(chapter.verses_count || 0) && styles.disabled]}><Text style={styles.readerToggleText}>Next page →</Text></Pressable>
      </View>
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

function StudyNotebookScreen({ notes, savedIds, savedVerseDetails, collections, onAssignCollection, onBack }) {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("All");
  const noteItems = Object.entries(notes || {}).map(([key, note]) => ({ key, note })).filter(item => item.note);
  const savedItems = Object.entries(savedVerseDetails || {}).filter(([key]) => savedIds.includes(key));
  const matches = value => String(value || "").toLowerCase().includes(query.trim().toLowerCase());
  const visibleNotes = noteItems.filter(item => matches(item.key) || matches(item.note));
  const visibleSaved = savedItems.filter(([key, item]) => {
    const collection = collections?.[key] || "Favorites";
    return (activeCollection === "All" || collection === activeCollection) &&
      (matches(key) || matches(item.reference) || matches(item.translation));
  });
  return <>
    <Header eyebrow="YOUR PERSONAL STUDY SPACE" title="Study notebook" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Find your reflections and bookmarks</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search notes, surah:ayah, or translation…" placeholderTextColor={MUTED} style={styles.emailInput}/>
      <Text style={styles.sectionTitle}>Collections</Text>
      <View style={styles.readerToggleRow}>
        {["All","Favorites","Study","Memorization"].map(name => <Pressable key={name} accessibilityRole="button" onPress={() => setActiveCollection(name)} style={[styles.readerToggle,activeCollection===name && styles.readerToggleActive]}><Text style={[styles.readerToggleText,activeCollection===name && styles.readerToggleTextActive]}>{name}</Text></Pressable>)}
      </View>
      <Text style={styles.sectionTitle}>Saved ayahs ({visibleSaved.length})</Text>
      {visibleSaved.length ? visibleSaved.map(([key,item]) => <View key={key} style={styles.savedAyah}>
        <Text style={styles.reference}>{item.reference || key}</Text>
        <Text style={styles.dailyArabic} writingDirection="rtl">{item.arabic || ""}</Text>
        <Text style={styles.translation}>{item.translation || ""}</Text>
        <Text style={styles.readerToolLabel}>Move to collection</Text>
        <View style={styles.readerToggleRow}>
          {["Favorites","Study","Memorization"].map(name => <Pressable key={name} accessibilityRole="button" onPress={() => onAssignCollection(key,name)} style={[styles.readerToggle,(collections?.[key] || "Favorites")===name && styles.readerToggleActive]}><Text style={[styles.readerToggleText,(collections?.[key] || "Favorites")===name && styles.readerToggleTextActive]}>{name}</Text></Pressable>)}
        </View>
      </View>) : <Text style={styles.progressHint}>No saved ayahs match this search and collection.</Text>}
      <Text style={styles.sectionTitle}>Personal notes ({visibleNotes.length})</Text>
      {visibleNotes.length ? visibleNotes.map(item => <View key={item.key} style={styles.savedAyah}>
        <Text style={styles.reference}>Ayah reference: {item.key}</Text>
        <Text style={styles.translation}>{item.note}</Text>
      </View>) : <Text style={styles.progressHint}>Your reader notes will appear here. Open an ayah in the Qur’an reader and choose Add note.</Text>}
    </View>
    <Button title="Back to home" secondary onPress={onBack}/>
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


function TafsirLibraryScreen({ onBack, initialTarget }) {
  const [sources, setSources] = useState([]);
  const [resourceId, setResourceId] = useState("");
  const [surah, setSurah] = useState(String(initialTarget?.surah || "1"));
  const [ayah, setAyah] = useState(String(initialTarget?.ayah || "1"));
  const [commentary, setCommentary] = useState(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingText, setLoadingText] = useState(false);
  const [error, setError] = useState("");
  const base = AYAH_API_BASE ? (AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE) : "";
  useEffect(() => {
    if (!base) return;
    let active = true;
    setLoadingSources(true);
    fetch(base + "/tafsirs?language=en")
      .then(response => { if (!response.ok) throw new Error("Tafsir catalogue request failed."); return response.json(); })
      .then(data => {
        if (!active) return;
        const items = Array.isArray(data.tafsirs) ? data.tafsirs : [];
        setSources(items);
        if (items.length) setResourceId(String(items[0].id));
      })
      .catch(() => { if (active) setError("The Tafsir catalogue could not load. Check the backend connection and its approved Tafsir permission."); })
      .finally(() => { if (active) setLoadingSources(false); });
    return () => { active = false; };
  }, []);
  const selectedSource = sources.find(item => String(item.id) === resourceId);
  const cleanHtml = value => String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const loadCommentary = async () => {
    const chapterNumber = Number(surah), verseNumber = Number(ayah);
    if (!base) { setError("The secure Ayah backend is not configured yet."); return; }
    if (!selectedSource || !Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 114 ||
        !Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > 286) {
      setError("Enter a valid surah number (1–114) and ayah number."); return;
    }
    setLoadingText(true); setError(""); setCommentary(null);
    try {
      const response = await fetch(base + "/tafsirs/" + resourceId + "/ayah/" + chapterNumber + "/" + verseNumber);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This commentary could not be loaded.");
      if (!data.tafsir?.text) throw new Error("No commentary was returned for this selection.");
      setCommentary({ ...data.tafsir, displayText: cleanHtml(data.tafsir.text), surah:chapterNumber, ayah:verseNumber, author:selectedSource.author_name || "Author information not supplied" });
    } catch (e) {
      setError(e.message || "Unable to load this commentary. Please try again.");
    } finally { setLoadingText(false); }
  };
  return <>
    <Header eyebrow="AYAH PLUS · TAFSIR" title="Explore Tafsir" />
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>A library of recognized commentary</Text>
      <Text style={styles.progressHint}>Choose a Tafsir source and an ayah reference. Commentary is retrieved from Quran Foundation, with the source and author shown alongside the passage.</Text>
      {!base ? <View style={styles.apiNotice}><Text style={styles.sectionTitle}>Secure content connection needed</Text><Text style={styles.progressHint}>Set EXPO_PUBLIC_AYAH_API_URL to your deployed Ayah backend. The server also needs the approved content.tafsirs.read permission.</Text></View> : null}
      <Text style={styles.settingLabel}>Tafsir source</Text>
      {loadingSources ? <ActivityIndicator color={GOLD}/> : sources.length ? sources.map(item => <Pressable key={item.id} onPress={() => {setResourceId(String(item.id));setCommentary(null);setError("");}} style={[styles.choice,resourceId===String(item.id)&&styles.choiceSelected]}><View style={{flex:1}}><Text style={[styles.choiceText,resourceId===String(item.id)&&styles.choiceTextSelected]}>{item.translated_name?.name || item.name}</Text><Text style={styles.reference}>{item.author_name || "Author not listed"} · {item.language_name || "Language not listed"}</Text></View><Text style={styles.choiceMark}>{resourceId===String(item.id)?"✓":"○"}</Text></Pressable>) : <Text style={styles.progressHint}>Available sources will appear here when the backend is connected.</Text>}
      <Text style={styles.settingLabel}>Surah number</Text>
      <TextInput value={surah} onChangeText={value=>{setSurah(value);setCommentary(null);}} keyboardType="number-pad" style={styles.emailInput} placeholder="1" placeholderTextColor={MUTED}/>
      <Text style={styles.settingLabel}>Ayah number</Text>
      <TextInput value={ayah} onChangeText={value=>{setAyah(value);setCommentary(null);}} keyboardType="number-pad" style={styles.emailInput} placeholder="1" placeholderTextColor={MUTED}/>
      <Button title={loadingText ? "Loading commentary…" : "Read Tafsir"} onPress={loadCommentary} disabled={!base||!selectedSource||loadingSources||loadingText}/>
      {error ? <Text style={styles.progressHint}>{error}</Text> : null}
    </View>
    {commentary ? <View style={styles.lessonCard}>
      <Text style={styles.cardEyebrow}>SOURCE-ATTRIBUTED COMMENTARY</Text>
      <Text style={styles.sectionTitle}>{commentary.translated_name?.name || commentary.resource_name || selectedSource?.name}</Text>
      <Text style={styles.reference}>Author: {commentary.author} · {commentary.language_name || selectedSource?.language_name}</Text>
      <Text style={styles.reference}>Reference: {commentary.surah}:{commentary.ayah}</Text>
      <Text style={[styles.stepText,{marginTop:16}]}>{commentary.displayText || "The source returned no readable text."}</Text>
      <Text style={styles.tinyNote}>This is commentary from the named source, not a new interpretation generated by Ayah. Where scholars differ, their views should be presented separately and attributed.</Text>
    </View> : null}
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>How Ayah handles Tafsir</Text>
      <Text style={styles.progressHint}>• Preserve the source name and author attribution.</Text>
      <Text style={styles.progressHint}>• Do not invent reasons for revelation or scholarly positions.</Text>
      <Text style={styles.progressHint}>• Add comparisons only when each source is retrieved and clearly identified.</Text>
      <Text style={styles.progressHint}>• Respect provider and publisher licensing before public release.</Text>
    </View>
    <Button title="Back to Ayah Plus" secondary onPress={onBack}/>
  </>;
}

function PremiumScreen({ onBack, onTeacher, onTafsir }) {
  return <>
    <Header eyebrow="AYAH PLUS" title="Go deeper in your Qur’an journey" />
    <View style={styles.premiumHero}>
      <Text style={styles.premiumKicker}>AYAH PLUS · EXPANDED LEARNING</Text>
      <Text style={styles.premiumBig}>More guidance. More depth. More ways to learn.</Text>
      <Text style={styles.progressHint}>Ayah Plus is being built as an expanded learning experience. The Qur’an itself remains accessible in the free version.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Tafsir Plus</Text>
      <Text style={styles.progressHint}>Explore recognized commentary by ayah, see author attribution, and compare sources as the library grows.</Text>
      <Text style={styles.lockedLabel}>PREMIUM FEATURE · IN DEVELOPMENT</Text>
      <Button title="Explore Tafsir library" onPress={onTafsir}/>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Teacher Plus</Text>
      <Text style={styles.progressHint}>A guided repeat-after-me learning experience with selectable learning languages is planned.</Text>
      <Button title="Preview AI teacher" secondary onPress={onTeacher}/>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>More Ayah Plus pillars</Text>
      {["Hifdh Plus · personalized revision","Arabic Plus · expanded lessons and tests","Insights Plus · detailed learning progress","Recitation Plus · expanded listening tools"].map(item=><Text key={item} style={styles.progressHint}>• {item}</Text>)}
    </View>
    <Text style={styles.tinyNote}>Subscriptions, trials, and payments are not active. Prices and plan details will be finalized after service costs and store requirements are reviewed.</Text>
    <Button title="Back to home" secondary onPress={onBack}/>
  </>;
}

function TeacherPreviewScreen({ onBack, onPremium }) {
  const [teacher, setTeacher] = useState("Hamza");
  const [language, setLanguage] = useState("English");
  return <>
    <Header eyebrow="TEACHER PLUS · PREVIEW" title="Meet your learning guide" />
    <View style={styles.teacherCard}>
      <View style={styles.teacherAvatar}><Text style={styles.teacherAvatarText}>{teacher === "Hamza" ? "ح" : "م"}</Text></View>
      <Text style={styles.teacherName}>{teacher}</Text>
      <Text style={styles.progressHint}>A calm, original learning-guide concept. This preview does not generate speech or imitate a real reciter.</Text>
      <View style={styles.assistantChoices}>
        {["Hamza","Maryam"].map(name=><Pressable key={name} onPress={()=>setTeacher(name)} style={[styles.nameChoice,teacher===name&&styles.choiceSelected]}><Text style={styles.choiceText}>{name}</Text></Pressable>)}
      </View>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Learning language</Text>
      <View style={styles.languageGrid}>{["English","Arabic","Urdu","Bengali","Turkish","French","Bahasa Indonesia"].map(item=><Pressable key={item} onPress={()=>setLanguage(item)} style={[styles.languageChoice,language===item&&styles.choiceSelected]}><Text style={styles.choiceText}>{item}</Text></Pressable>)}</View>
      <Text style={styles.reference}>Selected language: {language}</Text>
      <Text style={styles.progressHint}>The live AI tutor and generated voice are not connected yet. Qur’an recitation audio will use authorized reciter recordings, not voice imitation.</Text>
      <Button title="Explore Ayah Plus" onPress={onPremium}/>
    </View>
    <Button title="Back" secondary onPress={onBack}/>
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
  const saveReviewRating = (id, rating) => { const days = rating === "difficult" ? 1 : rating === "medium" ? 3 : 7; setReviewRecords(current => ({ ...current, [id]: { rating, lastReviewedAt: new Date().toISOString(), dueAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(), attempts: (current[id]?.attempts || 0) + 1 } })); };
  const [savedIds, setSavedIds] = usePersistentState("savedIds", []);
  const [favoriteReciterIds,setFavoriteReciterIds] = usePersistentState("favoriteReciterIds", []);
  const [preferredReciterId,setPreferredReciterId] = usePersistentState("preferredReciterId", "");
  const [preferredReciterName,setPreferredReciterName] = usePersistentState("preferredReciterName", "");
  const [savedVerseDetails, setSavedVerseDetails] = usePersistentState("savedVerseDetails", {});
  const [readerNotes, setReaderNotes] = usePersistentState("readerNotes", {});
  const [ayahCollections, setAyahCollections] = usePersistentState("ayahCollections", {});
  const [lastReadPosition, setLastReadPosition] = usePersistentState("lastReadPosition", null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [searchInitialAyah, setSearchInitialAyah] = useState(1);
  const [tafsirTarget, setTafsirTarget] = useState({ surah:"1", ayah:"1" });
  const [tafsirReturnTab, setTafsirReturnTab] = useState("premium");
  const [themeName, setThemeName] = usePersistentState("themeName", "auto");
  const [learningLanguage, setLearningLanguage] = usePersistentState("learningLanguage", "English");
  const [dailyGoal, setDailyGoal] = usePersistentState("dailyGoal", 10);
  const [dailyActivity, setDailyActivity] = usePersistentState("dailyActivity", {});
  const recordDailyActivity = (kind, keys) => { const d=new Date(); const date=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); setDailyActivity(current => { const today={...(current[date]||{})}; const list=Array.isArray(today[kind])?[...today[kind]]:[]; keys.forEach(key=>{if(key&&!list.includes(String(key)))list.push(String(key));}); return {...current,[date]:{...today,[kind]:list}}; }); };
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
  if (tab === "libraryReader" && selectedChapter) screen = <QuranReaderScreen preferredReciterId={preferredReciterId} preferredReciterName={preferredReciterName} onChangeChapter={setSelectedChapter} chapter={selectedChapter} initialAyah={searchInitialAyah} onRecordReading={keys => recordDailyActivity("readingAyahs",keys)} lastReadPosition={lastReadPosition} onSetReadingPosition={setLastReadPosition} onBack={() => setTab("library")} onOpenTafsir={(surah, ayah) => { setTafsirTarget({ surah:String(surah), ayah:String(ayah) }); setTafsirReturnTab("libraryReader"); setTab("tafsir"); }} savedIds={savedIds} notes={readerNotes} onSaveNote={(key,note) => setReaderNotes(current => { const next = { ...current }; if (note.trim()) next[key] = note.trim(); else delete next[key]; return next; })} onToggleSave={(id, detail) => { setSavedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); setSavedVerseDetails(current => { const next = { ...current }; if (savedIds.includes(id)) delete next[id]; else next[id] = detail; return next; }); }} />;
  else if (tab === "search") screen = <QuranSearchScreen language={learningLanguage} onOpenResult={async result => { try { const base = AYAH_API_BASE.endsWith("/") ? AYAH_API_BASE.slice(0,-1) : AYAH_API_BASE; const response = await fetch(base + "/chapters"); if (!response.ok) throw new Error("Could not load surah details."); const data = await response.json(); const chapter = (data.chapters || []).find(item => Number(item.id) === Number(result.chapter_id)); if (!chapter) throw new Error("This surah is not available in the reader yet."); setSearchInitialAyah(Number(result.verse_number)); setSelectedChapter(chapter); setTab("libraryReader"); } catch (error) { Alert.alert("Unable to open ayah", error.message || "Please try again."); } }} />;
  else if (tab === "library") screen = <QuranLibraryScreen onOpenChapter={chapter => { setSelectedChapter(chapter); setTab("libraryReader"); }} />;
  else if (tab === "tracking") screen = <FullMemorizationTrackingScreen progress={memorizationProgress} onSetStatus={(surahId, verse, status) => setMemorizationProgress(current => { const next = { ...current, [surahId]: { ...(current[surahId] || {}) } }; if (status === "none") delete next[surahId][verse]; else next[surahId][verse] = status; return next; })} onBack={() => setTab("progress")} />;
  else if (tab === "revision") screen = <SmartRevisionScreen records={reviewRecords} progress={memorizationProgress} onRateReview={saveReviewRating} onSyncRating={(surahId, verse, rating) => setMemorizationProgress(current => ({ ...current, [surahId]: { ...(current[surahId] || {}), [verse]: rating === "easy" ? "memorized" : rating === "difficult" ? "revision" : "learning" } }))} onStartVerse={(chapterId, verse) => { setActiveAssignment({ chapterId, startVerse:Number(verse), endVerse:Number(verse), revision:true }); setTab("buildSession"); }} onStartPractice={() => setTab("memorize")} />;
  else if (tab === "plan") screen = <MemorizationPlanScreen plan={memorizationPlan} onSavePlan={setMemorizationPlan} onStartPractice={() => setTab("memorize")} onBuildSession={() => { setActiveAssignment(null); setTab("buildSession"); }} onStartAssignment={assignment => { setActiveAssignment(assignment); setTab("buildSession"); }} practiceCount={practiceCount} />;
  else if (tab === "buildSession") screen = <BuildMemorizationSessionScreen onBack={() => setTab("memorize")} onCompleteSession={keys => recordDailyActivity("memorizationAyahs",keys)} initialAssignment={activeAssignment} onFinishAssignment={assignment => { if (!assignment.revision) setMemorizationPlan(current => ({ ...current, schedule: (current.schedule || []).map(item => item.date === assignment.date && item.startVerse === assignment.startVerse && item.endVerse === assignment.endVerse ? { ...item, completed: true, completedAt: new Date().toISOString() } : item) })); setActiveAssignment(null); if (assignment.revision) setTab("revision"); }} onProgressUpdate={(surahId, verse, status) => setMemorizationProgress(current => ({ ...current, [surahId]: { ...(current[surahId] || {}), [verse]: status } }))} />;
  else if (tab === "memorize") screen = <MemorizeScreen onPracticed={() => setPracticeCount(n => n + 1)} onBuildSession={() => setTab("buildSession")} onPracticeCompleted={id => { const map = { fatiha2: ["1","2"], ikhlas1: ["112","1"], asr1: ["103","1"] }; const ref = map[id]; if (ref) recordDailyActivity("memorizationAyahs",[ref[0]+":"+ref[1]]); if (ref) setMemorizationProgress(current => ({ ...current, [ref[0]]: { ...(current[ref[0]] || {}), [ref[1]]: current[ref[0]]?.[ref[1]] === "memorized" ? "memorized" : "learning" } })); }} onSyncRating={(id, rating) => { const map = { fatiha2: ["1","2"], ikhlas1: ["112","1"], asr1: ["103","1"] }; const ref = map[id]; if (ref) setMemorizationProgress(current => ({ ...current, [ref[0]]: { ...(current[ref[0]] || {}), [ref[1]]: rating === "easy" ? "memorized" : rating === "difficult" ? "revision" : "learning" } })); }} savedIds={savedIds} onToggleSave={id => setSavedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])} onSaved={() => setTab("saved")} onRateReview={saveReviewRating} reviewRecords={reviewRecords} />;
  else if (tab === "notebook") screen = <StudyNotebookScreen notes={readerNotes} savedIds={savedIds} savedVerseDetails={savedVerseDetails} collections={ayahCollections} onAssignCollection={(key,name) => setAyahCollections(current => ({ ...current, [key]:name }))} onBack={() => setTab("home")} />;
  else if (tab === "saved") screen = <SavedAyahsScreen savedIds={savedIds} savedVerseDetails={savedVerseDetails} onToggleSave={id => { setSavedIds(ids => ids.filter(x => x !== id)); setSavedVerseDetails(current => { const next = { ...current }; delete next[id]; return next; }); }} onLearn={() => setTab("memorize")} />;
  else if (tab === "arabic") screen = <ArabicLessonsScreen onPremium={() => setTab("premium")} />;
  else if (tab === "arabicAlphabet") screen = <ArabicAlphabetScreen onPremium={() => setTab("premium")} />;
  else if (tab === "teacher") screen = <TeacherPreviewScreen onBack={() => setTab("premium")} onPremium={() => setTab("premium")} />;
  else if (tab === "tafsir") screen = <TafsirLibraryScreen initialTarget={tafsirTarget} onBack={() => setTab(tafsirReturnTab)} />;
  else if (tab === "review" || tab === "listen") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} onTafsir={() => setTab("tafsir")} />;
  else if (tab === "settings") screen = <SettingsScreen themeName={themeName} onSelectTheme={setThemeName} language={learningLanguage} onSelectLanguage={setLearningLanguage} dailyGoal={dailyGoal} onSelectGoal={setDailyGoal} remindersEnabled={remindersEnabled} onToggleReminders={() => setRemindersEnabled(v => !v)} practiceCount={practiceCount} onBack={() => setTab("home")} />;
  else if (tab === "reciters") screen = <ReciterLibraryScreen favoriteIds={favoriteReciterIds} setFavoriteIds={setFavoriteReciterIds} preferredId={preferredReciterId} setPreferredId={setPreferredReciterId} setPreferredName={setPreferredReciterName} onBack={() => setTab("home")} />;
  else if (tab === "calendar") screen = <PersonalLearningCalendarScreen plan={memorizationPlan} activity={dailyActivity} onStartAssignment={assignment=>{setActiveAssignment(assignment);setTab("buildSession");}} onBack={destination=>setTab(destination||"home")} />;
  else if (tab === "recommendations") screen = <LearningRecommendationsScreen progress={memorizationProgress} reviewRecords={reviewRecords} activity={dailyActivity} onStartVerse={(chapterId,verse)=>{setActiveAssignment({chapterId,startVerse:Number(verse),endVerse:Number(verse),revision:true});setTab("buildSession");}} onStartPractice={mode=>setTab(mode==="revision"?"revision":"memorize")} onOpenPlan={()=>setTab("tracking")} onBack={()=>setTab("home")} />;
  else if (tab === "goals") screen = <DailyGoalsScreen activity={dailyActivity} readingTarget={5} memorizationTarget={1} onBack={() => setTab("home")} />;
  else if (tab === "progress") screen = <ProgressScreen practiceCount={practiceCount} dailyGoal={dailyGoal} language={learningLanguage} reviewRecords={reviewRecords} onRevision={() => setTab("revision")} onTracking={() => setTab("tracking")} onLearn={() => setTab("memorize")} onSettings={() => setTab("settings")} />;
  else if (tab === "premium") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} onTafsir={() => { setTafsirTarget({ surah:"1", ayah:"1" }); setTafsirReturnTab("premium"); setTab("tafsir"); }} />;
  else screen = <HomeScreen onNavigate={navigate} onPractice={() => setTab("memorize")} lastReadPosition={lastReadPosition} onContinueReading={() => { if (lastReadPosition?.chapter) { setSelectedChapter(lastReadPosition.chapter); setTab("libraryReader"); } }} />;
  const tabs = [["home", "⌂", "Home"], ["library", "📖", "Qur’an"], ["memorize", "۞", "Learn"], ["settings", "⚙", "Appearance"], ["premium", "✧", "Ayah Plus"]];
  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle={activeTheme === "light" || activeTheme === "sepia" ? "dark-content" : "light-content"} backgroundColor={THEME_PALETTES[activeTheme].bg} /><View style={styles.appShell}><ScrollView contentContainerStyle={styles.container}>{screen}</ScrollView><View style={styles.bottomNav}>{tabs.map(([key, icon, label]) => <Pressable key={key} onPress={() => navigate(key)} style={styles.navButton}><Text style={[styles.navIcon, tab === key && styles.navSelected]}>{icon}</Text><Text style={[styles.navLabel, tab === key && styles.navSelected]}>{label}</Text></Pressable>)}</View></View></SafeAreaView>;
}
const createStyles = (p) => StyleSheet.create({
  goalProgressTrack:{height:9,backgroundColor:p.surface,borderRadius:8,overflow:"hidden",marginTop:7,marginBottom:16}, goalProgressFill:{height:9,backgroundColor:p.accent,borderRadius:8}, goalStatRow:{flexDirection:"row",justifyContent:"space-around",gap:8,marginVertical:12}, goalStat:{flex:1,alignItems:"center",backgroundColor:p.surface,borderRadius:12,padding:12}, goalStatValue:{fontSize:26,fontWeight:"800",color:p.accent}, reciterRow:{flexDirection:"row",alignItems:"center",gap:10},calendarGrid:{flexDirection:"row",flexWrap:"wrap",marginTop:12},calendarDay:{width:"14.2857%",minHeight:48,alignItems:"center",justifyContent:"center",borderRadius:10,marginBottom:4},calendarToday:{borderWidth:1,borderColor:p.accent},calendarMarks:{flexDirection:"row",gap:4,marginTop:4,minHeight:7},calendarDot:{width:6,height:6,borderRadius:3,backgroundColor:"transparent"},calendarAssignmentDot:{backgroundColor:p.accent},calendarActivityDot:{backgroundColor:"#58B88A"},calendarLegend:{flexDirection:"row",justifyContent:"space-around",marginTop:10},weekActivityRow:{flexDirection:"row",justifyContent:"space-between",gap:5,marginVertical:16}, weekDay:{flex:1,alignItems:"center",gap:6}, weekDayDot:{width:34,height:34,borderRadius:17,backgroundColor:p.surface,alignItems:"center",justifyContent:"center"}, weekDayDotActive:{backgroundColor:p.accent}, weekDayCount:{fontSize:12,fontWeight:"700",color:p.text},
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
  apiNotice:{backgroundColor:p.surface,borderRadius:14,padding:14,marginTop:14},chapterRow:{flexDirection:"row",alignItems:"center",paddingVertical:13,borderBottomWidth:1,borderBottomColor:p.border,gap:11},chapterNumber:{width:34,height:34,borderRadius:10,backgroundColor:p.surface,alignItems:"center",justifyContent:"center"},chapterNumberText:{color:p.accent,fontWeight:"800"},chapterDetails:{flex:1},chapterArabic:{color:p.text,fontSize:19},chapterArabicLarge:{color:p.text,fontSize:34,textAlign:"center",marginVertical:12},verseAudioControls:{flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:7,marginTop:12},verseCard:{backgroundColor:p.surface,borderRadius:15,padding:14,marginTop:14},verseMeta:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},verseNumber:{color:p.accent,fontWeight:"800"},verseBookmark:{color:p.accent,fontSize:12,fontWeight:"700"},verseArabic:{color:p.text,fontSize:27,lineHeight:54,textAlign:"right",marginTop:13},
  navIcon:{color:p.muted,fontSize:19,marginBottom:3},navLabel:{color:p.muted,fontSize:10},navSelected:{color:p.accent,fontWeight:"700"},
  stepDots:{flexDirection:"row",justifyContent:"center",gap:9,marginTop:4,marginBottom:8},stepDot:{width:8,height:8,borderRadius:4,backgroundColor:"#43536A"},stepDotActive:{backgroundColor:GOLD},
  rowButtons:{flexDirection:"row",gap:10},rowButtonCell:{flex:1},
  settingsButton:{backgroundColor:p.panel,borderWidth:1,borderColor:p.border,borderRadius:12,paddingVertical:9,paddingHorizontal:12,marginRight:8},settingsButtonText:{color:p.accent,fontSize:11,fontWeight:"700"},settingLabel:{color:p.accent,fontSize:11,fontWeight:"800",letterSpacing:1,marginTop:18,marginBottom:3},settingRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:18,paddingTop:14,borderTopWidth:1,borderTopColor:p.border},settingTextWrap:{flex:1,paddingRight:12},goalChoice:{backgroundColor:p.surface,borderRadius:12,paddingVertical:11,paddingHorizontal:16},toggle:{width:48,height:28,borderRadius:15,backgroundColor:p.surface,borderWidth:1,borderColor:p.border,justifyContent:"center",padding:3},toggleOn:{backgroundColor:p.accent,alignItems:"flex-end"},toggleKnob:{width:20,height:20,borderRadius:10,backgroundColor:"#FFFFFF"},toggleKnobOn:{backgroundColor:"#101C2D"},themeOption:{backgroundColor:p.surface,borderRadius:14,padding:13,marginTop:10,flexDirection:"row",alignItems:"center",gap:10},themeSwatches:{flexDirection:"row",gap:4},swatch:{width:15,height:28,borderRadius:5},themeTextWrap:{flex:1},themeNote:{color:p.muted,fontSize:10,marginTop:3},
  alphabetGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",marginTop:14},alphabetTile:{width:"23%",minHeight:82,backgroundColor:p.surface,borderRadius:14,marginBottom:9,alignItems:"center",justifyContent:"center",padding:6},alphabetTileLetter:{color:p.text,fontSize:28,lineHeight:38},alphabetTileName:{color:p.muted,fontSize:9,marginTop:3},alphabetHeroLetter:{color:p.text,fontSize:76,lineHeight:104,textAlign:"center",marginTop:10},alphabetOption:{color:p.text,fontSize:30,lineHeight:38}
});
let styles = createStyles(THEME_PALETTES.dark);