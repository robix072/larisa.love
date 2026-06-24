import React, { useEffect, useState, useRef, useCallback } from 'react';
import './index.css';

/* ── Content ── */
const HERO_TEXTS = [
  "Totul a început ca o carte pe care nu aș fi vrut să o mai închid vreodată.",
  "Ai ajuns aici din povestea noastră...\nȘi cred că în inima ta știi deja de ce există acest loc.",
  "Știu, n-am fost perfect.",
  "Poate n-am fost cel mai bun iubit.\nAu fost momente grele și greșeli pe care aș da orice să le pot șterge.",
  "Dar sufletul meu te-a iubit cu adevărat.\nFiecare zâmbet al tău era întregul meu univers.",
  "Nu scriu asta ca să forțez destinul,\nci doar pentru că inima mea nu poate să tacă.",
  "Pentru că fericirea nu se așteaptă, se alege.\nIar eu, în fiecare zi, te-am ales pe tine.",
  "Pentru mine, tu nu ai fost o pagină trecătoare,\nci întreaga mea carte.",
  "Ești o parte de neînlocuit din sufletul meu."
];

const REASONS = [
  'Zâmbetul tău care luminează absolut orice încăpere și îmi alungă orice urmă de tristețe.',
  'Modul în care mă privești, cu atâta căldură, sinceritate și înțelegere în ochi.',
  'Vocile tale drăguțe când te entuziasmezi de cel mai mic și neînsemnat lucru.',
  'Faptul că ești mereu acolo pentru mine, un refugiu sigur în fața lumii întregi.',
  'Pentru că pur și simplu ești tu. O capodoperă unică de bunătate și frumusețe.',
  'Cum îți așezi capul pe pieptul meu și simt, în sfârșit, că am ajuns acasă.',
  'Modul în care mă asculți și mă faci să fiu o versiune mai bună a mea în fiecare zi.',
  'Pentru că în brațele tale, timpul se oprește și restul lumii încetează să mai conteze.'
];

const THOUGHTS = [
  "Îți scriu seara în notes mesaje de noapte bună, sperând că într-o zi le vei citi din nou pe ecranul tău.",
  "Mă rog la Dumnezeu pentru noi și pentru liniștea ta în fiecare zi, pentru că fericirea ta e și a mea.",
  "Sunt momente când dorul mă strânge atât de tare, încât tot ce văd în jur îmi amintește de zâmbetul tău.",
  "Am învățat că greșelile se pot ierta, iar rănile se pot vindeca atunci când iubești cu adevărat.",
  "Dacă există o speranță, oricât de mică, aleg să cred în noi."
];

/* ── Scene manifest ── */
const SCENES = [
  { key: 'hero',    duration: 40500 }, // 9 texts * 4.5s
  { key: 'date',    duration: 6000  },
  { key: 'vault',   duration: 8000  },
  { key: 'love',    duration: 7000  },
  { key: 'meals',   duration: 7500  }, // New chapter
  { key: 'reasons', duration: 28000 }, // 8 reasons * 3.5s
  { key: 'music',   duration: null  }, // Handled by audio duration
  { key: 'letter',  duration: 25000 }, // Kept for 25 seconds
  { key: 'typing',  duration: null  }, // Auto-handled by typewriter/thoughtIdx
  { key: 'goodbye', duration: null  },
];

export default function App() {
  /* ── Core state ── */
  const [scene, setScene]           = useState(0);
  const [visits, setVisits]         = useState(SCENES.map(() => 0));
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isPaused, setIsPaused]     = useState(false);
  const [progress, setProgress]     = useState(0);
  const [musicDur, setMusicDur]     = useState(0);

  /* ── Passcode & Instructions state ── */
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin]               = useState('');
  const [pinError, setPinError]     = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  /* ── Scene-specific state ── */
  const [letterOpen, setLetterOpen] = useState(false);
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [loveTaps, setLoveTaps]     = useState(0);
  const [hearts, setHearts]         = useState([]);
  const [timeStats, setTimeStats]   = useState({
    years: 0, months: 0, weeks: 0, days: 0,
    hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
    loveYous: 0, meals: 0,
  });
  const [displayedThought, setDisplayedThought] = useState('');
  const [typingState, setTypingState] = useState('typing'); // 'typing', 'waiting', 'erasing'

  const rootRef    = useRef(null);
  const audioRef   = useRef(null);
  const elapsedRef = useRef(0); // Tracks scene elapsed milliseconds for exact pause-resume

  /* ── Derived state ── */
  const currentHeroIdx = scene === 0 ? Math.min(Math.floor(elapsedRef.current / 4500), HERO_TEXTS.length - 1) : HERO_TEXTS.length - 1;
  const reasonIdx      = scene === 5 ? Math.min(Math.floor(elapsedRef.current / 3500), REASONS.length - 1) : REASONS.length - 1;

  /* ── Passcode keypad logic ── */
  const handleKeypadPress = useCallback((num) => {
    setPin(p => {
      if (p.length >= 6) return p;
      const nextPin = p + num;
      if (nextPin === '140124') {
        setTimeout(() => setIsUnlocked(true), 300);
      } else if (nextPin.length === 6) {
        setTimeout(() => {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 500);
        }, 250);
      }
      return nextPin;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setPin(p => p.slice(0, -1));
  }, []);

  useEffect(() => {
    if (isUnlocked) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, handleKeypadPress, handleBackspace]);

  /* ── Time counter ── */
  useEffect(() => {
    const start = new Date('2024-01-14T00:00:00');
    const tick = () => {
      const now = new Date();
      const ms  = now - start;
      const s   = Math.floor(ms / 1000);
      const m   = Math.floor(s  / 60);
      const h   = Math.floor(m  / 60);
      const d   = Math.floor(h  / 24);
      const w   = Math.floor(d  / 7);
      const mo  = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      const y   = now.getFullYear() - start.getFullYear() +
        (now.getMonth() < start.getMonth() ||
        (now.getMonth() === start.getMonth() && now.getDate() < start.getDate()) ? -1 : 0);
      setTimeStats({ years: y, months: mo, weeks: w, days: d, hours: h, minutes: m, seconds: s, milliseconds: ms, loveYous: d * 6, meals: w * 4 });
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);

  /* ── Navigate to scene ── */
  const goTo = useCallback((idx) => {
    const i = Math.max(0, Math.min(idx, SCENES.length - 1));
    setScene(i);
    setVisits(v => { const n = [...v]; n[i]++; return n; });
    setProgress(0);
    setIsPaused(false);
    elapsedRef.current = 0; // Reset elapsed timer for new scene
    
    // Play/Pause audio logic
    if (audioRef.current) {
      if (i === 6) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  /* ── Auto-advance engine ── */
  useEffect(() => {
    if (!isPlaying || isPaused || scene === 6) return;
    
    let dur = SCENES[scene].duration;
    if (!dur) return; // Scenes with duration: null are handled elsewhere

    const TICK = 50;
    const id = setInterval(() => {
      elapsedRef.current += TICK;
      setProgress(Math.min((elapsedRef.current / dur) * 100, 100));
      if (elapsedRef.current >= dur) {
        clearInterval(id);
        elapsedRef.current = 0;
        goTo(scene + 1);
      }
    }, TICK);
    return () => clearInterval(id);
  }, [scene, isPlaying, isPaused, goTo]);

  /* ── Typewriter Thoughts (Scene 8) ── */
  useEffect(() => {
    if (scene !== 8 || !isPlaying || isPaused) return;

    let timer;
    const currentText = THOUGHTS[thoughtIdx];

    if (typingState === 'typing') {
      if (displayedThought.length < currentText.length) {
        timer = setTimeout(() => {
          setDisplayedThought(currentText.substring(0, displayedThought.length + 1));
        }, 35);
      } else {
        setTypingState('waiting');
      }
    } else if (typingState === 'waiting') {
      timer = setTimeout(() => {
        setTypingState('erasing');
      }, 4000);
    } else if (typingState === 'erasing') {
      if (displayedThought.length > 0) {
        timer = setTimeout(() => {
          setDisplayedThought(currentText.substring(0, displayedThought.length - 1));
        }, 15);
      } else {
        if (thoughtIdx < THOUGHTS.length - 1) {
          setThoughtIdx(t => t + 1);
          setTypingState('typing');
        } else {
          goTo(9);
        }
      }
    }

    return () => clearTimeout(timer);
  }, [scene, thoughtIdx, typingState, displayedThought, isPlaying, isPaused, goTo]);

  /* ── Auto-open letter ── */
  useEffect(() => {
    setLetterOpen(false);
    if (scene !== 7) return;
    const t = setTimeout(() => setLetterOpen(true), 2800);
    return () => clearTimeout(t);
  }, [scene]);

  /* ── Audio sync for Scene 6 ── */
  useEffect(() => {
    if (scene !== 6 || !audioRef.current) return;
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const handleEnded = () => {
      goTo(7);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    if (audio.duration) {
      setMusicDur(audio.duration * 1000);
    }
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [scene, goTo]);

  /* ── Click handlers ── */
  const spawnHeart = useCallback((cx, cy) => {
    if (!rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    const h = {
      id:  Date.now() + Math.random(),
      x:   cx - r.left,
      y:   cy - r.top,
      sz:  Math.random() * 16 + 18,
      rot: Math.random() * 40 - 20,
    };
    setHearts(p => [...p, h]);
    setTimeout(() => setHearts(p => p.filter(x => x.id !== h.id)), 1600);
  }, []);

  const handleClick = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.no-tap') || e.target.closest('iframe')) return;
    
    if (isPlaying) {
      spawnHeart(e.clientX, e.clientY);
    }
  }, [isPlaying, spawnHeart]);

  const startPlay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(e => console.warn('Audio context unlock failed:', e));
    }
    setShowInstructions(true);
  }, []);

  const togglePause = useCallback((e) => {
    e.stopPropagation();
    setIsPaused(p => {
      const nextPaused = !p;
      if (audioRef.current) {
        if (nextPaused) {
          audioRef.current.pause();
        } else if (scene === 6) {
          audioRef.current.play().catch(console.log);
        }
      }
      return nextPaused;
    });
  }, [scene]);

  const handleVinylClick = useCallback((e) => {
    e.stopPropagation();
    // Disabled to prevent user interaction during melody section
  }, []);

  const handleNextThought = useCallback((e) => {
    e.stopPropagation();
    setDisplayedThought('');
    if (thoughtIdx < THOUGHTS.length - 1) {
      setThoughtIdx(t => t + 1);
      setTypingState('typing');
    } else {
      goTo(9);
    }
  }, [thoughtIdx, goTo]);

  /* ── Render ── */
  if (!isUnlocked) {
    return (
      <div className="pin-root">
        <div className="vignette-light" aria-hidden="true" />
        <div className="glass-orbs" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <div className="pin-container glass-panel hl">
          <p className="pin-pre font-cursive">Pentru Larisa 🌸</p>
          <h2 className="pin-title">Introdu data care a schimbat totul...</h2>
          <p className="pin-hint">Introdu data aniversării voastre (DDMMAA)</p>
          
          <div className={`pin-dots-wrapper${pinError ? ' shake' : ''}`}>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`pin-dot${pin.length > i ? ' pin-dot-filled' : ''}`} 
              />
            ))}
          </div>

          <div className="pin-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                className="keypad-btn no-tap" 
                onClick={() => handleKeypadPress(num.toString())}
              >
                {num}
              </button>
            ))}
            <div className="keypad-empty" />
            <button 
              className="keypad-btn no-tap" 
              onClick={() => handleKeypadPress('0')}
            >
              0
            </button>
            <button 
              className="keypad-btn backspace-btn no-tap" 
              onClick={handleBackspace}
              aria-label="Șterge"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cinema-root${isPaused ? ' is-paused' : ''}`} ref={rootRef} onClick={handleClick}>

      {/* Floating background hearts */}
      <div className="floating-bg-hearts" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <span 
            key={i} 
            className={`bg-heart bg-heart-${i + 1}`}
            style={{
              left: `${(i * 8.5) + 4}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${12 + (i % 3) * 3}s`
            }}
          >
            {['💖', '🌸', '💗', '💕', '🎀'][i % 5]}
          </span>
        ))}
      </div>

      <div className="vignette-light" aria-hidden="true" />
      <div className="glass-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {hearts.map(h => (
        <span
          key={h.id}
          className="click-heart"
          style={{ left: h.x, top: h.y, fontSize: h.sz, transform: `translate(-50%,-50%) rotate(${h.rot}deg)` }}
        >💗</span>
      ))}

      {/* Progress bar */}
      {isPlaying && (scene > 0 && scene < 9 && scene !== 8) && (
        <div className="cin-progress" aria-hidden="true">
          <div
            className="cin-progress-fill"
            style={{ width: `${progress}%`, transitionDuration: isPaused ? '0s' : '0.05s' }}
          />
        </div>
      )}

      {/* Pause / Resume button */}
      {isPlaying && scene > 0 && scene < SCENES.length - 1 && (
        <button className="pause-btn no-tap" onClick={togglePause} aria-label={isPaused ? 'Continuă' : 'Pauză'}>
          {isPaused ? '▶' : '⏸'}
        </button>
      )}

      {/* ═══════════════════════════════════════
          SCENE 0 — HERO (Cover / Poem)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 0 ? ' scene-on' : ''}`}>
        <div className="si hero-si">
          {!isPlaying ? (
            !showInstructions ? (
              /* Cover State */
              <div className="cover-content hl hl-1">
                <p className="cover-pre font-cursive">Pentru Larisa 🌸</p>
                <h1 className="cover-title">Totul a început ca o carte.</h1>
                <p className="cover-body">
                  Fiecare poveste are capitolele ei. Dacă există o speranță,<br/>
                  sufletele pereche găsesc mereu drumul înapoi.
                </p>
                <div className="cover-heart-wrap">
                  <button className="cover-heart-btn no-tap" onClick={startPlay}>
                    <div className="heart-icon-glow">💖</div>
                    <span className="cover-btn-text">Deschide Cartea</span>
                  </button>
                </div>
                <p className="cover-hint">Atinge inima pentru a începe</p>
              </div>
            ) : (
              /* Instructions State */
              <div className="instructions-content glass-panel hl">
                <h2 className="inst-title">Instrucțiuni pentru sufletul tău...</h2>
                <div className="inst-list">
                  <div className="inst-item">
                    <span className="inst-icon">🔊</span>
                    <p className="inst-text">Dă sunetul la maximum. Ascultă melodia cu inima.</p>
                  </div>
                  <div className="inst-item">
                    <span className="inst-icon">👀</span>
                    <p className="inst-text">Atenție sporită. Privește fiecare cuvânt cu atenție.</p>
                  </div>
                  <div className="inst-item">
                    <span className="inst-icon">⏸️</span>
                    <p className="inst-text">Butonul de pauză din colț te lasă să oprești timpul dacă devii prea copleșită.</p>
                  </div>
                  <div className="inst-item">
                    <span className="inst-icon">❤️</span>
                    <p className="inst-text">Lasă emoțiile să te cuprindă, iar supărarea și răutatea deoparte...</p>
                  </div>
                </div>
                <button 
                  className="apple-btn no-tap inst-start-btn" 
                  onClick={() => {
                    setShowInstructions(false);
                    setIsPlaying(true);
                    
                    const cx = window.innerWidth / 2;
                    const cy = window.innerHeight / 2;
                    for (let i = 0; i < 15; i++) {
                      setTimeout(() => {
                        spawnHeart(
                          cx + (Math.random() * 200 - 100),
                          cy + (Math.random() * 200 - 100)
                        );
                      }, i * 60);
                    }
                  }}
                >
                  Sunt pregătită
                </button>
              </div>
            )
          ) : (
            /* Running Poem State */
            <div className="hero-content">
              <h1 className="hero-anim-text" key={currentHeroIdx}>
                {HERO_TEXTS[currentHeroIdx].split('\n').map((line, i) => (
                  <span key={i}>{line}<br/></span>
                ))}
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 1 — THE DATE
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 1 ? ' scene-on' : ''}`}>
        <div key={visits[1]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul I —</p>
          <div className="sa sa-2 date-wrap">
            <span className="date-num">14</span>
            <div className="date-right">
              <span className="date-month">IANUARIE</span>
              <span className="date-year">2024</span>
            </div>
          </div>
          <div className="sa sa-3 scene-divider" />
          <p className="sa sa-4 scene-sub">Ziua în care s-a schimbat totul.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 2 — TIME VAULT
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 2 ? ' scene-on' : ''}`}>
        <div key={visits[2]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul II —</p>
          <h2 className="sa sa-2 scene-title">Timpului i-am dăruit</h2>
          <div className="sa sa-3 vault-grid">
            {[
              { v: timeStats.years,                    l: 'ani'     },
              { v: timeStats.months,                   l: 'luni'    },
              { v: timeStats.days.toLocaleString(),    l: 'zile'    },
              { v: timeStats.hours.toLocaleString(),   l: 'ore'     },
              { v: timeStats.minutes.toLocaleString(), l: 'minute'  },
              { v: timeStats.seconds.toLocaleString(), l: 'secunde' },
            ].map((s, i) => (
              <div key={i} className={`vi vi-${i + 1}`}>
                <span className="vi-num">{s.v}</span>
                <span className="vi-lbl">{s.l}</span>
              </div>
            ))}
          </div>
          <div className="sa sa-4 vault-live">
            <span className="vl-dot" aria-hidden="true" />
            <span className="vl-text">
              {timeStats.milliseconds.toLocaleString()} ms de la început
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 3 — LOVE COUNTER
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 3 ? ' scene-on' : ''}`}>
        <div key={visits[3]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul III —</p>
          <div
            className="sa sa-2 love-wrap"
            onClick={() => setLoveTaps(p => p + 1)}
          >
            <div className="glass-heart-bg" />
            <span className="love-heart" role="img" aria-label="inimă">💗</span>
            <div className="love-ring lr-1" aria-hidden="true" />
            <div className="love-ring lr-2" aria-hidden="true" />
          </div>
          <p className="sa sa-3 love-num">
            ~{(timeStats.loveYous + loveTaps).toLocaleString()}
          </p>
          <p className="sa sa-4 love-lbl">„te iubesc”-uri împărțite</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 4 — MEALS TOGETHER (Fun Fact Chapter)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 4 ? ' scene-on' : ''}`}>
        <div key={visits[4]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul IV —</p>
          <div className="sa sa-2 meals-icon" aria-hidden="true">
            🍽️
          </div>
          <h2 className="sa sa-3 scene-title">Mesele împreună</h2>
          <p className="sa sa-4 meals-fact">
            Știai că... dacă am mâncat împreună de cel puțin 4 ori pe săptămână, în total am adunat:
          </p>
          <div className="sa sa-5 meals-card glass-panel">
            <span className="meals-num">~{timeStats.meals.toLocaleString()}</span>
            <span className="meals-lbl">de mese împărțite în doi</span>
          </div>
          <p className="sa sa-6 scene-sub font-cursive" style={{ fontSize: '1.45rem', marginTop: '0.5rem' }}>
            Fiecare mic dejun, prânz sau cină cu tine a fost despre noi.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 5 — REASONS (3D Cascading Deck)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 5 ? ' scene-on' : ''}`}>
        <div key={visits[5]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul V —</p>
          <h2 className="sa sa-2 scene-title">De ce te-am iubit</h2>
          
          <div className="sa sa-3 reasons-deck-container">
            <div className="reasons-deck">
              {REASONS.map((r, i) => {
                const diff = (i - reasonIdx + REASONS.length) % REASONS.length;
                let cardClass = "deck-card";
                if (diff === 0) cardClass += " card-active";
                else if (diff === 1) cardClass += " card-next";
                else if (diff === 2) cardClass += " card-far";
                else if (diff === REASONS.length - 1) cardClass += " card-prev";
                else cardClass += " card-hidden";

                const icons = ['✨', '🥺', '🧸', '🌸', '🎀', '💖', '🌟', '🥂'];
                const isActive = diff === 0;
                
                return (
                  <div key={i} className={cardClass}>
                    <div className="card-emoji-wrap">
                      <span className="card-emoji">{icons[i % icons.length]}</span>
                    </div>
                    <p className="card-text font-cursive">{r}</p>
                    {isActive && (
                      <div className="card-progress-bar-wrap">
                        <div className="card-progress-bar-fill" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sa sa-4 q-dots" aria-hidden="true">
            {REASONS.map((_, i) => (
              <div key={i} className={`q-dot${i === reasonIdx ? ' q-dot-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 6 — MUSIC (Interactive Vinyl Player)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 6 ? ' scene-on' : ''}`}>
        <div key={visits[6]} className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul VI —</p>
          <div className={`sa sa-2 vinyl-scene${!isPaused ? ' vinyl-playing' : ''}`} onClick={handleVinylClick}>
            <div className="vinyl-disc no-tap">
              <div className="vinyl-label">
                <div className="vinyl-hole" />
              </div>
            </div>
            <div className="glass-player-blur" />
          </div>
          <h2 className="sa sa-3 scene-title">Ești lumea mea</h2>
          <p className="sa sa-4 music-artist" style={{ marginTop: '-0.5rem' }}>Lele</p>
          
          <p className="sa sa-5 scene-sub" style={{ fontSize: '0.95rem', marginTop: '1rem', maxWidth: '85%' }}>
            Melodia noastră,<br/>cea care ne-a legat și mai mult.
          </p>
          
          <p className="sa sa-6 vinyl-help">Melodia care ne-a unit sufletele 🎵</p>
          
          <div className="sa sa-7 music-bar" aria-hidden="true" style={{ marginTop: '1rem' }}>
            <div className="music-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 7 — LETTER
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 7 ? ' scene-on' : ''}`}>
        <div key={visits[7]} className="si letter-si">
          <p className="sa sa-1 chapter-lbl">— Capitolul VII —</p>

          <div className={`sa sa-2 letter-stage${letterOpen ? ' letter-open' : ''}`}>
            {/* Envelope */}
            <div className="env-outer glass-panel">
              <div className="env-flap" aria-hidden="true" />
              <div className="env-body">
                <span className="env-seal" aria-hidden="true">💌</span>
              </div>
            </div>

            {/* Letter paper */}
            <div className="letter-paper font-handwriting" aria-live="polite">
              <p className="lp-salut">Dragă Larisa,</p>
              <p className="lp-text">
                Fiecare zi petrecută cu tine a fost cel mai frumos capitol din viața mea. Felul în care râzi,
                căldura ta și momentele simple în care doar ne priveam... toate s-au strâns adânc în inima mea.
              </p>
              <p className="lp-text">
                Știu că am făcut greșeli și că poate n-am știut întotdeauna cum să-ți arăt cât de importantă ești pentru mine. Îmi pare rău pentru fiecare secundă în care te-am făcut să te îndoiești de dragostea mea.
              </p>
              <p className="lp-text">
                Dacă aș putea schimba ceva, aș rescrie trecutul doar ca să te feresc de durere și să-ți ofer fericirea pe care o meriți. Îți mulțumesc pentru tot ce ai fost și încă ești pentru mine.
              </p>
              <p className="lp-sign">Cu tot sufletul și cu speranță, mereu. 🌸</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 8 — THOUGHTS (Typewriter state machine)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 8 ? ' scene-on' : ''}`}>
        <div className="si">
          <p className="sa sa-1 chapter-lbl">— Capitolul VIII —</p>
          <h2 className="sa sa-2 scene-title" style={{ marginBottom: '1rem' }}>Gânduri pentru tine</h2>
          <div className="sa sa-3 typing-box glass-panel">
            <p className="thoughts-text">
              {displayedThought}
              <span className="typewriter-cursor">|</span>
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SCENE 9 — EPILOGUE (Adio / Red Button Redirect)
      ═══════════════════════════════════════ */}
      <div className={`scene${scene === 9 ? ' scene-on' : ''}`}>
        <div key={visits[9]} className="si">

          <p className="sa sa-1 chapter-lbl">— Epilog —</p>
          <h1 className="sa sa-2 gb-title apple-title apple-pink">
            Adio, Larisa.
          </h1>
          <p className="sa sa-3 gb-body">
            Dacă drumurile noastre se despart cu adevărat aici, să știi că o parte din sufletul meu va rămâne mereu la tine. Îți mulțumesc pentru fiecare moment în care m-ai făcut fericit.<br/>
            Pentru că sufletele pereche nu se uită niciodată. Oricare ar fi alegerea ta, îți mulțumesc pentru noi.
          </p>

          <div className="sa sa-4 red-button-container">
            <a 
              className="sentimental-red-btn no-tap" 
              href="https://tinyurl.com/larisa0101s"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <span className="heart-broken-icon">💔</span>
              <span className="btn-main-txt">Apasă să redai sfârșitul nostru</span>
              <span className="btn-sub-txt">Te rog, privește asta cu atenție...</span>
            </a>
          </div>

          <p className="sa sa-5 gb-sig font-handwriting" style={{ fontSize: '2rem' }}>
            Cu dragoste, pentru totdeauna în inima mea. 💗
          </p>

        </div>
      </div>

      {/* Native HTML5 Audio preloaded */}
      <audio
        ref={audioRef}
        src="/melodii/lele-extracted.mp3"
        preload="auto"
        onLoadedMetadata={(e) => {
          setMusicDur(e.currentTarget.duration * 1000);
        }}
      />

    </div>
  );
}
