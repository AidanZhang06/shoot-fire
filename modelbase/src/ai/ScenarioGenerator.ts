import { getAzureConfig } from '../config/azureConfig';
import { phoenixTracer } from '../config/arizeConfig';
import { ScenarioGenerationInput, ScenarioGenerationOutput, FireScenario } from './types';
import { scenarioGenerationPrompts } from './prompts';

export class ScenarioGenerator {
  private config: ReturnType<typeof getAzureConfig>;

  constructor() {
    this.config = getAzureConfig();
  }

  async generateScenario(input: ScenarioGenerationInput): Promise<ScenarioGenerationOutput> {
    const traceStart = Date.now();

    try {
      // Build the prompt
      const userPrompt = scenarioGenerationPrompts.generate({
        buildingLayout: input.buildingLayout,
        currentConditions: input.currentConditions,
        difficulty: input.difficulty,
        floor: input.floor
      });

      // Trace the AI call
      phoenixTracer.trace('scenario_generation', {
        input: {
          buildingLayout: input.buildingLayout.substring(0, 200) + '...',
          difficulty: input.difficulty,
          floor: input.floor
        },
        prompt: userPrompt.substring(0, 500) + '...'
      }, {}, {
        model: this.config.deploymentName,
        temperature: 0.7
      });

      // Call Azure OpenAI via REST API
      const response = await fetch(this.config.targetUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: scenarioGenerationPrompts.system },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      let scenarioData: any;
      try {
        scenarioData = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          scenarioData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Could not parse AI response as JSON');
        }
      }

      // Transform to FireScenario format - ensure all arrays are defined
      // Default start position: center of floor 6 main wing (inside building)
      const defaultStartPos: [number, number, number] = [0, 21, 0]; // x=0 (center), y=21 (floor 6), z=0 (center)
      const scenario: FireScenario = {
        id: `scenario-${Date.now()}`,
        startPosition: Array.isArray(scenarioData.startPosition) ? scenarioData.startPosition : defaultStartPos,
        fireLocations: Array.isArray(scenarioData.fireLocations) ? scenarioData.fireLocations : [],
        smokeAreas: Array.isArray(scenarioData.smokeAreas) ? scenarioData.smokeAreas.map((sa: any) => ({
          nodes: Array.isArray(sa.nodes) ? sa.nodes : [],
          level: typeof sa.level === 'number' ? sa.level : 0,
          region: sa.region
        })) : [],
        blockedPaths: Array.isArray(scenarioData.blockedPaths) ? scenarioData.blockedPaths : [],
        blockedNodes: Array.isArray(scenarioData.blockedNodes) ? scenarioData.blockedNodes : [],
        // Ensure availableExits includes actual exit IDs from FireExits
        // If AI doesn't provide exits, default to floor 6 exits
        availableExits: Array.isArray(scenarioData.availableExits) && scenarioData.availableExits.length > 0
          ? scenarioData.availableExits
          : ['exit-6-east', 'exit-6-west', 'exit-6-south'], // Default to floor 6 exits
        correctPath: Array.isArray(scenarioData.correctPath) ? scenarioData.correctPath : [],
        description: scenarioData.description || 'Fire scenario',
        difficulty: scenarioData.difficulty || 'medium',
        estimatedTimeToSafety: scenarioData.estimatedTimeToSafety || 120
      };

      const traceEnd = Date.now();

      // Trace the result
      phoenixTracer.trace('scenario_generation', {
        input: {
          buildingLayout: input.buildingLayout.substring(0, 200) + '...',
          difficulty: input.difficulty,
          floor: input.floor
        }
      }, {
        scenario: {
          id: scenario.id,
          difficulty: scenario.difficulty,
          fireLocations: scenario.fireLocations.length,
          availableExits: scenario.availableExits.length
        },
        responseTime: traceEnd - traceStart
      }, {
        model: this.config.deploymentName,
        tokensUsed: data.usage?.total_tokens
      });

      return {
        scenario,
        reasoning: scenarioData.reasoning,
        safetyNotes: scenarioData.safetyNotes
      };
    } catch (error) {
      const traceEnd = Date.now();
      
      phoenixTracer.trace('scenario_generation_error', {
        input: {
          buildingLayout: input.buildingLayout.substring(0, 200) + '...',
          difficulty: input.difficulty,
          floor: input.floor
        }
      }, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: traceEnd - traceStart
      }, {});

      throw error;
    }
  }

  async generateMultipleScenarios(
    input: ScenarioGenerationInput,
    count: number = 3
  ): Promise<ScenarioGenerationOutput[]> {
    const scenarios: ScenarioGenerationOutput[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const scenario = await this.generateScenario({
          ...input,
          difficulty: input.difficulty || (i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard')
        });
        scenarios.push(scenario);
      } catch (error) {
        console.error(`Failed to generate scenario ${i + 1}:`, error);
      }
    }

    return scenarios;
  }
}

export const scenarioGenerator = new ScenarioGenerator();
