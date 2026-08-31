import { useState, useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'
import './index.css'
const REM_MODELS = [
  { id: "ac_base_rem01", name: "Base Outfit" },
  { id: "ac_base_rem_mizugi01", name: "Swimsuit (Mizugi)" },
  { id: "ac_base_rem_nemaki01", name: "Pajamas (Nemaki)" },
  { id: "ac_base_rem_ogre01", name: "Demon Form (Ogre)" },
  { id: "ac_base_rem_ogre_normal01", name: "Demon Form Normal" },
  { id: "ac_base_rem_pokerface01", name: "Pokerface" },
  { id: "ac_base_rem_valentine01", name: "Valentine" }
];

const EMOTION_MAP = {
  happy: 2,
  excited: 4,
  angry: 8,
  sad: 14,
  neutral: 16,
  shy: 27,
  embarrassed: 27,
  sleepy: 29
};

const IDLE_MOTIONS = [6, 7, 16, 17, 30, 32];
function App() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const isAutoSendRef = useRef(false)
  const idleIntervalRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(REM_MODELS[0].id)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'Rem is happy to see you.' }
  ])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isElectron = navigator.userAgent.toLowerCase().includes('electron')
  const messagesEndRef = useRef(null)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, isChatOpen])
  const canvasRef = useRef(null)
  const appRef = useRef(null)
  const modelRef = useRef(null)
  useEffect(() => {
    let isMounted = true;
    try {
      if (!appRef.current && canvasRef.current) {
        PIXI.Ticker.shared.autoStart = false;
        PIXI.Ticker.shared.stop();
        appRef.current = new PIXI.Application({
          view: canvasRef.current,
          autoStart: false,
          backgroundAlpha: 0,
          resizeTo: canvasRef.current.parentElement,
          resolution: Math.max(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          antialias: true,
          powerPreference: "high-performance"
        });
      }
      const loadLive2D = async () => {
        if (modelRef.current && appRef.current) {
          appRef.current.stage.removeChild(modelRef.current);
          modelRef.current.destroy();
          modelRef.current = null;
        }
        if (appRef.current) {
          appRef.current.stage.removeAllListeners('pointermove');
          appRef.current.stage.removeAllListeners('pointerdown');
        }
        if (idleIntervalRef.current) {
          clearInterval(idleIntervalRef.current);
          idleIntervalRef.current = null;
        }
        try {
          const modelPath = `/models/${selectedModel}/${selectedModel}.model3.json`;
          const model = await Live2DModel.from(modelPath);
          if (!isMounted || !appRef.current) {
            model.destroy();
            return;
          }
          if (canvasRef.current && canvasRef.current.parentElement) {
            const parent = canvasRef.current.parentElement;
            const scaleX = parent.clientWidth / model.width;
            const scaleY = parent.clientHeight / model.height;
            model.scale.set(Math.min(scaleX, scaleY) * 0.9);
            model.x = (parent.clientWidth - model.width * model.scale.x) / 2 - 150;
            model.y = (parent.clientHeight - model.height * model.scale.y) / 2 - 175;
          }
          model.interactive = true;
          model.buttonMode = true;
          appRef.current.stage.interactive = true;
          appRef.current.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);
          let lastPatX = 0;
          let patSwipes = 0;
          let lastPatTime = 0;
          appRef.current.stage.on('pointermove', (event) => {
            const x = event.data.global.x;
            const y = event.data.global.y;
            const headZoneY = model.y + (model.height * model.scale.y * 0.35);
            if (y < headZoneY && y > model.y - 100) {
              if (appRef.current && appRef.current.view) appRef.current.view.style.cursor = 'grab';
              const now = Date.now();
              if (now - lastPatTime < 500) {
                if (Math.abs(x - lastPatX) > 10) {
                  patSwipes++;
                  lastPatX = x;
                  lastPatTime = now;
                  if (patSwipes > 10) {
                    patSwipes = 0;
                    if (modelRef.current && modelRef.current.internalModel && modelRef.current.internalModel.motionManager) {
                      try {
                        modelRef.current.internalModel.motionManager.startMotion('', EMOTION_MAP.happy, 2);
                      } catch (e) { }
                    }
                  }
                }
              } else {
                patSwipes = 1;
                lastPatX = x;
                lastPatTime = now;
              }
            } else {
              patSwipes = 0;
              if (appRef.current && appRef.current.view) appRef.current.view.style.cursor = 'default';
            }
          });
          appRef.current.stage.on('pointerdown', () => {
            if (modelRef.current && modelRef.current.internalModel && modelRef.current.internalModel.motionManager) {
              try {
                modelRef.current.internalModel.motionManager.startRandomMotion('');
              } catch (e) { }
            }
          });
          appRef.current.stage.addChild(model);
          modelRef.current = model;

          // Dynamic Idle Animation
          idleIntervalRef.current = setInterval(() => {
            if (modelRef.current && modelRef.current.internalModel && modelRef.current.internalModel.motionManager) {
              try {
                const idleIdx = IDLE_MOTIONS[Math.floor(Math.random() * IDLE_MOTIONS.length)];
                modelRef.current.internalModel.motionManager.startMotion('', idleIdx, 1);
              } catch (e) { }
            }
          }, 8000);
        } catch (error) {
          console.error("Failed to load Live2D Model:", error);
        }
      };
      if (appRef.current) {
        loadLive2D();
      }
    } catch (e) {
      console.error("Critical error setting up PIXI:", e);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedModel]);
  useEffect(() => {
    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    const onKeyDown = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; };
    const onKeyUp = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    let walkTime = 0;
    const walkTicker = (delta) => {
      if (!modelRef.current) return;
      const speed = 7 * delta;
      let moved = false;
      if (keys.w || keys.ArrowUp) { modelRef.current.y -= speed; moved = true; }
      if (keys.s || keys.ArrowDown) { modelRef.current.y += speed; moved = true; }
      if (keys.a || keys.ArrowLeft) { modelRef.current.x -= speed; moved = true; }
      if (keys.d || keys.ArrowRight) { modelRef.current.x += speed; moved = true; }

      if (moved) {
        walkTime += delta * 0.15;
        const tilt = (keys.a || keys.ArrowLeft) ? -0.05 : ((keys.d || keys.ArrowRight) ? 0.05 : 0);
        modelRef.current.rotation += (tilt - modelRef.current.rotation) * 0.1;
        modelRef.current.scale.y = modelRef.current.scale.x * (1 + Math.abs(Math.sin(walkTime)) * 0.03);
      } else {
        modelRef.current.rotation += (0 - modelRef.current.rotation) * 0.1;
        modelRef.current.scale.y = modelRef.current.scale.x;
        walkTime = 0;
      }
    };
    PIXI.Ticker.shared.add(walkTicker);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      PIXI.Ticker.shared.remove(walkTicker);
    };
  }, []);
  useEffect(() => {
    let isTracking = true;
    if (isElectron && window.require) {
      try {
        const electron = window.require('electron');
        const cursorHandler = (event, { localX, localY }) => {
          if (!isTracking) return;
          if (modelRef.current) {
            modelRef.current.focus(localX, localY);
          }
          if (appRef.current) {
            PIXI.Ticker.shared.update(performance.now());
            appRef.current.renderer.render(appRef.current.stage);
          }
        };
        electron.ipcRenderer.on('global-cursor-update', cursorHandler);
        return () => {
          isTracking = false;
          electron.ipcRenderer.removeListener('global-cursor-update', cursorHandler);
        };
      } catch (err) {
        console.error("Failed to setup global cursor tracking", err);
      }
    } else {
      let intervalId = setInterval(() => {
        if (appRef.current) {
          PIXI.Ticker.shared.update(performance.now());
          appRef.current.renderer.render(appRef.current.stage);
        }
      }, 16);
      const handleGlobalMouseMove = (event) => {
        if (modelRef.current) {
          modelRef.current.focus(event.clientX, event.clientY);
        }
      };
      window.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        isTracking = false;
        clearInterval(intervalId);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isElectron]);
  useEffect(() => {
    if (response) {
      const timer = setTimeout(() => {
        setResponse('');
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [response]);
  const handleToggleRecord = async (autoSend = false) => {
    if (isRecording) {
      isAutoSendRef.current = autoSend;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          }
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice.webm');
          try {
            const res = await fetch('http://localhost:8081/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (data.text) {
              if (isAutoSendRef.current) {
                handleSend(data.text, true);
              } else {
                setInput(prev => prev + (prev ? ' ' : '') + data.text);
              }
            }
          } catch (err) {
            console.error("Transcription failed:", err);
          }
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
      }
    }
  };
  const handleSend = async (overrideText = null, useVoice = false) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim()) return
    const userMessage = textToSend;
    if (typeof overrideText !== 'string') setInput('');
    setLoading(true)
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }])
    try {
      const res = await fetch('http://localhost:8081/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, use_voice: useVoice })
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', text: data.response }])
      setResponse(data.response)
      setCurrentEmotion(data.emotion)
      if (modelRef.current && modelRef.current.internalModel && modelRef.current.internalModel.motionManager) {
        try {
          if (data.emotion) {
            const motionIdx = EMOTION_MAP[data.emotion.toLowerCase()] || EMOTION_MAP.neutral;
            modelRef.current.internalModel.motionManager.startMotion('', motionIdx, 2);
          }
        } catch (e) {
        }
      }
    } catch (error) {
      console.error(error)
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Sorry, Rem had an error connecting to the brain.' }])
    } finally {
      setLoading(false)
    }
  }
  const handlePlaySpecificVoice = async (textToSpeak) => {
    if (loading) return;
    if (modelRef.current && modelRef.current.internalModel && modelRef.current.internalModel.motionManager) {
      try {
        if (currentEmotion) {
          const motionIdx = EMOTION_MAP[currentEmotion.toLowerCase()] || EMOTION_MAP.neutral;
          modelRef.current.internalModel.motionManager.startMotion('', motionIdx, 2);
        }
      } catch (e) { }
    }
    try {
      await fetch('http://localhost:8081/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak })
      });
    } catch (error) {
      console.error("Failed to trigger voice:", error);
    }
  }
  const renderChatWindow = () => (
    <div className={`chat-window pointer-events-auto no-drag ${isElectron ? 'absolute top-20 left-8 w-80 h-[70vh]' : 'w-[35%] h-full rounded-none border-y-0 border-r-0'}`} style={{ zIndex: 1000, display: (isElectron && !isChatOpen) ? 'none' : 'flex' }}>
      <div className="chat-header">
        <div className="flex items-center gap-2 text-remBlue">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
          Chat
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button title="Info" className="hover:text-remBlue cursor-pointer bg-transparent border-none transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
          </button>
          {isElectron && (
            <button onClick={() => setIsChatOpen(false)} title="Close" className="hover:text-remBlue cursor-pointer ml-1 bg-transparent border-none transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="chat-messages relative">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role} relative group`}>
            {msg.text}
            {msg.role === 'assistant' && (
              <button
                onClick={() => handlePlaySpecificVoice(msg.text)}
                className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-remBlue transition-all cursor-pointer bg-transparent border-none p-1"
                title="Play Audio"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant animate-pulse">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <div className="chat-input-box">
          <input
            type="text"
            placeholder={isRecording ? "Listening... (Click mic to stop)" : "Say something..."}
            className={isRecording ? "text-red-500 placeholder-red-400" : ""}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button onClick={() => handleToggleRecord(false)} disabled={loading} className={`ml-2 cursor-pointer transition-colors bg-transparent border-none ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-remBlue'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
          </button>
          <button onClick={() => handleSend()} disabled={loading} className="ml-2 cursor-pointer transition-colors text-gray-400 hover:text-remBlue bg-transparent border-none">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <div className={`font-nunito h-screen w-screen flex ${isElectron ? 'relative draggable-area' : 'flex-row'}`}>
      { }
      <main className={`relative z-0 pointer-events-auto no-drag ${isElectron ? 'w-full h-full absolute top-0 left-0' : 'w-[65%] h-full flex flex-col justify-between p-6'}`}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
        { }
        <header className="w-full flex justify-between items-start z-50 pointer-events-none absolute top-6 left-6 right-6">
          <div className="relative pointer-events-auto no-drag mr-auto pl-2" style={{ marginLeft: isElectron ? '24px' : '0' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-56 bg-white/85 backdrop-blur-sm border-2 border-remBlue text-remDark font-bold rounded-full px-4 py-2 shadow-sm hover:shadow-md hover:bg-white transition-all outline-none cursor-pointer"
            >
              <span className="truncate">{REM_MODELS.find(m => m.id === selectedModel)?.name}</span>
              <svg className={`fill-current h-4 w-4 text-remBlue transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white/90 backdrop-blur-md border-2 border-remBlue rounded-2xl shadow-xl overflow-hidden z-[1000] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {REM_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 font-bold transition-colors ${selectedModel === m.id ? 'bg-remBlue text-white' : 'text-remDark hover:bg-blue-100 hover:text-remBlue'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        { }
        {isElectron && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 pointer-events-auto no-drag">
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="floating-action-btn" title="Toggle Chat">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            </button>
            <button onClick={() => handleToggleRecord(true)} className={`floating-action-btn ${isRecording ? 'bg-red-500 animate-pulse' : ''}`} title="Hold/Click to Talk">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
            </button>
            { }
            <div className="floating-action-btn bg-gray-600 hover:bg-gray-500 drag-handle cursor-move" title="Drag Window">
              <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" /></svg>
            </div>
          </div>
        )}
        { }
        {!isElectron && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 pointer-events-auto no-drag">
            <button onClick={handlePlayVoice} className="floating-action-btn" title="Speak Last Message">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            </button>
          </div>
        )}
      </main>
      { }
      {renderChatWindow()}
    </div>
  )
}
export default App