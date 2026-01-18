import React, { useState } from 'react';
import { scenarioGenerator } from './ai/ScenarioGenerator';
import { FireScenario } from './ai/types';
import { ScenarioState } from './scenario/types';
import { scenarioParser, ParsedScenario } from './utils/ScenarioParser';

interface ScenarioPanelProps {
  onScenarioStart?: (scenario: FireScenario) => void;
  onDecision?: (decision: string) => void;
  scenarioState?: ScenarioState;
  scenario?: FireScenario;
  onToggleFirstPerson?: (enabled: boolean) => void;
  firstPersonMode?: boolean;
  onScenarioParsed?: (parsed: ParsedScenario) => void;
}

interface ScenarioChoice {
  id: string;
  label: string;
  description: string;
}

interface StepFeedback {
  message: string;
  tip: string;
}

export function ScenarioPanel({
  onScenarioStart,
  onDecision,
  scenarioState,
  scenario: externalScenario,
  onToggleFirstPerson,
  firstPersonMode = false,
  onScenarioParsed
}: ScenarioPanelProps) {
  const [scenario, setScenario] = useState<FireScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSituation, setCurrentSituation] = useState<string>('');
  const [choices, setChoices] = useState<ScenarioChoice[]>([]);
  const [feedback, setFeedback] = useState<StepFeedback | null>(null);
  const [step, setStep] = useState(0);
  const [escaped, setEscaped] = useState(false);

  const generateScenario = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    setLoading(true);
    setFeedback(null);
    setStep(0);
    setEscaped(false);

    try {
      const result = await scenarioGenerator.generateScenario({
        buildingLayout: 'Gates Building - 9 floors, L-shaped',
        difficulty,
        floor: 6
      });

      setScenario(result.scenario);
      
      if (onScenarioStart) {
        onScenarioStart(result.scenario);
      }

      // Set initial situation
      generateSituation(result.scenario, 0);
    } catch (error) {
      console.error('Failed to generate scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSituation = (scn: FireScenario, stepNum: number) => {
    const situations = [
      {
        situation: `🔥 The fire alarm blares! You're on floor 6. Smoke is visible coming from the east corridor where a fire has started. The hallway is getting hazy.`,
        choices: [
          { id: 'assess', label: 'Stop and look for exit signs', description: 'Check your surroundings before moving' },
          { id: 'east', label: 'Head toward the east exit', description: 'It\'s the closest exit' },
          { id: 'west', label: 'Go to the west stairwell', description: 'Away from the smoke' },
        ]
      },
      {
        situation: `You're in the main hallway. You can see the glow of flames at the east end. Two exit signs are visible - west stairwell and south wing.`,
        choices: [
          { id: 'west-stairs', label: 'Take the west stairwell', description: 'Main evacuation route' },
          { id: 'south', label: 'Head to the south wing', description: 'Alternative route' },
          { id: 'elevator', label: 'Use the elevator', description: 'Faster way down' },
        ]
      },
      {
        situation: `You reach the stairwell. Other people are evacuating. The stairs are clear and emergency lights are on.`,
        choices: [
          { id: 'descend', label: 'Go down the stairs', description: 'Follow others to ground level' },
          { id: 'check-floor', label: 'Check this floor first', description: 'Make sure no one is left behind' },
        ]
      },
      {
        situation: `You're on the ground floor. The main exit is straight ahead. You can hear fire trucks arriving outside.`,
        choices: [
          { id: 'exit', label: 'Exit the building', description: 'Head to the assembly point' },
          { id: 'wait', label: 'Wait for firefighters', description: 'Let them guide you out' },
        ]
      }
    ];

    if (stepNum >= situations.length) {
      setEscaped(true);
      return;
    }

    const current = situations[stepNum];
    setCurrentSituation(current.situation);
    setChoices(current.choices);

    // Parse the situation text to extract location and hazard info
    if (onScenarioParsed) {
      const parsed = scenarioParser.parseScenarioText(current.situation, 6);
      onScenarioParsed(parsed);
    }
  };

  const handleChoice = (choiceId: string) => {
    // Generate feedback based on choice
    const feedbackMap: Record<string, StepFeedback> = {
      // Step 0 choices
      'assess': {
        message: '✓ Smart thinking! Assessing the situation helps you make better decisions.',
        tip: '💡 In a fire, take a moment to locate exits before moving.'
      },
      'east': {
        message: '⚠️ Careful - that\'s where the smoke is coming from. Let\'s try a different route.',
        tip: '💡 Never move toward smoke. It can disorient you and cause harm.'
      },
      'west': {
        message: '✓ Good choice! Moving away from smoke is the right instinct.',
        tip: '💡 Always evacuate away from fire and smoke when possible.'
      },
      // Step 1 choices
      'west-stairs': {
        message: '✓ Excellent! Stairwells are the safest evacuation route.',
        tip: '💡 Stairwells are designed to resist fire and smoke.'
      },
      'south': {
        message: '✓ Good thinking! Having backup routes is important.',
        tip: '💡 Know multiple exit routes from any building you\'re in.'
      },
      'elevator': {
        message: '⚠️ Elevators are risky during fires - they can fill with smoke or stop. Let\'s use the stairs instead.',
        tip: '💡 NEVER use elevators during a fire emergency.'
      },
      // Step 2 choices
      'descend': {
        message: '✓ Perfect! Following the evacuation flow is usually safest.',
        tip: '💡 Stay calm and move steadily - don\'t run on stairs.'
      },
      'check-floor': {
        message: '⚠️ Admirable, but your safety comes first. Firefighters are trained for rescue.',
        tip: '💡 Alert firefighters about anyone who might need help.'
      },
      // Step 3 choices
      'exit': {
        message: '✓ You made it! Head to the assembly point away from the building.',
        tip: '💡 Go to the designated meeting spot so you can be accounted for.'
      },
      'wait': {
        message: '✓ The exit is clear, so it\'s safe to proceed. But waiting for guidance is also reasonable.',
        tip: '💡 If unsure, following firefighter instructions is always safe.'
      },
    };

    const fb = feedbackMap[choiceId] || {
      message: 'Continuing...',
      tip: '💡 Stay calm and keep moving toward safety.'
    };

    setFeedback(fb);

    // Always continue to next step after a delay
    const nextStep = step + 1;
    setTimeout(() => {
      setStep(nextStep);
      setFeedback(null);
      const activeScenario = scenario || externalScenario;
      if (activeScenario) {
        generateSituation(activeScenario, nextStep);
      }
    }, 2500);

    if (onDecision) {
      onDecision(choiceId);
    }
  };

  const activeScenario = scenario || externalScenario;

  return (
    <div style={{
      width: '25%',
      minWidth: '320px',
      maxWidth: '380px',
      height: '100vh',
      background: 'linear-gradient(180deg, #1a1a1a 0%, #151515 100%)',
      color: '#ffffff',
      padding: '24px',
      overflowY: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxSizing: 'border-box',
      borderLeft: '3px solid #ff6b35',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        borderBottom: '3px solid #ff6b35',
        paddingBottom: '16px',
        background: 'linear-gradient(90deg, rgba(255, 107, 53, 0.1) 0%, transparent 100%)',
        padding: '12px 16px',
        marginLeft: '-24px',
        marginRight: '-24px',
        marginTop: '-24px',
        borderRadius: '0 0 8px 8px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          color: '#ff6b35',
          fontWeight: 700,
          textShadow: '0 2px 4px rgba(255, 107, 53, 0.3)',
          letterSpacing: '0.5px'
        }}>
          🔥 Fire Escape Trainer
        </h1>
        <button
          onClick={() => onToggleFirstPerson?.(!firstPersonMode)}
          style={{
            padding: '8px 12px',
            background: firstPersonMode ? 'linear-gradient(135deg, #ff6b35 0%, #ff8a50 100%)' : '#333',
            color: '#fff',
            border: `1px solid ${firstPersonMode ? '#ff6b35' : '#555'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: firstPersonMode ? '0 2px 8px rgba(255, 107, 53, 0.3)' : 'none'
          }}
          onMouseOver={(e) => {
            if (!firstPersonMode) {
              e.currentTarget.style.background = '#444';
            }
          }}
          onMouseOut={(e) => {
            if (!firstPersonMode) {
              e.currentTarget.style.background = '#333';
            }
          }}
        >
          {firstPersonMode ? '👁️ 1st Person' : '🎥 3rd Person'}
        </button>
      </div>

      {/* Scenario Selection */}
      {!activeScenario && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 107, 53, 0.2)'
          }}>
            <p style={{ 
              color: '#e0e0e0', 
              marginBottom: '20px', 
              fontSize: '16px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Select Difficulty Level
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['easy', 'medium', 'hard'].map((diff) => {
                const colors = {
                  easy: { bg: 'rgba(138, 255, 138, 0.1)', border: '#4a9c4a', text: '#8eff8e', hover: 'rgba(138, 255, 138, 0.2)' },
                  medium: { bg: 'rgba(255, 215, 142, 0.1)', border: '#9c8a4a', text: '#ffd78e', hover: 'rgba(255, 215, 142, 0.2)' },
                  hard: { bg: 'rgba(255, 142, 142, 0.1)', border: '#9c4a4a', text: '#ff8e8e', hover: 'rgba(255, 142, 142, 0.2)' }
                };
                const color = colors[diff as keyof typeof colors];
                
                return (
                  <button
                    key={diff}
                    onClick={() => generateScenario(diff as 'easy' | 'medium' | 'hard')}
                    disabled={loading}
                    style={{
                      padding: '16px 20px',
                      background: color.bg,
                      color: color.text,
                      border: `2px solid ${color.border}`,
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      opacity: loading ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = color.hover;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = color.bg;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>
                      {diff === 'easy' ? '🟢' : diff === 'medium' ? '🟡' : '🔴'}
                    </span>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>
                      {diff === 'easy' ? '• 1 fire • Multiple exits' : diff === 'medium' ? '• 2 fires • Some smoke' : '• 3+ fires • Heavy smoke'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Scenario */}
      {activeScenario && !escaped && (
        <>
          {/* Goal */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(138, 255, 138, 0.15) 0%, rgba(74, 156, 74, 0.1) 100%)',
            padding: '14px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '2px solid #4a9c4a',
            boxShadow: '0 2px 8px rgba(74, 156, 74, 0.2)'
          }}>
            <span style={{ color: '#8eff8e', fontSize: '14px', fontWeight: 600 }}>
              🎯 Mission: Escape the building safely
            </span>
          </div>

          {/* Situation */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(37, 37, 37, 0.95) 100%)',
            padding: '18px',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 107, 53, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '15px', 
              lineHeight: '1.7', 
              color: '#e8e8e8',
              fontWeight: 400
            }}>
              {currentSituation}
            </p>
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              backgroundColor: '#252525',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: '3px solid #ff6b35'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#e0e0e0' }}>
                {feedback.message}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                {feedback.tip}
              </p>
            </div>
          )}

          {/* Choices */}
          {!feedback && (
            <div>
              <p style={{ color: '#888', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase' }}>
                What do you do?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice.id)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '2px solid #444',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#3a3a3a';
                      e.currentTarget.style.borderColor = '#ff6b35';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                      e.currentTarget.style.borderColor = '#444';
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                      {choice.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {choice.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Success */}
      {escaped && (
        <div style={{
          backgroundColor: '#1a3a1a',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid #4a9c4a'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ color: '#8eff8e', margin: '0 0 10px 0' }}>You Escaped!</h2>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '15px' }}>
            Great job navigating to safety. Remember these lessons for real emergencies!
          </p>
          <button
            onClick={() => {
              setScenario(null);
              setFeedback(null);
              setStep(0);
              setEscaped(false);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff6b35',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Instructions */}
      {!activeScenario && (
        <div style={{ marginTop: 'auto', backgroundColor: '#252525', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ff6b35' }}>How to Play</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
            <li>Read each situation</li>
            <li>Choose your action</li>
            <li>Learn from feedback</li>
            <li>Escape safely!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
