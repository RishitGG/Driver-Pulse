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
        <div className="mb-4 w-[340px] h-[480px] bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-950/80 p-5 border-b border-white/10 flex justify-between items-center shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />
            <div className="flex items-center gap-3 relative">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
              <div>
                <h3 className="font-bold text-[14px] text-white tracking-wide leading-tight">Safety Copilot</h3>
                <p className="text-[11px] text-indigo-300 font-medium">Online & analyzing</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-slate-400 hover:text-white p-1.5 rounded-xl transition-colors relative z-10">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-gradient-to-b from-slate-900/40 to-slate-900/20 text-[14px]">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-2xl shadow-sm border ${
                  m.role === 'ai' 
                    ? 'bg-slate-800/80 text-slate-200 border-white/5 rounded-tl-sm shadow-md' 
                    : 'bg-indigo-600 text-white border-indigo-500 ml-auto rounded-tr-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                } max-w-[90%] break-words`}
              >
                {/* USE THE NEW HELPER HERE */}
                <MessageContent text={m.text} role={m.role} />
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium ml-1">
                <Loader2 className="animate-spin" size={14} />
                Copilot is typing...
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-slate-950/80 flex gap-3 relative">
            <input 
              className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500 shadow-inner"
              placeholder="Ask about goals, breaks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white w-[46px] flex items-center justify-center rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20 z-50 group"
      >
        {isOpen ? <X size={26} className="group-hover:rotate-90 transition-transform" /> : <MessageCircle size={26} className="group-hover:animate-pulse" />}
      </button>
    </div>
  );
};

export default AICopilot;