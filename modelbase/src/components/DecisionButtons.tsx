import React from 'react';

interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface DecisionButtonsProps {
  options: DecisionOption[];
  onSelect: (optionId: string) => void;
  selectedId?: string;
}

export function DecisionButtons({ options, onSelect, selectedId }: DecisionButtonsProps) {
  return (
    <div style={{ marginTop: '15px' }}>
      <h3 style={{
        fontSize: '16px',
        color: '#88ccff',
        marginBottom: '10px',
        marginTop: 0
      }}>
        Your Decision:
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => !option.disabled && onSelect(option.id)}
            disabled={option.disabled}
            style={{
              padding: '12px 16px',
              backgroundColor: selectedId === option.id ? '#00ffff' : option.disabled ? '#333' : '#252525',
              color: selectedId === option.id ? '#000' : option.disabled ? '#666' : '#ffffff',
              border: `2px solid ${selectedId === option.id ? '#00ffff' : option.disabled ? '#444' : '#444'}`,
              borderRadius: '8px',
              cursor: option.disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'all 0.2s',
              fontWeight: selectedId === option.id ? 'bold' : 'normal'
            }}
            onMouseEnter={(e) => {
              if (!option.disabled && selectedId !== option.id) {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.borderColor = '#00ffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!option.disabled && selectedId !== option.id) {
                e.currentTarget.style.backgroundColor = '#252525';
                e.currentTarget.style.borderColor = '#444';
              }
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: option.description ? '4px' : 0 }}>
              {option.label}
            </div>
            {option.description && (
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

