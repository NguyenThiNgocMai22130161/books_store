/**
 * AI Status Indicator Component
 * Shows AI service availability status
 */

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import './AIStatusIndicator.css';

const AIStatusIndicator = ({ position = 'top-right', showLabel = true }) => {
  const [status, setStatus] = useState('checking'); // checking, available, unavailable
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    checkAIStatus();
    // Check every 30 seconds
    const interval = setInterval(checkAIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAIStatus = async () => {
    try {
      const health = await aiService.checkHealth();
      setStatus(health.status === 'healthy' ? 'available' : 'unavailable');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('unavailable');
      setLastCheck(new Date());
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          color: '#48bb78',
          text: 'AI Available',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )
        };
      case 'unavailable':
        return {
          color: '#f56565',
          text: 'AI Offline',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          )
        };
      default:
        return {
          color: '#ecc94b',
          text: 'Checking...',
          icon: (
            <div className="checking-spinner" />
          )
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`ai-status-indicator ai-status-${position}`}>
      <div className="status-content" style={{ borderColor: config.color }}>
        <div className="status-dot" style={{ background: config.color }}>
          {config.icon}
        </div>
        {showLabel && (
          <span className="status-text" style={{ color: config.color }}>
            {config.text}
          </span>
        )}
      </div>
      
      {lastCheck && (
        <div className="status-tooltip">
          <strong>{config.text}</strong>
          <p>Kiểm tra lần cuối: {lastCheck.toLocaleTimeString('vi-VN')}</p>
          <button 
            onClick={checkAIStatus} 
            className="check-now-button"
          >
            Kiểm tra lại
          </button>
        </div>
      )}
    </div>
  );
};

export default AIStatusIndicator;
