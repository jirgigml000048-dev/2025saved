import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ENVELOPES, TREE_COORDINATES, COVER_BG_IMAGE, GAME_BG_IMAGE, YEAR_REVIEW_IMAGE, COLORS } from './constants';
import { GameState, EnvelopeData } from './types';

// ==========================================
// 🎵 ASSET CONFIGURATION
// ==========================================
const BGM_URLS = {
  GROUND: 'https://jetta.vgmtreasurechest.com/soundtracks/super-mario-25th-anniversary-soundtrack-1985-2010/vklcdjjs/01.%20Super%20Mario%20Bros.%20Ground%20Theme.mp3', 
  CASTLE: 'https://jetta.vgmtreasurechest.com/soundtracks/super-mario-3d-all-stars-switch-gamerip-2020/fjeterwg/1-01.%20Intro%20Jingle.mp3',
  STAR: 'https://jetta.vgmtreasurechest.com/soundtracks/super-mario-25th-anniversary-soundtrack-1985-2010/ozgiwick/20.%20World%20Clear.mp3',
  CLEAR: 'https://nu.vgmtreasurechest.com/soundtracks/super-mario-3d-land/nzkbchea/06%20Overworld.mp3',
  ERROR: 'https://www.myinstants.com/media/sounds/buzzer.mp3'
};

// --- HYBRID AUDIO ENGINE ---
// SFX: Web Audio API (Oscillators) for Zero Latency
// BGM: HTML5 Audio for CORS compatibility and streaming
const useGameAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const bgmRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const currentBgm = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // Initialize Web Audio Context (for SFX)
    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        gainNodeRef.current = gainNode;

        return () => { ctx.close(); };
    }, []);

    // Helper: Load BGM (HTML5 Audio)
    const loadBGM = async (key: string, url: string): Promise<void> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            audio.loop = false;
            
            // Success handler
            const onCanPlay = () => {
                cleanup();
                bgmRefs.current.set(key, audio);
                resolve();
            };

            // Error/Timeout handler
            const onError = () => {
                cleanup();
                console.warn(`[Audio] Failed/Timeout loading ${key}`);
                // Resolve anyway so the game starts even if music fails
                resolve(); 
            };

            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
            };

            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);

            // Timeout after 5 seconds to prevent hanging
            setTimeout(onError, 5000); 
            
            // Trigger load
            audio.load();
        });
    };

    const playBGM = useCallback((key: string, loop = false, volume = 0.5) => {
        if (isMuted) return;
        
        // Stop current BGM
        if (currentBgm.current) {
            currentBgm.current.pause();
            currentBgm.current.currentTime = 0;
        }

        const audio = bgmRefs.current.get(key);
        if (audio) {
            audio.loop = loop;
            audio.volume = volume;
            audio.play().catch(e => console.log("Playback prevented:", e));
            currentBgm.current = audio;
        }
    }, [isMuted]);

    // NEW: Play a sound without stopping the current BGM
    const playOneShot = useCallback((key: string, volume = 0.6) => {
        if (isMuted) return;
        const audio = bgmRefs.current.get(key);
        if (audio) {
            audio.currentTime = 0; // Restart sound if already playing
            audio.volume = volume;
            audio.play().catch(e => console.log("OneShot prevented:", e));
        }
    }, [isMuted]);

    const stopAll = useCallback(() => {
        if (currentBgm.current) {
            currentBgm.current.pause();
            currentBgm.current.currentTime = 0;
            currentBgm.current = null;
        }
    }, []);

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        
        // Handle BGM
        if (currentBgm.current) {
            currentBgm.current.muted = newMuted;
            if (!newMuted) currentBgm.current.play().catch(() => {});
        }

        // Handle SFX
        if (audioContextRef.current) {
             if (newMuted) {
                 audioContextRef.current.suspend();
             } else {
                 audioContextRef.current.resume();
             }
        }
    }, [isMuted]);

    const resumeContext = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    // --- SYNTHESIZED SFX (Zero Latency, No Loading) ---
    const playSynth = useCallback((type: 'blip' | 'coin' | 'powerup' | 'jump' | 'fanfare' | 'rub', time = 0) => {
        if (isMuted || !audioContextRef.current) return;
        const ctx = audioContextRef.current;
        
        // Ensure context is running
        if(ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime + time;

        gain.connect(gainNodeRef.current!);
        osc.connect(gain);

        if (type === 'blip') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'coin') { 
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now); 
            osc.frequency.setValueAtTime(1200, now + 0.05); 
            gain.gain.setValueAtTime(0.05, now); 
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'powerup') { 
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.4);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'fanfare') { 
             [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                 const o = ctx.createOscillator(); const g = ctx.createGain();
                 o.type = 'square'; o.frequency.value = freq;
                 g.connect(gainNodeRef.current!); o.connect(g);
                 g.gain.setValueAtTime(0.03, now + i*0.12);
                 g.gain.exponentialRampToValueAtTime(0.001, now + i*0.12 + 0.4);
                 o.start(now + i*0.12); o.stop(now + i*0.12 + 0.4);
             });
        } else if (type === 'rub') { 
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        }
    }, [isMuted]);

    return {
        loadBGM,
        playBGM,
        playOneShot,
        stopAll,
        toggleMute,
        isMuted,
        resumeContext,
        playSynth
    };
};

// --- Helper: Confetti Particle System ---
const ParticleSystem = React.forwardRef((props, ref) => {
    const [particles, setParticles] = useState<{id: number, x: number, y: number, color: string, vx: number, vy: number, size: number}[]>([]);
    React.useImperativeHandle(ref, () => ({
        spawn: (x: number, y: number, count = 10) => { 
            const newParticles = [];
            const colors = [COLORS.sunsetOrange, COLORS.scarfRed, '#FFFFFF', '#FFD700', COLORS.deepPineGreen];
            for(let i=0; i<count; i++) {
                newParticles.push({
                    id: Date.now() + i + Math.random(), x, y,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, size: Math.random() * 4 + 2 
                });
            }
            setParticles(prev => [...prev, ...newParticles]);
        }
    }));
    useEffect(() => {
        if (particles.length === 0) return;
        const interval = setInterval(() => {
            setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.5 }))
                .filter(p => p.y < window.innerHeight && p.x > 0 && p.x < window.innerWidth)); 
        }, 30);
        return () => clearInterval(interval);
    }, [particles.length]);
    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map(p => (
                <div key={p.id} className="absolute rounded-full" style={{ width: p.size, height: p.size, left: p.x, top: p.y, backgroundColor: p.color, boxShadow: `0 0 2px ${p.color}`, opacity: 0.8, transform: 'translate(-50%, -50%)' }} />
            ))}
        </div>
    );
});

// --- Helper: Mouse Trail ---
const CursorTrail = () => {
  const [trails, setTrails] = useState<{ x: number, y: number, id: number }[]>([]);
  useEffect(() => {
    let counter = 0;
    const handleMove = (x: number, y: number) => {
      if (counter % 3 === 0) { setTrails(prev => [ ...prev.slice(-15), { x, y, id: Date.now() } ]); }
      counter++;
    };
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { if(e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('touchmove', onTouchMove);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('touchmove', onTouchMove); };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {trails.map(trail => (
        <div key={trail.id} className="absolute w-2 h-2 bg-[#FFAD66] opacity-60" style={{ left: trail.x, top: trail.y, transform: 'translate(-50%, -50%)', boxShadow: '0 0 3px #FFAD66', animation: 'fadeTrail 0.8s forwards' }} />
      ))}
      <style>{`@keyframes fadeTrail { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 100% { transform: translate(-50%, 0%) scale(0); opacity: 0; } }`}</style>
    </div>
  );
};

// --- Helper: Loading Screen ---
const LoadingScreen = ({ progress }: { progress: number }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.nightBlue }}>
             <div className="text-6xl animate-bounce mb-8 filter drop-shadow-[0_0_10px_#FFAD66]">💌</div>
             <h2 className="text-[#FFAD66] font-bold text-xl mb-4 pixel-text-glow tracking-widest">LOADING MEMORIES...</h2>
             <div className="w-64 h-6 bg-black border-4 border-white p-1 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                 <div className="h-full bg-[#D94C23] transition-all duration-100 ease-out relative" style={{ width: `${progress}%` }}>
                    <div className="absolute top-0 right-0 h-full w-1 bg-white opacity-50 animate-pulse"></div>
                 </div>
             </div>
             <div className="mt-4 text-xs text-gray-400 font-mono tracking-widest">{Math.round(progress)}% COMPLETE</div>
        </div>
    );
};

// --- Helper: Credits Modal ---
const CreditsModal = ({ onClose }: { onClose: () => void }) => {
    const stats = [ { label: "Commits", value: "128" }, { label: "Versions", value: "45" }, { label: "Coffee", value: "∞" }, { label: "Love Lvl", value: "MAX" } ];
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s]">
            <div className="relative w-full max-w-md origin-center" style={{ backgroundColor: COLORS.nightBlue, boxShadow: `inset 0 0 0 4px ${COLORS.nightBlue}, inset 0 0 0 8px #fff, 0 0 0 4px #000, 10px 10px 0 rgba(0,0,0,0.5)`, border: '4px solid #fff', padding: '24px' }}>
                <div className="flex justify-between items-center border-b-4 border-white pb-3 mb-4">
                    <h2 className="text-[#FFAD66] text-sm sm:text-base font-bold tracking-widest pixel-text-glow">PROJECT ARCHIVE</h2>
                    <button onClick={onClose} className="text-white hover:text-[#FFAD66] text-xs uppercase transition-colors">x CLOSE</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-black/30 p-2 border-2 border-[#fff] text-center shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
                            <div className="text-[#B8C8D9] text-[10px] mb-1 uppercase tracking-wider">{s.label}</div>
                            <div className="text-white text-lg font-bold">{s.value}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center"><p className="text-[10px] text-[#B8C8D9] font-mono leading-relaxed">Built with React & Love.<br/>Version 2.0.0 // 2025</p></div>
            </div>
        </div>
    );
};

// --- Helper: Virtual Gamepad ---
const VirtualGamepad = ({ onClose, onInput }: { onClose: () => void, onInput: (key: string) => void }) => {
    const btnBase = "active:scale-90 active:brightness-75 transition-transform flex items-center justify-center select-none cursor-pointer z-10";
    const dPadBtn = `${btnBase} w-12 h-12 bg-[#333] border-2 border-[#111] shadow-[2px_2px_0_#000] text-white text-xs`;
    const actionBtn = `${btnBase} w-14 h-14 rounded-full border-2 border-[#111] shadow-[2px_2px_0_#000] text-black font-bold text-xl`;
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
             <div className="relative bg-[#ccc] w-full max-w-md p-6 rounded-lg border-4 border-[#555] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-4 overflow-hidden" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0 90%, 0 10%)' }}>
                 <div className="flex justify-between items-center border-b-2 border-[#999] pb-2 z-10 pt-4">
                     <span className="text-[#333] font-bold tracking-widest text-xs">CONTROLLER 1</span>
                     <button onClick={onClose} className="text-red-600 font-bold hover:scale-110">X</button>
                 </div>
                 <div className="w-full text-center z-10"><span className="text-[10px] text-[#555] font-bold tracking-widest bg-white/30 px-2 py-0.5 rounded">HINT: KONAMI CODE</span></div>
                 <div className="flex justify-between items-end pb-4 z-10 mt-2">
                     <div className="relative w-36 h-36">
                         <div className="absolute top-0 left-12"><button className={dPadBtn} onClick={() => onInput('ArrowUp')}>▲</button></div>
                         <div className="absolute bottom-0 left-12"><button className={dPadBtn} onClick={() => onInput('ArrowDown')}>▼</button></div>
                         <div className="absolute top-12 left-0"><button className={dPadBtn} onClick={() => onInput('ArrowLeft')}>◀</button></div>
                         <div className="absolute top-12 right-0"><button className={dPadBtn} onClick={() => onInput('ArrowRight')}>▶</button></div>
                         <div className="absolute top-12 left-12 w-12 h-12 bg-[#333]"></div>
                     </div>
                     <div className="flex gap-4 transform rotate-[-10deg] mb-4">
                         <div className="flex flex-col items-center gap-1"><button className={`${actionBtn} bg-[#cf2b3e]`} onClick={() => onInput('b')}>B</button></div>
                         <div className="flex flex-col items-center gap-1 mt-4"><button className={`${actionBtn} bg-[#cf2b3e]`} onClick={() => onInput('a')}>A</button></div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- Helper: Snowfall ---
const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = (canvas.width = window.innerWidth); let h = (canvas.height = window.innerHeight);
    const particles: { x: number; y: number; s: number; v: number; o: number }[] = [];
    const count = 50; 
    for (let i = 0; i < count; i++) { particles.push({ x: Math.random() * w, y: Math.random() * h, s: Math.random() * 4 + 2, v: Math.random() * 1 + 0.5, o: Math.random() * 0.6 + 0.4 }); }
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => { ctx.fillStyle = `rgba(255, 255, 255, ${p.o})`; ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.s), Math.floor(p.s)); p.y += p.v; p.x += Math.sin(p.y * 0.005) * 0.3; if (p.y > h) { p.y = -5; p.x = Math.random() * w; } if (p.x > w) p.x = 0; if (p.x < 0) p.x = w; });
      requestAnimationFrame(draw);
    };
    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize); draw();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-40" />;
};

// --- Helper: Pixel Icons ---
const PixelIcon = ({ id }: { id: number }) => {
  const iconStyle: React.CSSProperties = { width: '20px', height: '20px', shapeRendering: 'crispEdges' };
  const type = id % 5; 
  switch (type) {
    case 0: return (<svg viewBox="0 0 16 16" style={iconStyle}><path d="M2 11h12v3H2z" fill="#fff" /><path d="M4 11L8 3L12 11H4" fill="#c1121f" /><rect x="12" y="9" width="3" height="3" fill="#fff" /></svg>);
    case 1: return (<svg viewBox="0 0 16 16" style={iconStyle}><path d="M8 2L3 11h3v3h4v-3h3L8 2z" fill="#2d6a4f" /><rect x="7" y="14" width="2" height="2" fill="#5C4033" /></svg>);
    case 2: return (<svg viewBox="0 0 16 16" style={iconStyle}><rect x="5" y="6" width="6" height="6" fill="#8B4513" /><path d="M4 3h2v4H4z M10 3h2v4h-2z" fill="#5D4037" /><rect x="7" y="10" width="2" height="2" fill="#c1121f" /></svg>);
    case 3: return (<svg viewBox="0 0 16 16" style={iconStyle}><ellipse cx="8" cy="9" rx="4" ry="5" fill="#6F4E37" /><path d="M6 6l4 4 M10 6l-4 4" stroke="#4A3728" strokeWidth="1" /><rect x="7" y="3" width="2" height="2" fill="#4A3728" /></svg>);
    case 4: return (<svg viewBox="0 0 16 16" style={iconStyle}><rect x="3" y="5" width="10" height="8" fill="#e9c46a" /><rect x="7" y="5" width="2" height="8" fill="#c1121f" /><rect x="3" y="8" width="10" height="2" fill="#c1121f" /></svg>);
    default: return null;
  }
};

// --- Helper: Envelope ---
interface EnvelopeProps { 
    data: EnvelopeData; isRead: boolean; onInteract: (id: number, isDrag: boolean) => void; onHover: () => void; gameState: GameState; index: number; style?: React.CSSProperties; errorId: number | null; isSnowCovered: boolean; playRub: () => void;
}
const Envelope: React.FC<EnvelopeProps> = ({ data, isRead, onInteract, onHover, gameState, index, style, errorId, isSnowCovered, playRub }) => {
  const isInteractable = gameState === GameState.COLLECTING;
  const shouldAnimate = (gameState === GameState.COLLECTING || gameState === GameState.READY_TO_ASSEMBLE) && !isRead;
  const dragStartRef = useRef<{x: number, y: number, time: number} | null>(null);
  const isError = errorId === data.id;
  const [snowOpacity, setSnowOpacity] = useState(isSnowCovered ? 1 : 0);
  const [cleaned, setCleaned] = useState(!isSnowCovered);

  const handleStart = (clientX: number, clientY: number) => { 
      if (!isInteractable) return; 
      if (!cleaned) return; 
      dragStartRef.current = { x: clientX, y: clientY, time: Date.now() }; 
      onInteract(data.id, true); 
  };
  
  const handleSnowRub = (e: React.MouseEvent | React.TouchEvent) => {
      if (cleaned || gameState !== GameState.COLLECTING) return;
      setSnowOpacity(prev => {
          const next = prev - 0.05;
          if (next <= 0) { setCleaned(true); return 0; }
          playRub(); return next;
      });
  };
  
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onTouchStart = (e: React.TouchEvent) => { const touch = e.touches[0]; handleStart(touch.clientX, touch.clientY); };
  const handleEnd = (clientX: number, clientY: number) => { 
      if (!isInteractable || !dragStartRef.current) return; 
      const dx = Math.abs(clientX - dragStartRef.current.x); 
      const dy = Math.abs(clientY - dragStartRef.current.y); 
      const dt = Date.now() - dragStartRef.current.time; 
      if (dx < 10 && dy < 10 && dt < 500) { onInteract(data.id, false); } 
      dragStartRef.current = null; 
  };
  const onMouseUp = (e: React.MouseEvent) => handleEnd(e.clientX, e.clientY);
  const onTouchEnd = (e: React.TouchEvent) => { const touch = e.changedTouches[0]; handleEnd(touch.clientX, touch.clientY); };
  
  const customStyle = { 
      ...style, '--scale': data.scale, 
      animation: isError ? 'errorShake 0.4s cubic-bezier(.36,.07,.19,.97) both' : (shouldAnimate ? `float 3s ease-in-out infinite` : 'none'), 
      animationDelay: isError ? '0s' : `${index * 0.15}s`, 
      cursor: isInteractable ? (cleaned ? 'grab' : 'help') : 'default', 
  } as React.CSSProperties;
  
  return (
    <div id={`envelope-${data.id}`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseEnter={() => isInteractable && onHover()} onMouseMove={handleSnowRub} onTouchMove={handleSnowRub}
         className={`relative w-24 h-16 sm:w-28 sm:h-20 flex items-center justify-center transition-transform duration-100 ${isInteractable && cleaned ? 'hover:scale-110 active:cursor-grabbing active:scale-105' : ''} ${isRead && gameState === GameState.COLLECTING ? 'opacity-40 grayscale filter brightness-75' : 'opacity-100'} ${gameState === GameState.ASSEMBLING ? 'transition-none' : ''}`} style={{ backgroundColor: COLORS.cream, border: `3px solid ${COLORS.wood}`, boxShadow: `3px 3px 0 0 rgba(0,0,0,0.25)`, ...customStyle, }}>
      <style>{`@keyframes errorShake { 10%, 90% { transform: translate3d(-2px, 0, 0) rotate(-2deg); } 20%, 80% { transform: translate3d(4px, 0, 0) rotate(2deg); } 30%, 50%, 70% { transform: translate3d(-6px, 0, 0) rotate(-4deg); } 40%, 60% { transform: translate3d(6px, 0, 0) rotate(4deg); } }`}</style>
      {snowOpacity > 0 && (<div className="absolute inset-[-4px] z-30 pointer-events-auto" style={{ opacity: snowOpacity, background: 'repeating-linear-gradient(45deg, #fff, #fff 4px, #eee 4px, #eee 8px)' }}><div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-400 font-bold opacity-50 select-none">RUB ME</div></div>)}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}><line x1="0" y1="0" x2="50%" y2="60%" stroke={COLORS.wood} strokeWidth="2" /><line x1="100%" y1="0" x2="50%" y2="60%" stroke={COLORS.wood} strokeWidth="2" /></svg>
      <div className="z-10 mt-3 transform scale-110"><PixelIcon id={data.id} /></div>
      <div className="absolute bottom-1 right-2 text-[10px] sm:text-xs font-bold z-20" style={{ color: COLORS.wood }}>{data.id}</div>
    </div>
  );
};

// --- Helper: Draggable Star ---
const DraggableStar = ({ onPlaced }: { onPlaced: () => void }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const starRef = useRef<HTMLDivElement>(null);
    useEffect(() => { gsap.fromTo(starRef.current, { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'back.out' }); }, []);
    const handleMove = (clientX: number, clientY: number) => { if (!isDragging.current) return; setPos({ x: clientX, y: clientY }); };
    const handleEnd = () => {
        isDragging.current = false;
        const treeTopX = window.innerWidth * 0.5; const treeTopY = window.innerHeight * 0.25; 
        const dist = Math.sqrt(Math.pow(pos.x - treeTopX, 2) + Math.pow(pos.y - treeTopY, 2));
        if (dist < 100) { onPlaced(); } else { gsap.to(starRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out' }); setPos({ x: 0, y: 0 }); }
    };
    return (
        <div className="fixed z-[100] flex flex-col items-center justify-center" style={{ left: '50%', bottom: '20%', transform: `translate(calc(-50% + ${pos.x !== 0 ? pos.x - window.innerWidth/2 : 0}px), calc(${pos.y !== 0 ? pos.y - window.innerHeight * 0.8 : 0}px))` }}
            onMouseDown={(e) => { isDragging.current = true; handleMove(e.clientX, e.clientY); }} onTouchStart={(e) => { isDragging.current = true; handleMove(e.touches[0].clientX, e.touches[0].clientY); }} onMouseMove={(e) => handleMove(e.clientX, e.clientY)} onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)} onMouseUp={handleEnd} onTouchEnd={handleEnd}>
             <div ref={starRef} className="text-5xl sm:text-7xl filter drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] cursor-grab active:cursor-grabbing animate-pulse hover:scale-110 transition-transform">⭐</div>
             <div className="mt-4 text-white font-bold text-xs sm:text-sm animate-bounce pointer-events-none bg-black/50 px-2 py-1 rounded">DRAG ME TO THE TOP!</div>
        </div>
    );
};

// --- Helper: Retro Modal ---
interface ModalProps { data: EnvelopeData | null; onClose: () => void; playBlip: () => void; }
const Modal: React.FC<ModalProps> = ({ data, onClose, playBlip }) => {
  const [displayedText, setDisplayedText] = useState('');
  const textIndex = useRef(0);
  useEffect(() => {
    if (!data) return; setDisplayedText(''); textIndex.current = 0;
    const fullText = data.message;
    const interval = setInterval(() => { 
        if (textIndex.current < fullText.length) { 
            textIndex.current++; setDisplayedText(fullText.slice(0, textIndex.current));
            if (textIndex.current % 2 === 0) playBlip(); 
        } else { clearInterval(interval); } 
    }, 40);
    return () => clearInterval(interval);
  }, [data]);
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4 animate-[fadeIn_0.2s_ease-out]">
      <style>{`@keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } } @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
      <div className="relative w-full max-w-lg origin-center transform" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.nightBlue, boxShadow: `inset 0 0 0 4px ${COLORS.nightBlue}, inset 0 0 0 8px #fff, 0 0 0 4px #000, 10px 10px 0 rgba(0,0,0,0.5)`, border: '4px solid #fff', animation: 'popIn 0.3s steps(5) forwards', padding: '16px' }}>
        <div className="p-4 flex flex-col gap-4 border-4 border-transparent" style={{ marginTop: '4px'}}>
            <div className="flex justify-between items-center border-b-4 border-white pb-2 mb-2"><span className="text-xs uppercase tracking-widest text-[#FFAD66]">MEMORY_LOG_#{String(data.id).padStart(2,'0')}</span><span className="text-[10px] text-gray-400">{data.title}</span></div>
            <div className="relative p-1 bg-white"><div className="w-full aspect-[3/2] relative bg-black"><img src={data.imageUrl} alt="Memory" className="w-full h-full object-contain"/></div></div>
            <div className="min-h-[80px] p-4 text-xs sm:text-sm leading-loose font-mono text-white relative mt-2" style={{ backgroundColor: '#000', border: '2px solid #fff', boxShadow: '4px 4px 0 rgba(0,0,0,0.3)', fontFamily: '"Press Start 2P", "SimSun", "Microsoft YaHei", monospace' }}>
                <p className="whitespace-pre-wrap break-words">{displayedText}<span className="inline-block w-2 h-4 ml-1 animate-pulse bg-white"></span></p>
                <button onClick={onClose} className="absolute bottom-2 right-2 text-[10px] uppercase hover:text-[#FFAD66] animate-pulse">▼ NEXT</button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper: Cover Screen ---
interface CoverScreenProps { onStart: () => void; playBlip: () => void; playBtn: () => void; onOpenCredits: () => void; }
const CoverScreen: React.FC<CoverScreenProps> = ({ onStart, playBlip, playBtn, onOpenCredits }) => {
  const [textFinished, setTextFinished] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = "Save point reached.\nMemories ready to replay.";
  const indexRef = useRef(0);
  useEffect(() => {
    setDisplayedText(''); indexRef.current = 0;
    const interval = setInterval(() => {
      const idx = indexRef.current;
      if (idx < fullText.length) {
        setDisplayedText(prev => fullText.substring(0, idx + 1));
        if (idx % 2 === 0) playBlip(); indexRef.current = idx + 1;
      } else { setTextFinished(true); clearInterval(interval); }
    }, 80);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end pb-10 sm:pb-16 pointer-events-none">
        <div className="pointer-events-auto w-[90%] max-w-lg p-6 sm:p-8 backdrop-blur-sm animate-[pulse_3s_infinite] flex flex-col items-center text-center gap-6" style={{ backgroundColor: `${COLORS.deepPineGreen}EE`, boxShadow: `0 0 0 4px ${COLORS.cream}, 0 8px 0 rgba(0,0,0,0.4)` }}>
            <p className="pixel-text-glow text-sm sm:text-lg leading-relaxed tracking-wider font-mono whitespace-pre-line drop-shadow-md" style={{ color: COLORS.cream }}>{displayedText}<span className={`inline-block w-3 h-5 ml-2 align-middle ${textFinished ? 'opacity-0' : 'animate-pulse'}`} style={{ backgroundColor: COLORS.cream }}></span></p>
            <div className={`flex flex-col gap-3 items-center transition-opacity duration-500 ${textFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button onClick={onStart} className="group relative px-6 py-2 text-lg sm:text-xl uppercase font-bold tracking-widest transition-colors animate-pulse hover:scale-105 active:scale-95" style={{ color: COLORS.sunsetOrange, textShadow: '2px 2px 0 #000' }}><span className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-x-4 transition-all">▶</span>Start Game</button>
                 <button onClick={() => { playBtn(); onOpenCredits(); }} className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-white mt-2 border-b border-transparent hover:border-white transition-all">View Dev Log</button>
            </div>
        </div>
    </div>
  );
};

const SecretModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 animate-[fadeIn_0.5s]">
            <div className="text-center animate-bounce">
                <div className="text-6xl mb-4">❤️</div>
                <h1 className="text-xl sm:text-3xl text-[#FFAD66] mb-4 font-bold pixel-text-glow">CHEAT CODE ACTIVATED</h1>
                <p className="text-white text-sm sm:text-lg mb-8 leading-loose">Loophole detected.<br/><span className="text-[#D94C23]">Co-op proceeding — by choice.</span></p>
                <button onClick={onClose} className="px-6 py-3 bg-white text-black font-bold uppercase hover:bg-[#FFAD66] transition-colors">OK</button>
            </div>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const [readEnvelopes, setReadEnvelopes] = useState<Set<number>>(new Set());
  const [activeEnvelope, setActiveEnvelope] = useState<EnvelopeData | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.COVER);
  const [showSnow, setShowSnow] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [showGamepad, setShowGamepad] = useState(false);
  const [errorEnvelopeId, setErrorEnvelopeId] = useState<number | null>(null); 
  const [showCredits, setShowCredits] = useState(false);
  const [snowyEnvelopes, setSnowyEnvelopes] = useState<Set<number>>(new Set());
  const [envelopeLayout, setEnvelopeLayout] = useState<{ [key: number]: { x: number, y: number, r: number, z: number } }>({});

  const konamiSequence = useRef<string[]>([]);
  const particleRef = useRef<any>(null);
  
  const { loadBGM, playBGM, playOneShot, stopAll, toggleMute, isMuted, resumeContext, playSynth } = useGameAudio();

  // --- PRELOADER ---
  useEffect(() => {
      const initAssets = async () => {
          const images = [COVER_BG_IMAGE, GAME_BG_IMAGE, YEAR_REVIEW_IMAGE, ...ENVELOPES.map(e => e.imageUrl)];
          const audioKeys = Object.keys(BGM_URLS) as (keyof typeof BGM_URLS)[];
          
          let completed = 0;
          const total = images.length + audioKeys.length;
          
          const tick = () => {
              completed++;
              setLoadProgress((completed / total) * 100);
          };

          const imgPromises = images.map(src => new Promise<void>(resolve => {
              const img = new Image();
              img.src = src;
              img.onload = () => { tick(); resolve(); };
              img.onerror = () => { console.warn('Img err', src); tick(); resolve(); };
          }));

          const audioPromises = audioKeys.map(key => 
              loadBGM(key, BGM_URLS[key]).then(() => tick())
          );

          await Promise.all([...imgPromises, ...audioPromises]);
          
          // Small delay for smooth transition
          setTimeout(() => setIsLoading(false), 500);
      };
      initAssets();

      // Init logic
      const layout: any = {};
      const snowy = new Set<number>();
      while(snowy.size < 3) snowy.add(Math.floor(Math.random() * ENVELOPES.length) + 1);
      setSnowyEnvelopes(snowy);
      ENVELOPES.forEach(env => {
        layout[env.id] = { x: Math.random() * 80 + 10, y: Math.random() * 60 + 15, r: (Math.random() - 0.5) * 60, z: Math.floor(Math.random() * 10) };
      });
      setEnvelopeLayout(layout);
  }, []);

  const handleInput = useCallback((key: string) => {
    playSynth('blip');
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
    konamiSequence.current = [...konamiSequence.current, normalizedKey];
    const currentTail = konamiSequence.current.slice(-konamiCode.length);
    if (JSON.stringify(currentTail) === JSON.stringify(konamiCode)) {
        setSecretUnlocked(true); playSynth('fanfare'); playBGM('STAR', true); setShowSnow(true); setShowGamepad(false); konamiSequence.current = [];
    }
  }, [playSynth, playBGM]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleInput(e.key);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  useEffect(() => {
    if (gameState === GameState.COMPLETED) {
       gsap.to('#start-btn-container', { scale: 1, opacity: 1, duration: 0.5, delay: 1, ease: 'back.out', clearProps: 'pointerEvents' });
    }
  }, [gameState]);

  const handleGlobalMove = useCallback((clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth - 0.5) * 20; const y = (clientY / window.innerHeight - 0.5) * 20; setParallaxOffset({ x, y });
      if (draggingId !== null) {
          const newX = (clientX / window.innerWidth) * 100; const newY = (clientY / window.innerHeight) * 100;
          setEnvelopeLayout(prev => ({ ...prev, [draggingId]: { ...prev[draggingId], x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } }));
      }
  }, [draggingId]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleGlobalMove(e.clientX, e.clientY);
    const onMouseUp = () => setDraggingId(null);
    const onTouchMove = (e: TouchEvent) => { if (draggingId !== null) e.preventDefault(); if (e.touches.length > 0) handleGlobalMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => setDraggingId(null);
    // User interaction to unlock audio
    const onInteract = () => { resumeContext(); playSynth('blip', 0); window.removeEventListener('click', onInteract); window.removeEventListener('touchstart', onInteract); };
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false }); window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('click', onInteract); window.addEventListener('touchstart', onInteract);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd); window.removeEventListener('click', onInteract); window.removeEventListener('touchstart', onInteract);};
  }, [handleGlobalMove, draggingId, resumeContext, playSynth]);

  const handleStartGame = () => {
    resumeContext(); // Double check context is running
    setGameState(GameState.COLLECTING);
    playBGM('GROUND', true);
  };

  const handleResetGame = () => {
      playSynth('blip'); setGameState(GameState.COVER); setReadEnvelopes(new Set()); setShowSnow(false); setBgOpacity(1); setSecretUnlocked(false);
      const layout: any = {}; const snowy = new Set<number>();
      while(snowy.size < 3) snowy.add(Math.floor(Math.random() * ENVELOPES.length) + 1);
      setSnowyEnvelopes(snowy);
      ENVELOPES.forEach(env => { layout[env.id] = { x: Math.random() * 80 + 10, y: Math.random() * 60 + 15, r: (Math.random() - 0.5) * 60, z: Math.floor(Math.random() * 10) }; });
      setEnvelopeLayout(layout);
      gsap.set('.tree-decorations', { opacity: 0, scale: 0 }); gsap.set('#start-btn-container', { clearProps: 'all' });
      stopAll(); 
  };

  const handleEnvelopeInteract = (id: number, isDragStart: boolean) => {
      setEnvelopeLayout(prev => {
         let maxZ = 0; Object.values(prev).forEach(p => maxZ = Math.max(maxZ, p.z));
         return { ...prev, [id]: { ...prev[id], z: maxZ + 1 } };
      });
      if (isDragStart) { setDraggingId(id); } else {
          const expectedId = readEnvelopes.size + 1;
          if (id !== expectedId && !readEnvelopes.has(id)) {
              playOneShot('ERROR'); // Use playOneShot instead of playBGM
              setErrorEnvelopeId(id); setTimeout(() => setErrorEnvelopeId(null), 500); return;
          }
          const env = ENVELOPES.find(e => e.id === id);
          if (env) {
            playSynth('coin');
            const el = document.getElementById(`envelope-${id}`);
            if(el && particleRef.current) { const rect = el.getBoundingClientRect(); particleRef.current.spawn(rect.left + rect.width/2, rect.top + rect.height/2, 12); }
            setActiveEnvelope(env);
          }
      }
  };

  const handleModalClose = () => {
    playSynth('blip');
    if (activeEnvelope) {
        if(particleRef.current) { particleRef.current.spawn(window.innerWidth/2, window.innerHeight/2, 8); }
        if (gameState === GameState.COLLECTING) {
            const newSet = new Set(readEnvelopes); newSet.add(activeEnvelope.id); setReadEnvelopes(newSet);
            if (newSet.size === ENVELOPES.length) { setGameState(GameState.READY_TO_ASSEMBLE); setShowSnow(true); }
        }
        setActiveEnvelope(null);
    }
  };

  const startAssembly = () => {
    playSynth('blip'); setGameState(GameState.ASSEMBLING); playSynth('powerup'); playBGM('CASTLE', false);
    setTimeout(() => {
        const tl = gsap.timeline({ onComplete: () => { setGameState(GameState.PLACING_STAR); } });
        tl.to('#start-btn-container', { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in' }, 0);
        tl.to({}, { duration: 1.0, onUpdate: function() { setBgOpacity(1 - this.progress()); } }, 0);
        tl.to('.year-review-overlay', { opacity: 0, duration: 0.5 }, 0);
        ENVELOPES.forEach((env) => { tl.to(`#envelope-${env.id}`, { rotation: 360, scale: 0.5, x: 0, y: 0, duration: 0.8, ease: "power2.in" }, 0); });
        ENVELOPES.forEach((env) => { tl.to(`#envelope-${env.id}`, { x: () => (Math.random() - 0.5) * 40, y: () => (Math.random() - 0.5) * 40, rotation: () => (Math.random() - 0.5) * 30, filter: 'brightness(2) sepia(1)', duration: 0.1, repeat: 5, yoyo: true, ease: "none" }, 0.8); });
        ENVELOPES.forEach((env) => { const target = TREE_COORDINATES.find(t => t.id === env.id); if (target) { tl.to(`#envelope-${env.id}`, { position: 'fixed', left: `${target.x}%`, top: `${target.y}%`, xPercent: -50, yPercent: -50, rotation: 0, scale: 0.8, filter: 'brightness(1.2) drop-shadow(0 0 8px #FFD700)', duration: 1.2, ease: 'elastic.out(1, 0.4)', delay: 1.4 + (Math.random() * 0.1) }, 1.4); } });
        tl.to('.tree-decorations', { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, 2.6);
        tl.to('.envelope-container', { filter: 'drop-shadow(0 0 25px #FFAD66)', duration: 0.5, yoyo: true, repeat: 3 }, 2.4);
    }, 50);
  };

  const handleStarPlaced = () => {
      setGameState(GameState.COMPLETED); playSynth('fanfare'); playBGM('CLEAR', true);
      if (particleRef.current) { particleRef.current.spawn(window.innerWidth * 0.5, window.innerHeight * 0.25, 30); }
      gsap.to('.tree-star-static', { opacity: 1, scale: 1.5, duration: 0.5, ease: 'back.out' });
  };

  if (isLoading) {
      return <LoadingScreen progress={loadProgress} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white selection:bg-[#8BB6BF] selection:text-[#2F4858]" style={{ backgroundColor: COLORS.nightBlue }}>
      <ParticleSystem ref={particleRef} />
      <CursorTrail />
      <style>{`@keyframes energeticShake { 0%, 100% { transform: scale(1) rotate(0deg); } 20% { transform: scale(1.1) rotate(-3deg); } 40% { transform: scale(1.1) rotate(3deg); } 60% { transform: scale(1.1) rotate(-3deg); } 80% { transform: scale(1.1) rotate(3deg); } } .animate-shake-pulse { animation: energeticShake 0.6s ease-in-out infinite alternate; } @keyframes elasticPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } } @keyframes glowFlash { 0%, 100% { box-shadow: 0 0 0 6px ${COLORS.cream}, 0 0 0 12px ${COLORS.deepPineGreen}, 0 20px 50px rgba(0,0,0,0.6); opacity: 0.9; } 50% { box-shadow: 0 0 20px 6px ${COLORS.cream}, 0 0 0 12px ${COLORS.deepPineGreen}, 0 20px 50px rgba(0,0,0,0.6); opacity: 0.7; } } @keyframes breathe { 0%, 100% { background-color: ${COLORS.deepPineGreen}66; } 50% { background-color: ${COLORS.deepPineGreen}AA; } } @keyframes flash { 0% { opacity: 0; transform: scale(0.9); } 20% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }`}</style>
      
      <div className="absolute top-24 right-4 z-50 flex gap-4">
        <button onClick={() => { playSynth('blip'); setShowGamepad(true); }} className="p-2 border-2 border-white bg-black/50 hover:bg-black/70 active:scale-95 transition-all text-xs sm:text-sm" title="Input Cheat Code">🎮</button>
        <button onClick={() => { playSynth('blip'); toggleMute(); }} className="p-2 border-2 border-white bg-black/50 hover:bg-black/70 active:scale-95 transition-all text-xs sm:text-sm" style={{ fontFamily: '"Press Start 2P", cursive' }}>{isMuted ? '🔇' : '🔊'}</button>
      </div>

      <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${COVER_BG_IMAGE})`, opacity: gameState === GameState.COVER ? 1 : 0, pointerEvents: 'none' }} />
      <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${GAME_BG_IMAGE})`, opacity: gameState !== GameState.COVER ? bgOpacity : 0, pointerEvents: 'none', transform: `translate(${-parallaxOffset.x}px, ${-parallaxOffset.y}px) scale(1.05)` }} />
      
      {gameState === GameState.COVER && (<CoverScreen onStart={handleStartGame} playBlip={() => playSynth('blip')} playBtn={() => playSynth('blip')} onOpenCredits={() => setShowCredits(true)} />)}

      {gameState === GameState.READY_TO_ASSEMBLE && (
         <div className="year-review-overlay fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-[fadeIn_0.5s]">
             <div className="absolute inset-0 bg-white/20 animate-[pulse_0.2s_ease-out] pointer-events-none mix-blend-overlay"></div>
             <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center p-8 animate-[flash_0.6s_ease-out_forwards]">
                <img src={YEAR_REVIEW_IMAGE} alt="Year Review" className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(255,255,255,0.2)] border-4 border-white transform rotate-1" />
             </div>
         </div>
      )}

      {gameState === GameState.PLACING_STAR && ( <DraggableStar onPlaced={handleStarPlaced} /> )}

      {gameState !== GameState.COVER && (
        <main className="relative z-10 w-full h-full flex flex-col items-center">
            <header className="w-full h-16 sm:h-24 pointer-events-none"></header>
            <div className="flex-grow w-full flex items-center justify-center envelope-container">
                <div className="relative w-full h-[80vh] flex items-center justify-center mt-4">
                     <div className="relative w-full h-full">
                        <div className="tree-decorations fixed inset-0 pointer-events-none opacity-0 scale-0 origin-center transition-all z-0">
                            <div className="absolute w-14 h-32 bg-[#5C4033] border-4 border-[#3E2723]" style={{ left: '50%', top: '65%', transform: 'translate(-50%, 0)', boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }} />
                        </div>
                       {ENVELOPES.map((env, index) => {
                         const layout = envelopeLayout[env.id] || { x: 50, y: 50, r: 0, z: 10 };
                         const scatterStyle: React.CSSProperties = { position: 'absolute', left: `${layout.x}%`, top: `${layout.y}%`, transform: `translate(-50%, -50%) rotate(${layout.r}deg)`, zIndex: draggingId === env.id ? 9999 : layout.z };
                         const isStaticTree = gameState === GameState.COMPLETED || gameState === GameState.PLACING_STAR;
                         const isHidden = gameState === GameState.READY_TO_ASSEMBLE;
                         return (
                            <Envelope key={env.id} data={env} index={index} isRead={readEnvelopes.has(env.id)} onInteract={handleEnvelopeInteract} onHover={() => playSynth('blip')} gameState={gameState} 
                                style={{ ...((!isStaticTree && gameState !== GameState.ASSEMBLING) ? scatterStyle : undefined), opacity: isHidden ? 0 : 1, pointerEvents: isHidden ? 'none' : 'auto' }}
                                errorId={errorEnvelopeId} isSnowCovered={snowyEnvelopes.has(env.id)} playRub={() => playSynth('rub')}
                            />
                         );
                       })}
                       <div className="tree-decorations fixed inset-0 pointer-events-none opacity-0 scale-0 origin-center transition-all z-20">
                            <div className="tree-star-static absolute text-6xl sm:text-8xl animate-pulse transition-opacity duration-500" style={{ left: '50%', top: '16%', transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 0 10px #FFD700)', opacity: gameState === GameState.COMPLETED ? 1 : 0 }}>⭐</div>
                       </div>
                     </div>
                  </div>
            </div>
        </main>
      )}

      {gameState !== GameState.COVER && (
        <footer className="fixed bottom-0 left-0 w-full z-50 pointer-events-auto flex flex-col items-center justify-end pb-10 sm:pb-16">
            <div id="start-btn-container" className="pointer-events-auto flex flex-col items-center gap-6 mb-4">
                {gameState === GameState.READY_TO_ASSEMBLE && (
                     <button onClick={startAssembly} className="text-white px-12 py-6 text-xl sm:text-2xl font-bold uppercase tracking-widest animate-shake-pulse transition-all hover:brightness-110 pixel-text-glow" style={{ backgroundColor: '#E67E22', border: `4px solid ${COLORS.wood}`, boxShadow: `inset 0 4px 0 rgba(255,255,255,0.2), 0 8px 0 ${COLORS.wood}, 0 15px 20px rgba(0,0,0,0.6)`, textShadow: '2px 2px 0 #A04000' }}>START ASSEMBLY!</button>
                )}
                {gameState === GameState.COMPLETED && (
                    <div className="flex flex-col gap-3 items-center">
                        <button onClick={handleResetGame} className="px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-widest transition-colors hover:scale-105 active:scale-95" style={{ backgroundColor: COLORS.cream, color: COLORS.deepPineGreen, boxShadow: `4px 4px 0 ${COLORS.deepPineGreen}`, border: `2px solid ${COLORS.deepPineGreen}` }}>◀ RETURN TO HOME</button>
                        <button onClick={() => { playSynth('blip'); setShowCredits(true); }} className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-white border-b border-transparent hover:border-white transition-all">View Dev Log</button>
                    </div>
                )}
            </div>
        </footer>
      )}

      {gameState === GameState.COMPLETED && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="p-10 sm:p-14 backdrop-blur-sm animate-[elasticPop_0.8s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]" style={{ backgroundColor: `${COLORS.deepPineGreen}66`, animation: 'glowFlash 3s infinite alternate, breathe 4s infinite ease-in-out' }}>
                <h2 className="pixel-text-glow text-2xl sm:text-4xl text-center leading-normal drop-shadow-[4px_4px_0_#2F4858]" style={{ color: COLORS.cream }}>Merry Christmas,<br/><span className="whitespace-nowrap" style={{ color: COLORS.sunsetOrange }}>My Player 2!</span></h2>
            </div>
        </div>
      )}

      {secretUnlocked && (<SecretModal onClose={() => { setSecretUnlocked(false); if (gameState === GameState.COMPLETED) { playBGM('CLEAR'); } else if (gameState === GameState.COLLECTING) { playBGM('GROUND'); } }} />)}
      {showGamepad && (<VirtualGamepad onClose={() => setShowGamepad(false)} onInput={handleInput} />)}
      {activeEnvelope && (<Modal data={activeEnvelope} onClose={handleModalClose} playBlip={() => playSynth('blip')} />)}
      {showSnow && <Snowfall />}
      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
    </div>
  );
}