import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, MapPin } from 'lucide-react';

// --- HELPER COMPONENT FOR CLEAN LINKS ---
const MessageContent = ({ text, role }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const url = text.match(urlRegex)?.[0];
  const cleanText = text.replace(urlRegex, '').trim();

  return (
    <div className="flex flex-col gap-2">
      <p className="leading-relaxed whitespace-pre-wrap">{cleanText}</p>
      
      {/* Only show the button if there's a URL and the AI sent it */}
      {url && role === 'ai' && (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl transition-all font-bold shadow-sm active:scale-95"
        >
          <MapPin size={16} />
          Start Navigation
        </a>
      )}
    </div>
  );
};

const AICopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [goal, setGoal] = useState(null);
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      text: "Hey! I'm your DriveIntel Safety Assistant. How can I help you stay safe today?" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/goals');
        const data = await response.json();
        setGoal(data.daily_target || 50000); 
      } catch (error) {
        setGoal(50000);
      }
    };
    fetchGoalData();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to my brain! 🧠" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen && (
        <div className="mb-4 w-80 h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold tracking-wide">DriveIntel Safety Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-500 p-1 rounded transition">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 text-sm">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-2xl shadow-sm ${
                  m.role === 'ai' 
                    ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
                    : 'bg-blue-600 text-white ml-auto rounded-tr-none'
                } max-w-[90%] break-words`}
              >
                {/* USE THE NEW HELPER HERE */}
                <MessageContent text={m.text} role={m.role} />
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-xs italic ml-1">
                <Loader2 className="animate-spin" size={14} />
                Co-pilot is calculating...
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ask about goals, breaks, or surge zones..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default AICopilot;