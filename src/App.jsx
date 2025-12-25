import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, CheckCircle2, Calendar, BookOpen, BarChart3, Clock, Utensils, Dumbbell, ChevronDown, ChevronUp, Info, Activity, Timer, Zap, Play, Square, RotateCcw, AlertTriangle, LifeBuoy, Wind, Waves, Thermometer, Eye, ShieldAlert, Sparkles, Target } from 'lucide-react';

// Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "muovitazione-default";

const PROTOCOL = {
  dailyActions: [
    { id: 'water', time: '10:30', task: 'Risveglio e idratazione', detail: '500ml acqua a temperatura ambiente.', rationale: 'Riattiva la motilità gastrica e il sistema linfatico dopo il sonno: spesso la sete viene scambiata per fame.' },
    { id: 'stretch', time: '11:00', task: 'Attivazione', detail: '10 min stretching o passeggiata leggera.', rationale: "L'esposizione alla luce e il movimento leggero abbassano il cortisolo mattutino: questo evita che il corpo consumi muscolo." },
    { id: 'breakfast', time: '12:00', task: 'Colazione (rottura digiuno)', detail: '250ml latte soia + 20g proteine + 3g cacao.', rationale: 'Le proteine liquide sono assorbite velocemente: in questa fase il cortisolo è alto e le proteine proteggono i tuoi muscoli.' },
    { id: 'snack', time: '15:30', task: 'Merenda "ponte"', detail: '150g mela o arancia + 15g noci.', rationale: 'Questo mix stabilizza la glicemia: se lo salti, alle ore 20:00 avrai una crisi di fame incontrollabile.' },
    { id: 'workout', time: '17:30', task: 'Allenamento', detail: 'Scheda a, b o rucking secondo il giorno.', rationale: "Allenarsi prima di cena aumenta la sensibilità all'insulina: il cibo andrà nei muscoli e non nel grasso." },
    { id: 'dinner', time: '20:00', task: 'Cena "volume intelligente"', detail: '200g pesce o 150g salmone + 250g verdura + 40g riso.', rationale: 'Sostituiamo il volume infinito con volume nutriente: il carboidrato serale stimola la serotonina per calmarti.' },
    { id: 'closing', time: '21:00', task: 'Chiusura metabolica', detail: 'Lavaggio denti (menta) + tisana melissa.', rationale: "Il sapore di menta invia al cervello il segnale di fine pasto: la tisana distende le pareti gastriche." }
  ],
  weeklyPlan: {
    0: { type: 'riposo', task: 'Relax totale.' },
    1: { type: 'scheda a', task: 'Focus gambe e glutei.' },
    2: { type: 'scheda b', task: 'Focus schiena e postura.' },
    3: { type: 'riposo', task: 'Recupero attivo.' },
    4: { type: 'scheda a', task: 'Focus gambe e glutei.' },
    5: { type: 'scheda b', task: 'Focus schiena e postura.' },
    6: { type: 'rucking', task: '5-6kg nello zaino in collina.' }
  },
  workouts: {
    schedaA: {
      title: 'scheda a: lower body e power',
      exercises: [
        { name: 'Goblet squat con kettlebell', volume: '3 serie x 10 ripetizioni', rest: 90, intensity: 'Media: l\'ultima ripetizione deve essere faticosa ma pulita.', img: '/images/goblet squat.jpg', exec: 'Tieni la kettlebell al petto e scendi profonda: i gomiti devono toccare l\'interno coscia per garantire la profondità. Mantieni il petto alto.', rationale: 'Lavora tutto: gambe, glutei e addome per stare dritta.', errors: 'Attenzione agli errori: non sollevare i talloni e non far cedere le ginocchia verso l\'interno.' },
        { name: 'Stacchi rumeni con bilanciere', volume: '3 serie x 8 ripetizioni', rest: 90, intensity: 'Medio-alta: focus sulla tensione muscolare.', img: '/images/stacchi rumeni.jpg', exec: 'Gambe semitese e scendi col bilanciere sfiorando le cosce fino a metà stinco.', rationale: 'Miglior esercizio per glutei e femorali: costruisce la catena posteriore.', errors: 'Attenzione agli errori: non curvare la schiena e non allontanare il bilanciere dalle gambe.' },
        { name: 'Affondi indietro con manubri', volume: '2 serie x 10 passi per gamba', rest: 60, intensity: 'Costante: non fare pause tra i passi.', img: '/images/affondi.jpeg', exec: 'Fai un passo indietro e tocca terra col ginocchio leggermente.', rationale: 'Migliora l\'equilibrio e colpisce il gluteo in allungamento.', errors: 'Attenzione agli errori: non far tremare la caviglia e non sbattere il ginocchio a terra.' },
        { name: 'Plank sui gomiti', volume: '3 serie x 30-45 secondi', rest: 45, intensity: 'Massima contrazione addominale.', img: '/images/plank.jpg', exec: 'Mantieni il corpo dritto come una tavola: sposta il peso sui gomiti.', rationale: 'Rinforza il core e la stabilità complessiva.', errors: 'Attenzione agli errori: non alzare troppo il sedere e non far cedere la zona lombare.' }
      ]
    },
    schedaB: {
      title: 'scheda b: upper body e posture',
      exercises: [
        { name: 'Military press', volume: '3 serie x 8-10 ripetizioni', rest: 90, intensity: 'Esplosiva in salita, controllata in discesa.', img: '/images/Military-press-.jpeg', exec: 'Spingi il peso sopra la testa partendo dalle spalle.', rationale: 'Scolpisce le spalle e obbliga il core a lavorare tantissimo.', errors: 'Attenzione agli errori: non inarcare eccessivamente la schiena durante la spinta.' },
        { name: 'Rematore con kettlebell', volume: '3 serie x 10 per braccio', rest: 60, intensity: 'Focus sul "tirare" con il gomito.', img: '/images/gorilla row.jpeg', exec: 'Busto flesso avanti a 45 gradi: tira la kettlebell verso l\'anca.', rationale: 'Contrasta la postura chiusa e lavora i dorsali.', errors: 'Attenzione agli errori: non ruotare le spalle e non sollevare il busto.' },
        { name: 'Distensioni su panca', volume: '3 serie x 10 ripetizioni', rest: 90, intensity: 'Controllata.', img: '/images/panca piana.jpg', exec: 'Usa bilanciere o manubri spingendo dal petto.', rationale: 'Tonifica pettorali e tricipiti.', errors: 'Attenzione agli errori: non far rimbalzare il peso sul petto.' },
        { name: 'Barra trazioni (dead hang)', volume: '3 serie x max tempo', rest: 60, intensity: 'Resistenza pura.', img: '/images/trazioni.jpg', exec: 'Appenditi alla barra e lasciati penzolare con le braccia tese.', rationale: 'Decomprime la colonna vertebrale e rinforza la presa.', errors: 'Attenzione agli errori: non incassare il collo tra le spalle.' }
      ]
    },
    rucking: {
      title: 'rucking collinare',
      exercises: [
        { name: 'Camminata con carico', volume: '40-50 minuti', rest: 0, intensity: 'Passo svelto.', img: '/images/rucking.jpg', exec: 'Metti 5-6 kg nello zaino e cammina in collina.', rationale: 'Brucia 3x calorie della camminata.', errors: 'Attenzione agli errori: non piegare troppo il busto in avanti.' }
      ]
    }
  },
  sosMethods: [
    {
      id: 'tipp',
      title: 'shock termico: tuffo nel freddo',
      detail: 'Immergi il viso in acqua ghiacciata per 30 secondi o tieni un cubetto di ghiaccio nel palmo della mano.',
      rationale: 'Protocollo DBT (Dialectical Behavior Therapy): attiva il riflesso di immersione dei mammiferi che abbassa istantaneamente il battito cardiaco del 10-25%. Questo riflesso primordiale rallenta il metabolismo e riduce il consumo di ossigeno, creando un effetto calmante immediato sul sistema nervoso simpatico.',
      howTo: '1. Riempi una ciotola con acqua fredda e cubetti di ghiaccio\n2. Trattieni il respiro e immergi il viso per 15-30 secondi\n3. Respira normalmente e ripeti se necessario\n4. Alternativa: tieni un cubetto di ghiaccio sul polso o sulla nuca',
      whenToUse: 'Quando: attacco di panico, rabbia intensa, impulso autolesivo, dissociazione acuta. Evita se hai problemi cardiaci.',
      timer: 30,
      icon: Thermometer
    },
    {
      id: 'breathing',
      title: 'respirazione: metodo 4-7-8',
      detail: 'Inspira per 4 secondi, trattieni per 7, espira profondamente per 8 secondi.',
      rationale: 'Sviluppato dal Dr. Andrew Weil, questo schema respiratorio attiva il sistema nervoso parasimpatico (riposo e digestione) riducendo il cortisolo. L\'espirazione prolungata stimola il nervo vago che rallenta il battito cardiaco e abbassa la pressione sanguigna. Studi dimostrano una riduzione dell\'ansia del 30-40% dopo 4 cicli.',
      howTo: '1. Siediti con la schiena dritta\n2. Posiziona la lingua dietro i denti superiori\n3. Inspira silenziosamente dal naso contando fino a 4\n4. Trattieni il respiro contando fino a 7\n5. Espira completamente dalla bocca (con suono) contando fino a 8\n6. Questo è un ciclo. Ripeti per 4 cicli totali',
      whenToUse: 'Quando: difficoltà ad addormentarsi, ansia generalizzata, prima di eventi stressanti, dopo un litigio. Pratica 2 volte al giorno per risultati ottimali.',
      timer: 240,
      icon: Wind
    },
    {
      id: 'surfing',
      title: 'urge surfing: cavalca l\'onda',
      detail: 'Osserva l\'impulso come un\'onda che cresce, raggiunge il picco e si infrange.',
      rationale: 'Tecnica di Mindfulness-Based Relapse Prevention: gli impulsi (cibo, sostanze, comportamenti compulsivi) seguono una curva fisiologica che dura mediamente 15-30 minuti. Se non "cavalchi" l\'impulso senza agire, l\'intensità diminuisce naturalmente. Le neuroscienze mostrano che resistere all\'impulso rafforza la corteccia prefrontale e indebolisce il circuito della ricompensa.',
      howTo: '1. Quando arriva l\'impulso, fermati e siediti\n2. Identifica dove lo senti nel corpo (stomaco, petto, gola)\n3. Osserva l\'impulso salire come un\'onda: "Sta crescendo..."\n4. Non lottare, non giudicare: sei solo un surfista sull\'onda\n5. Nota il picco: "Ora è al massimo..."\n6. Osserva l\'onda scendere: "Sta diminuendo..."\n7. Respira finché l\'onda non si infrange completamente',
      whenToUse: 'Quando: voglia di fumare, binge eating, shopping compulsivo, controllo ossessivo del telefono, autolesionismo. Più lo pratichi, più diventa efficace.',
      timer: 900,
      icon: Waves
    },
    {
      id: 'erp',
      title: 'doc: prevenzione della risposta',
      detail: 'Resta nel disagio per 5 minuti senza compiere il rituale.',
      rationale: 'Exposure and Response Prevention (ERP): il gold standard per il Disturbo Ossessivo-Compulsivo. Il ciclo DOC funziona così: ossessione → ansia → compulsione → sollievo temporaneo. L\'ERP interrompe questo circuito: ti esponi all\'ossessione ma blocchi la compulsione. Inizialmente l\'ansia sale, ma dopo 20-40 minuti scende naturalmente (abituazione). Il cervello impara che l\'ossessione non è pericolosa e che non serve il rituale.',
      howTo: '1. Identifica il pensiero ossessivo (es: "Non ho chiuso il gas")\n2. Nota l\'ansia salire (scala da 0 a 10)\n3. Resisti all\'impulso di fare il rituale (non controllare)\n4. Cronometra: resta nel disagio per almeno 5-10 minuti\n5. Osserva l\'ansia senza giudicarla: "Sto sentendo ansia"\n6. Nota l\'ansia diminuire gradualmente\n7. Ripeti: ogni esposizione rende il rituale meno necessario',
      whenToUse: 'Quando: controlli ripetuti (porte, fornelli), lavaggio mani compulsivo, pensieri intrusivi, rituali mentali. Consulta sempre un terapeuta specializzato in DOC prima di iniziare.',
      timer: 300,
      icon: ShieldAlert
    },
    {
      id: 'mindfulness',
      title: 'mindfulness: scansione del corpo',
      detail: 'Porta l\'attenzione alle sensazioni fisiche senza giudicarle.',
      rationale: 'Body Scan Meditation del programma MBSR (Mindfulness-Based Stress Reduction) di Jon Kabat-Zinn. La scansione corporea interrompe il pilota automatico mentale e riporta l\'attenzione al presente. Studi fMRI mostrano che la pratica regolare riduce l\'attività dell\'amigdala (centro della paura) e aumenta la materia grigia nell\'ippocampo (memoria e regolazione emotiva). Dopo 8 settimane di pratica quotidiana, si osserva una riduzione del 40% nei sintomi di ansia e depressione.',
      howTo: '1. Sdraiati o siediti comodamente\n2. Chiudi gli occhi e porta attenzione ai piedi\n3. Nota sensazioni: calore, freddo, formicolio, pressione\n4. Respira "dentro" i piedi per 30 secondi\n5. Sposta l\'attenzione alle caviglie, poi polpacci, ginocchia...\n6. Procedi lentamente: cosce → bacino → addome → petto\n7. Spalle → braccia → mani → collo → viso → testa\n8. Termina con 3 respiri profondi consapevoli\n9. Non cercare di cambiare nulla, solo osserva',
      whenToUse: 'Quando: tensione muscolare cronica, difficoltà a dormire, dissociazione dal corpo, dopo traumi, dolore cronico. Pratica quotidiana ideale: 10 minuti prima di dormire.',
      timer: 600,
      icon: Eye
    },
    {
      id: 'defusion',
      title: 'defusione: osserva le nuvole',
      detail: 'Immagina ogni pensiero come una nuvola che passa.',
      rationale: 'Tecnica chiave dell\'Acceptance and Commitment Therapy (ACT). Normalmente siamo "fusi" con i pensieri: "Sono un fallimento" diventa la realtà. La defusione crea distanza: "Sto avendo il pensiero che sono un fallimento". Questa separazione riduce l\'impatto emotivo del 50-70% perché riconosci i pensieri come eventi mentali temporanei, non verità assolute. Il cervello impara che i pensieri sono solo... pensieri.',
      howTo: '1. Chiudi gli occhi e immagina un cielo blu\n2. Quando arriva un pensiero negativo, scrivilo su una nuvola\n3. Osserva la nuvola attraversare il cielo lentamente\n4. Non cercare di spingere via la nuvola (resistenza = persistenza)\n5. Lascia che passi da sola mentre tu osservi\n6. Altre tecniche di defusione:\n   - "Sto avendo il pensiero che..." (davanti ad ogni pensiero)\n   - Canta il pensiero sulla melodia di "Tanti auguri"\n   - Ripeti il pensiero 20 volte velocemente fino a perdere significato\n   - Visualizza i pensieri come messaggi su un nastro trasportatore',
      whenToUse: 'Quando: ruminazione mentale, autocritica intensa, pensieri catastrofici, dialogo interno tossico. Pratica ogni volta che un pensiero ti blocca.',
      timer: 0,
      icon: Sparkles
    },
    {
      id: 'grounding',
      title: 'radicamento: metodo 5-4-3-2-1',
      detail: 'Nomina: 5 cose che vedi, 4 che puoi toccare, 3 suoni, 2 odori, 1 sapore.',
      rationale: 'Tecnica di grounding sensoriale usata per dissociazione, flashback e attacchi di panico. Durante l\'ansia intensa, il cervello è "sequestrato" dall\'amigdala (modalità sopravvivenza). Coinvolgendo attivamente i 5 sensi, si riattiva la corteccia prefrontale (pensiero razionale) e si invia il messaggio: "Sono al sicuro, sono qui e ora". La ricerca mostra una riduzione dell\'ansia del 60% entro 3-5 minuti di pratica.',
      howTo: '1. Fermati e respira profondamente\n2. VISTA: nomina ad alta voce 5 cose che vedi ("Vedo una sedia rossa, un quadro, la porta...")\n3. TATTO: nomina 4 cose che puoi toccare e toccale ("Sento il tessuto del divano, il pavimento freddo, i miei capelli, il telefono liscio")\n4. UDITO: nomina 3 suoni che senti ("Sento il traffico fuori, il frigo che ronza, il mio respiro")\n5. OLFATTO: nomina 2 odori ("Sento profumo di caffè, l\'aria fresca")\n6. GUSTO: nomina 1 sapore ("Sento il sapore di menta in bocca")\n7. Variante veloce: nomina tutto ciò che vedi di un colore specifico (es: tutte le cose blu nella stanza)',
      whenToUse: 'Quando: flashback post-traumatici, derealizzazione, attacchi di panico, ansia pre-esame, prima di dormire se la mente corre. Strumento salvavita per chi soffre di PTSD.',
      timer: 0,
      icon: Activity
    }
  ]
};

const playTibetanBowl = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(110, ctx.currentTime);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(110.5, ctx.currentTime);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6);
  osc1.connect(gain); osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(); osc2.start();
  osc1.stop(ctx.currentTime + 6); osc2.stop(ctx.currentTime + 6);
};

const RestTimer = ({ initialSeconds, colorClass = "bg-[#FFE8D6]", accentColor = "text-[#D97555]" }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      clearInterval(timerRef.current);
      playTibetanBowl();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  return (
    <div className={`p-4 rounded-3xl mt-4 border border-[#E8D5B7]/60 ${colorClass} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isActive ? 'animate-pulse text-[#D97555]' : 'text-[#B8925A]'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5C3D2E]">Timer attivo</span>
        </div>
        <div className={`text-3xl font-mono font-black ${accentColor}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setTimeLeft(initialSeconds); setIsActive(true); }} className="flex-1 py-3 bg-white/60 hover:bg-white text-[#5C3D2E] rounded-2xl font-bold border border-[#E8D5B7]/60 transition-all text-sm uppercase">Avvia {initialSeconds < 60 ? initialSeconds + 's' : Math.floor(initialSeconds/60) + 'm'}</button>
        <button onClick={() => { setIsActive(false); setTimeLeft(0); }} className="px-4 py-3 bg-white/40 rounded-2xl"><RotateCcw className="w-5 h-5 text-[#B8925A]" /></button>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('oggi');
  const [dailyStatus, setDailyStatus] = useState({});
  const [focusStatus, setFocusStatus] = useState({});
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
  const [expandedSosId, setExpandedSosId] = useState(null);

  const todayKey = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const currentProgram = PROTOCOL.weeklyPlan[dayOfWeek];

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Errore autenticazione:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const progressDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', todayKey);
    const unsubProgress = onSnapshot(progressDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDailyStatus(data.completed || {});
        setFocusStatus(data.focus || {});
      }
      setLoading(false);
    }, (err) => console.error(err));

    const diaryCol = collection(db, 'artifacts', appId, 'users', user.uid, 'diary');
    const unsubDiary = onSnapshot(diaryCol, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setEntries(docs);
    }, (err) => console.error(err));
    return () => { unsubProgress(); unsubDiary(); };
  }, [user, todayKey]);

  const toggleTask = async (e, taskId) => {
    e.stopPropagation();
    if (!user) return;
    const newStatus = { ...dailyStatus, [taskId]: !dailyStatus[taskId] };
    setDailyStatus(newStatus); // Aggiorna immediatamente lo stato locale
    const progressDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', todayKey);
    try {
      await setDoc(progressDoc, { completed: newStatus, focus: focusStatus }, { merge: true });
    } catch (error) {
      console.error("Errore salvataggio:", error);
    }
  };

  const toggleFocus = async (e, taskId) => {
    e.stopPropagation();
    const newFocus = { ...focusStatus, [taskId]: !focusStatus[taskId] };
    setFocusStatus(newFocus); // Aggiorna immediatamente lo stato locale

    // Salva su Firebase solo se l'utente è loggato
    if (user) {
      const progressDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', todayKey);
      try {
        await setDoc(progressDoc, { completed: dailyStatus, focus: newFocus }, { merge: true });
      } catch (error) {
        console.error("Errore salvataggio:", error);
      }
    }
  };

  const addDiaryEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    // Crea entry locale
    const newEntryObj = {
      id: Date.now().toString(),
      text: newEntry,
      timestamp: { seconds: Date.now() / 1000 },
      date: todayKey
    };

    // Aggiorna subito lo stato locale
    setEntries([newEntryObj, ...entries]);
    setNewEntry('');

    // Salva su Firebase solo se l'utente esiste
    if (user) {
      try {
        const diaryCol = collection(db, 'artifacts', appId, 'users', user.uid, 'diary');
        await addDoc(diaryCol, { text: newEntryObj.text, timestamp: serverTimestamp(), date: todayKey });
      } catch (error) {
        console.error("Errore salvataggio diario:", error);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F0E6D2] font-sans text-[#D97555] animate-pulse text-xl font-bold italic uppercase tracking-widest">MuovitAzione...</div>;

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-[#F0E6D2] flex flex-col font-sans text-[#2D2D2D] pb-24 border-x border-[#D4A373]/30">
      <header className="bg-gradient-to-b from-[#E8D5B7] to-[#F5E0C3] border-b border-[#C9A961]/40 py-4 shadow-md text-center">
        <h1 className="text-2xl font-black text-[#5C3D2E] flex items-center justify-center gap-2 tracking-tight">
          <Heart className="w-6 h-6 fill-[#D64545] text-[#D64545] animate-pulse" />
          MuovitAzione
        </h1>
      </header>

      <main className="flex-1 p-5 space-y-6 overflow-x-hidden">
        {activeTab === 'oggi' && (
          <section className="space-y-4 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-[#C19A6B] to-[#B8925A] p-6 rounded-[2.5rem] shadow-lg border border-[#D4A373]/50 relative overflow-hidden">
              <h2 className="font-black text-lg flex items-center gap-3 text-white uppercase tracking-tight drop-shadow">
                <Calendar className="w-5 h-5 text-[#FFF8F0]" />
                Oggi: {currentProgram.type}
              </h2>
              <p className="text-[#FFF8F0]/95 text-sm mt-2 font-medium italic">{currentProgram.task}</p>
            </div>

            <div className="space-y-3">
              {PROTOCOL.dailyActions.map((action) => (
                <div key={action.id} className={`rounded-[2rem] border transition-all duration-300 ${focusStatus[action.id] ? 'bg-[#E8D5A0]/40 border-[#C9A961] shadow-xl' : (expandedId === action.id ? 'bg-white border-[#D97555] shadow-md' : 'bg-white border-[#E8D5B7]/60')}`}>
                  <div onClick={() => setExpandedId(expandedId === action.id ? null : action.id)} className="p-4 flex items-center gap-3 cursor-pointer">
                    <div className="flex-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#B8925A]">{action.time}</span>
                      <h3 className={`font-bold text-sm tracking-tight ${dailyStatus[action.id] ? 'text-[#5C3D2E] opacity-50 line-through' : 'text-[#2D2D2D]'}`}>{action.task}</h3>
                    </div>
                    <button onClick={(e) => toggleFocus(e, action.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${focusStatus[action.id] ? 'bg-[#C9A961] text-white shadow-lg' : 'bg-[#F5E8D4] text-[#B8925A] hover:bg-[#E8D5B7] hover:text-[#5C3D2E]'}`}>
                      <Target className="w-7 h-7" />
                    </button>
                  </div>
                  {expandedId === action.id && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-[#5C3D2E] leading-relaxed mb-4 border-t border-[#E8D5B7]/40 pt-4 font-medium">{action.detail}</p>
                      <div className="bg-[#FFF9E6] p-4 rounded-2xl border border-[#F5E8CC] text-[13px] text-[#5C3D2E] italic leading-relaxed shadow-inner">
                        <span className="font-black uppercase not-italic text-[10px] block mb-1 tracking-wider text-[#B8925A]">Perché funziona:</span>
                        {action.rationale}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'sos' && (
          <section className="space-y-4 animate-in slide-in-from-bottom-6 duration-700">
            <div className="bg-gradient-to-br from-[#D97555] to-[#C86648] p-8 rounded-[3rem] shadow-xl border-b-8 border-[#B55538]">
              <h2 className="text-2xl font-black flex items-center gap-3 text-white uppercase italic tracking-tighter drop-shadow-md"><LifeBuoy className="w-7 h-7" /> Sos: rifugio</h2>
              <p className="text-white/95 text-sm mt-3 font-medium leading-relaxed">Momento di tempesta? Questi sono i tuoi strumenti salvavita.</p>
            </div>
            <div className="space-y-3 pt-2">
              {PROTOCOL.sosMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div key={method.id} className={`bg-white rounded-[2.2rem] border-2 transition-all duration-500 ${expandedSosId === method.id ? 'border-[#D97555] shadow-lg scale-[1.02]' : 'border-[#E8D5B7]/60'}`}>
                    <div onClick={() => setExpandedSosId(expandedSosId === method.id ? null : method.id)} className="p-5 flex items-center gap-5 cursor-pointer">
                      <div className={`p-4 rounded-3xl transition-colors ${expandedSosId === method.id ? 'bg-[#D97555] text-white' : 'bg-[#FFE8D6] text-[#D97555]'}`}><IconComponent className="w-7 h-7" /></div>
                      <h3 className="flex-1 font-black text-[#5C3D2E] text-sm uppercase tracking-tight leading-tight">{method.title}</h3>
                      {expandedSosId === method.id ? <ChevronUp className="text-[#D97555]" /> : <ChevronDown className="text-[#C9A961]" />}
                    </div>
                    {expandedSosId === method.id && (
                      <div className="px-6 pb-8 animate-in fade-in duration-500 space-y-5">
                        <div className="h-px bg-[#F5E8CC]" />

                        <div className="bg-[#FFF9E6] p-5 rounded-3xl border border-[#F5E8CC] shadow-inner">
                          <span className="font-black uppercase block mb-2 tracking-widest text-[9px] text-[#D97555]">Cosa fare:</span>
                          <p className="text-[#5C3D2E] text-sm leading-relaxed font-medium italic">"{method.detail}"</p>
                        </div>

                        {method.howTo && (
                          <div className="bg-white p-5 rounded-3xl border border-[#E8D5B7]/60 shadow-sm">
                            <span className="font-black uppercase block mb-3 tracking-widest text-[9px] text-[#B8925A]">Come eseguirlo passo per passo:</span>
                            <p className="text-[#5C3D2E] text-sm leading-relaxed whitespace-pre-line">{method.howTo}</p>
                          </div>
                        )}

                        <div className="bg-[#E8F4E8] p-5 rounded-3xl border border-[#B8D4B8]">
                          <span className="font-black uppercase block mb-2 tracking-widest text-[9px] text-[#5C8B5C]">Perché funziona:</span>
                          <p className="text-[#3D5C3D] text-xs leading-relaxed">{method.rationale}</p>
                        </div>

                        {method.whenToUse && (
                          <div className="bg-[#FFE8D6] p-5 rounded-3xl border border-[#FFCAB5]">
                            <span className="font-black uppercase block mb-2 tracking-widest text-[9px] text-[#D97555]">Quando usarlo:</span>
                            <p className="text-[#A0523D] text-xs leading-relaxed">{method.whenToUse}</p>
                          </div>
                        )}

                        {method.timer > 0 && <RestTimer initialSeconds={method.timer} colorClass="bg-[#FFE8D6]" accentColor="text-[#D97555]" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'allenamento' && (
          <section className="space-y-8 animate-in fade-in duration-700">
            {Object.entries(PROTOCOL.workouts).map(([key, workout]) => (
              <div key={key} className="space-y-4">
                <h2 className="text-lg font-black text-[#5C3D2E] px-1 border-l-[6px] border-[#D97555] pl-4 uppercase tracking-widest">{workout.title}</h2>
                <div className="space-y-3">
                  {workout.exercises.map((ex, idx) => {
                    const exId = `${key}-${idx}`;
                    const isExpanded = expandedWorkoutId === exId;
                    return (
                      <div key={idx} className={`rounded-[2rem] border transition-all duration-500 ${dailyStatus[exId] ? 'bg-[#D4E7D4]/40 border-[#7A9B76] shadow-lg' : (isExpanded ? 'bg-white border-[#D97555] shadow-xl translate-y-[-2px]' : 'bg-white border-[#E8D5B7]/60')}`}>
                        <div onClick={() => setExpandedWorkoutId(isExpanded ? null : exId)} className="p-4 flex items-center justify-between cursor-pointer">
                          <div className="flex-1 px-2">
                            <h3 className={`font-black text-sm tracking-tight ${dailyStatus[exId] ? 'text-[#5C3D2E] opacity-50 line-through' : 'text-[#2D2D2D]'}`}>{ex.name}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] bg-[#FFE8D6] text-[#D97555] px-3 py-1 rounded-full font-black uppercase tracking-wider">{ex.volume}</span>
                              {dailyStatus[exId] && <span className="text-[9px] bg-[#C19A6B] text-white px-3 py-1 rounded-full font-black uppercase tracking-wider">✓ Completato</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => toggleTask(e, exId)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dailyStatus[exId] ? 'bg-[#7A9B76] text-white shadow-lg' : 'bg-[#F5E8D4] text-[#B8925A] hover:bg-[#7A9B76]/30 hover:text-[#5C3D2E]'}`}><CheckCircle2 className="w-6 h-6" /></button>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#D97555]" /> : <ChevronDown className="w-5 h-5 text-[#C9A961]" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-5 pb-6 animate-in slide-in-from-top-3 duration-500">
                            <div className="rounded-[2rem] overflow-hidden mb-5 bg-[#F5E8D4] border border-[#E8D5B7]/60 shadow-inner">
                              <img src={ex.img} alt={ex.name} className="w-full h-64 object-cover" onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=' + ex.name.replace(/\s/g, '+'); }} />
                            </div>
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#F5E8D4] p-4 rounded-[1.5rem] border border-[#E8D5B7]/60"><p className="text-[9px] font-black text-[#B8925A] uppercase tracking-widest mb-1">Recupero:</p><p className="font-black text-[#D97555] text-lg">{ex.rest}s</p></div>
                                <div className="bg-[#F5E8D4] p-4 rounded-[1.5rem] border border-[#E8D5B7]/60"><p className="text-[9px] font-black text-[#B8925A] uppercase tracking-widest mb-1">Intensità:</p><p className="font-black text-[#5C3D2E] text-xs leading-tight">{ex.intensity}</p></div>
                              </div>
                              {ex.rest > 0 && <RestTimer initialSeconds={ex.rest} colorClass="bg-[#FFE8D6]" accentColor="text-[#C19A6B]" />}
                              <div className="bg-white p-5 rounded-3xl border border-[#E8D5B7]/60 shadow-sm"><p className="text-[10px] font-black text-[#B8925A] uppercase mb-2 tracking-widest">Esecuzione tecnica:</p><p className="text-sm italic text-[#5C3D2E] leading-relaxed font-medium">{ex.exec}</p></div>
                              <div className="bg-[#FFE8E0] p-5 rounded-3xl border border-[#FFCAB5] text-[#A0523D]"><p className="text-[10px] font-black text-[#D97555] uppercase flex items-center gap-2 mb-2 tracking-widest"><AlertTriangle className="w-3 h-3" /> Attenzione agli errori:</p><p className="text-sm leading-relaxed">{ex.errors}</p></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'diario' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-700">
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D5B7]/60 shadow-md">
              <form onSubmit={addDiaryEntry} className="space-y-4">
                <label className="block text-sm font-black text-[#5C3D2E] px-1 uppercase tracking-wider text-center">Come ti senti oggi?</label>
                <textarea value={newEntry} onChange={(e) => setNewEntry(e.target.value)} placeholder="Oggi mi sento..." className="w-full p-6 rounded-[2rem] bg-[#FFF9E6] border-2 border-[#F5E8CC] focus:border-[#C9A961] focus:ring-0 outline-none min-h-[160px] text-[#5C3D2E] font-medium placeholder:italic transition-all shadow-inner" />
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-[#C19A6B] to-[#B8925A] hover:from-[#B8925A] hover:to-[#A88650] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98]">Salva sensazione</button>
              </form>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="font-black text-[#B8925A] px-2 flex items-center gap-3 uppercase tracking-widest text-xs"><BookOpen className="w-4 h-4" /> Storico note:</h3>
              {entries.length === 0 ? <div className="text-center py-20 text-[#C9A961] italic font-medium bg-white rounded-[2rem] border border-dashed border-[#E8D5B7] uppercase text-[10px] tracking-[0.2em]">Sinfonia del silenzio.</div> :
                entries.map((entry) => (
                  <div key={entry.id} className="bg-white p-6 rounded-[2rem] border border-[#E8D5B7]/60 shadow-sm relative overflow-hidden group hover:border-[#C9A961] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#C9A961] group-hover:bg-[#B8925A] transition-colors" />
                    <div className="text-[10px] font-black text-[#B8925A] uppercase mb-3 tracking-[0.2em]">{entry.date === todayKey ? 'Oggi' : entry.date}</div>
                    <p className="text-[#5C3D2E] text-[15px] whitespace-pre-wrap leading-relaxed font-medium italic">"{entry.text.charAt(0).toUpperCase() + entry.text.slice(1)}"</p>
                  </div>
                ))
              }
            </div>
          </section>
        )}
      </main>

      {/* Menu di navigazione fisso in basso */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-gradient-to-t from-white to-[#FFF8F0]/95 backdrop-blur-xl border-t border-[#C9A961]/40 shadow-2xl z-30">
        <div className="flex justify-around items-center px-2 py-2 gap-1">
          {[
            { id: 'oggi', icon: CheckCircle2, label: 'oggi' },
            { id: 'allenamento', icon: Dumbbell, label: 'gym' },
            { id: 'sos', icon: LifeBuoy, label: 'sos' },
            { id: 'diario', icon: BookOpen, label: 'diario' }
          ].map((tab) => {
            const NavIcon = tab.icon;
            const isSos = tab.id === 'sos';
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? { backgroundColor: isSos ? '#D97555' : '#7A9B76' } : {}} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'text-white font-black shadow-md' : 'text-[#C9A961] font-medium hover:text-[#5C3D2E] bg-transparent'}`}>
                <NavIcon className="w-5 h-5" />
                <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;