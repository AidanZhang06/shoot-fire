import { getSafetyScore, EvaluationContext } from './FireSafetyRules';
import { ScenarioState } from '../scenario/types';
import { FireScenario } from '../ai/types';
import { Path } from '../navigation/types';
import { phoenixTracer } from '../config/arizeConfig';

export interface EvaluationResult {
  correct: boolean;
  score: number; // 0-100
  feedback: string;
  detailedFeedback: string[];
  safetyNotes: string[];
  violations: Array<{ rule: string; severity: string; description: string }>;
}

export class SafetyEvaluator {
  evaluateDecision(
    chosenPath: string[],
    scenario: FireScenario,
    state: ScenarioState,
    actualPath?: Path
  ): EvaluationResult {
    const traceStart = Date.now();

    // Build evaluation context
    const context: EvaluationContext = {
      chosenPath,
      correctPath: scenario.correctPath,
      fireLocations: state.fireLocations.map(f => ({
        position: f.position,
        intensity: f.intensity
      })),
      smokeAreas: state.smokeAreas,
      blockedNodes: state.blockedNodes,
      timeToSafety: state.timeToSafety || 0,
      estimatedTimeToSafety: scenario.estimatedTimeToSafety
    };

    // Get safety score
    const safetyResult = getSafetyScore(context);

    // Determine if decision was correct
    const isCorrectPath = this.isCorrectPath(chosenPath, scenario.correctPath);
    const isSafe = safetyResult.passed && !this.pathGoesThroughFire(chosenPath, context);
    const correct = isCorrectPath || (isSafe && this.reachesExit(chosenPath, scenario.availableExits));

    // Generate feedback
    const feedback = this.generateFeedback(correct, safetyResult, context);
    const detailedFeedback = this.generateDetailedFeedback(safetyResult, context);
    const safetyNotes = this.generateSafetyNotes(safetyResult, context);

    const result: EvaluationResult = {
      correct,
      score: safetyResult.score,
      feedback,
      detailedFeedback,
      safetyNotes,
      violations: safetyResult.violations
        .filter(v => !v.passed)
        .map(v => ({
          rule: v.rule.name,
          severity: v.rule.severity,
          description: v.rule.description
        }))
    };

    const traceEnd = Date.now();

    // Trace evaluation
    phoenixTracer.trace('safety_evaluation', {
      scenarioId: scenario.id,
      chosenPath: chosenPath.slice(0, 5), // First 5 nodes
      correctPath: scenario.correctPath.slice(0, 5)
    }, {
      correct,
      score: safetyResult.score,
      responseTime: traceEnd - traceStart
    }, {
      violations: result.violations.length
    });

    return result;
  }

  private isCorrectPath(chosenPath: string[], correctPath: string[]): boolean {
    // Check if chosen path matches correct path (allowing for minor deviations)
    if (chosenPath.length === 0 || correctPath.length === 0) return false;

    // Check if paths share significant overlap
    const overlap = chosenPath.filter(node => correctPath.includes(node)).length;
    const similarity = overlap / Math.max(chosenPath.length, correctPath.length);
    
    return similarity >= 0.7; // 70% similarity threshold
  }

  private pathGoesThroughFire(path: string[], context: EvaluationContext): boolean {
    // Simplified check - in real implementation would check node adjacency to fire
    // For now, check if any path node is in a blocked node (which may be blocked by fire)
    return path.some(nodeId => context.blockedNodes.includes(nodeId));
  }

  private reachesExit(path: string[], availableExits: string[]): boolean {
    if (path.length === 0) return false;
    const lastNode = path[path.length - 1];
    return availableExits.includes(lastNode);
  }

  private generateFeedback(
    correct: boolean,
    safetyResult: ReturnType<typeof getSafetyScore>,
    context: EvaluationContext
  ): string {
    if (correct && safetyResult.passed) {
      return 'Excellent! You chose a safe path and reached the exit successfully.';
    } else if (correct && !safetyResult.passed) {
      return 'You reached the exit, but your path had some safety concerns.';
    } else if (!correct && safetyResult.passed) {
      return 'Your path was safe, but not the most efficient route to the exit.';
    } else {
      return 'Your path has safety issues. Review fire safety principles and try again.';
    }
  }

  private generateDetailedFeedback(
    safetyResult: ReturnType<typeof getSafetyScore>,
    context: EvaluationContext
  ): string[] {
    const feedback: string[] = [];

    safetyResult.violations.forEach(({ rule, passed }) => {
      if (!passed) {
        feedback.push(`❌ ${rule.rule.name}: ${rule.rule.description}`);
      } else {
        feedback.push(`✓ ${rule.rule.name}: Followed correctly`);
      }
    });

    if (context.timeToSafety > context.estimatedTimeToSafety * 1.5) {
      feedback.push('⚠️ You took longer than optimal to reach safety.');
    }

    if (context.chosenPath.length > context.correctPath.length * 1.5) {
      feedback.push('⚠️ Your path was longer than necessary.');
    }

    return feedback;
  }

  private generateSafetyNotes(
    safetyResult: ReturnType<typeof getSafetyScore>,
    context: EvaluationContext
  ): string[] {
    const notes: string[] = [];

    if (safetyResult.violations.some(v => !v.passed && v.rule.severity === 'critical')) {
      notes.push('CRITICAL: Never enter areas with active fire. Always find an alternative route.');
    }

    if (safetyResult.violations.some(v => !v.passed && v.rule.id === 'minimize-smoke')) {
      notes.push('Remember: Minimize smoke exposure by choosing paths with better ventilation.');
    }

    if (context.timeToSafety > context.estimatedTimeToSafety * 2) {
      notes.push('Tip: In a real fire, every second counts. Move quickly but safely to the nearest exit.');
    }

    return notes;
  }
}

export const safetyEvaluator = new SafetyEvaluator();

