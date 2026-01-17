// Arize Phoenix Configuration
// Note: Phoenix is primarily Python-based, but we can use REST API for observability
export const phoenixConfig = {
  // Phoenix Cloud endpoint (if using cloud)
  cloudEndpoint: 'https://app.phoenix.arize.com',
  // Local Phoenix endpoint (if running locally)
  localEndpoint: 'http://localhost:6006',
  // API key for Phoenix Cloud (if using)
  apiKey: import.meta.env.VITE_PHOENIX_API_KEY || '',
  // Whether to enable tracing
  enableTracing: import.meta.env.VITE_ENABLE_PHOENIX_TRACING === 'true' || false
};

export interface PhoenixTrace {
  name: string;
  input: Record<string, any>;
  output: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: number;
}

// Simple tracing interface that can be extended to use Phoenix REST API
export class PhoenixTracer {
  private traces: PhoenixTrace[] = [];
  private enabled: boolean;

  constructor(enabled: boolean = phoenixConfig.enableTracing) {
    this.enabled = enabled;
  }

  trace(name: string, input: Record<string, any>, output: Record<string, any>, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const trace: PhoenixTrace = {
      name,
      input,
      output,
      metadata,
      timestamp: Date.now()
    };

    this.traces.push(trace);
    
    // In production, this would send to Phoenix via REST API
    // For now, we'll log locally and can extend to send to Phoenix
    console.log('[Phoenix Trace]', trace);
  }

  getTraces(): PhoenixTrace[] {
    return this.traces;
  }

  clearTraces() {
    this.traces = [];
  }

  // Future: Send traces to Phoenix REST API
  async sendToPhoenix(traces: PhoenixTrace[]) {
    // Implementation would use Phoenix REST API
    // Example:
    // await fetch(`${phoenixConfig.cloudEndpoint}/api/v1/traces`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${phoenixConfig.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(traces)
    // });
  }
}

export const phoenixTracer = new PhoenixTracer();

