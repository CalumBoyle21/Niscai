/**
 * Calculate the distance for a ship route between two ports using the PUB151 distances database.
 * @author Calum Boyle
 * @version 1.0
*/

/// <reference types="node" />
import * as fs from "fs";
import * as path from "path";

interface PortEntry {
  destinations: Record<string, number> | string;
  junctions: Record<string, number> | string;
  location: string;
}

interface PortData {
  [portName: string]: PortEntry;
}

type Graph = Map<string, Map<string, number>>;

export interface RouteResult {
  origin: string;
  destination: string;
  distanceKm: number;
  path: string[];
}

// Build the graph from the port data, ensuring that the shortest distance is used for any duplicate edges

function buildGraph(data: PortData): Graph {
  const graph: Graph = new Map();

  const addEdge = (a: string, b: string, dist: number) => {
    if (!graph.has(a)) graph.set(a, new Map());
    if (!graph.has(b)) graph.set(b, new Map());

    const existing = graph.get(a)!.get(b);
    if (existing === undefined || dist < existing) {
      graph.get(a)!.set(b, dist);
      graph.get(b)!.set(a, dist);
    }
  };

  for (const [port, info] of Object.entries(data)) {
    if (typeof info.destinations === "object" && info.destinations !== null) {
      for (const [dest, dist] of Object.entries(info.destinations)) {
        if (typeof dist === "number") addEdge(port, dest, dist);
      }
    }
    if (typeof info.junctions === "object" && info.junctions !== null) {
      for (const [junc, dist] of Object.entries(info.junctions)) {
        if (typeof dist === "number") addEdge(port, junc, dist);
      }
    }
  }

  return graph;
}

// Dijkstra's algorithm implementation

function dijkstra(
  graph: Graph,
  start: string,
  end: string
): { distance: number; path: string[] } | null {
  if (!graph.has(start)) return null;
  if (!graph.has(end)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  // Min-heap: [distance, node]
  const pq: [number, string][] = [[0, start]];
  const visited = new Set<string>();

  dist.set(start, 0);

  while (pq.length > 0) {
    // Extract minimum
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i][0] < pq[minIdx][0]) minIdx = i;
    }
    const [d, node] = pq[minIdx];
    pq.splice(minIdx, 1);

    if (visited.has(node)) continue;
    visited.add(node);

    if (node === end) break;

    const neighbors = graph.get(node);
    if (!neighbors) continue;

    for (const [neighbor, weight] of neighbors) {
      if (visited.has(neighbor)) continue;
      const nd = d + weight;
      if (nd < (dist.get(neighbor) ?? Infinity)) {
        dist.set(neighbor, nd);
        prev.set(neighbor, node);
        pq.push([nd, neighbor]);
      }
    }
  }

  const distance = dist.get(end);
  if (distance === undefined) return null;

  // Reconstruct path
  const path: string[] = [];
  let cur: string | undefined = end;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }

  return { distance, path };
}

//Call this class to calculate the distance between two ports and return the distance in kilometers

export class PortDistanceCalculator {
  private graph: Graph;
  private portNames: string[];

  constructor(dataFilePath: string) {
    const raw = fs.readFileSync(path.resolve(dataFilePath), "utf-8");
    const data: PortData = JSON.parse(raw);
    this.graph = buildGraph(data);
    this.portNames = Object.keys(data);
  }

  /**
   * Find the shortest sea route between two ports.
   * Returns null if either port is not found or no route exists.
   */
  findRoute(origin: string, destination: string): RouteResult | null {
    const result = dijkstra(this.graph, origin, destination);
    if (!result) return null;

    return {
      origin,
      destination,
      distanceKm: Math.round(result.distance * 1.852),
      path: result.path,
    };
  }

  /**
   * Returns direct distance if one exists or null if no direct connection exists.
   */
  directDistance(origin: string, destination: string): number | null {
    return this.graph.get(origin)?.get(destination) ?? null;
  }

  /**
   * Search port names for validation.
   */
  searchPorts(query: string): boolean {
    return this.portNames.some((p) => p.toLowerCase() === query.toLowerCase());
}

  /** 
   * All known port/waypoint node names in the graph. 
   */
  get allNodes(): string[] {
    return [...this.graph.keys()];
  }
}
