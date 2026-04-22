import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import axios from 'axios';

const AIChatbot = ({ cycleData }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Build personalised greeting using user name
  const getGreeting = () => {
    const name = user?.name?.split(' ')?.[0] || '';
    const base = t('chat.greeting');
    if (name && !base.includes(name)) {
      // Prepend name to greeting
      return `Hi ${name}! 👋 ${base}`;
    }
    return base;
  };

  // Initialize with greeting
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: getGreeting(),
      timestamp: new Date()
    }]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Helper: friendly fallback messages that never feel like an error
    const getFriendlyFallback = (msg) => {
      const name = user?.name?.split(' ')?.[0] || 'friend';
      const lower = msg.toLowerCase().trim();
      // Greeting
      if (['hi','hello','hey','hii','helo','hai','helo','hiya','sup','namaste','namaskar'].some(g => lower === g || lower.startsWith(g + ' '))) {
        return `Hello ${name}! 😊 It's so good to hear from you! How are you feeling today? I'm here for all your health questions — periods, nutrition, PCOS, sleep, you name it. What would you like to talk about?`;
      }
      // How are you
      if (lower.includes('how are you') || lower.includes('how r you') || lower.includes('hws u')) {
        return `I'm doing great, ${name}! 🌸 Always ready to help you feel your best. What's on your mind today?`;
      }
      // Thank you
      if (lower.startsWith('thank') || lower === 'ty' || lower === 'thx') {
        return `You're so welcome, ${name}! 🌷 Anytime you have a question — big or small — I'm right here for you.`;
      }
      // Default warm fallback
      return `Hey ${name}! 😊 I'm here with you — I just need a moment to gather my thoughts. Could you ask that again? I'd love to help you!`;
    };

    const sendWithRetry = async (attempt = 0) => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post('/api/chat', {
          message: userMessage.content,
          language,
          cycleData: cycleData || null
        }, config);
        return data.reply;
      } catch (err) {
        // Retry once after 800ms for transient failures
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 800));
          return sendWithRetry(1);
        }
        // After retry, return a warm persona-consistent message — NEVER a cold error
        return getFriendlyFallback(userMessage.content);
      }
    };

    try {
      const reply = await sendWithRetry();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick suggestion chips
  const suggestions = [
    'What should I eat during my period?',
    'Tell me about my current phase',
    'How can I improve my sleep?',
    'What is BMI?',
  ];

  return (
    <>
      {/* Floating Action Button — pill with icon + name */}
      <button
        className={`chat-fab ${isOpen ? 'chat-fab-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        id="chat-fab-btn"
        title="Chat with Swastha Saheli"
      >
        <Sparkles size={20} />
        <span>Swastha Saheli</span>
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel-open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="chat-title">{t('chat.title')}</h3>
              <p className="chat-subtitle-text">{t('chat.subtitle')}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'} ${msg.isError ? 'chat-msg-error' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="chat-msg-avatar">
                  <Sparkles size={14} />
                </div>
              )}
              <div className="chat-msg-bubble">
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg chat-msg-bot">
              <div className="chat-msg-avatar">
                <Sparkles size={14} />
              </div>
              <div className="chat-msg-bubble chat-typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions (show only when no conversaton yet) */}
        {messages.length <= 1 && !loading && (
          <div className="chat-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="chat-suggestion-chip"
                onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="chat-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default AIChatbot;
