// Prompt templates for AI scenario generation

export const scenarioGenerationPrompts = {
  system: `You are a fire safety scenario generator for building evacuation training. 
You generate realistic fire scenarios that test evacuation decision-making skills.
Your scenarios must be:
- Realistic and based on fire safety principles
- Educational (teach proper evacuation procedures)
- Varied in difficulty and complexity
- Safe for training (no scenarios that would be impossible to escape from)

Always provide scenarios in valid JSON format.`,

  generate: (input: {
    buildingLayout: string;
    currentConditions?: Record<string, any>;
    difficulty?: string;
    floor?: number;
  }) => `Generate a fire evacuation scenario for the Gates Building at Carnegie Mellon University.

BUILDING LAYOUT:
${input.buildingLayout}

${input.currentConditions ? `CURRENT CONDITIONS:
${JSON.stringify(input.currentConditions, null, 2)}` : ''}

${input.difficulty ? `DIFFICULTY LEVEL: ${input.difficulty}` : ''}
${input.floor ? `STARTING FLOOR: Floor ${input.floor}` : ''}

Generate a scenario with the following structure:
1. A starting position (x, y, z coordinates where y is the floor height)
2. Fire locations with positions and intensity (0-1 scale)
3. Smoke areas affecting navigation nodes (list of affected areas with smoke levels 0-1)
4. Blocked paths or collapsed areas
5. Available safe exits
6. The optimal/correct path to safety
7. A descriptive narrative of the scenario

Return your response as a JSON object with this exact structure:
{
  "startPosition": [x, y, z],
  "fireLocations": [
    {
      "position": [x, y, z],
      "intensity": 0.0-1.0,
      "description": "Brief description"
    }
  ],
  "smokeAreas": [
    {
      "region": "Description of area",
      "level": 0.0-1.0,
      "affectedNodes": ["node-id-1", "node-id-2"]
    }
  ],
  "blockedNodes": ["node-id-1", "node-id-2"],
  "blockedPaths": ["fromId-toId"],
  "availableExits": ["exit-id-1", "exit-id-2"],
  "correctPath": ["start-node", "node-2", "node-3", "exit-node"],
  "description": "A detailed narrative description of the fire scenario",
  "difficulty": "easy|medium|hard",
  "estimatedTimeToSafety": 120,
  "safetyNotes": "Important safety considerations for this scenario"
}

Make the scenario realistic and educational. Consider:
- Fire spreads over time
- Smoke rises and fills upper areas first
- Multiple exit options should be available
- The correct path should avoid fire and minimize smoke exposure
- Blocked paths should create decision points (not dead ends)`,

  validate: (scenario: any) => `Validate this fire scenario for safety and realism:

${JSON.stringify(scenario, null, 2)}

Check:
1. Is at least one safe exit path available?
2. Are fire locations realistic (not blocking all exits)?
3. Is the correct path actually safe?
4. Are smoke levels reasonable (not instantly lethal)?
5. Does the scenario teach proper evacuation principles?

Respond with validation result and any issues found.`
};

