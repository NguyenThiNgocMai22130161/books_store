/**
 * AI Chatbot Widget Component
 * Floating chatbot for book recommendations
 */

import React, { useState, useEffect, useRef } from 'react';
import aiService from '../../services/aiService';
import './ChatbotWidget.css';

const ChatbotWidget = ({ bookId = null, category = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: bookId 
          ? 'Xin chào! Tôi có thể giúp bạn tìm sách tương tự hoặc trả lời câu hỏi về sách này.'
          : 'Xin chào! Tôi là trợ lý AI của Books Store. Tôi có thể giúp bạn tìm sách, gợi ý sách phù hợp, hoặc trả lời câu hỏi về sách. Bạn cần giúp gì?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, bookId]);

  // Listen for openChatbot events from AskAIButton
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.message) {
        setInputMessage(e.detail.message);
      }
    };
    window.addEventListener('openChatbot', handleOpenChat);
    return () => window.removeEventListener('openChatbot', handleOpenChat);
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(
        inputMessage,
        bookId,
        category,
        sessionId
      );

      // Save session ID
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        intent: response.intent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBookClick = (book) => {
    // Navigate to book detail
    window.location.href = `/books/${book.bookId}`;
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Button */}
      {!isOpen && (
        <button 
          className="chatbot-button"
          onClick={toggleChat}
          aria-label="Open AI Chatbot"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chatbot-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div>
                <h3>AI Assistant</h3>
                <p>Trợ lý tìm sách thông minh</p>
              </div>
            </div>
            <div className="chatbot-actions">
              <button 
                className="chatbot-action-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button 
                className="chatbot-action-btn"
                onClick={toggleChat}
                title="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message message-${msg.role} ${msg.isError ? 'message-error' : ''}`}
              >
                <div className="message-content">
                  <p>{msg.content}</p>
                  
                  {/* Book Recommendations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources">
                      <p className="sources-title">📚 Sách gợi ý:</p>
                      <div className="sources-list">
                        {msg.sources.map((book, idx) => (
                          <div 
                            key={idx} 
                            className="source-item"
                            onClick={() => handleBookClick(book)}
                          >
                            <div className="source-info">
                              <p className="source-title">{book.title}</p>
                              <p className="source-author">{book.author}</p>
                              <p className="source-price">
                                {book.price?.toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                            <div className="source-score">
                              {(book.score * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows="2"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
