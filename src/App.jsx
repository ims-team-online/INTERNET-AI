import React, { useState } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('text');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    setMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
      if (mode === 'text') {
        const response = await fetch(
          'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6LALyoJ7gSAvCj1aH2j-rc97ZpJ3UdcZj8IC038Sc2suA'),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: userMsg.text }] }] })
          }
        );

        const data = await response.json();
        
        let aiReply = "System Error: Unable to fetch response.";
        if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          aiReply = data.candidates[0].content.parts[0].text;
        } else if (data && data.error) {
          aiReply = "Error: " + data.error.message;
        }

        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
      }
        }

        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
      } else {
        const imageUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(currentInput) + '?width=800&height=800&nologo=true';
        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; });
      }
    } catch (error) {
      console.error(error);
      setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: "System Error: Unable to fetch response.", type: 'text' }]; });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
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
        <button onClick={function() { setMode('image'); }} className={mode === 'image' ? 'active' : ''}>Image</button>
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

export default App;
