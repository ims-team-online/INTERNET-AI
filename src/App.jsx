import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [userMood, setUserMood] = useState('Focused');
  const [voiceGender, setVoiceGender] = useState('female');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // FMP Account State
  const [fmpUser, setFmpUser] = useState(function() {
    return localStorage.getItem('ims_fmp_user') || null;
  });
  const [usernameInput, setUsernameInput] = useState('');

  // Persistent Chat History
  const [messages, setMessages] = useState(function() {
    const saved = localStorage.getItem('ims_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Splash Screen Timer
  useEffect(function() {
    const timer = setTimeout(function() {
      setLoading(false);
    }, 2500);
    return function() { clearTimeout(timer); };
  }, []);

  // Save Chat History
  useEffect(function() {
    localStorage.setItem('ims_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Text-To-Speech (TTS) Voice Engine
  const speakText = function(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (voiceGender === 'male') {
      utterance.voice = voices.find(function(v) { return v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK English Male'); }) || voices[0];
      utterance.pitch = 0.6; // Deep male voice pitch
    } else {
      utterance.voice = voices.find(function(v) { return v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google UK English Female'); }) || voices[0];
      utterance.pitch = 1.2; // Female voice pitch
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // FMP Login Handler
  const handleFmpLogin = function() {
    if (!usernameInput.trim()) return;
    localStorage.setItem('ims_fmp_user', usernameInput);
    setFmpUser(usernameInput);
  };

  const handleFmpLogout = function() {
    localStorage.removeItem('ims_fmp_user');
    setFmpUser(null);
  };

  // Send Message Routine
  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    setMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        const apiKey = 'AQ.Ab8RN6LALyoJ7gSAvCj1aH2j-rc97ZpJ3UdcZj8IC038Sc2suA';
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

        const systemPrompt = "You are INTERNET.AI by IMS WORKSPACE created by Ijot Gunjan Jha. The logged-in FMP User is: " + (fmpUser || "Guest") + ". The user's current mood is: " + userMood + ". Keep answers clear and tailored to their mood.";

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Question: " + userMsg.text }] }]
          })
        });

        const data = await response.json();
        let aiReply = "System Error: Unable to fetch response.";
        
        if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          aiReply = data.candidates[0].content.parts[0].text;
        } else if (data && data.error) {
          aiReply = "API Error: " + data.error.message;
        }

        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
        speakText(aiReply);
      } else {
        const imageUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(currentInput) + '?width=800&height=800&nologo=true';
        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; });
      }
    } catch (error) {
      setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: "Error: " + error.message, type: 'text' }]; });
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. IMS Startup Splash Screen
  if (loading) {
    return (
      <div style={splashStyle}>
        <h1>IMS WORKSPACE</h1>
        <p>Welcome to INTERNET.AI</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Developed by Ijot Gunjan Jha</p>
      </div>
    );
  }

  // 2. FMP ID Login Portal Screen
  if (!fmpUser) {
    return (
      <div style={loginStyle}>
        <h2>IMS WORKSPACE</h2>
        <p>Sign in to your FMP Account</p>
        <input 
          type="text" 
          placeholder="Enter FMP Username..." 
          value={usernameInput}
          onChange={function(e) { setUsernameInput(e.target.value); }}
          style={inputFieldStyle}
        />
        <button onClick={handleFmpLogin} style={buttonStyle}>Login to FMP</button>
      </div>
    );
  }

  // 3. Main INTERNET.AI Workspace UI
  return (
    <div className={'app-container ' + theme}>
      <div className="top-bar" style={topBarStyle}>
        <div>
          <strong>IMS INTERNET.AI</strong>
          <span style={{ fontSize: '11px', marginLeft: '8px' }}>(FMP: {fmpUser})</span>
        </div>
        <div>
          <select value={theme} onChange={function(e) { setTheme(e.target.value); }}>
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
          <select value={userMood} onChange={function(e) { setUserMood(e.target.value); }}>
            <option value="Happy">Mood: Happy</option>
            <option value="Focused">Mood: Focused</option>
            <option value="Tired">Mood: Tired</option>
            <option value="Neutral">Mood: Neutral</option>
          </select>
          <select value={voiceGender} onChange={function(e) { setVoiceGender(e.target.value); }}>
            <option value="female">Voice: Female</option>
            <option value="male">Voice: Deep Male</option>
          </select>
          <button onClick={handleFmpLogout} style={{ marginLeft: '5px' }}>Logout</button>
        </div>
      </div>

      <div className="chat-box">
        {messages.map(function(msg) {
          return (
            <div key={msg.id} className={'message ' + msg.sender}>
              {msg.type === 'image' ? (
                <img src={msg.imageUrl} alt={msg.text} className="generated-img" />
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="controls">
        <button onClick={function() { setMode('text'); }} className={mode === 'text' ? 'active' : ''}>Chat</button>
        <button onClick={function() { setMode('image'); }} className={mode === 'image' ? 'active' : ''}>Image Mode</button>
        <button onClick={function() { setMessages([]); localStorage.removeItem('ims_chat_history'); }}>Clear History</button>
      </div>

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

// Inline Styles for Splash & FMP Auth
const splashStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center' };
const loginStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1e293b', color: '#fff' };
const inputFieldStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '10px', width: '220px' };
const buttonStyle = { padding: '10px 20px', borderRadius: '5px', backgroundColor: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' };
const topBarStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', color: '#fff' };

export default App;
