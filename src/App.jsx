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
  
  const [fmpUser, setFmpUser] = useState(function() {
    return localStorage.getItem('ims_fmp_user') || null;
  });
  const [usernameInput, setUsernameInput] = useState('');

  const [messages, setMessages] = useState(function() {
    const saved = localStorage.getItem('ims_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(function() {
    const timer = setTimeout(function() { setLoading(false); }, 2000);
    return function() { clearTimeout(timer); };
  }, []);

  useEffect(function() {
    localStorage.setItem('ims_chat_history', JSON.stringify(messages));
  }, [messages]);

  const speakText = function(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (voiceGender === 'male') {
      utterance.voice = voices.find(function(v) { return v.name.includes('Male') || v.name.includes('David'); }) || voices[0];
      utterance.pitch = 0.6;
    } else {
      utterance.voice = voices.find(function(v) { return v.name.includes('Female') || v.name.includes('Zira'); }) || voices[0];
      utterance.pitch = 1.2;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleFmpLogin = function() {
    if (!usernameInput.trim()) return;
    localStorage.setItem('ims_fmp_user', usernameInput);
    setFmpUser(usernameInput);
  };

  const handleFmpLogout = function() {
    localStorage.removeItem('ims_fmp_user');
    setFmpUser(null);
  };

  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    setMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        const promptText = "You are INTERNET.AI by IMS WORKSPACE created by Ijot Gunjan Jha. User: " + (fmpUser || "Guest") + ". Mood: " + userMood + ".\n\nUser Question: " + currentInput;

        // Fallback working open mirror endpoint
        const response = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: promptText }]
          })
        });

        let aiReply = "";
        if (response.ok) {
          aiReply = await response.text();
        } else {
          // If public API fails, provide clear feedback
          aiReply = "Service temporarily busy. Please check your network connection and try again.";
        }

        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
        speakText(aiReply);
      } else {
        const imageUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(currentInput) + '?width=800&height=800&nologo=true';
        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; });
      }
    } catch (error) {
      setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: "Connection error. Please try sending again.", type: 'text' }]; });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={splashStyle}>
        <h1>IMS WORKSPACE</h1>
        <p>Welcome to INTERNET.AI</p>
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
        <button onClick={handleFmpLogin} style={buttonStyle}>Login to FMP</button>
      </div>
    );
  }

  return (
    <div className={'app-container ' + theme}>
      <div className="top-bar">
        <div>
          <strong>IMS INTERNET.AI</strong>
          <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '6px' }}>({fmpUser})</span>
        </div>
        <div className="top-controls">
          <select value={theme} onChange={function(e) { setTheme(e.target.value); }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <select value={userMood} onChange={function(e) { setUserMood(e.target.value); }}>
            <option value="Happy">Happy</option>
            <option value="Focused">Focused</option>
            <option value="Tired">Tired</option>
            <option value="Neutral">Neutral</option>
          </select>
          <select value={voiceGender} onChange={function(e) { setVoiceGender(e.target.value); }}>
            <option value="female">Voice: Female</option>
            <option value="male">Voice: Male</option>
          </select>
          <button onClick={handleFmpLogout}>Logout</button>
        </div>
      </div>

      <div className="chat-box">
        {messages.map(function(msg) {
          return (
            <div key={msg.id} className={'message ' + msg.sender}>
              {msg.type === 'image' ? (
                <img src={msg.imageUrl} alt={msg.text} style={{ maxWidth: '100%', borderRadius: '8px' }} />
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
        <button onClick={function() { setMessages([]); localStorage.removeItem('ims_chat_history'); }}>Clear</button>
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

const splashStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' };
const loginStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' };
const inputFieldStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '12px', width: '80%', maxWidth: '280px', backgroundColor: '#1e293b', color: '#fff' };
const buttonStyle = { padding: '10px 20px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 'bold' };

export default App;
