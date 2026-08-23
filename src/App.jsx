import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [userMood, setUserMood] = useState('Focused');
  const [voiceStyle, setVoiceStyle] = useState('soft');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text');
  const [isGenerating, setIsGenerating] = useState(false);

  // Settings & History UI
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Live Cam & Mic
  const [isMicListening, setIsMicListening] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const videoRef = useRef(null);

  const [fmpUser, setFmpUser] = useState(function() {
    return localStorage.getItem('ims_fmp_user') || null;
  });
  const [usernameInput, setUsernameInput] = useState('');

  // Chat Sessions Storage
  const [sessions, setSessions] = useState(function() {
    const saved = localStorage.getItem('ims_chat_sessions');
    return saved ? JSON.parse(saved) : [{ id: Date.now(), title: 'Chat 1', messages: [] }];
  });
  const [currentSessionId, setCurrentSessionId] = useState(function() {
    const saved = localStorage.getItem('ims_chat_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[0] ? parsed[0].id : Date.now();
    }
    return Date.now();
  });

  const activeSession = sessions.find(function(s) { return s.id === currentSessionId; }) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  useEffect(function() {
    const timer = setTimeout(function() { setLoading(false); }, 1200);
    return function() { clearTimeout(timer); };
  }, []);

  useEffect(function() {
    localStorage.setItem('ims_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Voice Engine
  const speakText = function(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (voiceStyle === 'soft') {
      utterance.voice = voices.find(function(v) { return v.name.includes('Samantha') || v.name.includes('Natural'); }) || voices[0];
      utterance.pitch = 1.1;
      utterance.rate = 0.85;
    } else if (voiceStyle === 'professional') {
      utterance.voice = voices.find(function(v) { return v.name.includes('Google') || v.name.includes('Daniel'); }) || voices[0];
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    } else if (voiceStyle === 'male') {
      utterance.voice = voices.find(function(v) { return v.name.includes('David') || v.name.includes('Male'); }) || voices[0];
      utterance.pitch = 0.7;
      utterance.rate = 0.95;
    } else {
      utterance.voice = voices.find(function(v) { return v.name.includes('Zira') || v.name.includes('Female'); }) || voices[0];
      utterance.pitch = 1.2;
      utterance.rate = 1.0;
    }
    window.speechSynthesis.speak(utterance);
  };

  // Microphone Listener
  const toggleMicrophone = function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone input not supported on this browser.");
      return;
    }
    if (isMicListening) {
      setIsMicListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = function() { setIsMicListening(true); };
    recognition.onresult = function(e) {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsMicListening(false);
    };
    recognition.onerror = function() { setIsMicListening(false); };
    recognition.onend = function() { setIsMicListening(false); };
    recognition.start();
  };

  // Camera Toggle
  const toggleCamera = async function() {
    if (isCamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(function(track) { track.stop(); });
      }
      setIsCamActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCamActive(true);
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

  // Chat Session Controls
  const handleNewChat = function() {
    const newId = Date.now();
    const newSession = { id: newId, title: "Chat " + (sessions.length + 1), messages: [] };
    setSessions(function(prev) { return [newSession, ...prev]; });
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  const handleDeleteChat = function(id, e) {
    e.stopPropagation();
    const filtered = sessions.filter(function(s) { return s.id !== id; });
    if (filtered.length === 0) {
      const fallback = { id: Date.now(), title: 'Chat 1', messages: [] };
      setSessions([fallback]);
      setCurrentSessionId(fallback.id);
    } else {
      setSessions(filtered);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
    }
  };

  const updateCurrentMessages = function(updater) {
    setSessions(function(prev) {
      return prev.map(function(s) {
        if (s.id === currentSessionId) {
          const updatedMsgs = typeof updater === 'function' ? updater(s.messages) : updater;
          return { ...s, messages: updatedMsgs };
        }
        return s;
      });
    });
  };

  // Send Logic
  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    updateCurrentMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        const prompt = encodeURIComponent(currentInput);
        const response = await fetch("https://text.pollinations.ai/" + prompt + "?model=openai&cache=false");

        let aiReply = "";
        if (response.ok) {
          aiReply = await response.text();
        } else {
          aiReply = "I am ready! How can I help you today?";
        }

        updateCurrentMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
        speakText(aiReply);
      } else {
        const enhancedPrompt = encodeURIComponent(currentInput + ", high quality, detailed, photorealistic, 8k resolution, clean artwork");
        const imageUrl = "https://image.pollinations.ai/prompt/" + enhancedPrompt + "?width=800&height=800&nologo=true";
        updateCurrentMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; });
      }
    } catch (error) {
      updateCurrentMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: "Unable to complete request. Please try again.", type: 'text' }]; });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={splashStyle}>
        <h1>IMS WORKSPACE</h1>
        <p>Loading INTERNET.AI Engine...</p>
      </div>
    );
  }

  if (!fmpUser) {
    return (
      <div style={loginStyle}>
        <h2>IMS WORKSPACE</h2>
        <p style={{ marginBottom: '15px' }}>Sign in to your FMP Account</p>
        <input 
          type="text" 
          placeholder="Enter FMP ID / Email..." 
          value={usernameInput}
          onChange={function(e) { setUsernameInput(e.target.value); }}
          style={inputFieldStyle}
        />
        <button onClick={function() { if (usernameInput.trim()) { localStorage.setItem('ims_fmp_user', usernameInput); setFmpUser(usernameInput); } }} style={buttonStyle}>Login</button>
      </div>
    );
  }

  return (
    <div className={'app-container ' + theme}>
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <strong>IMS INTERNET.AI</strong>
          <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '6px' }}>({fmpUser})</span>
        </div>
        <div className="top-controls">
          <button onClick={handleNewChat}>+ New Chat</button>
          <button onClick={function() { setShowHistory(!showHistory); }}>History</button>
          <button onClick={function() { setShowSettings(!showSettings); }}>Settings ⚙️</button>
          <button onClick={function() { localStorage.removeItem('ims_fmp_user'); setFmpUser(null); }}>Logout</button>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>⚙️ Settings</h3>
            <div className="setting-row">
              <label>Theme</label>
              <select value={theme} onChange={function(e) { setTheme(e.target.value); }}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="neon">Neon</option>
                <option value="sunset">Sunset</option>
              </select>
            </div>
            <div className="setting-row">
              <label>Voice Type</label>
              <select value={voiceStyle} onChange={function(e) { setVoiceStyle(e.target.value); }}>
                <option value="soft">Soft Voice</option>
                <option value="professional">Professional</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div className="setting-row">
              <label>User Mood</label>
              <select value={userMood} onChange={function(e) { setUserMood(e.target.value); }}>
                <option value="Focused">Focused</option>
                <option value="Happy">Happy</option>
                <option value="Tired">Tired</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>
            <button className="close-btn" onClick={function() { setShowSettings(false); }}>Close</button>
          </div>
        </div>
      )}

      {/* History Drawer Overlay */}
      {showHistory && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>💬 Chat Sessions</h3>
            <div className="history-list">
              {sessions.map(function(s) {
                return (
                  <div key={s.id} className={'history-item ' + (s.id === currentSessionId ? 'active' : '')} onClick={function() { setCurrentSessionId(s.id); setShowHistory(false); }}>
                    <span>{s.title}</span>
                    <button onClick={function(e) { handleDeleteChat(s.id, e); }}>🗑️</button>
                  </div>
                );
              })}
            </div>
            <button className="close-btn" onClick={function() { setShowHistory(false); }}>Close</button>
          </div>
        </div>
      )}

      {/* Live Video Camera Box */}
      {isCamActive && (
        <div className="video-preview-container">
          <video ref={videoRef} autoPlay playsInline muted className="video-preview"></video>
        </div>
      )}

      {/* Scrollable Chat Feed */}
      <div className="chat-box">
        {messages.map(function(msg) {
          return (
            <div key={msg.id} className={'message ' + msg.sender}>
              {msg.type === 'image' ? (
                <img src={msg.imageUrl} alt={msg.text} />
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Output Mode Controls */}
      <div className="controls">
        <button onClick={function() { setMode('text'); }} className={mode === 'text' ? 'active' : ''}>Chat Mode</button>
        <button onClick={function() { setMode('image'); }} className={mode === 'image' ? 'active' : ''}>🎨 Enhanced Image Mode</button>
      </div>

      {/* Interactive Microphone & Camera Controls */}
      <div className="live-media-bar">
        <button onClick={toggleMicrophone} className={isMicListening ? 'active-media' : ''}>
          {isMicListening ? '🎙️ Listening...' : '🎤 Mic Input'}
        </button>
        <button onClick={toggleCamera} className={isCamActive ? 'active-media' : ''}>
          {isCamActive ? '📹 Stop Camera' : '📷 Live Cam'}
        </button>
      </div>

      {/* Input Bar */}
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') handleSend(); }}
          placeholder="Talk with INTERNET AI..."
        />
        <button onClick={handleSend} disabled={isGenerating}>Send</button>
      </div>
    </div>
  );
}

const splashStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' };
const loginStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' };
const inputFieldStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '12px', width: '80%', maxWidth: '280px', backgroundColor: '#1e293b', color: '#fff' };
const buttonStyle = { padding: '10px 20px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 'bold' };

export default App;
