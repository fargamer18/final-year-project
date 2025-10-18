'use client';
import { useState } from 'react';

export default function ChatUI() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = { role: 'user', text: input };
    setMessages([...messages, newMessage]);
    setInput('');
    // Fake bot response (for now)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: 'This is a placeholder reply 💬' }]);
    }, 500);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl h-[80vh] bg-[#1e1e1e] rounded-2xl shadow-lg p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 self-end text-right' : 'bg-gray-700 text-left'}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="flex-1 bg-gray-800 p-2 rounded-xl text-white focus:outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-xl"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
