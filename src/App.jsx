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
    { id: 'tipp', title: 'shock termico: tuffo nel freddo', detail: 'Immergi il viso in acqua ghiacciata per 30 secondi o tieni un cubetto di ghiaccio nel palmo della mano.', rationale: 'Protocollo dbt: attiva il riflesso di immersione che abbassa istantaneamente il battito cardiaco.', timer: 30, icon: Thermometer },
    { id: 'breathing', title: 'respirazione: metodo 4-7-8', detail: 'Inspira per 4 secondi, trattiene per 7, espira profondamente per 8 secondi.', rationale: 'Linee guida ansia: attiva il sistema parasimpatico.', timer: 240, icon: Wind },
    { id: 'surfing', title: 'urge surfing: cavalca l\'onda', detail: 'Osserva l\'impulso come un\'onda che cresce, raggiunge il picco e si infrange.', rationale: 'Protocollo act: gli impulsi passano se non alimentati.', timer: 900, icon: Waves },
    { id: 'erp', title: 'doc: prevenzione della risposta', detail: 'Resta nel disagio per 5 minuti senza compiere il rituale.', rationale: 'Gold standard erp: interrompe il ciclo ossessivo.', timer: 300, icon: ShieldAlert },
    { id: 'mindfulness', title: 'mindfulness: scansione del corpo', detail: 'Porta l\'attenzione alle sensazioni fisiche senza giudicarle.', rationale: 'Mindfulness mbsr: sposta il focus dalla mente al presente.', timer: 600, icon: Eye },
    { id: 'defusion', title: 'defusione: osserva le nuvole', detail: 'Immagina ogni pensiero come una nuvola che passa.', rationale: 'Protocollo act: crea distanza tra te e il pensiero.', timer: 0, icon: Sparkles },
    { id: 'grounding', title: 'radicamento: metodo 5-4-3-2-1', detail: 'Nomina: 5 cose che vedi, 4 che puoi toccare, 3 suoni.', rationale: 'Ancora la mente alla realtà sensoriale esterna.', timer: 0, icon: Activity }
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

const RestTimer = ({ initialSeconds, colorClass = "bg-[#F5E6D3]", accentColor = "text-[#C97C5D]" }) => {
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
    <div className={`p-4 rounded-3xl mt-4 border border-[#E8CFAB]/50 ${colorClass} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isActive ? 'animate-pulse text-[#C97C5D]' : 'text-[#A0755B]'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#6B4423]">Timer attivo</span>
        </div>
        <div className={`text-3xl font-mono font-black ${accentColor}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setTimeLeft(initialSeconds); setIsActive(true); }} className="flex-1 py-3 bg-[#FEFCF8]/60 hover:bg-[#FEFCF8] text-[#6B4423] rounded-2xl font-bold border border-[#E8CFAB]/50 transition-all text-sm uppercase">Avvia {initialSeconds < 60 ? initialSeconds + 's' : Math.floor(initialSeconds/60) + 'm'}</button>
        <button onClick={() => { setIsActive(false); setTimeLeft(0); }} className="px-4 py-3 bg-[#FEFCF8]/40 rounded-2xl"><RotateCcw className="w-5 h-5 text-[#A0755B]" /></button>
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
    if (!user || !newEntry.trim()) return;
    const diaryCol = collection(db, 'artifacts', appId, 'users', user.uid, 'diary');
    await addDoc(diaryCol, { text: newEntry, timestamp: serverTimestamp(), date: todayKey });
    setNewEntry('');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F5EBE0] font-sans text-[#C97C5D] animate-pulse text-xl font-bold italic uppercase tracking-widest">MuovitAzione...</div>;

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-[#F5EBE0] flex flex-col font-sans text-[#3D3D3D] pb-24 border-x border-[#D4A373]/20">
      <header className="bg-gradient-to-b from-[#E8CFAB] to-[#F5DFB8] border-b border-[#D4A373]/30 p-8 sticky top-0 z-20 shadow-lg text-center">
        <h1 className="text-3xl font-black text-[#6B4423] flex items-center justify-center gap-2 tracking-tighter drop-shadow-sm">
          <Heart className="w-7 h-7 fill-[#C97C5D] text-[#C97C5D] animate-pulse" />
          MuovitAzione
        </h1>
        <p className="text-[10px] text-[#A0755B] mt-2 uppercase tracking-[0.2em] font-black">Il tuo protocollo vintage 2.0</p>
      </header>

      <main className="flex-1 p-5 space-y-6 overflow-x-hidden">
        {activeTab === 'oggi' && (
          <section className="space-y-4 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-[#B4A284] to-[#A89168] p-6 rounded-[2.5rem] shadow-md border border-[#D4A373]/40 relative overflow-hidden">
              <h2 className="font-black text-lg flex items-center gap-3 text-white uppercase tracking-tight drop-shadow">
                <Calendar className="w-5 h-5 text-[#F5EBE0]" />
                Oggi: {currentProgram.type}
              </h2>
              <p className="text-[#F5EBE0]/90 text-sm mt-2 font-medium italic">{currentProgram.task}</p>
            </div>

            <div className="space-y-3">
              {PROTOCOL.dailyActions.map((action) => (
                <div key={action.id} className={`rounded-[2rem] border transition-all duration-300 ${focusStatus[action.id] ? 'bg-[#D4A373]/30 border-[#D4A373] shadow-xl' : (expandedId === action.id ? 'bg-[#FEFCF8] border-[#C97C5D] shadow-md' : 'bg-[#FEFCF8] border-[#E8CFAB]/50')}`}>
                  <div onClick={() => setExpandedId(expandedId === action.id ? null : action.id)} className="p-4 flex items-center gap-3 cursor-pointer">
                    <div className="flex-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#A0755B]">{action.time}</span>
                      <h3 className={`font-bold text-sm tracking-tight ${dailyStatus[action.id] ? 'text-[#6B4423] opacity-50 line-through' : 'text-[#3D3D3D]'}`}>{action.task}</h3>
                    </div>
                    <button onClick={(e) => toggleFocus(e, action.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${focusStatus[action.id] ? 'bg-[#D4A373] text-white shadow-lg' : 'bg-[#F5EBE0] text-[#A0755B] hover:bg-[#E8CFAB] hover:text-[#6B4423]'}`}>
                      <Target className="w-7 h-7" />
                    </button>
                  </div>
                  {expandedId === action.id && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-[#5D4E37] leading-relaxed mb-4 border-t border-[#E8CFAB]/30 pt-4 font-medium">{action.detail}</p>
                      <div className="bg-[#FFF8E7] p-4 rounded-2xl border border-[#E8CFAB] text-[13px] text-[#6B4423] italic leading-relaxed shadow-inner">
                        <span className="font-black uppercase not-italic text-[10px] block mb-1 tracking-wider text-[#A0755B]">Perché funziona:</span>
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
            <div className="bg-gradient-to-br from-[#C97C5D] to-[#B56947] p-8 rounded-[3rem] shadow-xl border-b-8 border-[#A0523D]">
              <h2 className="text-2xl font-black flex items-center gap-3 text-white uppercase italic tracking-tighter drop-shadow-md"><LifeBuoy className="w-7 h-7" /> Sos: rifugio</h2>
              <p className="text-[#FFF8F0] text-sm mt-3 font-medium leading-relaxed">Momento di tempesta? Questi sono i tuoi strumenti salvavita.</p>
            </div>
            <div className="space-y-3 pt-2">
              {PROTOCOL.sosMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div key={method.id} className={`bg-[#FEFCF8] rounded-[2.2rem] border-2 transition-all duration-500 ${expandedSosId === method.id ? 'border-[#C97C5D] shadow-lg scale-[1.02]' : 'border-[#E8CFAB]/50'}`}>
                    <div onClick={() => setExpandedSosId(expandedSosId === method.id ? null : method.id)} className="p-5 flex items-center gap-5 cursor-pointer">
                      <div className={`p-4 rounded-3xl transition-colors ${expandedSosId === method.id ? 'bg-[#C97C5D] text-white' : 'bg-[#F5E6D3] text-[#C97C5D]'}`}><IconComponent className="w-7 h-7" /></div>
                      <h3 className="flex-1 font-black text-[#6B4423] text-sm uppercase tracking-tight leading-tight">{method.title}</h3>
                      {expandedSosId === method.id ? <ChevronUp className="text-[#C97C5D]" /> : <ChevronDown className="text-[#D4A373]" />}
                    </div>
                    {expandedSosId === method.id && (
                      <div className="px-6 pb-8 animate-in fade-in duration-500">
                        <div className="h-px bg-[#E8CFAB] mb-5" />
                        <p className="text-[#5D4E37] text-[15px] leading-relaxed font-medium mb-5 italic">"{method.detail}"</p>
                        <div className="bg-[#FFF8E7] p-5 rounded-3xl border border-[#E8CFAB] text-xs text-[#6B4423] leading-relaxed shadow-inner">
                          <span className="font-black uppercase block mb-2 tracking-widest text-[9px] text-[#C97C5D]">Protocollo scientifico:</span>
                          {method.rationale}
                        </div>
                        {method.timer > 0 && <RestTimer initialSeconds={method.timer} colorClass="bg-[#F5E6D3]" accentColor="text-[#C97C5D]" />}
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
                <h2 className="text-lg font-black text-[#6B4423] px-1 border-l-[6px] border-[#C97C5D] pl-4 uppercase tracking-widest">{workout.title}</h2>
                <div className="space-y-3">
                  {workout.exercises.map((ex, idx) => {
                    const exId = `${key}-${idx}`;
                    const isExpanded = expandedWorkoutId === exId;
                    return (
                      <div key={idx} className={`rounded-[2rem] border transition-all duration-500 ${focusStatus[exId] ? 'bg-[#D4A373]/25 border-[#D4A373] shadow-lg' : (isExpanded ? 'bg-[#FEFCF8] border-[#C97C5D] shadow-xl translate-y-[-2px]' : 'bg-[#FEFCF8] border-[#E8CFAB]/50')}`}>
                        <div onClick={() => setExpandedWorkoutId(isExpanded ? null : exId)} className="p-4 flex items-center justify-between cursor-pointer">
                          <div className="flex-1 px-2">
                            <h3 className={`font-black text-sm tracking-tight ${dailyStatus[exId] ? 'text-[#6B4423] opacity-50 line-through' : 'text-[#3D3D3D]'}`}>{ex.name}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] bg-[#F5E6D3] text-[#C97C5D] px-3 py-1 rounded-full font-black uppercase tracking-wider">{ex.volume}</span>
                              {dailyStatus[exId] && <span className="text-[9px] bg-[#B4A284] text-white px-3 py-1 rounded-full font-black uppercase tracking-wider">✓ Completato</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => toggleTask(e, exId)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dailyStatus[exId] ? 'bg-[#B4A284] text-white' : 'bg-[#F5EBE0] text-[#A0755B] hover:bg-[#B4A284]/30'}`}><CheckCircle2 className="w-5 h-5" /></button>
                            <button onClick={(e) => toggleFocus(e, exId)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${focusStatus[exId] ? 'bg-[#D4A373] text-white' : 'bg-[#F5EBE0] text-[#A0755B] hover:bg-[#D4A373]/30 hover:text-[#6B4423]'}`}><Target className="w-5 h-5" /></button>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#C97C5D]" /> : <ChevronDown className="w-5 h-5 text-[#D4A373]" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-5 pb-6 animate-in slide-in-from-top-3 duration-500">
                            <div className="rounded-[2rem] overflow-hidden mb-5 bg-[#F5EBE0] border border-[#E8CFAB]/50 shadow-inner">
                              <img src={ex.img} alt={ex.name} className="w-full h-64 object-cover" onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=' + ex.name.replace(/\s/g, '+'); }} />
                            </div>
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#F5EBE0] p-4 rounded-[1.5rem] border border-[#E8CFAB]/50"><p className="text-[9px] font-black text-[#A0755B] uppercase tracking-widest mb-1">Recupero:</p><p className="font-black text-[#C97C5D] text-lg">{ex.rest}s</p></div>
                                <div className="bg-[#F5EBE0] p-4 rounded-[1.5rem] border border-[#E8CFAB]/50"><p className="text-[9px] font-black text-[#A0755B] uppercase tracking-widest mb-1">Intensità:</p><p className="font-black text-[#6B4423] text-xs leading-tight">{ex.intensity}</p></div>
                              </div>
                              {ex.rest > 0 && <RestTimer initialSeconds={ex.rest} colorClass="bg-[#F5E6D3]" accentColor="text-[#B4A284]" />}
                              <div className="bg-[#FEFCF8] p-5 rounded-3xl border border-[#E8CFAB]/50 shadow-sm"><p className="text-[10px] font-black text-[#A0755B] uppercase mb-2 tracking-widest">Esecuzione tecnica:</p><p className="text-sm italic text-[#5D4E37] leading-relaxed font-medium">{ex.exec}</p></div>
                              <div className="bg-[#FFEEE8] p-5 rounded-3xl border border-[#F5C8B8] text-[#8B4A3A]"><p className="text-[10px] font-black text-[#C97C5D] uppercase flex items-center gap-2 mb-2 tracking-widest"><AlertTriangle className="w-3 h-3" /> Attenzione agli errori:</p><p className="text-sm leading-relaxed">{ex.errors}</p></div>
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
            <div className="bg-[#FEFCF8] p-8 rounded-[2.5rem] border border-[#E8CFAB]/50 shadow-md">
              <form onSubmit={addDiaryEntry} className="space-y-4">
                <label className="block text-sm font-black text-[#6B4423] px-1 uppercase tracking-wider text-center">Come ti senti oggi?</label>
                <textarea value={newEntry} onChange={(e) => setNewEntry(e.target.value)} placeholder="Oggi mi sento..." className="w-full p-6 rounded-[2rem] bg-[#FFF8E7] border-2 border-[#E8CFAB] focus:border-[#D4A373] focus:ring-0 outline-none min-h-[160px] text-[#5D4E37] font-medium placeholder:italic transition-all shadow-inner" />
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-[#B4A284] to-[#A89168] hover:from-[#A89168] hover:to-[#9B845C] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98]">Salva sensazione</button>
              </form>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="font-black text-[#A0755B] px-2 flex items-center gap-3 uppercase tracking-widest text-xs"><BookOpen className="w-4 h-4" /> Storico note:</h3>
              {entries.length === 0 ? <div className="text-center py-20 text-[#D4A373] italic font-medium bg-[#FEFCF8] rounded-[2rem] border border-dashed border-[#E8CFAB] uppercase text-[10px] tracking-[0.2em]">Sinfonia del silenzio.</div> :
                entries.map((entry) => (
                  <div key={entry.id} className="bg-[#FEFCF8] p-6 rounded-[2rem] border border-[#E8CFAB]/50 shadow-sm relative overflow-hidden group hover:border-[#D4A373] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#D4A373] group-hover:bg-[#C97C5D] transition-colors" />
                    <div className="text-[10px] font-black text-[#A0755B] uppercase mb-3 tracking-[0.2em]">{entry.date === todayKey ? 'Oggi' : entry.date}</div>
                    <p className="text-[#5D4E37] text-[15px] whitespace-pre-wrap leading-relaxed font-medium italic">"{entry.text.charAt(0).toUpperCase() + entry.text.slice(1)}"</p>
                  </div>
                ))
              }
            </div>
          </section>
        )}
      </main>

      {/* Menu di navigazione fisso in basso */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-gradient-to-t from-[#FEFCF8] to-[#FFF8F0]/95 backdrop-blur-xl border-t border-[#D4A373]/30 shadow-2xl z-30">
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? { backgroundColor: isSos ? '#C97C5D' : '#6B4423' } : {}} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'text-white font-black shadow-md' : 'text-[#D4A373] font-medium hover:text-[#6B4423] bg-transparent'}`}>
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