import React, { useState, useEffect, useRef } from 'react';
import { School } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const { users, students, setCurrentUser, schoolName } = useAppContext();
  const [loginType, setLoginType] = useState<'staff' | 'parent'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedUsername, setIsFocusedUsername] = useState(false);
  const [typingLength, setTypingLength] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [isPandaHovered, setIsPandaHovered] = useState(false);
  
  type PandaAction = 'strolling' | 'flying' | 'experiment' | 'running';
  const [pandaAction, setPandaAction] = useState<PandaAction>('strolling');
  
  const scientists = [
    { name: 'ابن سينا', emoji: '👳‍♂️', quote: 'العقل البشري قوة من قوى النفس.. استمر في التعلم!', color: '#a78bfa' },
    { name: 'الخوارزمي', emoji: '📜', quote: 'علم الجبر مفتاح لحل كل عقدة.. أهلاً بك!', color: '#fbbf24' },
    { name: 'الحسن بن الهيثم', emoji: '👁️', quote: 'البحث عن الحقيقة بحد ذاته أمر مطلوب.. أنر عقلك!', color: '#38bdf8' },
    { name: 'أبو بكر الرازي', emoji: '🧪', quote: 'التجربة هي المعيار الأساسي للوصول لليقين.', color: '#34d399' },
    { name: 'عباس بن فرناس', emoji: '🦅', quote: 'الشجاعة في التجربة هي أول خطوة نحو الطيران والابتكار!', color: '#fb7185' }
  ];
  const [persona, setPersona] = useState(0);
  
  useEffect(() => {
    setPersona(Math.floor(Math.random() * scientists.length));
  }, []);

  useEffect(() => {
    const actions: PandaAction[] = ['strolling', 'flying', 'experiment', 'running'];
    const interval = setInterval(() => {
      if (isPandaHovered) return; // Don't change action while user is hovering
      setPandaAction(prev => {
        let next;
        do { next = actions[Math.floor(Math.random() * actions.length)]; } while (next === prev);
        return next;
      });
    }, 15000); // cycle every 15s
    return () => clearInterval(interval);
  }, [isPandaHovered]);

  const idleTimerRef = useRef<number | null>(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      if (!password || !username) setIsIdle(true);
    }, 3500);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current); };
  }, [username, password, isFocusedUsername, isFocusedPassword]);

  useEffect(() => {
    if (isFocusedUsername) {
      setTypingLength(Math.min(username.length, 20));
    }
  }, [username, isFocusedUsername]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'staff') {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        setCurrentUser(user);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } else {
      // Parent Login Logic (Local simulation for now)
      const student = students.find(s => s.enrollmentNumber === username);
      if (!student) {
        setError('رقم القيد غير صحيح');
        return;
      }
      
      const cleanInputPhone = password.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
      const cleanFatherPhone = (student.fatherPhone || '').replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
      const cleanMotherPhone = (student.motherPhone || '').replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');

      const isFatherMatch = cleanFatherPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanFatherPhone);
      const isMotherMatch = cleanMotherPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanMotherPhone);

      if (!isFatherMatch && !isMotherMatch) {
        setError('رقم الهاتف غير مطابق لبيانات الطالب');
        return;
      }
      
      setCurrentUser({
        id: `parent_${student.id}`,
        username: student.enrollmentNumber,
        name: student.fatherName || `ولي أمر ${student.name}`,
        role: 'parent',
        studentId: student.id // Custom property we can read later
      } as any);
    }
  };

  const isCoveringEyes = isFocusedPassword;
  const eyeX = isFocusedUsername ? (typingLength / 20) * 16 - 8 : (isIdle ? -5 : 0);
  const eyeY = isFocusedUsername ? 4 : (isIdle ? 6 : 0);

  return (
    <div style={styles.container} className="login-animated-bg">
      <style>
        {`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .login-animated-bg {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .floating-element {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes scatterAssemble {
            0% { 
              opacity: 0; 
              letter-spacing: 2em; 
              filter: blur(12px); 
              transform: scale(1.5); 
            }
            30% { 
              opacity: 1; 
              letter-spacing: 1em; 
              filter: blur(4px); 
            }
            80% { 
              letter-spacing: normal; 
              filter: blur(0px); 
              transform: scale(1);
            }
            100% { 
              letter-spacing: normal; 
              filter: blur(0px); 
              transform: scale(1);
            }
          }
          .animated-school-name {
            display: inline-block;
            animation: scatterAssemble 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            text-shadow: 0 4px 6px rgba(0,0,0,0.3);
            color: #fff;
            font-size: 32px;
            font-weight: 900;
          }
          @keyframes logoPulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,255,255,0.4)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,255,255,0.4)); }
          }
          .logo-pulse {
            animation: logoPulse 3s ease-in-out infinite;
          }
          .side-character-left {
            position: fixed;
            left: 5%;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .roaming-panda-container {
            position: fixed;
            bottom: -20px;
            left: 0;
            z-index: 25;
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: roam 25s linear infinite;
          }
          .roaming-panda-sprite {
            animation: flipDirection 25s linear infinite;
          }
          /* Strolling (25s) */
          @keyframes roam {
            0% { transform: translateX(-20vw); }
            45% { transform: translateX(90vw); }
            50% { transform: translateX(90vw); }
            95% { transform: translateX(-20vw); }
            100% { transform: translateX(-20vw); }
          }
          /* Running (5s dash) */
          @keyframes dash {
            0% { transform: translateX(-20vw); }
            100% { transform: translateX(120vw); }
          }
          /* Flying (10s floating wave) */
          @keyframes fly {
            0% { transform: translate(-20vw, -10vh) scale(0.8); }
            25% { transform: translate(30vw, -30vh) scale(1); }
            50% { transform: translate(60vw, -15vh) scale(0.9); }
            75% { transform: translate(90vw, -35vh) scale(1.1); }
            100% { transform: translate(120vw, -5vh) scale(0.8); }
          }
          /* Experiment (Center screen) */
          @keyframes standCenter {
            0%, 100% { transform: translateX(35vw); }
          }
          /* Explosion effect inside the experiment */
          @keyframes explodeFlask {
            0%, 90% { transform: scale(1); filter: brightness(1); }
            91% { transform: scale(3); filter: brightness(2) hue-rotate(90deg); }
            92%, 100% { transform: scale(0); opacity: 0; }
          }
          @keyframes explodeFlash {
            0%, 91% { opacity: 0; transform: scale(0); background: transparent; }
            92% { opacity: 1; transform: scale(10); background: #fef08a; }
            93% { opacity: 1; transform: scale(15); background: #ef4444; }
            96%, 100% { opacity: 0; transform: scale(20); background: transparent; }
          }
          @keyframes sootFace {
            0%, 92% { filter: brightness(1); }
            93%, 100% { filter: brightness(0.2) contrast(1.5) sepia(0.3); }
          }
          
          @keyframes flipDirection {
            0% { transform: scaleX(-1); }
            49.9% { transform: scaleX(-1); }
            50% { transform: scaleX(1); }
            99.9% { transform: scaleX(1); }
            100% { transform: scaleX(-1); }
          }
          @keyframes walkCycle {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-5px) rotate(5deg); }
            75% { transform: translateY(-5px) rotate(-5deg); }
          }
          @keyframes wiggleFeet {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            75% { transform: rotate(-15deg); }
          }
          @media (max-width: 1100px) {
            .side-character-left, .roaming-panda-container {
              display: none !important;
            }
          }
        `}
      </style>
      
      {/* ─── Roaming Panda ─── */}
      <div 
        className="roaming-panda-container" 
        style={{ 
          animationPlayState: isPandaHovered ? 'paused' : 'running',
          animation: isPandaHovered ? 'none' 
            : pandaAction === 'strolling' ? 'roam 25s linear infinite'
            : pandaAction === 'running' ? 'dash 6s linear infinite'
            : pandaAction === 'flying' ? 'fly 10s ease-in-out infinite'
            : 'standCenter 15s linear infinite'
        }}
        onMouseEnter={() => setIsPandaHovered(true)}
        onMouseLeave={() => setIsPandaHovered(false)}
      >
        {/* Explosion Flash Overlay */}
        {pandaAction === 'experiment' && !isPandaHovered && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '50px', height: '50px',
            borderRadius: '50%',
            zIndex: 99,
            pointerEvents: 'none',
            animation: 'explodeFlash 15s infinite'
          }}></div>
        )}

        {/* Speech Bubble (Appears only on Hover) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          marginBottom: '20px',
          textAlign: 'center',
          border: `2px solid var(--primary-color)`,
          width: '260px',
          position: 'relative',
          opacity: isPandaHovered ? 1 : 0,
          transform: isPandaHovered ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: isPandaHovered ? 'auto' : 'none',
          zIndex: 100
        }}>
          <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }}>
            أهلاً بك في نظام قرطاس! 🐼
          </div>
          <div style={{ fontSize: '14px', color: '#475569', marginTop: '6px' }}>
            {pandaAction === 'flying' ? 'أنا سوبر باندا! أطير لحماية النظام... ' : 
             pandaAction === 'running' ? 'أنا أسرع باندا في العالم! ' :
             pandaAction === 'experiment' ? 'كنت أقوم بتجربة علمية للتو... ' : ''}
            أتركك اليوم مع حكمة من العظيم <strong style={{ color: scientists[persona].color }}>{scientists[persona].name}</strong> الموجود على يسارك...
          </div>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', marginLeft: '-8px', width: '16px', height: '16px', background: '#fff', transform: 'rotate(45deg)', borderBottom: `2px solid var(--primary-color)`, borderRight: `2px solid var(--primary-color)` }}></div>
        </div>

        {/* Panda Sprite */}
        <div 
          className="roaming-panda-sprite" 
          style={{ 
            animationPlayState: isPandaHovered ? 'paused' : 'running',
            animation: pandaAction === 'strolling' && !isPandaHovered ? 'flipDirection 25s linear infinite' : 'none'
          }}
        >
          <svg 
            viewBox="0 0 200 240" 
            width="220" 
            height="264" 
            style={{ 
              zIndex: 1, 
              position: 'relative', 
              transition: 'all 0.4s ease-out', 
              transform: isPandaHovered ? 'scale(1.05) rotate(0deg)' 
                : pandaAction === 'flying' ? 'scale(1) rotate(65deg)'
                : pandaAction === 'running' ? 'scale(1) rotate(15deg)'
                : 'scale(1) rotate(0deg)',
              animation: isPandaHovered ? 'none' : 
                (pandaAction === 'strolling' || pandaAction === 'experiment') ? 'walkCycle 1.5s ease-in-out infinite' 
                : pandaAction === 'running' ? 'walkCycle 0.4s ease-in-out infinite' 
                : 'none',
              filter: pandaAction === 'experiment' && !isPandaHovered ? 'var(--soot-filter, none)' : 'none'
            }}
          >
            {pandaAction === 'experiment' && !isPandaHovered && (
              <style>{`svg { animation: sootFace 15s infinite; }`}</style>
            )}

            {/* Red Cape for Superman Flying */}
            {pandaAction === 'flying' && (
              <g style={{ animation: 'wiggleFeet 0.5s infinite' }}>
                <path d="M 70 120 Q 20 200 10 240 Q 50 250 130 240 Q 180 200 130 120 Z" fill="#ef4444" opacity="0.9" />
              </g>
            )}

          {/* Background circle - removed to make it full body floating */}
          
          {/* ── Body ── */}
          <g style={{ transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)', transform: isCoveringEyes ? 'translateY(8px)' : 'translateY(0)' }}>
            <ellipse cx="100" cy="210" rx="55" ry="30" fill="#1a1a2e" />
            {/* Belly */}
            <ellipse cx="100" cy="210" rx="35" ry="20" fill="#f5f5f5" />
            
            {/* Feet */}
            <g style={{
              transformOrigin: '70px 230px',
              animation: isPandaHovered ? 'none' : 
                pandaAction === 'running' ? 'wiggleFeet 0.4s ease-in-out infinite' :
                pandaAction === 'flying' ? 'none' : 
                pandaAction === 'experiment' ? 'none' : 'wiggleFeet 1.5s ease-in-out infinite'
            }}>
              <ellipse cx="70" cy="235" rx="16" ry="10" fill="#1a1a2e" />
              <ellipse cx="70" cy="235" rx="8" ry="6" fill="#e8a0bf" opacity="0.8" />
            </g>
            <g style={{
              transformOrigin: '130px 230px',
              animation: isPandaHovered ? 'none' : 
                pandaAction === 'running' ? 'wiggleFeet 0.4s ease-in-out infinite 0.2s' :
                pandaAction === 'flying' ? 'none' :
                pandaAction === 'experiment' ? 'none' : 'wiggleFeet 1.5s ease-in-out infinite 0.75s'
            }}>
              <ellipse cx="130" cy="235" rx="16" ry="10" fill="#1a1a2e" />
              <ellipse cx="130" cy="235" rx="8" ry="6" fill="#e8a0bf" opacity="0.8" />
            </g>
          </g>
          <g style={{ transition: 'transform 0.25s ease-out', transformOrigin: '100px 100px', transform: isIdle && !isCoveringEyes ? 'rotate(-6deg) translateY(4px)' : 'rotate(0)' }}>
            <circle cx="48" cy="52" r="24" fill="#1a1a2e" />
            <circle cx="152" cy="52" r="24" fill="#1a1a2e" />
            <circle cx="48" cy="52" r="12" fill="#e8a0bf" />
            <circle cx="152" cy="52" r="12" fill="#e8a0bf" />
            <ellipse cx="100" cy="100" rx="62" ry="58" fill="#ffffff" />
            <ellipse cx="68" cy="92" rx="22" ry="20" fill="#1a1a2e" transform="rotate(-8 68 92)" />
            <ellipse cx="132" cy="92" rx="22" ry="20" fill="#1a1a2e" transform="rotate(8 132 92)" />
            
            {/* Eyes */}
            <g style={{ opacity: isCoveringEyes ? 0 : 1, transition: 'opacity 0.15s 0.2s' }}>
              {isPandaHovered ? (
                /* Happy closed eyes when hovered/laughing */
                <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none">
                  <path d="M 58 92 Q 68 84 78 92" />
                  <path d="M 122 92 Q 132 84 142 92" />
                </g>
              ) : (
                /* Normal open eyes */
                <>
                  <ellipse cx="68" cy="92" rx="12" ry="11" fill="#ffffff" />
                  <ellipse cx="132" cy="92" rx="12" ry="11" fill="#ffffff" />
                  <g style={{ transform: `translate(${eyeX}px, ${eyeY}px)`, transition: 'transform 0.12s ease-out' }}>
                    <circle cx="68" cy="93" r="6" fill="#0f172a" />
                    <circle cx="132" cy="93" r="6" fill="#0f172a" />
                    <circle cx="66" cy="91" r="2.5" fill="#ffffff" />
                    <circle cx="130" cy="91" r="2.5" fill="#ffffff" />
                    <circle cx="70" cy="95" r="1" fill="#ffffff" opacity="0.6" />
                    <circle cx="134" cy="95" r="1" fill="#ffffff" opacity="0.6" />
                  </g>
                </>
              )}
            </g>
            <g style={{ opacity: isCoveringEyes ? 1 : 0, transition: 'opacity 0.1s' }}>
              <path d="M 56 92 Q 68 86 80 92" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 120 92 Q 132 86 144 92" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
            <ellipse cx="100" cy="112" rx="8" ry="5" fill="#1a1a2e" />
            <ellipse cx="98" cy="111" rx="3" ry="2" fill="#444" opacity="0.4" />
            
            {/* Mouth */}
            <g style={{ transition: 'all 0.3s' }}>
              <line x1="100" y1="117" x2="100" y2="122" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
              {isPandaHovered ? (
                /* Big Laughing Mouth */
                <path d="M 85 122 Q 100 145 115 122 Z" fill="#e11d48" stroke="#1a1a2e" strokeWidth="2" strokeLinejoin="round" />
              ) : isIdle ? (
                <ellipse cx="100" cy="126" rx="5" ry="4" fill="#e8a0bf" stroke="#1a1a2e" strokeWidth="1.5" />
              ) : isFocusedUsername ? (
                <path d="M 92 122 Q 100 128 108 122" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M 88 122 Q 100 135 112 122" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none" />
              )}
            </g>
            <circle cx="55" cy="108" r="8" fill="#f9a8d4" opacity="0.4" />
            <circle cx="145" cy="108" r="8" fill="#f9a8d4" opacity="0.4" />
          </g>
          <g style={{ transformOrigin: '40px 190px', transform: isCoveringEyes ? 'translate(30px, -45px) rotate(30deg)' : pandaAction === 'flying' && !isPandaHovered ? 'rotate(-130deg) translate(-20px, 40px)' : 'translate(0, 0) rotate(0)', transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <ellipse cx="45" cy="185" rx="14" ry="22" fill="#1a1a2e" />
            <ellipse cx="45" cy="185" rx="8" ry="10" fill="#3a3a4e" opacity="0.3" />
          </g>
          <g style={{ transformOrigin: '160px 190px', transform: isCoveringEyes ? 'translate(-30px, -45px) rotate(-30deg)' : pandaAction === 'flying' && !isPandaHovered ? 'rotate(130deg) translate(20px, 40px)' : isIdle && !isCoveringEyes ? 'translate(-15px, -30px) rotate(-25deg)' : pandaAction === 'experiment' && !isPandaHovered ? 'translate(-10px, -30px) rotate(-20deg)' : 'translate(0, 0) rotate(0)', transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <ellipse cx="155" cy="185" rx="14" ry="22" fill="#1a1a2e" />
            <ellipse cx="155" cy="185" rx="8" ry="10" fill="#3a3a4e" opacity="0.3" />
            
            {/* Science Beaker */}
            {pandaAction === 'experiment' && !isPandaHovered && (
              <g style={{ animation: 'explodeFlask 15s infinite' }}>
                <path d="M 145 130 L 165 130 L 175 160 L 135 160 Z" fill="rgba(255,255,255,0.7)" stroke="#1a1a2e" strokeWidth="2" />
                <path d="M 148 140 L 162 140 L 170 157 L 140 157 Z" fill="#10b981" opacity="0.8" />
                <circle cx="155" cy="148" r="3" fill="#fff" opacity="0.6" />
                <circle cx="162" cy="152" r="2" fill="#fff" opacity="0.6" />
              </g>
            )}

            <g style={{ opacity: isIdle && !isCoveringEyes ? 1 : 0, transition: 'opacity 0.2s 0.1s' }}>
              <ellipse cx="155" cy="160" rx="5" ry="10" fill="#1a1a2e" />
            </g>
          </g>
        </svg>
        </div>{/* end roaming-panda-sprite */}
      </div>{/* end roaming-panda-container */}

      {/* ─── Left Side: Scientist ─── */}
      <div className="side-character-left">
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          marginBottom: '20px',
          textAlign: 'center',
          border: `2px solid ${scientists[persona].color}`,
          width: '260px',
          position: 'relative',
          animation: 'float 5s ease-in-out infinite 1s'
        }}>
          <div style={{ fontSize: '18px', color: '#1e293b', fontStyle: 'italic', fontWeight: 'bold' }}>
            "{scientists[persona].quote}"
          </div>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', marginLeft: '-8px', width: '16px', height: '16px', background: 'rgba(255, 255, 255, 0.95)', transform: 'rotate(45deg)', borderBottom: `2px solid ${scientists[persona].color}`, borderRight: `2px solid ${scientists[persona].color}` }}></div>
        </div>

        <div style={{ 
          width: '160px', 
          height: '160px', 
          borderRadius: '50%', 
          background: scientists[persona].color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '90px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          border: '6px solid #fff',
          animation: 'float 6s ease-in-out infinite 2s'
        }}>
          {scientists[persona].emoji}
        </div>
      </div>

      <div style={{...styles.loginBox, zIndex: 20}} className="floating-element">
        <div style={styles.header}>
          <div style={styles.logoWrapper} className="logo-pulse">
            <School size={48} strokeWidth={1.5} color="#0f172a" />
          </div>
          <h2 style={styles.title}>
            <span style={{ color: '#fff' }}>قِـرْطَاس</span>
            <span style={{ color: '#38bdf8', margin: '0 10px' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 300, letterSpacing: '4px', fontSize: '24px' }}>QIRTAS</span>
          </h2>
          <div style={{ marginTop: '10px', overflow: 'hidden' }}>
            <span className="animated-school-name">
              {schoolName}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%' }}>
          <button 
            type="button"
            onClick={() => { setLoginType('staff'); setError(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: loginType === 'staff' ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
          >
            👨‍🏫 دخول الإدارة والمعلمين
          </button>
          <button 
            type="button"
            onClick={() => { setLoginType('parent'); setError(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: loginType === 'parent' ? '#f59e0b' : 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
          >
            👨‍👩‍👦 بوابة أولياء الأمور
          </button>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <div style={{ ...styles.icon, transform: isFocusedUsername ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%)', filter: isFocusedUsername ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none' }}>
              🧑‍🏫
            </div>
            <input
              type="text"
              placeholder={loginType === 'staff' ? "اسم المستخدم" : "رقم القيد الخاص بالطالب"}
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setIsFocusedUsername(true)}
              onBlur={() => setIsFocusedUsername(false)}
              style={{ ...styles.input, borderColor: isFocusedUsername ? 'var(--primary-color)' : 'var(--border-color)' }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={{ ...styles.icon, transform: isFocusedPassword ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%)', filter: isFocusedPassword ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none' }}>
              🔐
            </div>
            <input
              type={loginType === 'parent' ? "tel" : "password"}
              placeholder={loginType === 'staff' ? "كلمة المرور" : "رقم هاتف ولي الأمر المسجل"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setIsFocusedPassword(true)}
              onBlur={() => setIsFocusedPassword(false)}
              style={{ ...styles.input, borderColor: isFocusedPassword ? 'var(--primary-color)' : 'var(--border-color)' }}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button}>
            تسجيل الدخول
          </button>
        </form>

        <div style={styles.footer}>
          نظام الإدارة المدرسية المتكامل &copy; {new Date().getFullYear()} <br/>
          حقوق النظام محفوظة للمهندس نورالدين الدربازي - <span style={{ direction: 'ltr', display: 'inline-block' }}>0914216122</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: 'Cairo, sans-serif',
    direction: 'rtl',
  },
  loginBox: {
    width: '100%',
    maxWidth: 420,
    padding: '40px 32px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 30,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    width: '100%',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    borderRadius: 24,
    padding: 16,
    boxShadow: '0 12px 24px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 8px',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },
  avatarContainer: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 170,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease',
    zIndex: 2,
    fontSize: 28,
  },
  input: {
    width: '100%',
    padding: '16px 56px 16px 16px',
    borderRadius: 16,
    border: '2px solid rgba(255,255,255,0.2)',
    outline: 'none',
    fontSize: 16,
    fontFamily: 'Cairo, sans-serif',
    background: 'rgba(255,255,255,0.9)',
    color: '#333',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  error: {
    color: 'var(--danger-color)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    background: 'rgba(239,68,68,0.1)',
    padding: '10px',
    borderRadius: 8,
    border: '1px solid rgba(239,68,68,0.2)',
    fontWeight: 600,
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: '#fff',
    borderRadius: 16,
    fontSize: 20,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'Cairo, sans-serif',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: 600,
  }
};
