import { phoenixTracer, PhoenixTrace } from '../config/arizeConfig';

export class TraceLogger {
  // Log scenario generation
  logScenarioGeneration(input: any, output: any, metadata?: any): void {
    phoenixTracer.trace('scenario_generation', input, output, metadata);
  }

  // Log user decision
  logUserDecision(scenarioId: string, decisionId: string, path: string[], metadata?: any): void {
    phoenixTracer.trace('user_decision', {
      scenarioId,
      decisionId,
      pathLength: path.length,
      pathPreview: path.slice(0, 5)
    }, {
      decisionId,
      pathLength: path.length
    }, metadata);
  }

  // Log evaluation result
  logEvaluation(scenarioId: string, evaluation: any, metadata?: any): void {
    phoenixTracer.trace('safety_evaluation', {
      scenarioId,
      chosenPath: evaluation.chosenPath?.slice(0, 5)
    }, {
      correct: evaluation.correct,
      score: evaluation.score,
      violations: evaluation.violations?.length || 0
    }, metadata);
  }

  // Log scenario outcome
  logScenarioOutcome(scenarioId: string, outcome: 'safe' | 'unsafe' | 'timeout', timeToSafety?: number): void {
    phoenixTracer.trace('scenario_outcome', {
      scenarioId
    }, {
      outcome,
      timeToSafety
    }, {});
  }

  // Get all traces (for debugging or sending to Phoenix)
  getTraces(): PhoenixTrace[] {
    return phoenixTracer.getTraces();
  }

  // Clear traces
  clearTraces(): void {
    phoenixTracer.clearTraces();
  }
}

export const traceLogger = new TraceLogger();

