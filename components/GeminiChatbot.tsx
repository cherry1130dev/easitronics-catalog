'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  RefreshCcw, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  AlertCircle,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  '💡 Suggest IoT projects for ECE',
  '💰 Projects under ₹15,000',
  '🤖 Robotics & Embedded top picks',
  '📦 What is included in a hardware kit?',
  '⚡ Help me choose a final year project',
];

export default function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Hi! I'm Easi (Powered by Gemini AI).**
Ask me for verified engineering projects by branch, domain, or budget!
*(All costs are estimations only, not fixed).*

Support: [Charan (+91 7989604815)](https://wa.me/917989604815) | [Mouli (+91 7731943179)](https://wa.me/917731943179)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved API key from localStorage if any
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('easitronics_gemini_api_key');
      if (savedKey) setUserApiKey(savedKey);
    } catch (_) {}
  }, []);

  // Listen for open event from Navbar
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-gemini-chat', handleOpenEvent);
    return () => window.removeEventListener('open-gemini-chat', handleOpenEvent);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem('easitronics_gemini_api_key', key.trim());
      } else {
        localStorage.removeItem('easitronics_gemini_api_key');
      }
    } catch (_) {}
    setShowSettings(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userApiKey: userApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          source: data.source,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'No response from assistant');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I ran into an issue: ${err.message || 'Unable to connect'}. You can also chat directly with our developers & support team on WhatsApp: **Charan (+91 7989604815)** or **Mouli (+91 7731943179)**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Conversation reset. How can I assist you with engineering projects today? *(Note: All catalog project costs are estimations only and not fixed).*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Inline Markdown Formatter (handles bold, links, italics)
  const renderInlineText = (text: string) => {
    // Regex matching markdown links [text](url), bold **bold**, or italic *italic*
    const tokens = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*[^*]+?\*)/g);

    return tokens.map((part, i) => {
      if (!part) return null;

      // Link match: [Text](URL)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        const isInternal = url.startsWith('/');
        if (isInternal) {
          return (
            <Link
              key={i}
              href={url}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline decoration-amber-400/60 hover:decoration-amber-300 transition-colors mx-0.5"
            >
              <span>{label}</span>
              <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/60 hover:decoration-emerald-400 transition-colors mx-0.5"
          >
            <span>{label}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      }

      // Bold match: **text**
      const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={i} className="font-bold text-white">
            {boldMatch[1]}
          </strong>
        );
      }

      // Italic match: *text*
      const italicMatch = part.match(/^\*(.*?)\*$/);
      if (italicMatch) {
        return (
          <em key={i} className="italic text-slate-400">
            {italicMatch[1]}
          </em>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  // Line-by-line Markdown Formatter for chat bubbles
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Empty line spacer
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      // Heading 3: ### Heading
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-amber-300 text-xs mt-1.5 mb-0.5">
            {renderInlineText(line.replace(/^###\s*/, ''))}
          </h4>
        );
      }

      // Blockquote: > Quote
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="p-2 my-1 rounded-lg bg-slate-950/80 border-l-2 border-amber-400 text-[11px] text-amber-200/90 leading-relaxed">
            {renderInlineText(line.replace(/^>\s*/, ''))}
          </div>
        );
      }

      // Bullet points: • or - or *
      if (line.startsWith('• ') || line.startsWith('- ') || (line.startsWith('* ') && !line.startsWith('**'))) {
        const content = line.replace(/^[•\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 text-xs text-slate-200 leading-relaxed">
            <span className="text-amber-400 font-bold shrink-0 mt-0.5 text-[10px]">•</span>
            <div className="flex-1">{renderInlineText(content)}</div>
          </div>
        );
      }

      // Regular line
      return (
        <p key={idx} className="text-xs my-0.5 text-slate-200 leading-relaxed">
          {renderInlineText(line)}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          title="Ask Easi - AI Project Advisor (Powered by Gemini AI)"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-teal-600 animate-ping" />
          </div>
          <div className="text-left leading-tight">
            <span className="font-black text-xs sm:text-sm tracking-tight block text-slate-950">Ask Easi</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-900 block opacity-85 hidden xs:inline">Gemini AI</span>
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[420px] h-[85vh] sm:h-[580px] max-h-[92vh] bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Easi</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Easi • Powered by Gemini AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Reset Chat */}
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>

              {/* API Key Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Gemini API Key configuration"
                className={`p-1.5 rounded-lg transition-colors ${
                  showSettings ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Key Drawer (Optional Configuration) */}
          {showSettings && (
            <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Google Gemini API Key</span>
                </span>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                <strong>Easi</strong> is powered by Google Gemini AI. You can connect your personal Gemini API key or use the built-in Easitronics project catalog engine.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleSaveApiKey(userApiKey)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Cost Disclaimer Bar */}
          <div className="px-3 py-1 bg-amber-950/40 border-b border-amber-900/40 text-[10px] text-amber-300 font-medium flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>*Project costs are <strong>estimations only</strong> (not fixed).</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Easi AI</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-400 text-slate-950 font-semibold rounded-br-none shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  <div className={`text-[9px] mt-1.5 flex items-center justify-between opacity-70 ${
                    msg.role === 'user' ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {msg.source && (
                      <span className="font-mono text-[8px] bg-slate-950/60 px-1.5 py-0.2 rounded border border-slate-800">
                        {msg.source}
                      </span>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-900/50 rounded-xl w-fit border border-slate-800">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Easi is consulting Gemini AI & catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug.replace(/^[^a-zA-Z0-9]+/, '').trim())}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about project titles, ECE, IoT, kits..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all disabled:opacity-40"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
