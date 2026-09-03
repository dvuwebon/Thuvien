import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, Settings, Trash2, Key, Check, BookOpen, HelpCircle } from 'lucide-react';
import { askLibraryAI } from '../services/aiService';
import { getActiveApiKey, setActiveApiKey } from '../config/aiConfig';

const QUICK_PROMPTS = [
  '📚 Gợi ý sách phát triển bản thân hot nhất?',
  '⏱️ Thời hạn mượn sách tối đa là bao lâu?',
  '🔄 Hướng dẫn cách trả sách trên cổng độc giả?',
  '💻 Thư viện có sách lập trình & AI nào hay?'
];

export default function AIChatWidget({ books = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào bạn đọc! Tôi là **Trợ lý AI Thư viện SmartLib** 🤖.\n\nTôi có thể hỗ trợ bạn tra cứu sách, gợi ý sách theo sở thích, hướng dẫn quy trình mượn - trả và giải đáp mọi thắc mắc học tập. Bạn cần tôi hỗ trợ gì hôm nay?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySavedMsg, setApiKeySavedMsg] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Focus input khi mở chat
  useEffect(() => {
    if (isOpen && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showSettings]);

  // Nạp API key hiện có khi mở cài đặt
  useEffect(() => {
    if (showSettings) {
      setApiKeyInput(getActiveApiKey());
    }
  }, [showSettings]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputMessage;
    if (!textToSend.trim() || isThinking) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      // Gọi AI service (được cấu hình đúng 5 giây chờ kèm hoạt họa 3 dấu chấm nhịp nhàng)
      const reply = await askLibraryAI(userMsg.text, books);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Rất tiếc, đã có sự cố kết nối trong giây lát. Bạn vui lòng thử lại nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setActiveApiKey(apiKeyInput);
    setApiKeySavedMsg(true);
    setTimeout(() => {
      setApiKeySavedMsg(false);
      setShowSettings(false);
    }, 1200);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: 'Đoạn trò chuyện đã được làm mới! Bạn muốn hỏi gì tiếp theo?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      <style>{`
        @keyframes aiPulseGlow {
          0%, 100% {
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 12px 32px rgba(79, 70, 229, 0.6), 0 0 0 10px rgba(99, 102, 241, 0);
          }
        }

        @keyframes aiDotBounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .ai-dot-1 {
          animation: aiDotBounce 1.2s infinite ease-in-out;
          animation-delay: 0s;
        }
        .ai-dot-2 {
          animation: aiDotBounce 1.2s infinite ease-in-out;
          animation-delay: 0.2s;
        }
        .ai-dot-3 {
          animation: aiDotBounce 1.2s infinite ease-in-out;
          animation-delay: 0.4s;
        }

        .ai-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .ai-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .ai-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .ai-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* 1. Nút nổi (Floating Button) ở góc dưới bên phải */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {/* Tooltip gợi ý thân thiện */}
          <div
            onClick={() => setIsOpen(true)}
            style={{
              background: '#ffffff',
              color: '#1e293b',
              padding: '7px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.2s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Sparkles size={14} color="#6366f1" />
            <span>Hỏi đáp AI Thư viện 🤖</span>
          </div>

          {/* Nút bấm tròn phát sáng nổi bật */}
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              animation: 'aiPulseGlow 2.8s infinite',
              transition: 'transform 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            title="Mở Trợ lý AI Thư viện"
          >
            <Bot size={28} />
            {/* Chấm xanh trạng thái Online */}
            <span
              style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #ffffff'
              }}
            />
          </button>
        </div>
      )}

      {/* 2. Khung chat AI toàn diện (Chat Modal Window) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22), 0 8px 18px rgba(15, 23, 42, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            fontFamily: 'inherit'
          }}
        >
          {/* Header của Khung Chat */}
          <div
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  position: 'relative'
                }}
              >
                <Bot size={22} color="#ffffff" />
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '1.5px solid #ffffff'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Trợ Lý AI Thư Viện</span>
                  <Sparkles size={14} color="#fde047" />
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                  <span>Tự động phản hồi sau 5s</span>
                </div>
              </div>
            </div>

            {/* Các nút công cụ trên Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: showSettings ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Cài đặt API Key AI"
              >
                <Settings size={16} />
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Làm mới đoạn chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Đóng khung chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Panel Cài đặt API Key khi nhấn bánh răng */}
          {showSettings && (
            <div
              style={{
                padding: '16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                <Key size={16} color="#4f46e5" />
                <span>Cài Đặt API Key AI</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Dán <strong>Google Gemini API Key</strong> hoặc <strong>OpenAI Key</strong> của bạn vào đây (hoặc cấu hình tại tệp <code>frontend/src/config/aiConfig.js</code>):
              </p>
              <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Dán API Key vào đây..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    background: '#4f46e5',
                    borderColor: '#4f46e5',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {apiKeySavedMsg ? <Check size={14} /> : 'Lưu Key'}
                </button>
              </form>
              {apiKeySavedMsg && (
                <div style={{ color: '#16a34a', fontSize: '11.5px', marginTop: '6px', fontWeight: 600 }}>
                  ✓ Đã lưu API Key thành công!
                </div>
              )}
            </div>
          )}

          {/* Vùng Tin nhắn (Message Scroll Area) */}
          <div
            className="ai-scrollbar"
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isAi ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  {/* Avatar */}
                  {isAi && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                      }}
                    >
                      <Bot size={18} color="#ffffff" />
                    </div>
                  )}

                  {/* Bong bóng tin nhắn */}
                  <div style={{ maxWidth: '82%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                        background: isAi ? '#ffffff' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        color: isAi ? '#1e293b' : '#ffffff',
                        fontSize: '13px',
                        lineHeight: 1.55,
                        boxShadow: isAi ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(37, 99, 235, 0.2)',
                        border: isAi ? '1px solid #e2e8f0' : 'none',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.text}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: '#94a3b8',
                        marginTop: '3px',
                        textAlign: isAi ? 'left' : 'right',
                        padding: '0 4px'
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* HOẠT HỌA 3 DẤU CHẤM CHUYỂN ĐỘNG NHỊP NHÀNG LÊN XUỐNG KHI AI ĐANG NGHĨ (5S) */}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  <Bot size={18} color="#ffffff" />
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '4px 16px 16px 16px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {/* 3 dấu chấm chuyển động nhịp nhàng */}
                  <span
                    className="ai-dot-1"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      display: 'inline-block'
                    }}
                  />
                  <span
                    className="ai-dot-2"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#7c3aed',
                      display: 'inline-block'
                    }}
                  />
                  <span
                    className="ai-dot-3"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ec4899',
                      display: 'inline-block'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginLeft: '6px',
                      fontStyle: 'italic',
                      userSelect: 'none'
                    }}
                  >
                    AI đang soạn câu trả lời...
                  </span>
                </div>
              </div>
            )}

            {/* Gợi ý câu hỏi nhanh (Chỉ hiện khi đoạn chat còn ngắn) */}
            {messages.length <= 2 && !isThinking && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💡 Gợi ý câu hỏi nhanh:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eef2ff';
                        e.currentTarget.style.borderColor = '#c7d2fe';
                        e.currentTarget.style.color = '#4338ca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer - Khung nhập câu hỏi */}
          <div
            style={{
              padding: '12px 14px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '6px 8px 6px 12px'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isThinking ? 'AI đang trả lời, vui lòng chờ...' : 'Nhập câu hỏi cho AI Thư viện...'}
                disabled={isThinking}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  color: '#0f172a'
                }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isThinking}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: !inputMessage.trim() || isThinking ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !inputMessage.trim() || isThinking ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (inputMessage.trim() && !isThinking) e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                title="Gửi câu hỏi"
              >
                <Send size={16} />
              </button>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>Hệ thống AI Thư viện SmartLib</span>
              <span>•</span>
              <span
                onClick={() => setShowSettings(true)}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#6366f1' }}
              >
                Cấu hình API Key
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
