import { NavigationNode, NavigationEdge, NavigationGraph, Path } from './types';

export class NavigationGraphImpl implements NavigationGraph {
  nodes: Map<string, NavigationNode>;
  edges: Map<string, NavigationEdge>;
  floors: Map<number, string[]>;
  exits: string[];

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.floors = new Map();
    this.exits = [];
  }

  addNode(node: NavigationNode): void {
    this.nodes.set(node.id, node);
    
    if (!this.floors.has(node.floor)) {
      this.floors.set(node.floor, []);
    }
    this.floors.get(node.floor)!.push(node.id);

    if (node.type === 'exit') {
      this.exits.push(node.id);
    }
  }

  addEdge(fromId: string, toId: string, weight: number = 1): void {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      console.warn(`Cannot add edge: nodes ${fromId} or ${toId} not found`);
      return;
    }

    const edgeKey = `${fromId}-${toId}`;
    const edge: NavigationEdge = {
      from: fromId,
      to: toId,
      weight,
      blocked: false,
      smokeLevel: 0
    };

    this.edges.set(edgeKey, edge);

    // Update node neighbors
    const fromNode = this.nodes.get(fromId)!;
    if (!fromNode.neighbors.includes(toId)) {
      fromNode.neighbors.push(toId);
    }

    const toNode = this.nodes.get(toId)!;
    if (!toNode.neighbors.includes(fromId)) {
      toNode.neighbors.push(fromId);
    }
  }

  getNode(id: string): NavigationNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(fromId: string, toId: string): NavigationEdge | undefined {
    return this.edges.get(`${fromId}-${toId}`);
  }

  getNodesOnFloor(floor: number): NavigationNode[] {
    const nodeIds = this.floors.get(floor) || [];
    return nodeIds.map(id => this.nodes.get(id)!).filter(Boolean);
  }

  getExits(): NavigationNode[] {
    return this.exits.map(id => this.nodes.get(id)!).filter(Boolean);
  }

  blockNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.blocked = true;
      // Block all edges connected to this node
      node.neighbors.forEach(neighborId => {
        const edge = this.getEdge(nodeId, neighborId);
        if (edge) edge.blocked = true;
      });
    }
  }

  unblockNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.blocked = false;
      node.neighbors.forEach(neighborId => {
        const edge = this.getEdge(nodeId, neighborId);
        if (edge) edge.blocked = false;
      });
    }
  }

  setSmokeLevel(nodeId: string, level: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.smokeLevel = Math.max(0, Math.min(1, level));
    }
  }

  getEffectiveWeight(fromId: string, toId: string): number {
    const edge = this.getEdge(fromId, toId);
    if (!edge || edge.blocked) return Infinity;

    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (fromNode?.blocked || toNode?.blocked) return Infinity;

    let weight = edge.weight;
    
    // Add smoke penalty
    const smokePenalty = (fromNode?.smokeLevel || 0) + (toNode?.smokeLevel || 0);
    weight *= (1 + smokePenalty * 2); // Smoke doubles movement cost at max level

    return weight;
  }
}

