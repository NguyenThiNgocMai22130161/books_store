/**
 * Ask AI Button Component
 * Quick access button to open chatbot with pre-filled question
 */

import React from 'react';
import './AskAIButton.css';

const AskAIButton = ({ question, onClick, style = 'primary', size = 'medium' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(question);
    }
    // You can also dispatch an event to open chatbot
    window.dispatchEvent(new CustomEvent('openChatbot', { 
      detail: { message: question } 
    }));
  };

  return (
    <button 
      className={`ask-ai-button ask-ai-${style} ask-ai-${size}`}
      onClick={handleClick}
      title={`Hỏi AI: ${question}`}
    >
      <svg 
        className="ai-icon" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V2.99c3.72 1.15 6.47 4.82 7 8.94v.06h-7z"/>
      </svg>
      <span className="button-text">{question}</span>
      <svg 
        className="arrow-icon" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
};

export default AskAIButton;
