// Fire safety rules and principles for evaluation

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  check: (context: EvaluationContext) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface EvaluationContext {
  chosenPath: string[];
  correctPath: string[];
  fireLocations: Array<{ position: [number, number, number]; intensity: number }>;
  smokeAreas: Array<{ nodes: string[]; level: number }>;
  blockedNodes: string[];
  timeToSafety: number;
  estimatedTimeToSafety: number;
}

export const fireSafetyRules: SafetyRule[] = [
  {
    id: 'avoid-fire',
    name: 'Avoid Fire Zones',
    description: 'Never enter or pass through areas with active fire',
    severity: 'critical',
    check: (context) => {
      // Check if chosen path goes through any fire locations
      // This is simplified - in real implementation, would check node adjacency
      return true; // Placeholder
    }
  },
  {
    id: 'minimize-smoke',
    name: 'Minimize Smoke Exposure',
    description: 'Choose paths with minimal smoke exposure',
    severity: 'high',
    check: (context) => {
      // Check if chosen path minimizes smoke exposure
      return true; // Placeholder
    }
  },
  {
    id: 'use-nearest-exit',
    name: 'Use Nearest Safe Exit',
    description: 'Head to the nearest accessible exit',
    severity: 'high',
    check: (context) => {
      // Check if chosen path leads to nearest exit
      return context.chosenPath.length <= context.correctPath.length * 1.5;
    }
  },
  {
    id: 'avoid-blocked',
    name: 'Avoid Blocked Paths',
    description: 'Do not attempt to use blocked or collapsed paths',
    severity: 'critical',
    check: (context) => {
      // Check if path uses blocked nodes
      const usesBlocked = context.chosenPath.some(nodeId => 
        context.blockedNodes.includes(nodeId)
      );
      return !usesBlocked;
    }
  },
  {
    id: 'time-efficiency',
    name: 'Time Efficiency',
    description: 'Reach safety in reasonable time',
    severity: 'medium',
    check: (context) => {
      // Check if time to safety is reasonable
      return context.timeToSafety <= context.estimatedTimeToSafety * 1.5;
    }
  },
  {
    id: 'no-delay',
    name: 'No Unnecessary Delays',
    description: 'Do not wait unnecessarily when safe to proceed',
    severity: 'medium',
    check: (context) => {
      // Check if player moved efficiently
      return context.timeToSafety <= context.estimatedTimeToSafety * 2;
    }
  }
];

export function getSafetyScore(context: EvaluationContext): {
  score: number; // 0-100
  passed: boolean;
  violations: Array<{ rule: SafetyRule; passed: boolean }>;
} {
  const violations: Array<{ rule: SafetyRule; passed: boolean }> = [];
  let score = 100;

  fireSafetyRules.forEach(rule => {
    const passed = rule.check(context);
    violations.push({ rule, passed });

    if (!passed) {
      // Deduct points based on severity
      switch (rule.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
  });

  score = Math.max(0, score);
  const passed = score >= 70; // Passing threshold

  return { score, passed, violations };
}

