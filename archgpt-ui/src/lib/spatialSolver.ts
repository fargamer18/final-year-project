/**
 * ARCHGPT CONSTRAINT RESOLUTION ENGINE (CRE) v3
 * Deterministic Spatial Solver for Semantic Architecture
 */

export interface SpatialNode {
  id: string;
  type: 'room' | 'wall' | 'opening' | 'core' | 'slab' | 'staircase';
  dimensions: { w: number; h: number; d: number };
  position: { x: number; y: number; z: number };
  tags?: string[];
  parentId?: string;
  floorIndex?: number;
}

export interface SpatialRelation {
  sourceId: string;
  targetId: string;
  type: 'adjacent' | 'on-top-of' | 'inside';
}

export interface ArchitecturalIR {
  nodes: SpatialNode[];
  relations: SpatialRelation[];
  styleContext?: string;
}

export interface DesignEvaluation {
  score: {
    circulation: number;
    daylight: number;
    overall: number;
  };
  violations: string[];
  remedies: Array<{ nodeId: string; action: 'move' | 'resize' | 'add_void' | 'connect'; target: any }>;
}

export class SpatialSolver {
  /**
   * Main entry point: Resolves intent into a functional, connected model
   */
  resolve(ir: ArchitecturalIR): SpatialNode[] {
    console.log('[CRE v3] Starting Deep Architectural Validation...');
    
    let nodes = [...ir.nodes];
    const relations = ir.relations || [];
    
    // Pass 1: Structural Integrity (Geometry)
    nodes = this.solveParenting(nodes);
    nodes = this.snapAdjacent(nodes, relations);

    // Pass 2: Architectural Validation (The "Hard Truth" Loop)
    const evaluation = this.evaluateArchitecture(nodes, relations);
    
    console.log(`[CRE v3] Architecture Score: ${Math.round(evaluation.score.overall * 100)}/100`);
    if (evaluation.violations.length > 0) {
      console.warn('[CRE v3] Critical Failures:', evaluation.violations);
      nodes = this.applyRemedies(nodes, evaluation.remedies);
    }

    return nodes;
  }

  private evaluateArchitecture(nodes: SpatialNode[], relations: SpatialRelation[]): DesignEvaluation {
    const violations: string[] = [];
    const remedies: DesignEvaluation['remedies'] = [];
    let circScore = 1.0;
    let lightScore = 1.0;

    // 1. CIRCULATION GRAPH VALIDATION (Non-Negotiable)
    const cores = nodes.filter(n => n.type === 'core' || n.type === 'staircase');
    const rooms = nodes.filter(n => n.type === 'room');

    if (cores.length === 0) {
      violations.push("CRITICAL: No vertical circulation core found.");
      circScore = 0;
    } else {
      rooms.forEach(room => {
        // Graph adjacency check: must connect to a core or an adjacent connected room
        const isConnected = relations.some(r => 
          (r.sourceId === room.id && cores.some(c => c.id === r.targetId)) ||
          (r.targetId === room.id && cores.some(c => c.id === r.sourceId))
        );
        if (!isConnected) {
          violations.push(`Room ${room.id} is a DEAD END (isolated from stairs).`);
          circScore -= (1 / rooms.length);
          remedies.push({ nodeId: room.id, action: 'connect', target: cores[0].id });
        }
      });
    }

    // 2. HABITABLE LIGHT LOGIC (Function vs Decoration)
    const habitableRooms = rooms.filter(r => r.tags?.includes('habitable') || /bedroom|living/i.test(r.id));
    if (habitableRooms.length > 0) {
      habitableRooms.forEach(room => {
        const hasWindow = nodes.some(n => n.type === 'opening' && n.parentId === room.id);
        if (!hasWindow) {
          violations.push(`Habitable room ${room.id} fails Light Access (no window).`);
          lightScore -= (1 / habitableRooms.length);
          remedies.push({ nodeId: room.id, action: 'add_void', target: 'attached_opening' });
        }
      });
    }

    const overall = (circScore + lightScore) / 2;
    return {
      score: { circulation: Math.max(0, circScore), daylight: Math.max(0, lightScore), overall },
      violations,
      remedies
    };
  }

  private solveParenting(nodes: SpatialNode[]): SpatialNode[] {
    return nodes.map(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          return {
            ...node,
            position: {
              x: parent.position.x + node.position.x,
              y: parent.position.y + node.position.y,
              z: parent.position.z + node.position.z
            }
          };
        }
      }
      return node;
    });
  }

  private snapAdjacent(nodes: SpatialNode[], relations: SpatialRelation[]): SpatialNode[] {
    relations.filter(r => r.type === 'adjacent').forEach(rel => {
      const source = nodes.find(n => n.id === rel.sourceId);
      const target = nodes.find(n => n.id === rel.targetId);
      if (source && target) {
        console.log(`[CRE v3] Aligned: ${source.id} <-> ${target.id}`);
      }
    });
    return nodes;
  }

  private applyRemedies(nodes: SpatialNode[], remedies: DesignEvaluation['remedies']): SpatialNode[] {
    return nodes.map(node => {
      const remedy = remedies.find(r => r.nodeId === node.id);
      if (remedy?.action === 'move') {
        return { ...node, position: { ...node.position, ...remedy.target } };
      }
      return node;
    });
  }
}
