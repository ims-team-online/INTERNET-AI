  // 100% Free Public AI Call (GET Request Fix)
  const handleSend = async function() {
    if (!input.trim() || isGenerating) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input, type: 'text' };
    updateCurrentMessages(function(prev) { return [...prev, userMsg]; });
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      if (mode === 'text') {
        const encodedPrompt = encodeURIComponent(currentInput);
        const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai`);

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const aiReply = await res.text();

        updateCurrentMessages(function(prev) { 
          return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; 
        });
        speakText(aiReply);
      } else {
        const enhancedPrompt = encodeURIComponent(currentInput + ", high quality digital render");
        const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=800&height=800&nologo=true`;
        updateCurrentMessages(function(prev) { 
          return [...prev, { id: Date.now() + 1, sender: 'ai', text: currentInput, imageUrl: imageUrl, type: 'image' }]; 
        });
      }
    } catch (err) {
      updateCurrentMessages(function(prev) { 
        return [...prev, { id: Date.now() + 1, sender: 'ai', text: `⚠️ ${err.message}`, type: 'text' }]; 
      });
    } finally {
      setIsGenerating(false);
    }
  };
