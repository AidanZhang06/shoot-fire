import React from 'react';

export type FeedbackType = 'correct' | 'incorrect' | 'warning' | 'info';

interface FeedbackDisplayProps {
  type: FeedbackType;
  message: string;
  details?: string;
  show: boolean;
}

export function FeedbackDisplay({ type, message, details, show }: FeedbackDisplayProps) {
  if (!show) return null;

  const colors = {
    correct: { bg: '#1a2a1a', border: '#44ff44', text: '#aaffaa', icon: '✓' },
    incorrect: { bg: '#2a1a1a', border: '#ff4444', text: '#ffaaaa', icon: '✗' },
    warning: { bg: '#2a2a1a', border: '#ffaa44', text: '#ffccaa', icon: '⚠' },
    info: { bg: '#1a1a2a', border: '#4488ff', text: '#aaaaff', icon: 'ℹ' }
  };

  const style = colors[type];

  return (
    <div style={{
      backgroundColor: style.bg,
      padding: '15px',
      borderRadius: '8px',
      border: `2px solid ${style.border}`,
      marginTop: '15px',
      animation: 'fadeIn 0.3s ease-in'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: details ? '8px' : 0
      }}>
        <span style={{
          fontSize: '20px',
          color: style.border
        }}>
          {style.icon}
        </span>
        <span style={{
          fontSize: '14px',
          color: style.text,
          fontWeight: 'bold'
        }}>
          {message}
        </span>
      </div>
      {details && (
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: style.text,
          opacity: 0.9,
          lineHeight: '1.5',
          marginLeft: '30px'
        }}>
          {details}
        </p>
      )}
    </div>
  );
}

