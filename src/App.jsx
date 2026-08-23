  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    setMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        // Direct Gemini API URL
        const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6LALyoJ7gSAvCj1aH2j-rc97ZpJ3UdcZj8IC038Sc2suA';
        
        // Wrapped in CORS proxy to prevent browser blocks
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMsg.text }] }]
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
      } else {
        const imageUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(currentInput) + '?width=800&height=800&nologo=true';
        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; });
      }
    } catch (error) {
      console.error(error);
      setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: "Network/CORS Error: Request blocked by browser.", type: 'text' }]; });
    } finally {
      setIsGenerating(false);
    }
  };
