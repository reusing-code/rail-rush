import type { Node, Edge } from "@xyflow/react";

export type Team = "RED" | "BLUE";

export type GamePhase = "SETUP" | "PLAYING";

export interface ChipCounts {
  RED: number;
  BLUE: number;
}

export interface GameNodeData {
  label: string;
  chips: ChipCounts;
  [key: string]: unknown;
}

export type GameNode = Node<GameNodeData, "gameNode">;
export type GameEdge = Edge;

export interface GameEvent {
  id: string;
  team: Team;
  amount: number;
  label: string;
  timestamp: number;
}

export type HistoryAction =
  | { type: "PLACE_CHIP"; nodeId: string; team: Team }
  | { type: "AWARD_CHIPS"; eventId: string; team: Team; amount: number };

export type EditorMode = "CONNECT" | "MOVE";

export interface GameState {
  phase: GamePhase;
  activeTeam: Team;
  nodes: GameNode[];
  edges: GameEdge[];
  startingBalance: number;
  chipPools: ChipCounts;
  events: GameEvent[];
  history: HistoryAction[];
  historyIndex: number;
  nodeCounter: number;
  editorMode: EditorMode;
}
