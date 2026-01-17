import React, { useState, useEffect } from 'react';
import { ScenarioDisplay } from './components/ScenarioDisplay';
import { DecisionButtons } from './components/DecisionButtons';
import { FeedbackDisplay, FeedbackType } from './components/FeedbackDisplay';
import { scenarioGenerator } from './ai/ScenarioGenerator';
import { FireScenario } from './ai/types';
import { ScenarioState } from './scenario/types';

interface ScenarioPanelProps {
  onScenarioStart?: (scenario: FireScenario) => void;
  onDecision?: (decision: string) => void;
  scenarioState?: ScenarioState;
  onToggleFirstPerson?: (enabled: boolean) => void;
  firstPersonMode?: boolean;
}

export function ScenarioPanel({ onScenarioStart, onDecision, scenarioState, onToggleFirstPerson, firstPersonMode = false }: ScenarioPanelProps) {
  const [scenario, setScenario] = useState<FireScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string; details?: string } | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string | undefined>();

  const buildingLayout = `Gates Building - 9 floors, L-shaped design
- Floors 1-2: Basement/ground level
- Floors 3-5: Public floors (lecture halls, classrooms, café)
- Floors 6-9: Modular floors (labs, offices, PhD spaces)
- Main wing: Horizontal (east-west), ~45m wide, ~18m deep
- Side wing: Vertical (north-south), ~15m wide, ~35m deep
- Central hallways on floors 6-9
- Fire exits at east and west ends of main wing, south end of side wing`;

  const generateScenario = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    setLoading(true);
    setFeedback(null);
    setSelectedDecision(undefined);

    try {
      const result = await scenarioGenerator.generateScenario({
        buildingLayout,
        difficulty,
        floor: 6 // Start on floor 6 for modular floors
      });

      setScenario(result.scenario);
      if (onScenarioStart) {
        onScenarioStart(result.scenario);
      }

      setFeedback({
        type: 'info',
        message: 'Scenario generated successfully!',
        details: `Difficulty: ${result.scenario.difficulty.toUpperCase()}`
      });
    } catch (error) {
      setFeedback({
        type: 'incorrect',
        message: 'Failed to generate scenario',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = (decisionId: string) => {
    setSelectedDecision(decisionId);
    if (onDecision) {
      onDecision(decisionId);
    }
  };

  // Get decision options based on current state
  const getDecisionOptions = () => {
    if (!scenario || !scenarioState) return [];

    const options = [];

    // Get available paths (this would come from the scenario engine)
    if (scenarioState.status === 'in_progress') {
      // Decision options based on available directions
      const availableExits = scenarioState.availableExits || [];
      
      if (availableExits.some(e => e.includes('east'))) {
        options.push({
          id: 'move-east',
          label: 'Move East',
          description: 'Head towards the east exit'
        });
      }
      
      if (availableExits.some(e => e.includes('west'))) {
        options.push({
          id: 'move-west',
          label: 'Move West',
          description: 'Head towards the west exit'
        });
      }
      
      if (availableExits.some(e => e.includes('south'))) {
        options.push({
          id: 'move-south',
          label: 'Move South',
          description: 'Head towards the south exit'
        });
      }
      
      options.push({
        id: 'move-north',
        label: 'Move to Center',
        description: 'Move towards the center hallway'
      });
    }

    return options;
  };

  return (
    <div style={{
      width: '25%',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      padding: '20px',
      overflowY: 'auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      borderLeft: '2px solid #333'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          color: '#00ffff',
          borderBottom: '2px solid #00ffff',
          paddingBottom: '10px',
          flex: 1
        }}>
          Fire Scenario Simulator
        </h1>
        <button
          onClick={() => onToggleFirstPerson?.(!firstPersonMode)}
          style={{
            padding: '8px 12px',
            backgroundColor: firstPersonMode ? '#00ffff' : '#252525',
            color: firstPersonMode ? '#000' : '#ffffff',
            border: `2px solid ${firstPersonMode ? '#00ffff' : '#666'}`,
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}
          title={firstPersonMode ? "Click to exit first person (ESC also works)" : "Toggle first person view - Click canvas to look around"}
        >
          {firstPersonMode ? '👁️ 1st' : '👁️ 3rd'}
        </button>
      </div>

      {/* Scenario Generation Controls */}
      {!scenario && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '18px',
            color: '#88ccff',
            marginBottom: '15px',
            marginTop: 0
          }}>
            Generate Scenario
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => generateScenario('easy')}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#1a2a1a',
                color: '#88ff88',
                border: '2px solid #44ff44',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Generating...' : 'Generate Easy Scenario'}
            </button>
            <button
              onClick={() => generateScenario('medium')}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#2a2a1a',
                color: '#ffaa44',
                border: '2px solid #ffaa44',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Generating...' : 'Generate Medium Scenario'}
            </button>
            <button
              onClick={() => generateScenario('hard')}
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: '#2a1a1a',
                color: '#ff6666',
                border: '2px solid #ff4444',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Generating...' : 'Generate Hard Scenario'}
            </button>
          </div>
        </div>
      )}

      {/* Active Scenario Display */}
      {scenario && scenarioState && (
        <>
          <ScenarioDisplay scenario={scenario} state={scenarioState} />

          {/* Decision Buttons */}
          {scenarioState.status === 'in_progress' && (
            <DecisionButtons
              options={getDecisionOptions()}
              onSelect={handleDecision}
              selectedId={selectedDecision}
            />
          )}

          {/* Reset Button */}
          {scenarioState.status !== 'in_progress' && (
            <button
              onClick={() => {
                setScenario(null);
                setFeedback(null);
                setSelectedDecision(undefined);
              }}
              style={{
                marginTop: '15px',
                padding: '12px',
                width: '100%',
                backgroundColor: '#252525',
                color: '#ffffff',
                border: '2px solid #666',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Reset / New Scenario
            </button>
          )}
        </>
      )}

      {/* Feedback Display */}
      {feedback && (
        <FeedbackDisplay
          type={feedback.type}
          message={feedback.message}
          details={feedback.details}
          show={true}
        />
      )}

      {/* Info Section (when no active scenario) */}
      {!scenario && (
        <section style={{ marginTop: '30px' }}>
          <h2 style={{
            fontSize: '18px',
            color: '#88ccff',
            marginBottom: '10px',
            marginTop: '20px'
          }}>
            How It Works
          </h2>
          <div style={{
            backgroundColor: '#252525',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#aaaaaa',
              lineHeight: '1.6'
            }}>
              1. Click a button above to generate an AI-powered fire scenario<br/>
              2. The scenario will show fire locations, smoke areas, and available exits<br/>
              3. Make decisions to navigate to safety<br/>
              4. Your choices are evaluated based on fire safety principles<br/>
              5. Learn from feedback and improve your evacuation skills
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
