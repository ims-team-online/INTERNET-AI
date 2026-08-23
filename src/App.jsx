import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6JHw-kg5p7LgU8TaOdJd9s46hTT4zIe0flYJYH4IPPuqw");
export default function App() {
  // --- States ---
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState('dark'); // 'dark', 'light', 'custom'
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState('text'); // 'text', 'image'
  
  const chatEndRef = useRef(null);

  // --- Splash Screen Timer ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // --- Handle Send Message ---
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: mode };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6IepkqU96nQY1_TmNe3nZZ66quAHT7v9llmfpAeZVtwGQ`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: userMsg.text }] }] })
          }
        );
        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "System Error: Unable to fetch response.";

        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: aiReply, type: 'text' }]);
      } else {
        // Image generation simulation (Pollinations API endpoint)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(userMsg.text)}?width=800&height=800&nologo=true`;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: userMsg.text, imageUrl, type: 'image' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Error connecting to INTERNET AI core.', type: 'text' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Save Chat Logic ---
  const saveCurrentChat = () => {
    if (messages.length === 0) return;
    const existingIndex = savedChats.findIndex(c => c.id === currentChatId);
    const title = messages[0]?.text.slice(0, 20) + '...';
    if (existingIndex > -1) {
      const updated = [...savedChats];
      updated[existingIndex] = { id: currentChatId, title, messages };
      setSavedChats(updated);
    } else {
      setSavedChats([...savedChats, { id: currentChatId, title, messages }]);
    }
  };

  const startNewChat = () => {
    saveCurrentChat();
    setCurrentChatId(Date.now());
    setMessages([]);
    setIsDrawerOpen(false);
  };

  const loadChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setIsDrawerOpen(false);
  };

  // --- 1. SPLASH SCREEN ---
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="logo-box">
            <h1 className="logo-ims">IMS</h1>
            <div className="logo-bar">UNBOXING HAPPINESS</div>
          </div>
          <h2 className="welcome-text">WELCOME</h2>
          <p className="workspace-sub">IMS WORKSPACE</p>
        </div>
      </div>
    );
  }

  // --- 2. MAIN WEB APP ---
  return (
    <div className={`app-container theme-${theme}`}>
      {/* Top Header */}
      <header className="app-header">
        <button className="btn-saved-chats" onClick={() => setIsDrawerOpen(true)}>
          ≡ Saved Chats
        </button>
        <h1 className="app-title">INTERNET AI</h1>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="theme-select">
          <option value="dark">Dark Theme</option>
          <option value="light">Light Theme</option>
          <option value="custom">Custom Neon</option>
        </select>
      </header>

      {/* Drawer: Saved Chats */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Saved Chats</h3>
              <button onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>
            <button className="btn-new-chat" onClick={startNewChat}>+ New Chat</button>
            <div className="chat-list">
              {savedChats.length === 0 ? (
                <p className="no-chats">No saved chats yet.</p>
              ) : (
                savedChats.map(c => (
                  <div key={c.id} className="chat-item" onClick={() => loadChat(c)}>
                    💬 {c.title}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>INTERNET AI Engine Ready</h2>
            <p>Type a prompt below to generate responses or images.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender === 'ai' ? 'rainbow-active' : ''}`}>
              {msg.type === 'image' && msg.imageUrl ? (
                <div className="image-result">
                  <p><strong>Prompt:</strong> {msg.text}</p>
                  <img src={msg.imageUrl} alt="AI Generated" className="generated-img" />
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {/* Live Rainbow Generating State */}
        {isGenerating && (
          <div className="message-row ai">
            <div className="message-bubble rainbow-active loading-box">
              <div className="rainbow-flow"></div>
              <span>INTERNET AI is generating...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Footer */}
      <footer className="input-footer">
        <div className="mode-toggle">
          <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Chat</button>
          <button className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>Image</button>
        </div>
        <div className="input-bar">
          <input
            type="text"
            placeholder={mode === 'text' ? "Talk with INTERNET AI..." : "Describe the image you want..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-send" onClick={handleSend} disabled={isGenerating}>
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
