import React from 'react';
import { ScenarioState } from '../scenario/types';
import { FireScenario } from '../ai/types';

interface PostScenarioReflectionProps {
  scenario: FireScenario;
  state: ScenarioState;
  playerPath: string[];
  optimalPath?: string[];
  alternativePaths?: Array<{ path: string[]; description: string; cost: number }>;
}

export function PostScenarioReflection({
  scenario,
  state,
  playerPath,
  optimalPath,
  alternativePaths = []
}: PostScenarioReflectionProps) {
  if (state.status !== 'completed') return null;

  const outcome = state.outcome || 'unsafe';
  const timeTaken = state.timeToSafety || 0;
  const optimalTime = scenario.estimatedTimeToSafety || 0;
  const healthRemaining = state.playerHealth || 0;

  const getOutcomeMessage = () => {
    switch (outcome) {
      case 'safe':
        return {
          title: '✅ Successfully Evacuated',
          color: '#44ff44',
          message: 'You reached safety!'
        };
      case 'death':
        return {
          title: '💀 Fatal Outcome',
          color: '#ff4444',
          message: 'You did not survive the scenario.'
        };
      case 'trapped':
        return {
          title: '🚫 Trapped',
          color: '#ff8844',
          message: 'No viable path to safety was available.'
        };
      case 'timeout':
        return {
          title: '⏱️ Timeout',
          color: '#ffaa44',
          message: 'Time limit exceeded.'
        };
      default:
        return {
          title: '⚠️ Unsafe Outcome',
          color: '#ffaa44',
          message: 'You did not reach safety safely.'
        };
    }
  };

  const outcomeInfo = getOutcomeMessage();

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '20px',
      borderRadius: '10px',
      border: `2px solid ${outcomeInfo.color}`,
      marginTop: '20px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <h2 style={{
        color: outcomeInfo.color,
        marginTop: 0,
        marginBottom: '15px',
        fontSize: '20px'
      }}>
        {outcomeInfo.title}
      </h2>

      {/* Outcome Summary */}
      <div style={{
        backgroundColor: '#252525',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.8' }}>
          <div><strong>Time to Safety:</strong> {timeTaken.toFixed(1)}s {optimalTime > 0 && `(Optimal: ${optimalTime.toFixed(1)}s)`}</div>
          <div><strong>Health Remaining:</strong> {healthRemaining.toFixed(0)}%</div>
          <div><strong>Path Length:</strong> {playerPath.length} nodes {optimalPath && `(Optimal: ${optimalPath.length} nodes)`}</div>
          <div><strong>Outcome:</strong> {outcomeInfo.message}</div>
        </div>
      </div>

      {/* Path Comparison */}
      {optimalPath && optimalPath.length > 0 && (
        <div style={{
          backgroundColor: '#252525',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#88ccff', marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>
            Path Comparison
          </h3>
          <div style={{ fontSize: '13px', color: '#aaaaaa', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#ffff00' }}>Your Path:</strong> {playerPath.length} nodes
              {playerPath.length > optimalPath.length && (
                <span style={{ color: '#ffaa44' }}> (Longer than optimal)</span>
              )}
            </div>
            <div>
              <strong style={{ color: '#44ff44' }}>Optimal Path:</strong> {optimalPath.length} nodes
            </div>
            {timeTaken > optimalTime * 1.2 && (
              <div style={{ color: '#ffaa44', marginTop: '8px' }}>
                ⚠️ You took {((timeTaken / optimalTime - 1) * 100).toFixed(0)}% longer than optimal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alternative Paths */}
      {alternativePaths.length > 0 && (
        <div style={{
          backgroundColor: '#252525',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#88ccff', marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>
            Alternative Routes
          </h3>
          <div style={{ fontSize: '13px', color: '#aaaaaa' }}>
            {alternativePaths.map((alt, index) => (
              <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
                <div><strong>{alt.description}</strong></div>
                <div style={{ fontSize: '12px', color: '#888' }}>Cost: {alt.cost.toFixed(1)} | Nodes: {alt.path.length}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Decision Points */}
      <div style={{
        backgroundColor: '#252525',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#88ccff', marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>
          Key Decision Points
        </h3>
        <div style={{ fontSize: '13px', color: '#aaaaaa', lineHeight: '1.6' }}>
          {playerPath.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Path taken:</strong> {playerPath.slice(0, 5).join(' → ')}
              {playerPath.length > 5 && ' → ...'}
            </div>
          )}
          {state.blockedNodes && state.blockedNodes.length > 0 && (
            <div style={{ marginBottom: '8px', color: '#ffaa44' }}>
              ⚠️ Encountered {state.blockedNodes.length} blocked areas
            </div>
          )}
          {state.smokeAreas && state.smokeAreas.length > 0 && (
            <div style={{ marginBottom: '8px', color: '#ffaa44' }}>
              ⚠️ Passed through {state.smokeAreas.length} smoke-affected areas
            </div>
          )}
        </div>
      </div>

      {/* Safety Lessons */}
      <div style={{
        backgroundColor: '#1a2a1a',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #44ff44'
      }}>
        <h3 style={{ color: '#88ff88', marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>
          Safety Lessons
        </h3>
        <div style={{ fontSize: '13px', color: '#aaffaa', lineHeight: '1.6' }}>
          {outcome === 'safe' && (
            <div>✓ You successfully navigated to safety. Remember: always know multiple exit routes.</div>
          )}
          {outcome === 'death' && (
            <div>❌ Never enter areas with active fire. Always find alternative routes, even if they take longer.</div>
          )}
          {outcome === 'trapped' && (
            <div>⚠️ Always have backup routes. If one path becomes blocked, you need alternatives.</div>
          )}
          {healthRemaining < 50 && (
            <div>⚠️ Your health was significantly reduced. Minimize time in smoke and fire areas.</div>
          )}
          {timeTaken > optimalTime * 1.5 && optimalTime > 0 && (
            <div>⚠️ Time is critical in emergencies. Practice identifying the fastest safe route.</div>
          )}
          {scenario.safetyNotes && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #44ff44' }}>
              {scenario.safetyNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
