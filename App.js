import React, { useState } from "react";
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View,
  Pressable, TextInput, ImageBackground, Alert
} from "react-native";

const GOLD = "#D9B96E";
const NAVY = "#101C2D";
const PANEL = "#1B2A40";
const MUTED = "#AAB6C7";
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
        <ActionTile icon="ا" title="Arabic lessons" subtitle="Everyday words" onPress={() => onNavigate("arabic")} />\n        <ActionTile icon="ح" title="Arabic alphabet" subtitle="Recognize your first letters" onPress={() => onNavigate("arabicAlphabet")} />
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
function MemorizeScreen({ onPracticed }) {
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
      <Button title={done ? "Session completed" : "Finish this practice"} onPress={() => { if (!done) { setDone(true); onPracticed(); } }} disabled={done} />
      <Text style={styles.tinyNote}>This guided practice is interactive, but audio playback and automatic recitation checking are not connected yet. Please check Qur’an text and pronunciation with a trusted mushaf or qualified teacher.</Text>
    </>
  );
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
\nfunction ReviewScreen() {
  const [show, setShow] = useState(false);
  return <><Header eyebrow="REVIEW" title="Strengthen your recall" /><View style={styles.infoCard}><Text style={styles.cardEyebrow}>REVIEW CARD</Text><Text style={styles.dailyArabic} writingDirection="rtl">{PRACTICE.arabic}</Text>{show && <Text style={styles.translation}>{PRACTICE.translation}</Text>}<Text style={styles.reference}>{PRACTICE.reference}</Text><Button title={show ? "Hide translation" : "Show translation"} secondary onPress={() => setShow(!show)} /></View><Text style={styles.progressHint}>A personal review schedule and saved memorization history will be added in a later milestone.</Text></>;
}
function ListenScreen() {
  const [choice, setChoice] = useState("Mishary Rashid Alafasy");
  return <><Header eyebrow="RECITATION" title="Listen and follow" /><View style={styles.infoCard}><Text style={styles.sectionTitle}>Choose a reciter</Text>{["Mishary Rashid Alafasy", "Saad Al-Ghamdi", "Abdul Rahman Al-Sudais"].map(n => <Pressable key={n} onPress={() => setChoice(n)} style={[styles.choice, choice === n && styles.choiceSelected]}><Text style={[styles.choiceText, choice === n && styles.choiceTextSelected]}>{n}</Text><Text style={styles.choiceMark}>{choice === n ? "✓" : "○"}</Text></Pressable>)}<Text style={styles.progressHint}>Selected: {choice}. Audio will use authorized recordings from a verified source.</Text></View></>;
}
function TeacherScreen({ onPremium }) {
  const [assistant, setAssistant] = useState("Hamza");
  return <><Header eyebrow="AYAH PLUS · AI TEACHER" title="A teacher by your side" /><View style={styles.teacherCard}><View style={styles.teacherAvatar}><Text style={styles.teacherAvatarText}>{assistant === "Hamza" ? "ح" : "م"}</Text></View><Text style={styles.teacherName}>{assistant}</Text><Text style={styles.translation}>Your Qur’an learning companion</Text><View style={styles.assistantChoices}>{["Hamza", "Maryam"].map(n => <Pressable key={n} onPress={() => setAssistant(n)} style={[styles.nameChoice, assistant === n && styles.choiceSelected]}><Text style={[styles.choiceText, assistant === n && styles.choiceTextSelected]}>{n}</Text></Pressable>)}</View><Text style={styles.progressHint}>Choose the assistant name you prefer. The assistant’s teaching voice will be original and carefully designed for clear, gentle recitation guidance.</Text></View><View style={styles.infoCard}><Text style={styles.sectionTitle}>Planned teacher features</Text>{["Repeat-after-me practice, ayah by ayah","Speak with you in your chosen language","Help with memorization and revision","Explain vocabulary and basic meanings","Build a personal learning routine"].map(x => <Text key={x} style={styles.stepText}>✦  {x}</Text>)}<Text style={styles.lockedLabel}>PREMIUM FEATURE PREVIEW</Text><Button title="See Ayah Plus" onPress={onPremium} /></View></>;
}
function TeacherPreviewScreen({ onBack, onPremium }) {
  const [assistant, setAssistant] = useState("Hamza");
  const [language, setLanguage] = useState("English");
  const [step, setStep] = useState(0);
  const languages = ["English", "العربية", "اردو", "বাংলা", "Türkçe", "Français", "Bahasa Indonesia"];
  const steps = [
    "Listen carefully to the ayah.",
    "Now repeat the ayah at a comfortable pace.",
    "Check the words, then try once more."
  ];
  return <>
    <Header eyebrow="AYAH PLUS · TEACHER PREVIEW" title="Meet your Qur’an teacher" />
    <View style={styles.teacherCard}>
      <View style={styles.teacherAvatar}><Text style={styles.teacherAvatarText}>{assistant === "Hamza" ? "ح" : "م"}</Text></View>
      <Text style={styles.teacherName}>{assistant}</Text>
      <Text style={styles.translation}>A calm, warm, original teaching voice</Text>
      <Text style={styles.progressHint}>Designed to be gentle, clear and unhurried—not an imitation of a specific reciter.</Text>
      <View style={styles.assistantChoices}>
        {["Hamza", "Maryam"].map(n => <Pressable key={n} onPress={() => setAssistant(n)} style={[styles.nameChoice, assistant === n && styles.choiceSelected]}><Text style={[styles.choiceText, assistant === n && styles.choiceTextSelected]}>{n}</Text></Pressable>)}
      </View>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Teaching language</Text>
      <Text style={styles.progressHint}>Choose the language you would like the assistant to use for explanations.</Text>
      <View style={styles.languageGrid}>
        {languages.map(item => <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.languageChoice, language === item && styles.choiceSelected]}><Text style={[styles.choiceText, language === item && styles.choiceTextSelected]}>{item}</Text></Pressable>)}
      </View>
      <Text style={styles.progressHint}>Selected: {language}. More languages can be added as the assistant is developed.</Text>
    </View>
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Repeat-after-me lesson preview</Text>
      <Text style={styles.dailyArabic} writingDirection="rtl">{PRACTICE.arabic}</Text>
      <Text style={styles.reference}>{PRACTICE.reference}</Text>
      <View style={styles.practicePrompt}><Text style={styles.practicePromptText}>{steps[step]}</Text></View>
      <Button title={step === 2 ? "Restart lesson preview" : "Next practice step"} onPress={() => setStep(step === 2 ? 0 : step + 1)} />
      <Text style={styles.tinyNote}>This is a screen-flow preview only. Live AI conversation, speech recognition and generated audio are not connected yet.</Text>
    </View>
    <Button title="See Ayah Plus plan" onPress={onPremium} />
    <Button title="Back to Ayah" secondary onPress={onBack} />
  </>;
}
function PremiumScreen({ onBack, onTeacher }) {
  return <><Header eyebrow="AYAH PLUS" title="More support for your hifdh" /><View style={styles.premiumHero}><Text style={styles.premiumKicker}>YOUR PERSONAL LEARNING COMPANION</Text><Text style={styles.premiumBig}>Learn. Listen. Repeat.</Text><Text style={styles.translation}>A focused Qur’an learning experience with an AI teacher.</Text></View><View style={styles.infoCard}><Text style={styles.sectionTitle}>Planned Plus benefits</Text>{["AI teacher with repeat-after-me sessions","Choose Hamza or Maryam as your assistant","Multilingual conversation and explanations","Guided memorization and revision tools","Expanded recitation and learning options"].map(x => <Text key={x} style={styles.stepText}>✓  {x}</Text>)}<Button title="Preview the AI teacher" onPress={onTeacher} secondary /></View><View style={styles.trialCard}><Text style={styles.sectionTitle}>Try Ayah Plus for 7 days</Text><Text style={styles.progressHint}>The free trial is planned as a one-time offer per account. Subscription price: to be decided.</Text><Text style={styles.tinyNote}>Trial eligibility, billing, cancellation and one-time-use enforcement will be implemented securely before launch. This preview does not start a trial or charge anything.</Text><Button title="Premium access — coming soon" disabled onPress={() => {}} /></View><Button title="Back to Ayah" secondary onPress={onBack} /></>;
}
export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState("home");
  const [practiceCount, setPracticeCount] = useState(0);
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
  if (!signedIn) return <SafeAreaView style={styles.safeArea}><StatusBar barStyle="light-content" /><WelcomeScreen onEmailContinue={continueEmail} onGoogle={googlePlaceholder} /></SafeAreaView>;
  let screen;
  if (tab === "memorize") screen = <MemorizeScreen onPracticed={() => setPracticeCount(n => n + 1)} />;
  else if (tab === "arabic") screen = <ArabicLessonsScreen onPremium={() => setTab("premium")} />;\n  else if (tab === "arabicAlphabet") screen = <ArabicAlphabetScreen onPremium={() => setTab("premium")} />;
  else if (tab === "teacher") screen = <TeacherPreviewScreen onBack={() => setTab("home")} onPremium={() => setTab("premium")} />;
  else if (tab === "review" || tab === "listen") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} />;
  else if (tab === "premium") screen = <PremiumScreen onBack={() => setTab("home")} onTeacher={() => setTab("teacher")} />;
  else screen = <HomeScreen onNavigate={navigate} onPractice={() => setTab("memorize")} />;
  const tabs = [["home", "⌂", "Home"], ["memorize", "۞", "Learn"], ["premium", "✧", "Ayah Plus"]];
  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle="light-content" backgroundColor={NAVY} /><View style={styles.appShell}><ScrollView contentContainerStyle={styles.container}>{screen}</ScrollView><View style={styles.bottomNav}>{tabs.map(([key, icon, label]) => <Pressable key={key} onPress={() => navigate(key)} style={styles.navButton}><Text style={[styles.navIcon, tab === key && styles.navSelected]}>{icon}</Text><Text style={[styles.navLabel, tab === key && styles.navSelected]}>{label}</Text></Pressable>)}</View></View></SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:NAVY}, appShell:{flex:1}, container:{padding:22,paddingBottom:28,flexGrow:1},
  welcomeBackground:{flex:1,justifyContent:"center"}, welcomeShade:{flex:1,backgroundColor:"rgba(8,17,30,0.68)",padding:20,justifyContent:"center"},
  welcomeTop:{alignItems:"center",marginBottom:18}, logo:{width:54,height:54,borderRadius:18,backgroundColor:PANEL,borderWidth:1,borderColor:"#53617A",alignItems:"center",justifyContent:"center",marginBottom:8},
  logoArabic:{color:GOLD,fontSize:24,fontWeight:"700"},brand:{color:"#FFF",fontSize:17,fontWeight:"800",letterSpacing:5},tagline:{color:"#D5DCE6",fontSize:12,marginTop:7,textAlign:"center"},
  dailyCard:{backgroundColor:"rgba(27,42,64,0.88)",borderRadius:24,padding:20,borderWidth:1,borderColor:"rgba(217,185,110,0.38)",marginBottom:16},
  dailyCardCompact:{marginBottom:14},cardEyebrow:{color:GOLD,fontSize:10,letterSpacing:2,fontWeight:"700",textAlign:"center"},
  dailyArabic:{color:"#FFF",fontSize:29,lineHeight:58,textAlign:"center",marginTop:14,marginBottom:9},translation:{color:"#E1E6ED",fontSize:14,textAlign:"center",lineHeight:23,marginBottom:7},
  reference:{color:MUTED,fontSize:11,textAlign:"center",marginTop:7},signInCard:{backgroundColor:"rgba(16,28,45,0.94)",borderRadius:22,padding:18,borderWidth:1,borderColor:"#34445B"},
  signInTitle:{color:"#FFF",fontSize:19,fontWeight:"700",textAlign:"center"},signInCopy:{color:MUTED,fontSize:12,textAlign:"center",lineHeight:19,marginTop:7},
  emailArea:{marginTop:12},emailInput:{backgroundColor:"#24354C",borderWidth:1,borderColor:"#53617A",borderRadius:12,padding:13,color:"#FFF",fontSize:14},
  tinyNote:{color:MUTED,fontSize:10,lineHeight:16,textAlign:"center",marginTop:12},button:{backgroundColor:GOLD,borderRadius:14,paddingVertical:14,paddingHorizontal:16,alignItems:"center",marginTop:12},
  buttonSecondary:{backgroundColor:"transparent",borderWidth:1,borderColor:GOLD},buttonText:{color:NAVY,fontWeight:"700",fontSize:13},buttonTextSecondary:{color:GOLD},disabled:{opacity:0.55},pressed:{opacity:0.76},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:14,marginBottom:23},eyebrow:{color:GOLD,fontSize:10,letterSpacing:2,fontWeight:"700",marginBottom:7},
  heading:{color:"#FFF",fontSize:22,fontWeight:"700"},pageHeader:{marginTop:18,marginBottom:23},pageTitle:{color:"#FFF",fontSize:27,fontWeight:"700"},
  progressCard:{backgroundColor:PANEL,borderRadius:18,padding:18,borderWidth:1,borderColor:"#34445B",marginBottom:24},
  sectionTitle:{color:"#FFF",fontSize:17,fontWeight:"700",marginBottom:10},progressHint:{color:MUTED,fontSize:12,marginTop:9,lineHeight:19},
  actionGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",marginTop:4},actionTile:{width:"48%",backgroundColor:PANEL,borderRadius:18,padding:15,marginBottom:12,borderWidth:1,borderColor:"#34445B",minHeight:118},
  tileTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},actionIcon:{color:GOLD,fontSize:23,marginBottom:10},lock:{color:GOLD,fontSize:9,letterSpacing:1,fontWeight:"800"},
  actionTitle:{color:"#FFF",fontSize:14,fontWeight:"700",marginBottom:5},actionSubtitle:{color:MUTED,fontSize:11},
  premiumBanner:{backgroundColor:"#25364B",borderRadius:18,padding:17,borderWidth:1,borderColor:"#8D784B",marginTop:8},premiumTitle:{color:GOLD,fontSize:17,fontWeight:"700"},
  lessonCard:{backgroundColor:PANEL,borderRadius:22,padding:20,borderWidth:1,borderColor:"#34445B",marginBottom:15},infoCard:{backgroundColor:PANEL,borderRadius:20,padding:18,borderWidth:1,borderColor:"#34445B",marginTop:16,marginBottom:16},
  stepText:{color:"#E1E6ED",fontSize:13,lineHeight:21,marginBottom:9},choice:{backgroundColor:"#24354C",borderRadius:13,padding:14,marginTop:9,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  choiceSelected:{borderWidth:1,borderColor:GOLD},choiceText:{color:"#E1E6ED",fontSize:13},choiceTextSelected:{color:GOLD,fontWeight:"700"},choiceMark:{color:GOLD,fontSize:17},
  teacherCard:{backgroundColor:PANEL,borderRadius:22,padding:20,alignItems:"center",borderWidth:1,borderColor:"#8D784B"},
  teacherAvatar:{width:76,height:76,borderRadius:38,backgroundColor:"#2C4059",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:GOLD},
  teacherAvatarText:{color:GOLD,fontSize:34},teacherName:{color:"#FFF",fontSize:23,fontWeight:"700",marginTop:12},assistantChoices:{flexDirection:"row",gap:10,marginTop:15},
  nameChoice:{paddingVertical:10,paddingHorizontal:22,borderRadius:12,backgroundColor:"#24354C"},lockedLabel:{color:GOLD,fontSize:10,fontWeight:"800",letterSpacing:1,marginTop:12},
  premiumHero:{backgroundColor:"#263A50",borderRadius:22,padding:22,borderWidth:1,borderColor:"#8D784B",marginBottom:16},
  premiumKicker:{color:GOLD,fontSize:10,letterSpacing:1.5,fontWeight:"800"},premiumBig:{color:"#FFF",fontSize:25,fontWeight:"800",marginTop:14,marginBottom:10},
  trialCard:{backgroundColor:PANEL,borderRadius:20,padding:18,borderWidth:1,borderColor:GOLD,marginBottom:14},
  languageGrid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},languageChoice:{backgroundColor:"#24354C",borderRadius:12,paddingVertical:10,paddingHorizontal:13},
  practicePrompt:{backgroundColor:"#24354C",borderRadius:14,padding:15,marginTop:10},practicePromptText:{color:GOLD,fontSize:14,fontWeight:"600",textAlign:"center",lineHeight:22},
  quizPrompt:{color:"#FFF",fontSize:17,fontWeight:"700",lineHeight:25,marginTop:14,marginBottom:6},quizScore:{color:GOLD,fontSize:36,fontWeight:"800",textAlign:"center",marginVertical:12},
  freeLessonBadge:{backgroundColor:"#24354C",borderRadius:12,padding:10,alignSelf:"flex-start",borderWidth:1,borderColor:GOLD,marginBottom:8},freeLessonBadgeText:{color:GOLD,fontSize:10,fontWeight:"800",letterSpacing:1.2},
  exampleBox:{backgroundColor:"#24354C",borderRadius:14,padding:14,marginTop:14,alignItems:"center"},exampleArabic:{color:"#FFF",fontSize:24,lineHeight:42,textAlign:"center"},
  navButton:{alignItems:"center",minWidth:58,paddingVertical:4},bottomNav:{flexDirection:"row",justifyContent:"space-around",borderTopWidth:1,borderTopColor:"#34445B",paddingTop:10,paddingBottom:7,backgroundColor:NAVY},
  navIcon:{color:MUTED,fontSize:19,marginBottom:3},navLabel:{color:MUTED,fontSize:10},navSelected:{color:GOLD,fontWeight:"700"},
  stepDots:{flexDirection:"row",justifyContent:"center",gap:9,marginTop:4,marginBottom:8},stepDot:{width:8,height:8,borderRadius:4,backgroundColor:"#43536A"},stepDotActive:{backgroundColor:GOLD},
  rowButtons:{flexDirection:"row",gap:10},rowButtonCell:{flex:1},\n  alphabetGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",marginTop:14},alphabetTile:{width:"23%",minHeight:82,backgroundColor:"#24354C",borderRadius:14,marginBottom:9,alignItems:"center",justifyContent:"center",padding:6},alphabetTileLetter:{color:"#FFF",fontSize:28,lineHeight:38},alphabetTileName:{color:MUTED,fontSize:9,marginTop:3},alphabetHeroLetter:{color:"#FFF",fontSize:76,lineHeight:104,textAlign:"center",marginTop:10},alphabetOption:{color:"#FFF",fontSize:30,lineHeight:38}
});