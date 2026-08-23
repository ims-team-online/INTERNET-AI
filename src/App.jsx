      if (mode === 'text') {
        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6LALyoJ7gSAvCj1aH2j-rc97ZpJ3UdcZj8IC038Sc2suA',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: userMsg.text }] }] })
          }
        );

        const data = await response.json();

        let aiReply = "System Error: Unable to fetch response.";
        if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          aiReply = data.candidates[0].content.parts[0].text;
        } else if (data && data.error) {
          aiReply = "API Error: " + data.error.message;
        }

        setMessages(function(prev) { return [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply, type: 'text' }]; });
      }
