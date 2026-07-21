import React from 'react';
import { Send } from 'lucide-react';

export default function ChatPanel({ messages = [], onSend, currentUser }) {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="enterprise-card overflow-hidden flex flex-col h-96 enterprise-fade-in">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Live Chat</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col min-h-0 bg-white">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <h5 className="font-bold text-slate-800 text-xs mb-1">Start a conversation</h5>
            <p className="text-[11px] text-slate-400 max-w-[220px] font-medium">
              Coordinate arrival times, landmarks, or job details here.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isSelf = m.senderRole === 'customer' || m.senderId === currentUser?.id;
            return (
              <div key={m.id || i} className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                  isSelf
                    ? 'bg-sky-400 text-[#0F172A] rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}>
                  {m.text}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                  <span>{m.senderName?.split(' ')[0]}</span>
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
        <input type="text" placeholder="Type a message..."
          value={input} onChange={(e) => setInput(e.target.value)}
          className="flex-1 enterprise-input !py-2.5" />
        <button type="submit"
          className="enterprise-btn-primary !py-2.5 !px-4">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
