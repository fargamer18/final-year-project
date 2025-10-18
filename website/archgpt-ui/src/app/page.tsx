"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { id: number; title: string; messages: { role: string; content: string }[] }[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const botMessage = {
      role: "bot",
      content: "Hello! I’m ArchGPT. (Your backend will go here later.)",
    };

    setMessages([...messages, userMessage, botMessage]);
    setInput("");
    setStarted(true);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0]?.content.slice(0, 25) || "New Chat";
      setChatHistory([
        { id: Date.now(), title, messages: messages },
        ...chatHistory,
      ]);
    }
    setMessages([]);
    setInput("");
    setStarted(false);
  };

  return (
    <AnimatePresence mode="wait">
      
      {!started ? (
        // --- LANDING SCREEN ---
        <motion.main
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] text-gray-100"
        >
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-5xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            ArchGPT
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full max-w-2xl px-4"
          >
            <div className="relative">
              
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full rounded-full border border-purple-400/60 bg-[#161616] px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 placeholder-gray-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
              />
              <button
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-600 p-3 transition duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12h15m0 0l-6-6m6 6l-6 6"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.main>
      ) : (
        // --- CHAT SCREEN ---
        <motion.main
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex h-screen bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] text-gray-100"
        >
          {/* Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: -250, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -250, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-64 bg-[#111111] border-r border-gray-800 flex flex-col p-4"
              >
                <div className="flex-1 overflow-y-auto space-y-2">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">
                      No previous chats
                    </p>
                  ) : (
                    chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        className="w-full text-left text-gray-300 hover:bg-gray-800 p-3 rounded-lg text-sm transition"
                        onClick={() => {
                          setMessages(chat.messages);
                          setStarted(true);
                        }}
                      >
                        {chat.title}
                      </button>
                    ))
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="py-4 px-6 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-800 transition"
                >
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  ArchGPT
                </h1>
              </div>

              <button
                onClick={handleNewChat}
                className="text-sm text-purple-400 hover:text-purple-300 border border-purple-500/40 hover:border-purple-400 rounded-full px-4 py-2 transition duration-200"
              >
                + New Chat
              </button>
            </header>

            {/* Chat Window */}
            <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white rounded-br-none"
                        : "bg-gray-800 text-gray-100 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </section>

            {/* Input Bar */}
            <footer className="border-t border-gray-800 p-4">
              <div className="max-w-3xl mx-auto flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Ask ArchGPT..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-[#161616] text-gray-200 rounded-full px-5 py-3 text-sm border border-purple-500/30 focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
                />
                <button
                  onClick={handleSend}
                  className="bg-purple-500 hover:bg-purple-600 p-3 rounded-full transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12h15m0 0l-6-6m6 6l-6 6"
                    />
                  </svg>
                </button>
              </div>
            </footer>
          </div>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
