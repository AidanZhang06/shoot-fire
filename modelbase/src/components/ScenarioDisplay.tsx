import React from 'react';
import { FireScenario } from '../ai/types';
import { ScenarioState } from '../scenario/types';

interface ScenarioDisplayProps {
  scenario: FireScenario;
  state: ScenarioState;
}

export function ScenarioDisplay({ scenario, state }: ScenarioDisplayProps) {
  const elapsedTime = state.status === 'in_progress' 
    ? Math.floor((Date.now() - state.startTime) / 1000)
    : 0;

  return (
    <div>
      <div style={{
        backgroundColor: '#2a1a1a',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #ff4444',
        marginBottom: '15px'
      }}>
        <h2 style={{
          fontSize: '18px',
          color: '#ff6666',
          marginTop: 0,
          marginBottom: '10px'
        }}>
          🔥 Active Fire Scenario
        </h2>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#ffaaaa',
          lineHeight: '1.6',
          marginBottom: '10px'
        }}>
          {scenario.description}
        </p>
        <div style={{
          display: 'flex',
          gap: '15px',
          fontSize: '12px',
          color: '#ffcccc'
        }}>
          <div>
            <strong>Difficulty:</strong> {scenario.difficulty.toUpperCase()}
          </div>
          <div>
            <strong>Time:</strong> {elapsedTime}s
          </div>
          <div>
            <strong>Status:</strong> {state.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#252525',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h3 style={{
          fontSize: '14px',
          color: '#88ccff',
          marginTop: 0,
          marginBottom: '8px'
        }}>
          Current Situation:
        </h3>
        <div style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: '1.6' }}>
          <div><strong>Your Position:</strong> Floor {state.currentFloor}</div>
          <div><strong>Fire Locations:</strong> {state.fireLocations.length}</div>
          <div><strong>Available Exits:</strong> {state.availableExits.length}</div>
          <div><strong>Blocked Areas:</strong> {state.blockedNodes.length} nodes</div>
        </div>
      </div>

      {scenario.safetyNotes && (
        <div style={{
          backgroundColor: '#1a2a1a',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #44ff44',
          marginBottom: '15px'
        }}>
          <h3 style={{
            fontSize: '14px',
            color: '#88ff88',
            marginTop: 0,
            marginBottom: '8px'
          }}>
            Safety Notes:
          </h3>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#aaffaa',
            lineHeight: '1.6'
          }}>
            {scenario.safetyNotes}
          </p>
        </div>
      )}
    </div>
  );
}

