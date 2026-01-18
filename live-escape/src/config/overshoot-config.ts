/**
 * Overshoot API Configuration
 * Configuration for real-time video analysis during emergencies
 */

export const OVERSHOOT_CONFIG = {
  apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
  apiKey: process.env.OVERSHOOT_API_KEY || '',  // Load from .env file
  processing: {
    clip_length_seconds: 0.5,   // Fast processing for emergencies
    delay_seconds: 0.5,          // Minimal delay between results
    sampling_ratio: 0.15,        // Balance accuracy vs speed (15% of frames)
    fps: 30                      // Maximum frames per second
  }
};

/**
 * Adaptive configuration for high-load scenarios (>30 users)
 */
export const OVERSHOOT_CONFIG_HIGH_LOAD = {
  apiUrl: OVERSHOOT_CONFIG.apiUrl,
  apiKey: OVERSHOOT_CONFIG.apiKey,
  processing: {
    clip_length_seconds: 1.0,    // Longer clips to reduce API calls
    delay_seconds: 1.0,
    sampling_ratio: 0.1,         // Lower sampling for better performance
    fps: 30
  }
};

/**
 * Emergency analysis prompt for Overshoot SDK
 * Single comprehensive prompt to minimize API calls and latency
 */
export const EMERGENCY_ANALYSIS_PROMPT = `Analyze this emergency evacuation video frame and identify:

1. OBSTACLES: Any physical blockages in the path (debris, furniture, locked doors)
2. HAZARDS:
   - Fire: location and intensity on scale 1-5, growth rate (stable/growing/rapid)
   - Smoke: density on scale 1-5, height from floor, visibility level
   - Water: flooding depth and flow rate
3. PEOPLE: Count of visible people and their approximate positions (left/center/right, near/far), density level, movement direction
4. EXITS: Any visible exit signs or doors, their status (clear/blocked/partially_blocked), approximate direction in degrees from center (0=straight ahead)

Prioritize accuracy over completeness. If uncertain about any field, mark as "unknown" or use lowest confidence values.`;

/**
 * JSON Schema for structured output from Overshoot API
 * Defines the exact structure of video analysis results
 */
export const EMERGENCY_SCHEMA = {
  type: 'object',
  required: ['timestamp', 'confidence', 'obstacles', 'hazards', 'people', 'exits'],
  properties: {
    timestamp: {
      type: 'number',
      description: 'Unix timestamp of frame analysis'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Overall confidence in analysis (0-1)'
    },
    obstacles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['debris', 'furniture', 'door', 'structural', 'unknown']
          },
          severity: {
            type: 'string',
            enum: ['passable', 'difficult', 'impassable']
          },
          position: {
            type: 'string',
            enum: ['left', 'center', 'right', 'overhead']
          },
          distance: {
            type: 'string',
            enum: ['immediate', 'near', 'far']
          }
        }
      }
    },
    hazards: {
      type: 'object',
      properties: {
        fire: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            intensity: { type: 'integer', minimum: 0, maximum: 5 },
            direction: {
              type: 'string',
              enum: ['left', 'center', 'right', 'behind', 'multiple']
            },
            growthRate: {
              type: 'string',
              enum: ['stable', 'growing', 'rapid']
            }
          }
        },
        smoke: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            density: { type: 'integer', minimum: 0, maximum: 5 },
            heightFromFloor: {
              type: 'string',
              enum: ['floor', 'waist', 'head', 'ceiling']
            },
            visibility: {
              type: 'string',
              enum: ['clear', 'reduced', 'minimal', 'zero']
            }
          }
        },
        water: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            depth: {
              type: 'string',
              enum: ['wet', 'ankle', 'shin', 'knee', 'thigh']
            },
            flow: {
              type: 'string',
              enum: ['still', 'slow', 'moderate', 'rapid']
            }
          }
        }
      }
    },
    people: {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 0 },
        density: {
          type: 'string',
          enum: ['clear', 'sparse', 'moderate', 'crowded', 'jammed']
        },
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              horizontal: {
                type: 'string',
                enum: ['left', 'center', 'right']
              },
              distance: {
                type: 'string',
                enum: ['immediate', 'near', 'far']
              }
            }
          }
        },
        movement: {
          type: 'string',
          enum: ['stationary', 'moving_same', 'moving_opposite', 'chaotic']
        }
      }
    },
    exits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          visible: { type: 'boolean' },
          type: {
            type: 'string',
            enum: ['door', 'sign', 'stairwell', 'window', 'unknown']
          },
          status: {
            type: 'string',
            enum: ['clear', 'blocked', 'partially_blocked', 'unknown']
          },
          direction: {
            type: 'integer',
            minimum: -180,
            maximum: 180,
            description: 'Degrees from center, 0=straight ahead'
          },
          distance: {
            type: 'string',
            enum: ['immediate', 'near', 'far']
          }
        }
      }
    },
    cameraMetadata: {
      type: 'object',
      properties: {
        orientation: {
          type: 'string',
          enum: ['portrait', 'landscape']
        },
        stability: {
          type: 'string',
          enum: ['stable', 'moving', 'shaking']
        },
        lightingQuality: {
          type: 'string',
          enum: ['good', 'dim', 'poor', 'dark']
        }
      }
    }
  }
};
