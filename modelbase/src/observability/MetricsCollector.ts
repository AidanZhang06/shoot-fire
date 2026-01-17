import { traceLogger } from './TraceLogger';

export interface ScenarioMetrics {
  scenarioId: string;
  generationTime: number;
  decisionCount: number;
  averageDecisionTime: number;
  correctDecisions: number;
  incorrectDecisions: number;
  finalScore: number;
  outcome: 'safe' | 'unsafe' | 'timeout';
  timeToSafety?: number;
}

export class MetricsCollector {
  private metrics: Map<string, ScenarioMetrics> = new Map();
  private decisionTimes: Map<string, number[]> = new Map();

  startScenario(scenarioId: string): void {
    this.metrics.set(scenarioId, {
      scenarioId,
      generationTime: Date.now(),
      decisionCount: 0,
      averageDecisionTime: 0,
      correctDecisions: 0,
      incorrectDecisions: 0,
      finalScore: 0,
      outcome: 'timeout'
    });
    this.decisionTimes.set(scenarioId, []);
  }

  recordDecision(scenarioId: string, correct: boolean, decisionTime: number): void {
    const metrics = this.metrics.get(scenarioId);
    if (!metrics) return;

    metrics.decisionCount++;
    if (correct) {
      metrics.correctDecisions++;
    } else {
      metrics.incorrectDecisions++;
    }

    const times = this.decisionTimes.get(scenarioId) || [];
    times.push(decisionTime);
    this.decisionTimes.set(scenarioId, times);
    metrics.averageDecisionTime = times.reduce((a, b) => a + b, 0) / times.length;
  }

  completeScenario(scenarioId: string, outcome: 'safe' | 'unsafe' | 'timeout', score: number, timeToSafety?: number): void {
    const metrics = this.metrics.get(scenarioId);
    if (!metrics) return;

    metrics.outcome = outcome;
    metrics.finalScore = score;
    metrics.timeToSafety = timeToSafety;

    // Log metrics to Phoenix
    traceLogger.logScenarioOutcome(scenarioId, outcome, timeToSafety);
  }

  getMetrics(scenarioId: string): ScenarioMetrics | undefined {
    return this.metrics.get(scenarioId);
  }

  getAllMetrics(): ScenarioMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Calculate success rate across all scenarios
  getSuccessRate(): number {
    const allMetrics = this.getAllMetrics();
    if (allMetrics.length === 0) return 0;

    const successful = allMetrics.filter(m => m.outcome === 'safe').length;
    return (successful / allMetrics.length) * 100;
  }

  // Get average score across all scenarios
  getAverageScore(): number {
    const allMetrics = this.getAllMetrics();
    if (allMetrics.length === 0) return 0;

    const totalScore = allMetrics.reduce((sum, m) => sum + m.finalScore, 0);
    return totalScore / allMetrics.length;
  }
}

export const metricsCollector = new MetricsCollector();

